import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddEquipment, useUpdateEquipment, Equipment } from "@/hooks/useRoomEquipment";

interface EquipmentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  roomId: string;
  isNew: boolean;
}

export const EquipmentEditDialog: React.FC<EquipmentEditDialogProps> = ({
  isOpen,
  onClose,
  equipment,
  roomId,
  isNew,
}) => {
  const addEquipment = useAddEquipment();
  const updateEquipment = useUpdateEquipment();

  const [formData, setFormData] = useState({
    equipment_code: '',
    equipment_name: '',
    equipment_type: '' as 'МИ' | 'не МИ' | '',
    brand: '',
    country: '',
    specification: '',
    documents: [] as any[],
    standard: '',
    quantity: '',
    unit: '',
    notes: '',
  });

  useEffect(() => {
    if (equipment && !isNew) {
      setFormData({
        equipment_code: equipment.equipment_code || '',
        equipment_name: equipment.equipment_name || '',
        equipment_type: equipment.equipment_type || '',
        brand: equipment.brand || '',
        country: equipment.country || '',
        specification: equipment.specification || '',
        documents: equipment.documents || [],
        standard: equipment.standard || '',
        quantity: equipment.quantity || '',
        unit: equipment.unit || '',
        notes: equipment.notes || '',
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
        quantity: '',
        unit: '',
        notes: '',
      });
    }
  }, [equipment, isNew]);

  const handleSave = async () => {
    try {
      if (isNew) {
        await addEquipment.mutateAsync({
          ...formData,
          room_id: roomId,
          equipment_type: formData.equipment_type || null,
        });
      } else if (equipment) {
        await updateEquipment.mutateAsync({
          ...formData,
          id: equipment.id,
          room_id: roomId,
          equipment_type: formData.equipment_type || null,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving equipment:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Добавить оборудование' : 'Редактировать оборудование'}</DialogTitle>
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
              onValueChange={(value: 'МИ' | 'не МИ') => setFormData({ ...formData, equipment_type: value })}
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
              Функция загрузки файлов будет добавлена позже
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
