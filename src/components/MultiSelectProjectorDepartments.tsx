import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, Link } from 'lucide-react';

interface MultiSelectProjectorDepartmentsProps {
  projectorDepartments: string[];
  selectedDepartments: string[];
  onAdd: (department: string) => void;
  onRemove: (department: string) => void;
  onRemoveAll: () => void;
  isLoading?: boolean;
}

export default function MultiSelectProjectorDepartments({
  projectorDepartments,
  selectedDepartments,
  onAdd,
  onRemove,
  onRemoveAll,
  isLoading = false
}: MultiSelectProjectorDepartmentsProps) {
  const [selectedForAdd, setSelectedForAdd] = useState<string>('');

  // Фильтруем доступные отделения (исключаем уже выбранные)
  const availableDepartments = projectorDepartments.filter(
    dept => !selectedDepartments.includes(dept)
  );

  console.log('📋 MultiSelect Debug:', {
    totalProjectorDepartments: projectorDepartments.length,
    selectedDepartmentsCount: selectedDepartments.length,
    availableDepartmentsCount: availableDepartments.length,
    allProjectorDepartments: projectorDepartments,
    currentSelectedDepartments: selectedDepartments,
    currentAvailableDepartments: availableDepartments
  });

  const handleAdd = () => {
    if (selectedForAdd) {
      onAdd(selectedForAdd);
      setSelectedForAdd('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Показываем выбранные отделения */}
      {selectedDepartments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-green-700 dark:text-green-400">
              Связанные отделения проектировщиков:
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={onRemoveAll}
              disabled={isLoading}
              className="h-6 text-xs"
            >
              Удалить все связи
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedDepartments.map((dept) => (
              <div 
                key={dept} 
                className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800"
              >
                <Link className="h-3 w-3 text-green-600" />
                <span className="text-sm font-medium">{dept}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(dept)}
                  disabled={isLoading}
                  className="h-4 w-4 p-0 text-red-600 hover:text-red-700 hover:bg-red-100 ml-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Интерфейс добавления нового отделения */}
      {availableDepartments.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Select
                value={selectedForAdd}
                onValueChange={setSelectedForAdd}
              >
                <SelectTrigger className="flex-1 h-8">
                  <SelectValue placeholder="Выберите отделение проектировщиков" />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!selectedForAdd || isLoading}
                className="h-8"
              >
                <Plus className="h-3 w-3 mr-1" />
                Связать
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {availableDepartments.length === 0 && selectedDepartments.length === 0 && (
        <div className="text-xs text-muted-foreground italic">
          Нет доступных отделений проектировщиков
        </div>
      )}
    </div>
  );
}