import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle, Download, Eye, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ValidationResult {
  valid: boolean;
  newRecords: any[];
  duplicateRecords: any[];
  errors: string[];
}

interface ImportStatus {
  status: 'idle' | 'validating' | 'validated' | 'importing' | 'success' | 'error';
  message?: string;
  validation?: ValidationResult;
}

export const ImportWithValidationPanel: React.FC = () => {
  const [importStatus, setImportStatus] = useState<ImportStatus>({ status: 'idle' });
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const validateData = async (data: any[]): Promise<ValidationResult> => {
    const requiredFields = ['ЭТАЖ', 'БЛОК', 'ОТДЕЛЕНИЕ', 'КОД ПОМЕЩЕНИЯ', 'НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ'];
    const errors: string[] = [];
    
    // Проверяем структуру данных
    if (data.length === 0) {
      errors.push('CSV файл пуст');
      return { valid: false, newRecords: [], duplicateRecords: [], errors };
    }

    const firstRow = data[0];
    const missingFields = requiredFields.filter(field => !(field in firstRow));
    
    if (missingFields.length > 0) {
      errors.push(`Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
      return { valid: false, newRecords: [], duplicateRecords: [], errors };
    }

    // Получаем существующие записи из БД
    const { data: existingData, error } = await supabase
      .from('projector_floors')
      .select('ЭТАЖ, БЛОК, ОТДЕЛЕНИЕ, "КОД ПОМЕЩЕНИЯ", "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"');

    if (error) {
      errors.push(`Ошибка при получении существующих данных: ${error.message}`);
      return { valid: false, newRecords: [], duplicateRecords: [], errors };
    }

    // Создаем набор существующих записей для быстрого поиска
    const existingSet = new Set(
      existingData?.map(row => 
        `${row['ЭТАЖ']}|${row['БЛОК']}|${row['ОТДЕЛЕНИЕ']}|${row['КОД ПОМЕЩЕНИЯ']}|${row['НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ']}`
      ) || []
    );

    const newRecords: any[] = [];
    const duplicateRecords: any[] = [];

    // Проверяем каждую запись
    data.forEach((row, index) => {
      try {
        // Валидация этажа
        const etazh = parseFloat(String(row['ЭТАЖ']).replace(',', '.'));
        if (isNaN(etazh)) {
          errors.push(`Строка ${index + 2}: ЭТАЖ должен быть числом`);
          return;
        }

        // Валидация площади (опционально)
        const area = row['Площадь (м2)'] ? parseFloat(String(row['Площадь (м2)']).replace(',', '.')) : null;
        if (row['Площадь (м2)'] && isNaN(area!)) {
          errors.push(`Строка ${index + 2}: Площадь должна быть числом`);
          return;
        }

        // Создаем обработанную запись
        const processedRow = {
          ...row,
          'ЭТАЖ': etazh,
          'Площадь (м2)': area,
          'Кол-во': row['Кол-во'] || null
        };

        // Проверяем на дубликаты
        const recordKey = `${etazh}|${row['БЛОК']}|${row['ОТДЕЛЕНИЕ']}|${row['КОД ПОМЕЩЕНИЯ']}|${row['НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ']}`;
        
        if (existingSet.has(recordKey)) {
          duplicateRecords.push(processedRow);
        } else {
          newRecords.push(processedRow);
        }
      } catch (error) {
        errors.push(`Строка ${index + 2}: Ошибка обработки данных`);
      }
    });

    return {
      valid: errors.length === 0,
      newRecords,
      duplicateRecords,
      errors
    };
  };

  const handleFileValidation = async (file: File) => {
    setImportStatus({ status: 'validating' });

    try {
      const text = await file.text();
      const data = parseCSV(text);
      
      const validation = await validateData(data);
      
      setImportStatus({
        status: 'validated',
        validation,
        message: validation.valid 
          ? `Готово к импорту: ${validation.newRecords.length} новых записей, ${validation.duplicateRecords.length} дубликатов`
          : `Найдены ошибки: ${validation.errors.length}`
      });

      if (!validation.valid) {
        toast({
          title: "Ошибки валидации",
          description: `Найдено ${validation.errors.length} ошибок в файле`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Validation error:', error);
      setImportStatus({
        status: 'error',
        message: 'Ошибка при валидации файла'
      });

      toast({
        title: "Ошибка валидации",
        description: "Не удалось обработать файл",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    if (!importStatus.validation?.valid || !importStatus.validation.newRecords.length) return;

    setImportStatus(prev => ({ ...prev, status: 'importing' }));

    try {
      const batchSize = 1000;
      let totalInserted = 0;
      const newRecords = importStatus.validation.newRecords;

      for (let i = 0; i < newRecords.length; i += batchSize) {
        const batch = newRecords.slice(i, i + batchSize);
        const { error } = await supabase.from('projector_floors').insert(batch);
        if (error) throw error;
        totalInserted += batch.length;
      }

      setImportStatus({
        status: 'success',
        message: `Успешно импортировано ${totalInserted} новых записей`
      });

      toast({
        title: "Импорт завершен",
        description: `Добавлено ${totalInserted} новых записей в базу данных`,
      });

    } catch (error) {
      console.error('Import error:', error);
      setImportStatus({
        status: 'error',
        message: 'Ошибка при импорте данных'
      });

      toast({
        title: "Ошибка импорта",
        description: "Не удалось импортировать данные",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      handleFileValidation(file);
    }
  };

  const resetStatus = () => {
    setImportStatus({ status: 'idle' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvContent = `ЭТАЖ,БЛОК,ОТДЕЛЕНИЕ,КОД ПОМЕЩЕНИЯ,НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ,Код помещения,Наименование помещения,Площадь (м2),Код оборудования,Наименование оборудования,Ед. изм.,Кол-во,Примечания
1,А,Хирургия,101,Операционная,101,Операционная,25.5,МЕД001,Операционный стол,шт,2,Комментарий`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_projector_import.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = () => {
    switch (importStatus.status) {
      case 'validating':
        return <Upload className="h-4 w-4 animate-pulse" />;
      case 'validated':
        return importStatus.validation?.valid ? 
          <CheckCircle className="h-4 w-4 text-green-500" /> : 
          <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'importing':
        return <Upload className="h-4 w-4 animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    switch (importStatus.status) {
      case 'validating':
        return <Badge variant="outline" className="text-blue-600">Проверка...</Badge>;
      case 'validated':
        return importStatus.validation?.valid ?
          <Badge variant="outline" className="text-green-600">Готов к импорту</Badge> :
          <Badge variant="outline" className="text-red-600">Ошибки</Badge>;
      case 'importing':
        return <Badge variant="outline" className="text-blue-600">Импорт...</Badge>;
      case 'success':
        return <Badge variant="outline" className="text-green-600">Успешно</Badge>;
      case 'error':
        return <Badge variant="outline" className="text-red-600">Ошибка</Badge>;
      default:
        return <Badge variant="outline">Готов</Badge>;
    }
  };

  return (
    <>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Импорт с валидацией
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Импорт данных проектировщиков с проверкой на дубликаты и валидацией.
          </div>

          {/* Status Display */}
          {importStatus.status !== 'idle' && (
            <div className="p-3 rounded-lg border bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="font-medium">Проектировщики</span>
                  {getStatusBadge()}
                </div>
                
                {['validated', 'success', 'error'].includes(importStatus.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetStatus}
                    className="h-auto p-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {importStatus.message && (
                <p className="text-sm text-muted-foreground mb-2">{importStatus.message}</p>
              )}

              {importStatus.validation && (
                <div className="space-y-2">
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">Новых: {importStatus.validation.newRecords.length}</span>
                    <span className="text-orange-600">Дубликатов: {importStatus.validation.duplicateRecords.length}</span>
                    {importStatus.validation.errors.length > 0 && (
                      <span className="text-red-600">Ошибок: {importStatus.validation.errors.length}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {(importStatus.validation.newRecords.length > 0 || importStatus.validation.duplicateRecords.length > 0) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(true)}
                        className="gap-2"
                      >
                        <Eye className="h-3 w-3" />
                        Просмотр
                      </Button>
                    )}
                    
                    {importStatus.validation.valid && importStatus.validation.newRecords.length > 0 && (
                      <Button
                        size="sm"
                        onClick={handleImport}
                        disabled={importStatus.status === 'importing'}
                        className="gap-2"
                      >
                        <Upload className="h-3 w-3" />
                        Импорт ({importStatus.validation.newRecords.length})
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full gap-2"
              size="sm"
            >
              <Download className="h-4 w-4" />
              Скачать шаблон
            </Button>
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importStatus.status === 'validating' || importStatus.status === 'importing'}
              className="w-full gap-2"
            >
              <Upload className="h-4 w-4" />
              Выбрать CSV файл
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          {/* Information */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Проверяет дубликаты по ключевым полям</p>
            <p>• Добавляет только новые записи</p>
            <p>• Валидирует формат данных</p>
            <p>• Показывает предварительный просмотр</p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Предварительный просмотр данных</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh]">
            {importStatus.validation && (
              <div className="space-y-4">
                {importStatus.validation.errors.length > 0 && (
                  <div>
                    <h3 className="font-medium text-red-600 mb-2">Ошибки ({importStatus.validation.errors.length})</h3>
                    <div className="space-y-1">
                      {importStatus.validation.errors.map((error, idx) => (
                        <p key={idx} className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
                      ))}
                    </div>
                  </div>
                )}

                {importStatus.validation.newRecords.length > 0 && (
                  <div>
                    <h3 className="font-medium text-green-600 mb-2">Новые записи ({importStatus.validation.newRecords.length})</h3>
                    <div className="text-xs space-y-1">
                      {importStatus.validation.newRecords.slice(0, 5).map((record, idx) => (
                        <div key={idx} className="bg-green-50 p-2 rounded">
                          {record['ОТДЕЛЕНИЕ']} - {record['НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ']} (Этаж: {record['ЭТАЖ']})
                        </div>
                      ))}
                      {importStatus.validation.newRecords.length > 5 && (
                        <p className="text-muted-foreground">... и еще {importStatus.validation.newRecords.length - 5} записей</p>
                      )}
                    </div>
                  </div>
                )}

                {importStatus.validation.duplicateRecords.length > 0 && (
                  <div>
                    <h3 className="font-medium text-orange-600 mb-2">Дубликаты ({importStatus.validation.duplicateRecords.length})</h3>
                    <div className="text-xs space-y-1">
                      {importStatus.validation.duplicateRecords.slice(0, 5).map((record, idx) => (
                        <div key={idx} className="bg-orange-50 p-2 rounded">
                          {record['ОТДЕЛЕНИЕ']} - {record['НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ']} (Этаж: {record['ЭТАЖ']})
                        </div>
                      ))}
                      {importStatus.validation.duplicateRecords.length > 5 && (
                        <p className="text-muted-foreground">... и еще {importStatus.validation.duplicateRecords.length - 5} записей</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};