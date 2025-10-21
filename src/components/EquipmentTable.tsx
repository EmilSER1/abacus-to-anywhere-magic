import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, ChevronDown, ChevronRight, DollarSign } from 'lucide-react';
import { Equipment, useRoomEquipment, useDeleteEquipment } from '@/hooks/useRoomEquipment';
import { EquipmentDialog } from './EquipmentDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUserRole } from '@/hooks/useUserRole';
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
  const { canEdit } = useUserRole();
  
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Equipment | null>(null);
  const [expandedSpecs, setExpandedSpecs] = useState<string[]>([]);
  const [expandedPurchase, setExpandedPurchase] = useState<string[]>([]);

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

  const toggleSpecs = (equipmentId: string) => {
    setExpandedSpecs(prev => 
      prev.includes(equipmentId) 
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const togglePurchase = (equipmentId: string) => {
    setExpandedPurchase(prev => 
      prev.includes(equipmentId) 
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  const hasSpecs = (eq: Equipment) => {
    return !!(eq.dimensions || eq.humidity_temperature || eq.voltage || eq.frequency || 
      eq.power_watts || eq.power_watts_peak || eq.ups || eq.floor_load || 
      eq.floor_load_heaviest || eq.ceiling_load_heaviest || eq.chiller || 
      eq.precision_ac || eq.exhaust || eq.drainage || eq.hot_water || 
      eq.cold_water || eq.distilled_water || eq.neutralization_tank || 
      eq.data_requirements || eq.emergency_buttons || eq.xray_warning_lamps || 
      eq.raised_floor || eq.ceiling_drops || eq.medical_gas_o2 || 
      eq.medical_gas_ma4 || eq.medical_gas_ma7 || eq.medical_gas_n2o || 
      eq.medical_gas_other || eq.other_requirements);
  };

  const hasPurchaseInfo = (eq: Equipment) => {
    return !!(eq.purchase_price || eq.price_updated_at || eq.incoterms || 
      eq.supplier || eq.supplier_status || (eq.supplier_contacts && eq.supplier_contacts.length > 0));
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
              <React.Fragment key={eq.id}>
                <TableRow>
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
                  <TableCell className="text-right sticky right-0 bg-background shadow-[-2px_0_4px_rgba(0,0,0,0.1)] z-10">
                    <div className="flex justify-end gap-2">
                      {canEdit() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePurchase(eq.id)}
                          title="Закупочная информация"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}
                      {hasSpecs(eq) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSpecs(eq.id)}
                          title="Технические характеристики"
                        >
                          {expandedSpecs.includes(eq.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(eq)}
                        title="Редактировать"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(eq)}
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {canEdit() && expandedPurchase.includes(eq.id) && (
                  <TableRow className="bg-accent/20">
                    <TableCell colSpan={11}>
                      <div className="p-4 space-y-4">
                        <h4 className="font-semibold text-sm mb-3">Закупочная информация</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {eq.purchase_price && (
                            <div>
                              <div className="text-xs text-muted-foreground">Цена закупа</div>
                              <div className="text-sm font-medium">
                                {eq.purchase_price} {eq.purchase_currency || ''}
                              </div>
                            </div>
                          )}
                          {eq.price_updated_at && (
                            <div>
                              <div className="text-xs text-muted-foreground">Дата обновления</div>
                              <div className="text-sm font-medium">
                                {new Date(eq.price_updated_at).toLocaleDateString('ru-RU')}
                              </div>
                            </div>
                          )}
                          {eq.incoterms && (
                            <div>
                              <div className="text-xs text-muted-foreground">Условия инкотермс</div>
                              <div className="text-sm font-medium">{eq.incoterms}</div>
                            </div>
                          )}
                          {eq.supplier && (
                            <div>
                              <div className="text-xs text-muted-foreground">Поставщик</div>
                              <div className="text-sm font-medium">{eq.supplier}</div>
                            </div>
                          )}
                          {eq.supplier_status && (
                            <div>
                              <div className="text-xs text-muted-foreground">Статус поставщика</div>
                              <div className="text-sm font-medium">
                                <Badge variant="outline">{eq.supplier_status}</Badge>
                              </div>
                            </div>
                          )}
                          {eq.supplier_contacts && eq.supplier_contacts.length > 0 && (
                            <div className="col-span-2 md:col-span-3">
                              <div className="text-xs text-muted-foreground mb-2">Контакты</div>
                              <div className="space-y-3">
                                {eq.supplier_contacts.map((contact: any, idx: number) => (
                                  <div key={idx} className="border rounded-lg p-3 space-y-1">
                                    {contact.name && (
                                      <div className="font-medium">{contact.name}</div>
                                    )}
                                    {contact.phones && contact.phones.length > 0 && (
                                      <div className="text-xs">
                                        <span className="text-muted-foreground">Тел: </span>
                                        {contact.phones.join(', ')}
                                      </div>
                                    )}
                                    {contact.emails && contact.emails.length > 0 && (
                                      <div className="text-xs">
                                        <span className="text-muted-foreground">Email: </span>
                                        {contact.emails.join(', ')}
                                      </div>
                                    )}
                                    {contact.city && (
                                      <div className="text-xs">
                                        <span className="text-muted-foreground">Город: </span>
                                        {contact.city}
                                      </div>
                                    )}
                                    {contact.address && (
                                      <div className="text-xs">
                                        <span className="text-muted-foreground">Адрес: </span>
                                        {contact.address}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {expandedSpecs.includes(eq.id) && (
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={11}>
                      <div className="p-4 space-y-4">
                        <h4 className="font-semibold text-sm mb-3">Технические характеристики</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {eq.dimensions && (
                            <div>
                              <div className="text-xs text-muted-foreground">Размеры (Ш/Д/В), мм</div>
                              <div className="text-sm font-medium">{eq.dimensions}</div>
                            </div>
                          )}
                          {eq.humidity_temperature && (
                            <div>
                              <div className="text-xs text-muted-foreground">Влажность и температура</div>
                              <div className="text-sm font-medium">{eq.humidity_temperature}</div>
                            </div>
                          )}
                          {eq.voltage && (
                            <div>
                              <div className="text-xs text-muted-foreground">Вольт</div>
                              <div className="text-sm font-medium">{eq.voltage}</div>
                            </div>
                          )}
                          {eq.frequency && (
                            <div>
                              <div className="text-xs text-muted-foreground">Частота</div>
                              <div className="text-sm font-medium">{eq.frequency}</div>
                            </div>
                          )}
                          {eq.power_watts && (
                            <div>
                              <div className="text-xs text-muted-foreground">Мощность в Ватт</div>
                              <div className="text-sm font-medium">{eq.power_watts}</div>
                            </div>
                          )}
                          {eq.power_watts_peak && (
                            <div>
                              <div className="text-xs text-muted-foreground">Мощность Ватт пиковая</div>
                              <div className="text-sm font-medium">{eq.power_watts_peak}</div>
                            </div>
                          )}
                          {eq.ups && (
                            <div>
                              <div className="text-xs text-muted-foreground">Источник бесперебойного питания</div>
                              <div className="text-sm font-medium">{eq.ups}</div>
                            </div>
                          )}
                          {eq.floor_load && (
                            <div>
                              <div className="text-xs text-muted-foreground">Нагрузка на пол</div>
                              <div className="text-sm font-medium">{eq.floor_load}</div>
                            </div>
                          )}
                          {eq.floor_load_heaviest && (
                            <div>
                              <div className="text-xs text-muted-foreground">Самая тяжелая часть</div>
                              <div className="text-sm font-medium">{eq.floor_load_heaviest}</div>
                            </div>
                          )}
                          {eq.ceiling_load_heaviest && (
                            <div>
                              <div className="text-xs text-muted-foreground">Нагрузка на потолок (самая тяжелая часть)</div>
                              <div className="text-sm font-medium">{eq.ceiling_load_heaviest}</div>
                            </div>
                          )}
                          {eq.chiller !== null && eq.chiller !== undefined && (
                            <div>
                              <div className="text-xs text-muted-foreground">Чиллер</div>
                              <div className="text-sm font-medium">{eq.chiller ? 'Да' : 'Нет'}</div>
                            </div>
                          )}
                          {eq.precision_ac !== null && eq.precision_ac !== undefined && (
                            <div>
                              <div className="text-xs text-muted-foreground">Прецизионный кондиционер</div>
                              <div className="text-sm font-medium">{eq.precision_ac ? 'Да' : 'Нет'}</div>
                            </div>
                          )}
                          {eq.exhaust && (
                            <div>
                              <div className="text-xs text-muted-foreground">Вытяжка (Диаметр и расход)</div>
                              <div className="text-sm font-medium">{eq.exhaust}</div>
                            </div>
                          )}
                          {eq.drainage && (
                            <div>
                              <div className="text-xs text-muted-foreground">Дренаж (Диаметр и расход)</div>
                              <div className="text-sm font-medium">{eq.drainage}</div>
                            </div>
                          )}
                          {eq.hot_water && (
                            <div>
                              <div className="text-xs text-muted-foreground">Горячая вода (Диаметр и расход)</div>
                              <div className="text-sm font-medium">{eq.hot_water}</div>
                            </div>
                          )}
                          {eq.cold_water && (
                            <div>
                              <div className="text-xs text-muted-foreground">Холодная вода (Диаметр и расход)</div>
                              <div className="text-sm font-medium">{eq.cold_water}</div>
                            </div>
                          )}
                          {eq.distilled_water && (
                            <div>
                              <div className="text-xs text-muted-foreground">Дистиллированная вода (Диаметр и расход)</div>
                              <div className="text-sm font-medium">{eq.distilled_water}</div>
                            </div>
                          )}
                          {eq.neutralization_tank && (
                            <div>
                              <div className="text-xs text-muted-foreground">Дренаж - резервуар для нейтрализации</div>
                              <div className="text-sm font-medium">{eq.neutralization_tank}</div>
                            </div>
                          )}
                          {eq.data_requirements && (
                            <div>
                              <div className="text-xs text-muted-foreground">Требования к данным</div>
                              <div className="text-sm font-medium">{eq.data_requirements}</div>
                            </div>
                          )}
                          {eq.emergency_buttons && (
                            <div>
                              <div className="text-xs text-muted-foreground">Кнопки экстренного вызова</div>
                              <div className="text-sm font-medium">{eq.emergency_buttons}</div>
                            </div>
                          )}
                          {eq.xray_warning_lamps && (
                            <div>
                              <div className="text-xs text-muted-foreground">Рентгеновские предупреждающие лампы</div>
                              <div className="text-sm font-medium">{eq.xray_warning_lamps}</div>
                            </div>
                          )}
                          {eq.raised_floor && (
                            <div>
                              <div className="text-xs text-muted-foreground">Фальшпол (Да/Нет и Глубина)</div>
                              <div className="text-sm font-medium">{eq.raised_floor}</div>
                            </div>
                          )}
                          {eq.ceiling_drops && (
                            <div>
                              <div className="text-xs text-muted-foreground">Опуски плит (Да/Нет и Глубина)</div>
                              <div className="text-sm font-medium">{eq.ceiling_drops}</div>
                            </div>
                          )}
                          {eq.medical_gas_o2 && (
                            <div>
                              <div className="text-xs text-muted-foreground">Медгазы (O2)</div>
                              <div className="text-sm font-medium">{eq.medical_gas_o2}</div>
                            </div>
                          )}
                          {eq.medical_gas_ma4 && (
                            <div>
                              <div className="text-xs text-muted-foreground">Медгазы (MA4)</div>
                              <div className="text-sm font-medium">{eq.medical_gas_ma4}</div>
                            </div>
                          )}
                          {eq.medical_gas_ma7 && (
                            <div>
                              <div className="text-xs text-muted-foreground">Медгазы (MA7)</div>
                              <div className="text-sm font-medium">{eq.medical_gas_ma7}</div>
                            </div>
                          )}
                          {eq.medical_gas_n2o && (
                            <div>
                              <div className="text-xs text-muted-foreground">Медгазы (N2O)</div>
                              <div className="text-sm font-medium">{eq.medical_gas_n2o}</div>
                            </div>
                          )}
                          {eq.medical_gas_other && (
                            <div>
                              <div className="text-xs text-muted-foreground">Медгазы (Другие)</div>
                              <div className="text-sm font-medium">{eq.medical_gas_other}</div>
                            </div>
                          )}
                          {eq.other_requirements && (
                            <div className="col-span-2 md:col-span-3">
                              <div className="text-xs text-muted-foreground">Прочие требования</div>
                              <div className="text-sm font-medium">{eq.other_requirements}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
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