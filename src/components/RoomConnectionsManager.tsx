import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Link2, Building2 } from 'lucide-react'
import { useDepartments } from '@/hooks/useDepartments'
import { useDepartmentMappingsWithDetails } from '@/hooks/useDepartmentMappingsById'
import { useRoomConnectionsById, useCreateRoomConnectionById, useDeleteRoomConnectionById } from '@/hooks/useRoomConnectionsById'
import DepartmentRoomsDisplay from '@/components/DepartmentRoomsDisplay'
import { useToast } from '@/hooks/use-toast'
import { useUserRole } from '@/hooks/useUserRole'
import { supabase } from '@/integrations/supabase/client'

export default function RoomConnectionsManager() {
  const [linkingRoom, setLinkingRoom] = useState<{
    departmentId: string;
    roomId: string;
    roomName: string;
    departmentName: string;
    isProjectorDepartment: boolean;
  } | null>(null)
  
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [availableTargetRooms, setAvailableTargetRooms] = useState<Array<{id: string; name: string; departmentName: string}>>([])
  const [connectionDialogSource, setConnectionDialogSource] = useState<{
    roomId: string;
    roomName: string;
    departmentId: string;
    departmentName: string;
    isProjectorDepartment: boolean;
  } | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set())
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set())

  const { data: departments } = useDepartments()
  const { data: departmentMappings } = useDepartmentMappingsWithDetails()
  const { data: connections, refetch: refetchConnections } = useRoomConnectionsById()
  const createConnectionMutation = useCreateRoomConnectionById()
  const deleteConnectionMutation = useDeleteRoomConnectionById()
  const { toast } = useToast()
  const { canEdit } = useUserRole()

  // Получаем связанные отделения (только те, у которых есть ID)
  const linkedDepartmentPairs = departmentMappings?.filter(mapping => 
    mapping.turar_department_id && mapping.projector_department_id
  ) || []

  // Автоматическое обновление данных каждые 10 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      refetchConnections();
      setLastUpdate(new Date());
    }, 10000); // 10 секунд

    return () => clearInterval(interval);
  }, [refetchConnections]);

  const handleLinkRoom = async (roomId: string, roomName: string, departmentId: string, departmentName: string, isProjectorDepartment: boolean) => {
    // Устанавливаем источник для диалога
    setConnectionDialogSource({
      roomId,
      roomName,
      departmentId,
      departmentName,
      isProjectorDepartment
    });

    // Определяем доступные кабинеты для связывания
    let targetRooms: Array<{id: string; name: string; departmentName: string}> = [];
    
    try {
      if (isProjectorDepartment) {
        // Для проектировщиков ищем кабинеты Турар
        const turarDepts = linkedDepartmentPairs
          .filter(pair => pair.projector_department_id === departmentId);
        
        console.log('🔍 Поиск кабинетов Турар для проектировщика:', {
          departmentId,
          departmentName,
          linkedPairs: turarDepts.length,
          turarDepts: turarDepts.map(d => d.turar_department)
        });
        
        for (const dept of turarDepts) {
          console.log(`🔍 Загружаем кабинеты Турар для отделения: ${dept.turar_department}`);
          
          const { data: rooms, error } = await supabase
            .from('turar_medical')
            .select('*')
            .eq('Отделение/Блок', dept.turar_department);
          
          console.log(`📋 Загружено записей из БД для ${dept.turar_department}:`, rooms?.length || 0);
          
          if (error) {
            console.error('Ошибка загрузки кабинетов Турар:', error);
            continue;
          }
          
          if (rooms && rooms.length > 0) {
            // Дедупликация по названию кабинета
            const uniqueRooms = new Map();
            rooms.forEach((room: any) => {
              const roomName = room['Помещение/Кабинет'];
              if (roomName && roomName.trim() && !uniqueRooms.has(roomName)) {
                uniqueRooms.set(roomName, {
                  id: room.id,
                  name: roomName,
                  departmentName: dept.turar_department
                });
              }
            });
            const deduplicatedRooms = Array.from(uniqueRooms.values());
            console.log(`✨ Уникальных кабинетов после дедупликации для ${dept.turar_department}:`, deduplicatedRooms.length);
            console.log('🏠 Список кабинетов:', deduplicatedRooms.map(r => r.name));
            targetRooms.push(...deduplicatedRooms);
          } else {
            console.log(`⚠️ Нет данных для отделения ${dept.turar_department}`);
          }
        }
      } else {
        // Для Турар ищем кабинеты проектировщиков
        const projectorDepts = linkedDepartmentPairs
          .filter(pair => pair.turar_department_id === departmentId);
        
        console.log('🔍 Поиск кабинетов проектировщиков для Турар:', {
          departmentId,
          departmentName,
          linkedPairs: projectorDepts.length,
          projectorDepts: projectorDepts.map(d => d.projector_department)
        });
        
        for (const dept of projectorDepts) {
          console.log(`🔍 Загружаем кабинеты проектировщиков для отделения: ${dept.projector_department}`);
          
          const { data: rooms, error } = await supabase
            .from('projector_floors')
            .select('*')
            .eq('ОТДЕЛЕНИЕ', dept.projector_department);
          
          console.log(`📋 Загружено записей из БД для ${dept.projector_department}:`, rooms?.length || 0);
          
          if (error) {
            console.error('Ошибка загрузки кабинетов проектировщиков:', error);
            continue;
          }
          
          if (rooms && rooms.length > 0) {
            // Дедупликация по названию кабинета
            const uniqueRooms = new Map();
            rooms.forEach((room: any) => {
              const roomName = room['НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ'];
              if (roomName && roomName.trim() && !uniqueRooms.has(roomName)) {
                uniqueRooms.set(roomName, {
                  id: room.id,
                  name: roomName,
                  departmentName: dept.projector_department
                });
              }
            });
            const deduplicatedRooms = Array.from(uniqueRooms.values());
            console.log(`✨ Уникальных кабинетов после дедупликации для ${dept.projector_department}:`, deduplicatedRooms.length);
            console.log('🏠 Список кабинетов:', deduplicatedRooms.map(r => r.name));
            targetRooms.push(...deduplicatedRooms);
          } else {
            console.log(`⚠️ Нет данных для отделения ${dept.projector_department}`);
          }
        }
      }
    } catch (error) {
      console.error('Общая ошибка загрузки кабинетов:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список кабинетов",
        variant: "destructive"
      });
      return;
    }

    console.log('🎯 ИТОГО найдено кабинетов для связывания:', targetRooms.length);
    console.log('📝 Список кабинетов:', targetRooms.map(r => r.name));
    
    setAvailableTargetRooms(targetRooms);
    setSelectedRooms(new Set());
    setShowConnectionDialog(true);
  };

  const createMultipleConnections = async () => {
    if (!connectionDialogSource || selectedRooms.size === 0) {
      toast({
        title: "Ошибка",
        description: "Необходимо выбрать кабинеты для связывания",
        variant: "destructive"
      });
      return;
    }

    try {
      let successCount = 0;
      
      for (const roomId of selectedRooms) {
        const connectionData = connectionDialogSource.isProjectorDepartment ? {
          turar_department_id: connectionDialogSource.departmentId,
          turar_room_id: roomId,
          projector_department_id: connectionDialogSource.departmentId,
          projector_room_id: connectionDialogSource.roomId
        } : {
          turar_department_id: connectionDialogSource.departmentId,
          turar_room_id: connectionDialogSource.roomId,
          projector_department_id: connectionDialogSource.departmentId,
          projector_room_id: roomId
        };

        await createConnectionMutation.mutateAsync(connectionData);
        successCount++;
      }
      
      // Сбрасываем состояние
      setConnectionDialogSource(null);
      setSelectedRooms(new Set());
      setShowConnectionDialog(false);
      
      // Обновляем данные
      await refetchConnections();
      setLastUpdate(new Date());
      
      toast({
        title: "Связи созданы",
        description: `Успешно создано ${successCount} связей`
      });
    } catch (error) {
      console.error('Ошибка создания связей:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать некоторые связи",
        variant: "destructive"
      });
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      await deleteConnectionMutation.mutateAsync(connectionId)
      // Принудительно обновляем данные после удаления
      await refetchConnections();
      setLastUpdate(new Date());
      toast({
        title: "Связь удалена",
        description: "Связь между кабинетами успешно удалена"
      });
    } catch (error) {
      console.error('Ошибка удаления связи:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить связь",
        variant: "destructive"
      });
    }
  }

  const cancelLinking = () => {
    setConnectionDialogSource(null)
    setSelectedRooms(new Set())
    setShowConnectionDialog(false)
    toast({
      title: "Связывание отменено",
      description: "Процесс связывания кабинетов отменен"
    })
  }

  const toggleDepartment = (deptKey: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(deptKey)) {
      newExpanded.delete(deptKey);
    } else {
      newExpanded.add(deptKey);
    }
    setExpandedDepartments(newExpanded);
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Связывание кабинетов</h2>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">
              Нажмите "Связать кабинеты" на любом кабинете для начала процесса связывания
            </p>
            <div className="text-xs text-muted-foreground">
              Обновлено: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>
        
      </div>


      {/* Группировка по отделениям Турар */}
      <div className="space-y-8">
        {linkedDepartmentPairs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-muted-foreground">
                Нет связанных отделений. Сначала создайте связи на вкладке "Связывание отделений".
              </div>
            </CardContent>
          </Card>
        ) : (
          // Группируем по отделениям Турар
          Object.entries(
            linkedDepartmentPairs.reduce((acc, pair) => {
              const turarDept = pair.turar_department;
              if (!acc[turarDept]) {
                acc[turarDept] = {
                  turar_department_id: pair.turar_department_id!,
                  turar_department: pair.turar_department,
                  projector_departments: []
                };
              }
              acc[turarDept].projector_departments.push({
                projector_department_id: pair.projector_department_id!,
                projector_department: pair.projector_department
              });
              return acc;
            }, {} as Record<string, {
              turar_department_id: string;
              turar_department: string;
              projector_departments: Array<{
                projector_department_id: string;
                projector_department: string;
              }>;
            }>)
          ).map(([turarDeptName, group]) => {
            const deptKey = `turar-${turarDeptName}`;
            const isExpanded = expandedDepartments.has(deptKey);
            
            return (
              <Card key={turarDeptName} className="overflow-hidden">
                <CardHeader 
                  className="pb-2 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleDepartment(deptKey)}
                >
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-xs">Турар</Badge>
                      <span>{turarDeptName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {group.projector_departments.length} связей
                      </Badge>
                      <span className="text-sm">{isExpanded ? '▼' : '▶'}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Кабинеты Турар */}
                      <DepartmentRoomsDisplay
                        departmentId={group.turar_department_id}
                        departmentName={group.turar_department}
                        connections={connections || []}
                        onRemoveConnection={handleRemoveConnection}
                        onLinkRoom={(roomId, roomName) => handleLinkRoom(roomId, roomName, group.turar_department_id, group.turar_department, false)}
                        linkingRoom={null}
                        selectedRooms={new Set()}
                        multiSelectMode={false}
                      />

                      {/* Связанные отделения проектировщиков */}
                      <div className="space-y-3">
                        {group.projector_departments.map((projDept) => (
                          <DepartmentRoomsDisplay
                            key={projDept.projector_department_id}
                            departmentId={projDept.projector_department_id}
                            departmentName={projDept.projector_department}
                            connections={connections || []}
                            onRemoveConnection={handleRemoveConnection}
                            onLinkRoom={(roomId, roomName) => handleLinkRoom(roomId, roomName, projDept.projector_department_id, projDept.projector_department, true)}
                            linkingRoom={null}
                            isProjectorDepartment={true}
                            selectedRooms={new Set()}
                            multiSelectMode={false}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Диалог для создания связей */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создание связей</DialogTitle>
            {connectionDialogSource && (
              <div className="text-sm text-muted-foreground">
                Исходный кабинет: {connectionDialogSource.departmentName} - {connectionDialogSource.roomName}
              </div>
            )}
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm font-medium">
              Выберите кабинеты для связывания ({selectedRooms.size} выбрано):
            </div>
            
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {availableTargetRooms.map((room) => {
                const isSelected = selectedRooms.has(room.id);
                return (
                  <div
                    key={room.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => {
                      const newSelected = new Set(selectedRooms);
                      if (isSelected) {
                        newSelected.delete(room.id);
                      } else {
                        newSelected.add(room.id);
                      }
                      setSelectedRooms(newSelected);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{room.name}</div>
                        <div className="text-xs text-muted-foreground">{room.departmentName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && <Badge variant="default" className="text-xs">Выбран</Badge>}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={cancelLinking}>
                Отменить
              </Button>
              <Button 
                onClick={createMultipleConnections} 
                disabled={selectedRooms.size === 0 || createConnectionMutation.isPending}
              >
                {createConnectionMutation.isPending ? 'Создание...' : `Создать связи (${selectedRooms.size})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}