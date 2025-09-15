import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, Link, Check } from 'lucide-react';

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

  const handleCheckboxChange = (department: string, checked: boolean) => {
    console.log('✅ Checkbox clicked:', { department, checked });
    if (checked) {
      console.log('➕ Adding department:', department);
      onAdd(department);
    } else {
      console.log('➖ Removing department:', department);
      onRemove(department);
    }
  };

  console.log('📋 MultiSelect Debug:', {
    totalProjectorDepartments: projectorDepartments.length,
    selectedDepartmentsCount: selectedDepartments.length,
    allProjectorDepartments: projectorDepartments,
    currentSelectedDepartments: selectedDepartments
  });

  return (
    <div className="space-y-3">
      {/* Показываем выбранные отделения */}
      {selectedDepartments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-green-700 dark:text-green-400">
              Связанные отделения проектировщиков ({selectedDepartments.length}):
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
                <Check className="h-3 w-3 text-green-600" />
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

      {/* Checkbox интерфейс для выбора отделений */}
      {projectorDepartments.length > 0 && (
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="text-sm font-medium mb-3">
              Выберите отделения проектировщиков:
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {projectorDepartments.map((dept) => {
                const isSelected = selectedDepartments.includes(dept);
                return (
                  <div key={dept} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dept-${dept}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => handleCheckboxChange(dept, checked as boolean)}
                      disabled={isLoading}
                    />
                    <label 
                      htmlFor={`dept-${dept}`} 
                      className={`text-sm flex-1 cursor-pointer ${
                        isSelected ? 'font-medium text-green-700 dark:text-green-400' : ''
                      }`}
                    >
                      {dept}
                    </label>
                    {isSelected && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {projectorDepartments.length === 0 && (
        <div className="text-xs text-muted-foreground italic">
          Нет доступных отделений проектировщиков
        </div>
      )}
    </div>
  );
}