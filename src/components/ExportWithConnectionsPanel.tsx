import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Building2, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFloorsData } from '@/hooks/useFloorsData';
import { useRoomConnections } from '@/hooks/useRoomConnections';
import * as XLSX from 'xlsx';

interface ExportData {
  'Этаж': number;
  'Блок': string;
  'Отделение': string;
  'Код помещения': string;
  'Наименование помещения': string;
  'Площадь (м2)': number | null;
  'Код оборудования': string | null;
  'Наименование оборудования': string | null;
  'Ед. изм.': string | null;
  'Количество': string | number | null;
  'Примечания': string | null;
  'Связанное отделение Турар': string | null;
  'Связанный кабинет Турар': string | null;
  'Статус связи': string;
}

export const ExportWithConnectionsPanel: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { data: floorsData, isLoading: floorsLoading } = useFloorsData();
  const { data: connections } = useRoomConnections();

  const exportData = async () => {
    if (!floorsData || floorsLoading) return;

    setIsExporting(true);
    try {
      // Создаем карту связей для быстрого поиска
      const connectionsMap = new Map<string, { turar_department: string; turar_room: string }>();
      
      connections?.forEach(conn => {
        const key = `${conn.projector_department}|${conn.projector_room}`;
        connectionsMap.set(key, {
          turar_department: conn.turar_department,
          turar_room: conn.turar_room
        });
      });

      // Подготавливаем данные для экспорта
      const exportData: ExportData[] = floorsData.map(floor => {
        const connectionKey = `${floor["ОТДЕЛЕНИЕ"]}|${floor["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]}`;
        const connection = connectionsMap.get(connectionKey);

        return {
          'Этаж': floor["ЭТАЖ"],
          'Блок': floor["БЛОК"],
          'Отделение': floor["ОТДЕЛЕНИЕ"],
          'Код помещения': floor["КОД ПОМЕЩЕНИЯ"],
          'Наименование помещения': floor["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"],
          'Площадь (м2)': floor["Площадь (м2)"],
          'Код оборудования': floor["Код оборудования"],
          'Наименование оборудования': floor["Наименование оборудования"],
          'Ед. изм.': floor["Ед. изм."],
          'Количество': floor["Кол-во"],
          'Примечания': floor["Примечания"],
          'Связанное отделение Турар': connection?.turar_department || null,
          'Связанный кабинет Турар': connection?.turar_room || null,
          'Статус связи': connection ? 'Связано' : 'Не связано'
        };
      });

      // Создаем Excel файл
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Настраиваем ширину колонок
      const colWidths = [
        { wch: 8 },   // Этаж
        { wch: 12 },  // Блок
        { wch: 20 },  // Отделение
        { wch: 15 },  // Код помещения
        { wch: 25 },  // Наименование помещения
        { wch: 12 },  // Площадь
        { wch: 15 },  // Код оборудования
        { wch: 30 },  // Наименование оборудования
        { wch: 10 },  // Ед. изм.
        { wch: 12 },  // Количество
        { wch: 20 },  // Примечания
        { wch: 25 },  // Связанное отделение Турар
        { wch: 25 },  // Связанный кабинет Турар
        { wch: 15 }   // Статус связи
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Данные с связями');

      // Генерируем файл
      const fileName = `floors_with_connections_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      // Подсчитываем статистику
      const connectedCount = exportData.filter(item => item['Статус связи'] === 'Связано').length;
      const totalRooms = new Set(exportData.map(item => `${item['Отделение']}|${item['Наименование помещения']}`)).size;
      const connectedRooms = new Set(
        exportData
          .filter(item => item['Статус связи'] === 'Связано')
          .map(item => `${item['Отделение']}|${item['Наименование помещения']}`)
      ).size;

      toast({
        title: "Экспорт завершен",
        description: `Экспортировано ${exportData.length} записей. Связанных помещений: ${connectedRooms}/${totalRooms}`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Ошибка экспорта",
        description: "Не удалось экспортировать данные",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const connectedRoomsCount = connections?.length || 0;
  const totalRoomsCount = floorsData ? new Set(floorsData.map(f => `${f["ОТДЕЛЕНИЕ"]}|${f["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]}`)).size : 0;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Экспорт со связями
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Экспорт данных проектировщиков с информацией о связанных помещениях Турар.
        </div>

        {/* Статистика */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Всего помещений:
            </span>
            <Badge variant="outline">{totalRoomsCount}</Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Связанных:
            </span>
            <Badge variant="outline" className={connectedRoomsCount > 0 ? "text-green-600" : ""}>
              {connectedRoomsCount}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span>Не связанных:</span>
            <Badge variant="outline" className={totalRoomsCount - connectedRoomsCount > 0 ? "text-orange-600" : ""}>
              {totalRoomsCount - connectedRoomsCount}
            </Badge>
          </div>
        </div>

        <Button
          onClick={exportData}
          disabled={isExporting || floorsLoading || !floorsData}
          className="w-full gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Экспортируем...' : 'Экспорт в Excel'}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Включает все данные проектировщиков</p>
          <p>• Показывает связанные отделения и кабинеты Турар</p>
          <p>• Указывает статус связи для каждого помещения</p>
        </div>
      </CardContent>
    </Card>
  );
};