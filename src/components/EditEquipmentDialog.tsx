import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Equipment {
  id: string;
  "Наименование оборудования"?: string;
  "Код оборудования"?: string;
  "Кол-во"?: string;
  "Ед. изм."?: string;
  "Примечания"?: string;
  equipment_status?: 'Согласовано' | 'Не согласовано' | 'Не найдено';
  equipment_specification?: string;
  equipment_documents?: string;
}

interface EditEquipmentDialogProps {
  equipment: Equipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEquipment: Equipment) => void;
  isNew?: boolean;
}

const statusConfig = {
  'Согласовано': { color: 'bg-green-100 text-green-800', label: 'Согласовано' },
  'Не согласовано': { color: 'bg-yellow-100 text-yellow-800', label: 'Не согласовано' },
  'Не найдено': { color: 'bg-red-100 text-red-800', label: 'Не найдено' }
} as const;

export default function EditEquipmentDialog({
  equipment,
  isOpen,
  onClose,
  onSave,
  isNew = false
}: EditEquipmentDialogProps) {
  const [formData, setFormData] = useState<Equipment>(() => ({
    id: equipment?.id || '',
    "Наименование оборудования": equipment?.["Наименование оборудования"] || '',
    "Код оборудования": equipment?.["Код оборудования"] || '',
    "Кол-во": equipment?.["Кол-во"] || '',
    "Ед. изм.": equipment?.["Ед. изм."] || '',
    "Примечания": equipment?.["Примечания"] || '',
    equipment_status: equipment?.equipment_status || 'Не найдено',
    equipment_specification: equipment?.equipment_specification || '',
    equipment_documents: equipment?.equipment_documents || ''
  }));

  React.useEffect(() => {
    if (equipment) {
      setFormData({
        id: equipment.id || '',
        "Наименование оборудования": equipment["Наименование оборудования"] || '',
        "Код оборудования": equipment["Код оборудования"] || '',
        "Кол-во": equipment["Кол-во"] || '',
        "Ед. изм.": equipment["Ед. изм."] || '',
        "Примечания": equipment["Примечания"] || '',
        equipment_status: equipment.equipment_status || 'Не найдено',
        equipment_specification: equipment.equipment_specification || '',
        equipment_documents: equipment.equipment_documents || ''
      });
    }
  }, [equipment]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Добавить новое оборудование' : 'Редактировать оборудование'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Наименование оборудования</Label>
            <Input
              id="name"
              value={formData["Наименование оборудования"]}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                "Наименование оборудования": e.target.value
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Код оборудования</Label>
              <Input
                id="code"
                value={formData["Код оборудования"]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  "Код оборудования": e.target.value
                }))}
              />
            </div>
            <div>
              <Label htmlFor="quantity">Количество</Label>
              <Input
                id="quantity"
                value={formData["Кол-во"]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  "Кол-во": e.target.value
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Единица измерения</Label>
              <Input
                id="unit"
                value={formData["Ед. изм."]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  "Ед. изм.": e.target.value
                }))}
              />
            </div>
            <div>
              <Label htmlFor="status">Статус</Label>
              <Select
                value={formData.equipment_status}
                onValueChange={(value: 'Согласовано' | 'Не согласовано' | 'Не найдено') => 
                  setFormData(prev => ({
                    ...prev,
                    equipment_status: value
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <Badge className={config.color}>{config.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="specification">Спецификация</Label>
            <Textarea
              id="specification"
              value={formData.equipment_specification}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                equipment_specification: e.target.value
              }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="documents">Документы</Label>
            <Textarea
              id="documents"
              value={formData.equipment_documents}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                equipment_documents: e.target.value
              }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Примечания</Label>
            <Textarea
              id="notes"
              value={formData["Примечания"]}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                "Примечания": e.target.value
              }))}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            {isNew ? 'Добавить' : 'Сохранить'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}