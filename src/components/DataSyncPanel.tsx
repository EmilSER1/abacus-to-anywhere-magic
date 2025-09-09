import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncStatus {
  type: 'projector' | 'turar' | 'all';
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  inserted?: number;
}

export const DataSyncPanel: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ type: 'all', status: 'idle' });
  const { toast } = useToast();

  const handleSync = async (action: 'sync-projector-data' | 'sync-turar-data' | 'sync-all') => {
    const type = action === 'sync-projector-data' ? 'projector' : 
                 action === 'sync-turar-data' ? 'turar' : 'all';
                 
    setSyncStatus({ type, status: 'loading' });

    try {
      const { data, error } = await supabase.functions.invoke('sync-data', {
        body: { action }
      });

      if (error) {
        throw error;
      }

      setSyncStatus({ 
        type, 
        status: 'success', 
        message: data.message,
        inserted: data.inserted 
      });

      toast({
        title: "Синхронизация завершена",
        description: data.message,
      });

    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus({ 
        type, 
        status: 'error', 
        message: error.message || 'Ошибка синхронизации'
      });

      toast({
        title: "Ошибка синхронизации",
        description: error.message || 'Не удалось синхронизировать данные',
        variant: "destructive"
      });
    }
  };

  const loadLargeDataset = async () => {
    setSyncStatus({ type: 'all', status: 'loading' });

    try {
      // Загружаем данные из public JSON файлов напрямую
      const [projectorResponse, turarResponse] = await Promise.all([
        fetch('/combined_floors.json'),
        fetch('/turar_full.json')
      ]);

      if (!projectorResponse.ok || !turarResponse.ok) {
        throw new Error('Не удалось загрузить JSON файлы');
      }

      const rawProjectorData = await projectorResponse.json();
      const rawTurarData = await turarResponse.json();

      // Функция для конвертации числовых полей с запятыми в точки
      const fixNumericField = (value) => {
        if (typeof value === 'string' && value.includes(',')) {
          const fixed = value.replace(',', '.');
          return isNaN(parseFloat(fixed)) ? value : parseFloat(fixed);
        }
        return value;
      };

      // Исправляем числовые поля в данных проектировщиков и фильтруем некорректные записи
      const projectorData = rawProjectorData
        .map(item => ({
          ...item,
          "ЭТАЖ": fixNumericField(item["ЭТАЖ"]),
          "Площадь (м2)": fixNumericField(item["Площадь (м2)"]),
          "Кол-во": item["Кол-во"] === null ? null : fixNumericField(item["Кол-во"])
        }))
        .filter(item => 
          // Фильтруем записи с пустыми обязательными полями
          item["КОД ПОМЕЩЕНИЯ"] && 
          item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"] && 
          item["ОТДЕЛЕНИЕ"] && 
          item["БЛОК"] &&
          item["ЭТАЖ"] !== null &&
          item["ЭТАЖ"] !== undefined
        );

      // Исправляем числовые поля в данных турар и фильтруем некорректные записи
      const turarData = rawTurarData
        .map(item => ({
          ...item,
          "Кол-во": fixNumericField(item["Кол-во"])
        }))
        .filter(item =>
          // Фильтруем записи с пустыми обязательными полями
          item["Отделение/Блок"] &&
          item["Помещение/Кабинет"] &&
          item["Код оборудования"] &&
          item["Наименование"] &&
          item["Кол-во"] !== null &&
          item["Кол-во"] !== undefined
        );

      console.log(`Отфильтровано: ${rawProjectorData.length - projectorData.length} записей проектировщиков`);
      console.log(`Отфильтровано: ${rawTurarData.length - turarData.length} записей турар`);

      setSyncStatus({
        type: 'all',
        status: 'loading',
        message: `Обработано ${projectorData.length + turarData.length} корректных записей. Сохраняем в БД...`
      });

      // Очищаем существующие данные
      await Promise.all([
        supabase.from('projector_floors').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('turar_medical').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      ]);

      // Загружаем данные батчами для избежания лимитов
      const batchSize = 1000;
      let totalInserted = 0;

      // Загружаем projector данные батчами
      for (let i = 0; i < projectorData.length; i += batchSize) {
        const batch = projectorData.slice(i, i + batchSize);
        const { error } = await supabase.from('projector_floors').insert(batch);
        if (error) throw error;
        totalInserted += batch.length;
        
        setSyncStatus({
          type: 'all',
          status: 'loading',
          message: `Загружено проектировщиков: ${totalInserted}/${projectorData.length}`,
          inserted: totalInserted
        });
      }

      // Загружаем turar данные батчами
      for (let i = 0; i < turarData.length; i += batchSize) {
        const batch = turarData.slice(i, i + batchSize);
        const { error } = await supabase.from('turar_medical').insert(batch);
        if (error) throw error;
        totalInserted += batch.length;
        
        setSyncStatus({
          type: 'all',
          status: 'loading',
          message: `Загружено турар: ${totalInserted - projectorData.length}/${turarData.length}`,
          inserted: totalInserted
        });
      }

      setSyncStatus({
        type: 'all',
        status: 'success',
        message: `Успешно загружено ${totalInserted.toLocaleString()} записей!`,
        inserted: totalInserted
      });

      toast({
        title: "Полная загрузка завершена",
        description: `Загружено ${totalInserted.toLocaleString()} записей из JSON файлов`,
      });

    } catch (error) {
      console.error('Large dataset load error:', error);
      setSyncStatus({
        type: 'all',
        status: 'error',
        message: error.message || 'Ошибка загрузки большого набора данных'
      });

      toast({
        title: "Ошибка загрузки",
        description: error.message || 'Не удалось загрузить большой набор данных',
        variant: "destructive"
      });
    }
  };

  const handleRealDataSync = async () => {
    setSyncStatus({ type: 'all', status: 'loading' });

    try {
      let totalInserted = 0;
      
      // Загружаем проектировщиков батчами
      let batch = 0;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase.functions.invoke('load-real-data', {
          body: { action: 'load-projector-batch', batch }
        });

        if (error) throw error;
        
        totalInserted += data.inserted;
        hasMore = data.hasMore;
        batch++;
        
        setSyncStatus({
          type: 'all',
          status: 'loading',
          message: `Загружено проектировщиков: ${data.totalLoaded}/${data.totalAvailable}`,
          inserted: totalInserted
        });
      }

      // Загружаем турар батчами
      batch = 0;
      hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase.functions.invoke('load-real-data', {
          body: { action: 'load-turar-batch', batch }
        });

        if (error) throw error;
        
        totalInserted += data.inserted;
        hasMore = data.hasMore;
        batch++;
        
        setSyncStatus({
          type: 'all',
          status: 'loading',
          message: `Загружено турар: ${data.totalLoaded}/${data.totalAvailable}`,
          inserted: totalInserted
        });
      }

      setSyncStatus({
        type: 'all',
        status: 'success',
        message: 'Все реальные данные успешно загружены!',
        inserted: totalInserted
      });

      toast({
        title: "Загрузка завершена",
        description: `Загружено ${totalInserted.toLocaleString()} записей`,
      });

    } catch (error) {
      console.error('Real data sync error:', error);
      setSyncStatus({
        type: 'all',
        status: 'error',
        message: error.message || 'Ошибка загрузки реальных данных'
      });

      toast({
        title: "Ошибка загрузки",
        description: error.message || 'Не удалось загрузить реальные данные',
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: SyncStatus['status']) => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: SyncStatus['status']) => {
    switch (status) {
      case 'loading':
        return <Badge variant="outline" className="text-blue-600">Загрузка...</Badge>;
      case 'success':
        return <Badge variant="outline" className="text-green-600">Успешно</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-red-600">Ошибка</Badge>;
      default:
        return <Badge variant="outline">Готов</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Синхронизация данных с JSON
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Загрузка данных из JSON файлов в базу данных Supabase с правильным преобразованием полей.
        </div>

        {/* Status Display */}
        {syncStatus.status !== 'idle' && (
          <div className="p-3 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(syncStatus.status)}
              <span className="font-medium">
                {syncStatus.type === 'projector' ? 'Данные проектировщиков' :
                 syncStatus.type === 'turar' ? 'Данные турар' : 'Все данные'}
              </span>
              {getStatusBadge(syncStatus.status)}
            </div>
            
            {syncStatus.message && (
              <p className="text-sm text-muted-foreground">{syncStatus.message}</p>
            )}
            
            {syncStatus.inserted && (
              <p className="text-sm font-medium text-green-600">
                Загружено записей: {syncStatus.inserted.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Button
            variant="outline"
            onClick={() => handleSync('sync-projector-data')}
            disabled={syncStatus.status === 'loading'}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Тест проектировщики
          </Button>

          <Button
            variant="outline"
            onClick={() => handleSync('sync-turar-data')}
            disabled={syncStatus.status === 'loading'}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Тест турар
          </Button>

          <Button
            onClick={() => handleSync('sync-all')}
            disabled={syncStatus.status === 'loading'}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncStatus.status === 'loading' ? 'animate-spin' : ''}`} />
            Все тестовые
          </Button>

          <Button
            variant="secondary"
            onClick={() => handleRealDataSync()}
            disabled={syncStatus.status === 'loading'}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Малый набор
          </Button>

          <Button
            variant="default"
            onClick={() => loadLargeDataset()}
            disabled={syncStatus.status === 'loading'}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Database className="h-4 w-4" />
            Полный набор
          </Button>
        </div>

        {/* Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Данные загружаются из JSON файлов в public директории</p>
          <p>• Существующие данные будут заменены</p>
          <p>• Поля автоматически преобразуются из русских в английские</p>
        </div>
      </CardContent>
    </Card>
  );
};