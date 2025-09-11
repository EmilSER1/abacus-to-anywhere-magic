import { Badge } from '@/components/ui/badge'
import { useTurarRoomEquipment, useProjectorRoomEquipment } from '@/hooks/useRoomEquipment'
import { Loader2, Package } from 'lucide-react'

interface RoomEquipmentDisplayProps {
  roomId: string;
  isProjectorDepartment: boolean;
}

export default function RoomEquipmentDisplay({ roomId, isProjectorDepartment }: RoomEquipmentDisplayProps) {
  const turarEquipmentQuery = useTurarRoomEquipment(roomId);
  const projectorEquipmentQuery = useProjectorRoomEquipment(roomId);

  const equipment = isProjectorDepartment ? projectorEquipmentQuery.data : turarEquipmentQuery.data;
  const isLoading = isProjectorDepartment ? projectorEquipmentQuery.isLoading : turarEquipmentQuery.isLoading;

  if (isLoading) {
    return (
      <div className="bg-muted/30 p-3 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Загрузка оборудования...
        </div>
      </div>
    );
  }

  if (!equipment || equipment.length === 0) {
    return (
      <div className="bg-muted/30 p-3 rounded-lg">
        <div className="text-sm text-muted-foreground text-center">
          📦 В кабинете нет зарегистрированного оборудования
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 p-3 rounded-lg space-y-2">
      <div className="text-xs text-muted-foreground mb-2">
        {isProjectorDepartment ? (
          "Данные из проектной документации"
        ) : (
          "Данные из медицинского оборудования Турар"
        )}
      </div>
      
      <div className="space-y-2">
        {equipment.map((item) => (
          <div key={item.id} className="bg-background p-2 rounded border text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {isProjectorDepartment 
                    ? (item as any).equipment_name || 'Без названия'
                    : (item as any).equipment_name
                  }
                </div>
                <div className="text-muted-foreground">
                  Код: {isProjectorDepartment 
                    ? (item as any).equipment_code || 'Н/Д'
                    : (item as any).equipment_code
                  }
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="outline" className="text-xs">
                  {isProjectorDepartment 
                    ? `${(item as any).equipment_quantity || '?'} ${(item as any).equipment_unit || 'шт'}`
                    : `${(item as any).quantity} шт`
                  }
                </Badge>
                {isProjectorDepartment && (item as any).equipment_notes && (
                  <div className="text-xs text-muted-foreground max-w-24 truncate">
                    {(item as any).equipment_notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-xs text-muted-foreground border-t pt-2 flex items-center gap-1">
        <Package className="h-3 w-3" />
        Всего позиций: {equipment.length}
      </div>
    </div>
  );
}