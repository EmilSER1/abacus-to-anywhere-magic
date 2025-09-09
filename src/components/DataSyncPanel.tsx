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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
            variant="default"
            onClick={() => handleRealDataSync()}
            disabled={syncStatus.status === 'loading'}
            className="flex items-center gap-2 bg-primary"
          >
            <Download className="h-4 w-4" />
            Реальные данные
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