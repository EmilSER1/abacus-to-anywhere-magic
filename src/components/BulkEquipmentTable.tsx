import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Trash2, Upload } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

interface BulkEquipmentRow {
  code: string;
  name: string;
  quantity: string;
  unit: string;
  status: 'Согласовано' | 'Не согласовано' | 'Не найдено';
  specification: string;
  documents: string;
  supplier: string;
  price: string;
  notes: string;
}

interface BulkEquipmentTableProps {
  department: string;
  room: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipment: BulkEquipmentRow[]) => void;
}

const statusOptions = [
  { value: 'Согласовано', label: 'Согласовано', color: 'bg-green-100 text-green-800' },
  { value: 'Не согласовано', label: 'Не согласовано', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Не найдено', label: 'Не найдено', color: 'bg-red-100 text-red-800' }
];

export const BulkEquipmentTable: React.FC<BulkEquipmentTableProps> = ({
  department,
  room,
  isOpen,
  onClose,
  onSave
}) => {
  const { currentUserRole } = useUserRole();
  const isAdmin = currentUserRole === 'admin';
  const { toast } = useToast();
  const [rows, setRows] = useState<BulkEquipmentRow[]>([
    {
      code: '',
      name: '',
      quantity: '',
      unit: '',
      status: 'Не найдено',
      specification: '',
      documents: '',
      supplier: '',
      price: '',
      notes: ''
    }
  ]);

  const tableRef = useRef<HTMLTableElement>(null);

  const addRow = () => {
    setRows([...rows, {
      code: '',
      name: '',
      quantity: '',
      unit: '',
      status: 'Не найдено',
      specification: '',
      documents: '',
      supplier: '',
      price: '',
      notes: ''
    }]);
  };

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const updateRow = (index: number, field: keyof BulkEquipmentRow, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        toast({
          title: "Ошибка",
          description: "Буфер обмена пуст",
          variant: "destructive"
        });
        return;
      }

      const newRows: BulkEquipmentRow[] = lines.map(line => {
        const cells = line.split('\t'); // Разделитель табуляции (Excel)
        return {
          code: cells[0] || '',
          name: cells[1] || '',
          quantity: cells[2] || '',
          unit: cells[3] || '',
          status: (cells[4] as any) || 'Не найдено',
          specification: cells[5] || '',
          documents: cells[6] || '',
          supplier: isAdmin ? (cells[7] || '') : '',
          price: isAdmin ? (cells[8] || '') : '',
          notes: isAdmin ? (cells[9] || cells[7] || '') : (cells[7] || '')
        };
      });

      setRows(newRows);
      toast({
        title: "Данные вставлены",
        description: `Добавлено ${newRows.length} строк из буфера обмена`
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось прочитать данные из буфера обмена",
        variant: "destructive"
      });
    }
  };

  const handleSave = () => {
    const validRows = rows.filter(row => row.code || row.name);
    if (validRows.length === 0) {
      toast({
        title: "Ошибка",
        description: "Добавьте хотя бы одну позицию оборудования",
        variant: "destructive"
      });
      return;
    }

    onSave(validRows);
    setRows([{
      code: '',
      name: '',
      quantity: '',
      unit: '',
      status: 'Не найдено',
      specification: '',
      documents: '',
      supplier: '',
      price: '',
      notes: ''
    }]);
  };

  const clearAll = () => {
    setRows([{
      code: '',
      name: '',
      quantity: '',
      unit: '',
      status: 'Не найдено',
      specification: '',
      documents: '',
      supplier: '',
      price: '',
      notes: ''
    }]);
  };

  if (!isOpen) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            Массовое добавление оборудования в: {department} - {room}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-auto p-2">
            ✕
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={handlePaste} className="gap-2">
            <Upload className="h-3 w-3" />
            Вставить из буфера
          </Button>
          <Button size="sm" variant="outline" onClick={addRow} className="gap-2">
            <Plus className="h-3 w-3" />
            Добавить строку
          </Button>
          <Button size="sm" variant="outline" onClick={clearAll} className="gap-2">
            <Trash2 className="h-3 w-3" />
            Очистить все
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-2 bg-green-600 hover:bg-green-700">
            <Save className="h-3 w-3" />
            Сохранить ({rows.filter(r => r.code || r.name).length})
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="text-xs text-muted-foreground mb-3">
          💡 Совет: Скопируйте данные из Excel и нажмите "Вставить из буфера" или заполните таблицу вручную
        </div>
        
        <div className="overflow-x-auto border rounded-lg">
          <table ref={tableRef} className="w-full text-xs border-collapse">
            <thead className="bg-muted/50">
              <tr>
                <th className="border border-border p-2 text-left min-w-[100px]">Код оборудования</th>
                <th className="border border-border p-2 text-left min-w-[150px]">Наименование*</th>
                <th className="border border-border p-2 text-left min-w-[80px]">Количество</th>
                <th className="border border-border p-2 text-left min-w-[80px]">Ед. изм.</th>
                <th className="border border-border p-2 text-left min-w-[120px]">Статус</th>
                <th className="border border-border p-2 text-left min-w-[150px]">Спецификация</th>
                <th className="border border-border p-2 text-left min-w-[150px]">Документы</th>
                {isAdmin && <th className="border border-border p-2 text-left min-w-[120px]">Поставщик</th>}
                {isAdmin && <th className="border border-border p-2 text-left min-w-[100px]">Цена (руб.)</th>}
                <th className="border border-border p-2 text-left min-w-[150px]">Примечания</th>
                <th className="border border-border p-2 text-center w-[60px]">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-muted/20">
                  <td className="border border-border p-1">
                    <input
                      type="text"
                      value={row.code}
                      onChange={(e) => updateRow(index, 'code', e.target.value)}
                      className="w-full p-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
                      placeholder="Код..."
                    />
                  </td>
                  <td className="border border-border p-1">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateRow(index, 'name', e.target.value)}
                      className="w-full p-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
                      placeholder="Наименование*"
                      required
                    />
                  </td>
                  <td className="border border-border p-1">
                    <input
                      type="text"
                      value={row.quantity}
                      onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                      className="w-full p-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
                      placeholder="1"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) => updateRow(index, 'unit', e.target.value)}
                      className="w-full p-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
                      placeholder="шт"
                    />
                  </td>
                  <td className="border border-border p-1">
                    <select
                      value={row.status}
                      onChange={(e) => updateRow(index, 'status', e.target.value)}
                      className="w-full p-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-border p-1">
                    <input
                      type="text"
                      value={row.specification}
                      onChange={(e) => updateRow(index, 'specification', e.target.value)}
                      className="w-full p-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
                      placeholder="Спецификация..."
                    />
                  </td>
                  <td className="border border-border p-1">
                    <input
                      type="text"
                      value={row.documents}
                      onChange={(e) => updateRow(index, 'documents', e.target.value)}
                      className="w-full p-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
                      placeholder="Документы..."
                    />
                  </td>
                  {isAdmin && (
                    <td className="border border-border p-1">
                      <input
                        type="text"
                        value={row.supplier}
                        onChange={(e) => updateRow(index, 'supplier', e.target.value)}
                        className="w-full p-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
                        placeholder="Поставщик..."
                      />
                    </td>
                  )}
                  {isAdmin && (
                    <td className="border border-border p-1">
                      <input
                        type="number"
                        step="0.01"
                        value={row.price}
                        onChange={(e) => updateRow(index, 'price', e.target.value)}
                        className="w-full p-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
                        placeholder="0.00"
                      />
                    </td>
                  )}
                  <td className="border border-border p-1">
                    <input
                      type="text"
                      value={row.notes}
                      onChange={(e) => updateRow(index, 'notes', e.target.value)}
                      className="w-full p-1 text-xs border-0 bg-transparent focus:ring-1 focus:ring-blue-500 rounded"
                      placeholder="Примечания..."
                    />
                  </td>
                  <td className="border border-border p-1 text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-3 text-xs text-muted-foreground space-y-1">
          <p>📋 <strong>Как использовать:</strong></p>
          <p>• Скопируйте данные из Excel/Google Sheets и нажмите "Вставить из буфера"</p>
          <p>• Или заполните таблицу вручную, добавляя строки кнопкой "+"</p>
          <p>• Поля "Код" или "Наименование" обязательны для сохранения</p>
          {isAdmin && <p>• Поля "Поставщик" и "Цена" видны только администраторам</p>}
        </div>
      </CardContent>
    </Card>
  );
};