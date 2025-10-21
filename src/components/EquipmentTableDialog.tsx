import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRoomEquipment, useDeleteEquipment, Equipment } from "@/hooks/useRoomEquipment";
import { EquipmentEditDialog } from "./EquipmentEditDialog";
import { useUserRole } from "@/hooks/useUserRole";

interface EquipmentTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}

export const EquipmentTableDialog: React.FC<EquipmentTableDialogProps> = ({
  isOpen,
  onClose,
  roomId,
  roomName,
}) => {
  const { data: equipment = [], isLoading } = useRoomEquipment(roomId);
  const deleteEquipment = useDeleteEquipment();
  const { currentUserRole, canEdit: canEditRole } = useUserRole();
  const canEdit = canEditRole();
  
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setIsAddingNew(false);
    setIsEditDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingEquipment(null);
    setIsAddingNew(true);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Вы уверены, что хотите удалить это оборудование?")) {
      await deleteEquipment.mutateAsync({ id, room_id: roomId });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">
                Оборудование: {roomName}
              </DialogTitle>
              {canEdit && (
                <Button onClick={handleAdd} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Добавить
                </Button>
              )}
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
          ) : equipment.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Нет оборудования
            </div>
          ) : (
            <Table>
              <TableHeader>
              <TableRow>
                <TableHead>Код оборудования</TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead>Наименование (модель)</TableHead>
                <TableHead>Вид</TableHead>
                <TableHead>Бренд</TableHead>
                <TableHead>Страна</TableHead>
                <TableHead>Спецификация</TableHead>
                <TableHead>Документы</TableHead>
                <TableHead>Стандарт</TableHead>
                {canEdit && <TableHead className="w-[100px]">Действия</TableHead>}
              </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.equipment_code || '-'}</TableCell>
                    <TableCell className="font-medium">{item.equipment_name || '-'}</TableCell>
                    <TableCell>{item.model_name || '-'}</TableCell>
                    <TableCell>
                      {item.equipment_type ? (
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.equipment_type === 'МИ' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.equipment_type}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{item.brand || '-'}</TableCell>
                    <TableCell>{item.country || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={item.specification || ''}>
                      {item.specification || '-'}
                    </TableCell>
                    <TableCell>
                      {item.documents && Array.isArray(item.documents) && item.documents.length > 0 
                        ? `${item.documents.length} ссылок` 
                        : '-'}
                    </TableCell>
                    <TableCell>{item.standard || '-'}</TableCell>
                    {canEdit && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {isEditDialogOpen && (
        <EquipmentEditDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          equipment={editingEquipment}
          roomId={roomId}
          isNew={isAddingNew}
        />
      )}
    </>
  );
};
