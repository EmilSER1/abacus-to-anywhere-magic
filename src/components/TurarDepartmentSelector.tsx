import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTurarMedicalData } from '@/hooks/useTurarMedicalData';

interface TurarDepartmentSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
}

export default function TurarDepartmentSelector({ 
  value, 
  onValueChange, 
  label = "Выберите отделение Турар" 
}: TurarDepartmentSelectorProps) {
  const { data: turarData } = useTurarMedicalData();

  // Получаем уникальные отделения Турар
  const turarDepartments = React.useMemo(() => {
    if (!turarData) return [];
    
    const departments = new Set<string>();
    turarData.forEach(item => {
      if (item["Отделение/Блок"]) {
        departments.add(item["Отделение/Блок"]);
      }
    });
    
    return Array.from(departments).sort();
  }, [turarData]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Выберите отделение Турар" />
        </SelectTrigger>
        <SelectContent>
          {turarDepartments.map((dept) => (
            <SelectItem key={dept} value={dept}>
              {dept}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}