import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Equipment, useUpdateEquipment, useAddEquipment } from '@/hooks/useRoomEquipment';

interface EquipmentDialogProps {
  equipment: Equipment | null;
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  isNew?: boolean;
}

export const EquipmentDialog: React.FC<EquipmentDialogProps> = ({
  equipment,
  roomId,
  isOpen,
  onClose,
  isNew = false,
}) => {
  const updateEquipment = useUpdateEquipment();
  const addEquipment = useAddEquipment();

  const [formData, setFormData] = useState({
    equipment_code: '',
    equipment_name: '',
    equipment_type: '' as 'МИ' | 'не МИ' | '',
    brand: '',
    country: '',
    specification: '',
    documents: [] as string[],
    standard: '',
  });

  useEffect(() => {
    if (equipment) {
      setFormData({
        equipment_code: equipment.equipment_code || '',
        equipment_name: equipment.equipment_name || '',
        equipment_type: equipment.equipment_type || '',
        brand: equipment.brand || '',
        country: equipment.country || '',
        specification: equipment.specification || '',
        documents: equipment.documents || [],
        standard: equipment.standard || '',
      });
    } else {
      setFormData({
        equipment_code: '',
        equipment_name: '',
        equipment_type: '',
        brand: '',
        country: '',
        specification: '',
        documents: [],
        standard: '',
      });
    }
  }, [equipment]);

  const handleSave = () => {
    if (isNew) {
      addEquipment.mutate({
        room_id: roomId,
        ...formData,
        equipment_type: formData.equipment_type || null,
        quantity: null,
        unit: null,
        notes: null,
      });
    } else if (equipment) {
      updateEquipment.mutate({
        id: equipment.id,
        room_id: equipment.room_id,
        ...formData,
        equipment_type: formData.equipment_type || null,
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNew ? 'Добавить оборудование' : 'Редактировать оборудование'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="equipment_code">Код оборудования</Label>
            <Input
              id="equipment_code"
              value={formData.equipment_code}
              onChange={(e) => setFormData({ ...formData, equipment_code: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="equipment_name">Наименование *</Label>
            <Input
              id="equipment_name"
              value={formData.equipment_name}
              onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="equipment_type">Вид</Label>
            <Select
              value={formData.equipment_type}
              onValueChange={(value: 'МИ' | 'не МИ') => 
                setFormData({ ...formData, equipment_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите вид" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="МИ">МИ</SelectItem>
                <SelectItem value="не МИ">не МИ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="brand">Бренд</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="country">Страна</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="specification">Спецификация</Label>
            <Textarea
              id="specification"
              value={formData.specification}
              onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="documents">Документы</Label>
            <div className="text-sm text-muted-foreground">
              Функционал загрузки файлов будет добавлен позже
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="standard">Стандарт</Label>
            <Input
              id="standard"
              value={formData.standard}
              onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};