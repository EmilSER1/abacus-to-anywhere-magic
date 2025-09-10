import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadStatus {
  type: 'projector' | 'turar' | 'idle';
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  inserted?: number;
}

export const CsvUploadPanel: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ type: 'idle', status: 'idle' });
  const { toast } = useToast();
  const projectorInputRef = useRef<HTMLInputElement>(null);
  const turarInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        rows.push(row);
      }
    }

    return rows;
  };

  const handleFileUpload = async (file: File, type: 'projector' | 'turar') => {
    setUploadStatus({ type, status: 'loading' });

    try {
      const text = await file.text();
      const data = parseCSV(text);

      if (data.length === 0) {
        throw new Error('CSV файл пуст или неправильно отформатирован');
      }

      // Validate required fields based on type
      if (type === 'projector') {
        const requiredFields = ['ЭТАЖ', 'БЛОК', 'ОТДЕЛЕНИЕ', 'КОД ПОМЕЩЕНИЯ', 'НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ'];
        const firstRow = data[0];
        const missingFields = requiredFields.filter(field => !(field in firstRow));
        
        if (missingFields.length > 0) {
          throw new Error(`Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
        }

        // Convert and validate data
        const processedData = data.map((row, index) => {
          const etazh = parseFloat(String(row['ЭТАЖ']).replace(',', '.'));
          if (isNaN(etazh)) {
            throw new Error(`Строка ${index + 2}: ЭТАЖ должен быть числом`);
          }

          const area = row['Площадь (м2)'] ? parseFloat(String(row['Площадь (м2)']).replace(',', '.')) : null;
          
          return {
            ...row,
            'ЭТАЖ': etazh,
            'Площадь (м2)': area,
            'Кол-во': row['Кол-во'] || null
          };
        });

        // Clear existing data and insert new
        await supabase.from('projector_floors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        const batchSize = 1000;
        let totalInserted = 0;

        for (let i = 0; i < processedData.length; i += batchSize) {
          const batch = processedData.slice(i, i + batchSize);
          const { error } = await supabase.from('projector_floors').insert(batch);
          if (error) throw error;
          totalInserted += batch.length;
        }

        setUploadStatus({
          type,
          status: 'success',
          message: `Успешно загружено ${totalInserted} записей проектировщиков`,
          inserted: totalInserted
        });

      } else if (type === 'turar') {
        const requiredFields = ['Отделение/Блок', 'Помещение/Кабинет', 'Код оборудования', 'Наименование', 'Кол-во'];
        const firstRow = data[0];
        const missingFields = requiredFields.filter(field => !(field in firstRow));
        
        if (missingFields.length > 0) {
          throw new Error(`Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
        }

        // Convert and validate data
        const processedData = data.map((row, index) => {
          const quantity = parseInt(String(row['Кол-во']));
          if (isNaN(quantity)) {
            throw new Error(`Строка ${index + 2}: Кол-во должно быть числом`);
          }

          return {
            ...row,
            'Кол-во': quantity
          };
        });

        // Clear existing data and insert new
        await supabase.from('turar_medical').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        const batchSize = 1000;
        let totalInserted = 0;

        for (let i = 0; i < processedData.length; i += batchSize) {
          const batch = processedData.slice(i, i + batchSize);
          const { error } = await supabase.from('turar_medical').insert(batch);
          if (error) throw error;
          totalInserted += batch.length;
        }

        setUploadStatus({
          type,
          status: 'success',
          message: `Успешно загружено ${totalInserted} записей турар`,
          inserted: totalInserted
        });
      }

      toast({
        title: "Загрузка завершена",
        description: uploadStatus.message,
      });

    } catch (error) {
      console.error('CSV upload error:', error);
      setUploadStatus({
        type,
        status: 'error',
        message: error.message || 'Ошибка загрузки CSV файла'
      });

      toast({
        title: "Ошибка загрузки",
        description: error.message || 'Не удалось загрузить CSV файл',
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'projector' | 'turar') => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast({
          title: "Неверный формат файла",
          description: "Пожалуйста, выберите CSV файл",
          variant: "destructive"
        });
        return;
      }
      handleFileUpload(file, type);
    }
  };

  const downloadTemplate = (type: 'projector' | 'turar') => {
    let csvContent = '';
    
    if (type === 'projector') {
      csvContent = `ЭТАЖ,БЛОК,ОТДЕЛЕНИЕ,КОД ПОМЕЩЕНИЯ,НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ,Код помещения,Наименование помещения,Площадь (м2),Код оборудования,Наименование оборудования,Ед. изм.,Кол-во,Примечания
1,А,Хирургия,101,Операционная,101,Операционная,25.5,МЕД001,Операционный стол,шт,2,Комментарий`;
    } else {
      csvContent = `Отделение/Блок,Помещение/Кабинет,Код оборудования,Наименование,Кол-во
Хирургия,Операционная 1,МЕД001,Операционный стол,2`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `template_${type}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: UploadStatus['status']) => {
    switch (status) {
      case 'loading':
        return <Upload className="h-4 w-4 animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: UploadStatus['status']) => {
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
          <FileText className="h-5 w-5" />
          Загрузка CSV файлов
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Загрузите данные из CSV файлов в базу данных. Файлы должны соответствовать шаблону.
        </div>

        {/* Status Display */}
        {uploadStatus.status !== 'idle' && (
          <div className="p-3 rounded-lg border bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(uploadStatus.status)}
              <span className="font-medium">
                {uploadStatus.type === 'projector' ? 'Данные проектировщиков' : 'Данные турар'}
              </span>
              {getStatusBadge(uploadStatus.status)}
            </div>
            
            {uploadStatus.message && (
              <p className="text-sm text-muted-foreground">{uploadStatus.message}</p>
            )}
            
            {uploadStatus.inserted && (
              <p className="text-sm font-medium text-green-600">
                Загружено записей: {uploadStatus.inserted.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Upload Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Projector Upload */}
          <div className="space-y-3">
            <h3 className="font-medium">Проектировщики</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => downloadTemplate('projector')}
                className="w-full gap-2"
                size="sm"
              >
                <Download className="h-4 w-4" />
                Скачать шаблон
              </Button>
              
              <Button
                variant="outline"
                onClick={() => projectorInputRef.current?.click()}
                disabled={uploadStatus.status === 'loading'}
                className="w-full gap-2"
              >
                <Upload className="h-4 w-4" />
                Загрузить CSV
              </Button>
              
              <input
                ref={projectorInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e, 'projector')}
              />
            </div>
          </div>

          {/* Turar Upload */}
          <div className="space-y-3">
            <h3 className="font-medium">Турар</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => downloadTemplate('turar')}
                className="w-full gap-2"
                size="sm"
              >
                <Download className="h-4 w-4" />
                Скачать шаблон
              </Button>
              
              <Button
                variant="outline"
                onClick={() => turarInputRef.current?.click()}
                disabled={uploadStatus.status === 'loading'}
                className="w-full gap-2"
              >
                <Upload className="h-4 w-4" />
                Загрузить CSV
              </Button>
              
              <input
                ref={turarInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e, 'turar')}
              />
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Сначала скачайте шаблон и заполните его данными</p>
          <p>• CSV файл должен использовать запятую как разделитель</p>
          <p>• Обязательные поля должны быть заполнены</p>
          <p>• Существующие данные будут заменены</p>
        </div>
      </CardContent>
    </Card>
  );
};