import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useTurarMedicalData } from '@/hooks/useTurarMedicalData';

interface TurarRoomSelectorProps {
  selectedDepartment: string;
  selectedRooms: string[];
  onRoomsChange: (rooms: string[]) => void;
  multiple?: boolean;
  label?: string;
}

export default function TurarRoomSelector({ 
  selectedDepartment, 
  selectedRooms, 
  onRoomsChange, 
  multiple = true,
  label = "Выберите кабинеты" 
}: TurarRoomSelectorProps) {
  const { data: turarData } = useTurarMedicalData();

  // Получаем кабинеты для выбранного отделения
  const departmentRooms = React.useMemo(() => {
    if (!turarData || !selectedDepartment) return [];
    
    const rooms = new Set<string>();
    turarData.forEach(item => {
      if (item["Отделение/Блок"] === selectedDepartment && item["Помещение/Кабинет"]) {
        rooms.add(item["Помещение/Кабинет"]);
      }
    });
    
    return Array.from(rooms).sort();
  }, [turarData, selectedDepartment]);

  const handleRoomToggle = (roomName: string, checked: boolean) => {
    if (multiple) {
      if (checked) {
        onRoomsChange([...selectedRooms, roomName]);
      } else {
        onRoomsChange(selectedRooms.filter(room => room !== roomName));
      }
    } else {
      onRoomsChange(checked ? [roomName] : []);
    }
  };

  const handleSingleSelect = (value: string) => {
    onRoomsChange([value]);
  };

  if (!selectedDepartment) {
    return (
      <div className="space-y-2">
        <Label className="text-muted-foreground">{label}</Label>
        <div className="text-sm text-muted-foreground italic">
          Сначала выберите отделение
        </div>
      </div>
    );
  }

  if (!multiple) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Select value={selectedRooms[0] || ""} onValueChange={handleSingleSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите кабинет" />
          </SelectTrigger>
          <SelectContent>
            {departmentRooms.map((room) => (
              <SelectItem key={room} value={room}>
                {room}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label} ({selectedRooms.length} выбрано)</Label>
      <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
        {departmentRooms.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">
            Нет доступных кабинетов
          </div>
        ) : (
          <div className="space-y-2">
            {departmentRooms.map((room) => (
              <div key={room} className="flex items-center space-x-2">
                <Checkbox
                  id={`room-${room}`}
                  checked={selectedRooms.includes(room)}
                  onCheckedChange={(checked) => handleRoomToggle(room, checked as boolean)}
                />
                <Label
                  htmlFor={`room-${room}`}
                  className="text-sm cursor-pointer"
                >
                  {room}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}