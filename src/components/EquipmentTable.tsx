import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Equipment, useRoomEquipment, useDeleteEquipment } from '@/hooks/useRoomEquipment';
import { EquipmentDialog } from './EquipmentDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EquipmentTableProps {
  roomId: string;
}

export const EquipmentTable: React.FC<EquipmentTableProps> = ({ roomId }) => {
  const { data: equipment = [], isLoading } = useRoomEquipment(roomId);
  const deleteEquipment = useDeleteEquipment();
  
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Equipment | null>(null);

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setIsAddingNew(false);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingEquipment(null);
    setIsAddingNew(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (eq: Equipment) => {
    deleteEquipment.mutate({ id: eq.id, room_id: eq.room_id });
    setDeleteConfirm(null);
  };

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Загрузка оборудования...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleAddNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Добавить оборудование
        </Button>
      </div>

      {equipment.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          Нет оборудования в этом помещении
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Код оборудования</TableHead>
              <TableHead>Наименование</TableHead>
              <TableHead>Наименование (модель)</TableHead>
              <TableHead>Код оборудования*</TableHead>
              <TableHead>Вид</TableHead>
              <TableHead>Бренд</TableHead>
              <TableHead>Страна</TableHead>
              <TableHead>Спецификация</TableHead>
              <TableHead>Документы</TableHead>
              <TableHead>Стандарт</TableHead>
              <TableHead className="text-right sticky right-0 bg-background shadow-[-2px_0_4px_rgba(0,0,0,0.1)]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.map((eq) => (
              <TableRow key={eq.id}>
                <TableCell>{eq.equipment_code || '-'}</TableCell>
                <TableCell className="font-medium">{eq.equipment_name || '-'}</TableCell>
                <TableCell>{eq.model_name || '-'}</TableCell>
                <TableCell>{eq.equipment_code_required || '-'}</TableCell>
                <TableCell>
                  {eq.equipment_type ? (
                    <Badge variant={eq.equipment_type === 'МИ' ? 'default' : 'secondary'}>
                      {eq.equipment_type}
                    </Badge>
                  ) : '-'}
                </TableCell>
                <TableCell>{eq.brand || '-'}</TableCell>
                <TableCell>{eq.country || '-'}</TableCell>
                <TableCell className="max-w-xs truncate">{eq.specification || '-'}</TableCell>
                <TableCell>
                  {eq.documents && Array.isArray(eq.documents) && eq.documents.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {eq.documents.map((doc: any, idx: number) => (
                        <a
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline truncate max-w-[150px]"
                          title={doc.url}
                        >
                          {doc.name || `Документ ${idx + 1}`}
                        </a>
                      ))}
                    </div>
                  ) : '-'}
                </TableCell>
                <TableCell>{eq.standard || '-'}</TableCell>
                <TableCell className="text-right sticky right-0 bg-background shadow-[-2px_0_4px_rgba(0,0,0,0.1)]">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(eq)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(eq)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <EquipmentDialog
        equipment={editingEquipment}
        roomId={roomId}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingEquipment(null);
          setIsAddingNew(false);
        }}
        isNew={isAddingNew}
      />

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить оборудование?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Оборудование будет удалено безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};