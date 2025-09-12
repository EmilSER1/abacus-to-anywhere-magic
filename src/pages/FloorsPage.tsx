import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Edit, Plus, Building2, X } from 'lucide-react';
import EditEquipmentDialog from '@/components/EditEquipmentDialog';
import { useFloorsData, FloorData } from '@/hooks/useFloorsData';
import { useUpdateProjectorEquipment, useAddProjectorEquipment } from '@/hooks/useProjectorEquipment';
import { useTurarData } from '@/hooks/useTurarData';
import { useDepartmentMappings } from '@/hooks/useDepartmentMappings';
import { useLinkDepartmentToTurar, useUnlinkDepartmentFromTurar } from '@/hooks/useDepartmentTurarLink';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Equipment {
  id?: string;
  code?: string;
  name?: string;
  quantity?: string | number;
  unit?: string;
  notes?: string;
}

export default function FloorsPage() {
  const [searchParams] = useSearchParams();
  const { data: floorsData } = useFloorsData();
  const updateEquipmentMutation = useUpdateProjectorEquipment();
  const addEquipmentMutation = useAddProjectorEquipment();
  const { data: turarData } = useTurarData();
  const { data: departmentMappings } = useDepartmentMappings();
  const linkDepartmentMutation = useLinkDepartmentToTurar();
  const unlinkDepartmentMutation = useUnlinkDepartmentFromTurar();

  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [addingToRoom, setAddingToRoom] = useState<{ department: string; room: string } | null>(null);
  const [highlightTimeout, setHighlightTimeout] = useState(false);
  const [departmentTurarSelections, setDepartmentTurarSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    const urlSearchTerm = searchParams.get('search');
    if (urlSearchTerm) {
      const timer = setTimeout(() => {
        setHighlightTimeout(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const getDepartmentTurarLink = (departmentName: string) => {
    const mapping = departmentMappings?.find(m => m.projector_department === departmentName);
    return mapping?.turar_department || null;
  };

  const getTurarDepartments = () => {
    if (!turarData) return [];
    return [...new Set(turarData.map(item => item["Отделение"]))].sort();
  };

  const handleSaveDepartmentLink = (departmentName: string) => {
    const selectedTurarDepartment = departmentTurarSelections[departmentName];
    if (selectedTurarDepartment) {
      linkDepartmentMutation.mutate({
        departmentName,
        turarDepartment: selectedTurarDepartment
      });
    }
  };

  const handleRemoveDepartmentLink = (departmentName: string) => {
    unlinkDepartmentMutation.mutate(departmentName);
  };

  const onEditEquipment = (equipment: any, department: string, room: string) => {
    setEditingEquipment({
      ...equipment,
      department,
      room
    });
    setIsEditDialogOpen(true);
    setIsAddingEquipment(false);
  };

  const onAddEquipment = (department: string, room: string) => {
    setAddingToRoom({ department, room });
    setEditingEquipment({
      "Код оборудования": "",
      "Наименование оборудования": "",
      "Кол-во": "",
      "Ед. изм.": "",
      "Примечания": "",
      department,
      room
    });
    setIsEditDialogOpen(true);
    setIsAddingEquipment(true);
  };

  const handleSaveEquipment = async (equipmentData: any) => {
    const { department, room, ...equipment } = equipmentData;
    
    if (isAddingEquipment) {
      const newEquipment = {
        "ОТДЕЛЕНИЕ": department,
        "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": room,
        "КОД ПОМЕЩЕНИЯ": "",
        "ЭТАЖ": 1,
        "БЛОК": "",
        ...equipment
      };
      addEquipmentMutation.mutate(newEquipment);
    } else {
      updateEquipmentMutation.mutate(equipment);
    }
    
    setIsEditDialogOpen(false);
    setEditingEquipment(null);
    setIsAddingEquipment(false);
    setAddingToRoom(null);
  };

  if (!floorsData) {
    return <div className="flex justify-center items-center h-64">Загрузка...</div>;
  }

  // Group data by floors, then departments, then rooms
  const floorGroups = floorsData.reduce((acc: Record<string, FloorData[]>, item) => {
    const floorKey = `${item["ЭТАЖ"]} этаж`;
    if (!acc[floorKey]) acc[floorKey] = [];
    acc[floorKey].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Этажи и оборудование</h1>
      </div>

      <div className="space-y-4">
        {Object.entries(floorGroups).map(([floorName, floorItems]) => {
          const departmentGroups = floorItems.reduce((acc: Record<string, FloorData[]>, item) => {
            const dept = item["ОТДЕЛЕНИЕ"];
            if (!acc[dept]) acc[dept] = [];
            acc[dept].push(item);
            return acc;
          }, {});

          return (
            <Card key={floorName} className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {floorName}
              </h2>
              
              <Accordion type="single" collapsible className="space-y-2">
                <AccordionItem value={floorName} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <span className="text-lg font-medium">Отделения ({Object.keys(departmentGroups).length})</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {Object.entries(departmentGroups).map(([departmentName, departmentItems]) => {
                        const turarDepartmentLink = getDepartmentTurarLink(departmentName);
                        const turarDepartments = getTurarDepartments();
                        
                        const roomGroups = departmentItems.reduce((acc: Record<string, FloorData[]>, item) => {
                          const room = item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"];
                          if (!acc[room]) acc[room] = [];
                          acc[room].push(item);
                          return acc;
                        }, {});

                        return (
                          <div key={departmentName} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-medium text-primary">
                                {departmentName}
                              </h3>
                              
                              <div className="flex items-center gap-2">
                                {turarDepartmentLink ? (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      Связано с: {turarDepartmentLink}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="h-8 px-2 text-xs"
                                      onClick={() => handleRemoveDepartmentLink(departmentName)}
                                      disabled={unlinkDepartmentMutation.isPending}
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Удалить связь
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={departmentTurarSelections[departmentName] || ""}
                                      onValueChange={(value) => setDepartmentTurarSelections(prev => ({
                                        ...prev,
                                        [departmentName]: value
                                      }))}
                                    >
                                      <SelectTrigger className="w-48 h-8 text-xs">
                                        <SelectValue placeholder="Выберите отделение Турар" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {turarDepartments.map((turarDept) => (
                                          <SelectItem key={turarDept} value={turarDept}>
                                            {turarDept}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      size="sm"
                                      className="h-8 px-2 text-xs"
                                      onClick={() => handleSaveDepartmentLink(departmentName)}
                                      disabled={
                                        !departmentTurarSelections[departmentName] || 
                                        linkDepartmentMutation.isPending
                                      }
                                    >
                                      Связать
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <Accordion type="single" collapsible className="space-y-2">
                              <AccordionItem value={departmentName} className="border rounded-lg">
                                <AccordionTrigger className="px-4 hover:no-underline">
                                  <span className="text-base font-medium">Кабинеты ({Object.keys(roomGroups).length})</span>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                  <div className="space-y-3">
                                    {Object.entries(roomGroups).map(([roomName, roomItems]) => (
                                      <Accordion key={roomName} type="single" collapsible>
                                        <AccordionItem value={roomName} className="border rounded-lg">
                                          <AccordionTrigger className="px-4 hover:no-underline">
                                            <div className="flex items-center justify-between w-full mr-4">
                                              <span className="text-sm font-medium">{roomName}</span>
                                              <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                  {roomItems.filter(item => item["Наименование оборудования"]).length} предметов
                                                </Badge>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddEquipment(departmentName, roomName);
                                                  }}
                                                  className="h-6 w-6 p-0"
                                                >
                                                  <Plus className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          </AccordionTrigger>
                                          <AccordionContent className="px-4 pb-4">
                                            {roomItems.filter(item => item["Наименование оборудования"]).length > 0 ? (
                                              <div className="space-y-3">
                                                <table className="w-full border border-border/40 rounded-lg overflow-hidden">
                                                  <thead className="bg-muted/30">
                                                    <tr>
                                                      <th className="text-left p-3 font-semibold border-r border-border/40 last:border-r-0">Код оборудования</th>
                                                      <th className="text-left p-3 font-semibold border-r border-border/40 last:border-r-0">Наименование</th>
                                                      <th className="text-center p-3 font-semibold border-r border-border/40 last:border-r-0">Количество</th>
                                                      <th className="text-center p-3 font-semibold border-r border-border/40 last:border-r-0">Ед. изм.</th>
                                                      <th className="text-center p-3 font-semibold">Примечания</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {roomItems.filter(item => item["Наименование оборудования"]).map((item, eqIndex) => {
                                                      const urlSearchTerm = searchParams.get('search');
                                                      const urlDepartment = searchParams.get('department');
                                                      const urlRoom = searchParams.get('room');
                                                      
                                                      const isHighlighted = urlSearchTerm && 
                                                        urlDepartment === departmentName && 
                                                        urlRoom === roomName && 
                                                        item["Наименование оборудования"]?.toLowerCase().includes(urlSearchTerm.toLowerCase()) &&
                                                        !highlightTimeout;

                                                      const equipmentId = isHighlighted ? 
                                                        `${urlDepartment}-${urlRoom}-${urlSearchTerm}`.replace(/\s+/g, '-').toLowerCase() : 
                                                        undefined;

                                                      return (
                                                        <tr 
                                                          key={eqIndex}
                                                          id={equipmentId}
                                                          className={`border-t border-border/40 transition-all duration-500 hover:bg-muted/50 ${
                                                            isHighlighted 
                                                              ? 'bg-yellow-100 dark:bg-yellow-900/30 ring-2 ring-yellow-400 dark:ring-yellow-500 shadow-lg animate-pulse' 
                                                              : ''
                                                          }`}
                                                        >
                                                          <td className="p-3 font-mono text-xs border-r border-border/40 last:border-r-0">
                                                            {item["Код оборудования"] || '-'}
                                                          </td>
                                                          <td className={`p-3 break-words transition-all duration-300 border-r border-border/40 last:border-r-0 ${
                                                            isHighlighted 
                                                              ? 'text-yellow-800 dark:text-yellow-200 font-bold text-sm bg-yellow-200 dark:bg-yellow-800/50 rounded' 
                                                              : ''
                                                          }`}>
                                                            {isHighlighted && <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-ping"></span>}
                                                            {item["Наименование оборудования"] || '-'}
                                                          </td>
                                                          <td className="p-3 text-center border-r border-border/40 last:border-r-0">
                                                            {item["Кол-во"] || '-'}
                                                          </td>
                                                          <td className="p-3 text-center border-r border-border/40 last:border-r-0">
                                                            {item["Ед. изм."] || '-'}
                                                          </td>
                                                          <td className="p-3 text-center">
                                                            {item["Примечания"] && (
                                                              <Badge 
                                                                variant={isHighlighted ? "default" : "secondary"} 
                                                                className="text-xs h-5"
                                                              >
                                                                {item["Примечания"]}
                                                              </Badge>
                                                            )}
                                                          </td>
                                                        </tr>
                                                      );
                                                    })}
                                                  </tbody>
                                                </table>
                                              </div>
                                            ) : (
                                              <div className="text-center py-4 text-muted-foreground text-xs">
                                                Оборудование не указано
                                              </div>
                                            )}
                                          </AccordionContent>
                                        </AccordionItem>
                                      </Accordion>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          );
        })}
      </div>

      {/* Диалог редактирования оборудования */}
      <EditEquipmentDialog
        equipment={editingEquipment}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingEquipment(null);
          setIsAddingEquipment(false);
          setAddingToRoom(null);
        }}
        onSave={handleSaveEquipment}
        isNew={isAddingEquipment}
      />
    </div>
  );
}