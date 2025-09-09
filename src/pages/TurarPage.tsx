import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EditDepartmentDialog } from '@/components/EditDepartmentDialog';
import { EditRoomDialog } from '@/components/EditRoomDialog';
import { Navigation } from '@/components/Navigation';
import { Building2, Users, MapPin, Download, Search, Package } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';

// Define the interface for Turar equipment data
interface TurarEquipment {
  "Отделение/Блок": string;
  "Помещение/Кабинет": string;
  "Код оборудования": string;
  "Наименование": string;
  "Кол-во": number;
}

// Define the interface for a processed department
interface TurarDepartment {
  name: string;
  rooms: {
    name: string;
    equipment: TurarEquipment[];
  }[];
}

let turarData: TurarEquipment[] = [];

const TurarPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [departments, setDepartments] = useState<TurarDepartment[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<string[]>([]);
  const [highlightTimeout, setHighlightTimeout] = useState<boolean>(false);
  const [targetEquipmentId, setTargetEquipmentId] = useState<string | null>(null);

  useEffect(() => {
    const loadTurarData = async () => {
      try {
        const response = await fetch(`/turar_full.json?t=${Date.now()}`);
        const data: TurarEquipment[] = await response.json();
        turarData = data;
        
        // Process data to group by departments and rooms
        const processedData = processTurarData(data);
      setDepartments(processedData);

      // Handle search params from URL
      const urlSearchTerm = searchParams.get('search');
      const urlDepartment = searchParams.get('department');
      const urlRoom = searchParams.get('room');
      
      console.log('TurarPage URL params:', { urlSearchTerm, urlDepartment, urlRoom });
      
      if (urlSearchTerm && urlDepartment) {
        setSearchTerm(urlSearchTerm);
        setHighlightTimeout(false); // Reset highlight
        
        // Auto-expand relevant sections based on original data, not filtered
        const deptIndex = processedData.findIndex(dept => dept.name === urlDepartment);
        console.log('Found department index:', deptIndex, 'for department:', urlDepartment);
        console.log('Available departments:', processedData.map(d => d.name));
        
        if (deptIndex !== -1) {
          setExpandedDepartments([`dept-${deptIndex}`]);
          console.log('Expanded departments:', [`dept-${deptIndex}`]);
          
          if (urlRoom) {
            const roomIndex = processedData[deptIndex]?.rooms.findIndex(room => room.name === urlRoom);
            console.log('Found room index:', roomIndex, 'for room:', urlRoom);
            console.log('Available rooms:', processedData[deptIndex]?.rooms.map(r => r.name));
            if (roomIndex !== -1) {
              setExpandedRooms([`room-${deptIndex}-${roomIndex}`]);
              console.log('Expanded rooms:', [`room-${deptIndex}-${roomIndex}`]);
              
              // Set target equipment for scrolling
              const targetId = `${urlDepartment}-${urlRoom}-${urlSearchTerm}`.replace(/\s+/g, '-').toLowerCase();
              setTargetEquipmentId(targetId);
              
              // Scroll to element after animations complete
              setTimeout(() => {
                const element = document.getElementById(targetId);
                if (element) {
                  element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                  });
                }
              }, 800);
            }
          }
        }
        
        // Auto-remove highlight after 3 seconds
        setTimeout(() => setHighlightTimeout(true), 3000);
      }
      } catch (error) {
        console.error('Error loading turar data:', error);
      }
    };

    loadTurarData();
  }, [searchParams]);

  const processTurarData = (data: TurarEquipment[]): TurarDepartment[] => {
    const departmentMap = new Map<string, Map<string, TurarEquipment[]>>();

    // Group equipment by department and room
    data.forEach(item => {
      const deptName = item["Отделение/Блок"];
      const roomName = item["Помещение/Кабинет"];

      if (!departmentMap.has(deptName)) {
        departmentMap.set(deptName, new Map());
      }

      const deptRooms = departmentMap.get(deptName)!;
      if (!deptRooms.has(roomName)) {
        deptRooms.set(roomName, []);
      }

      deptRooms.get(roomName)!.push(item);
    });

    // Convert to array format
    return Array.from(departmentMap.entries()).map(([deptName, rooms]) => ({
      name: deptName,
      rooms: Array.from(rooms.entries()).map(([roomName, equipment]) => ({
        name: roomName,
        equipment: equipment
      }))
    }));
  };

  // Calculate statistics
  const totalDepartments = departments.length;
  const totalRooms = departments.reduce((acc, dept) => acc + dept.rooms.length, 0);
  const totalEquipment = departments.reduce((acc, dept) => 
    acc + dept.rooms.reduce((roomAcc, room) => 
      roomAcc + room.equipment.reduce((eqAcc, eq) => {
        const count = typeof eq["Кол-во"] === 'number' ? eq["Кол-во"] : parseInt(eq["Кол-во"]) || 0;
        return eqAcc + count;
      }, 0), 0), 0);
  const totalEquipmentTypes = departments.reduce((acc, dept) => 
    acc + dept.rooms.reduce((roomAcc, room) => roomAcc + room.equipment.length, 0), 0);

  // Filter departments based on search term
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.rooms.some(room => 
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.equipment.some(eq => 
        eq["Наименование"].toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq["Код оборудования"].toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  );

  const exportData = () => {
    const exportData = turarData.map(item => ({
      'Отделение/Блок': item["Отделение/Блок"],
      'Помещение/Кабинет': item["Помещение/Кабинет"],
      'Код оборудования': item["Код оборудования"],
      'Наименование': item["Наименование"],
      'Количество': item["Кол-во"]
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Турар');
    XLSX.writeFile(workbook, 'turar_equipment.xlsx');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Турар - Медицинское оборудование
          </h1>
          <p className="text-muted-foreground text-lg">
            Управление медицинским оборудованием по отделениям
          </p>
        </div>

        {/* Search and Export Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по отделениям, кабинетам или оборудованию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={exportData} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Экспорт в Excel
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего отделений</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalDepartments}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего помещений</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalRooms}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Единиц оборудования</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalEquipment}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Типов оборудования</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{totalEquipmentTypes}</div>
            </CardContent>
          </Card>
        </div>

        {/* Departments List */}
        <div className="space-y-6">
          {filteredDepartments.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Результаты не найдены</h3>
                <p className="text-muted-foreground text-center">
                  Попробуйте изменить критерии поиска или очистить фильтр
                </p>
              </CardContent>
            </Card>
          ) : (
            <Accordion 
              type="multiple" 
              className="space-y-4"
              value={expandedDepartments}
              onValueChange={setExpandedDepartments}
            >
              {filteredDepartments.map((department, deptIndex) => (
                <AccordionItem key={deptIndex} value={`dept-${deptIndex}`}>
                  <Card className="bg-card/50 backdrop-blur border-border/50">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-6 w-6 text-primary" />
                        <div className="text-left">
                          <div className="text-xl font-semibold">{department.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {department.rooms.length} помещений
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <Accordion 
                        type="multiple" 
                        className="space-y-2"
                        value={expandedRooms}
                        onValueChange={setExpandedRooms}
                      >
                        {department.rooms.map((room, roomIndex) => (
                          <AccordionItem key={roomIndex} value={`room-${deptIndex}-${roomIndex}`}>
                            <Card className="bg-muted/30 border-border/50">
                              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex items-center gap-3">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <div className="text-left">
                                    <div className="font-medium">{room.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {room.equipment.length} типов оборудования
                                    </div>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                <div className="space-y-2">
                                  {room.equipment.map((equipment, eqIndex) => {
                                    const urlSearchTerm = searchParams.get('search');
                                    const urlDepartment = searchParams.get('department');
                                    const urlRoom = searchParams.get('room');
                                    
                                      const isHighlighted = urlSearchTerm && 
                                        urlDepartment === department.name && 
                                        urlRoom === room.name && 
                                        (equipment["Наименование"].toLowerCase().includes(urlSearchTerm.toLowerCase()) ||
                                         equipment["Код оборудования"].toLowerCase().includes(urlSearchTerm.toLowerCase())) &&
                                        !highlightTimeout;

                                      const equipmentId = isHighlighted ? 
                                        `${urlDepartment}-${urlRoom}-${urlSearchTerm}`.replace(/\s+/g, '-').toLowerCase() : 
                                        undefined;

                                    return (
                                       <div
                                         key={eqIndex}
                                         id={equipmentId}
                                         className={`flex items-center justify-between p-3 rounded-md border transition-all duration-500 ${
                                           isHighlighted 
                                             ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-500 shadow-lg ring-2 ring-yellow-400 dark:ring-yellow-500 animate-pulse' 
                                             : 'bg-background/50 border-border/30'
                                         }`}
                                       >
                                         <div className="flex items-center gap-3">
                                           <Package className="h-4 w-4 text-muted-foreground" />
                                           <div>
                                             <div className={`font-medium transition-all duration-300 ${
                                               isHighlighted 
                                                 ? 'text-yellow-800 dark:text-yellow-200 font-bold' 
                                                 : ''
                                             }`}>
                                               {isHighlighted && <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-ping"></span>}
                                               {equipment["Наименование"]}
                                             </div>
                                             <div className="text-sm text-muted-foreground">
                                               Код: {equipment["Код оборудования"]}
                                             </div>
                                           </div>
                                         </div>
                                         <Badge 
                                           variant={isHighlighted ? "default" : "secondary"} 
                                           className={`font-medium ${isHighlighted ? 'bg-yellow-500 text-yellow-900' : ''}`}
                                         >
                                           {equipment["Кол-во"]} шт.
                                         </Badge>
                                       </div>
                                    );
                                  })}
                                </div>
                              </AccordionContent>
                            </Card>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </main>
    </div>
  );
};

export default TurarPage;