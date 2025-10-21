import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddEquipment, useUpdateEquipment, Equipment } from "@/hooks/useRoomEquipment";
import { useEquipmentFiles, EquipmentDocument } from "@/hooks/useEquipmentFiles";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, X, Download } from "lucide-react";
import { toast } from "sonner";

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
  const { uploadFile, deleteFile, getFileUrl } = useEquipmentFiles();
  const { canEdit } = useUserRole();
  const [uploading, setUploading] = useState(false);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedDocs: EquipmentDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const doc = await uploadFile(file, equipment?.id || 'temp');
      if (doc) {
        uploadedDocs.push(doc);
      }
    }

    setFormData({
      ...formData,
      documents: [...formData.documents, ...uploadedDocs],
    });
    setUploading(false);
    e.target.value = '';
  };

  const handleFileDelete = async (doc: EquipmentDocument) => {
    const success = await deleteFile(doc.url);
    if (success) {
      setFormData({
        ...formData,
        documents: formData.documents.filter((d: EquipmentDocument) => d.url !== doc.url),
      });
      toast.success("Файл удален");
    }
  };

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
            {canEdit && (
              <div className="flex items-center gap-2">
                <Input
                  id="documents"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            )}
            {formData.documents.length > 0 && (
              <div className="space-y-2 mt-2">
                {formData.documents.map((doc: EquipmentDocument, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm truncate max-w-[200px]">{doc.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(doc.size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(getFileUrl(doc.url), '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileDelete(doc)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
