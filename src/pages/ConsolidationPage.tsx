import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Navigation } from '@/components/Navigation';
import { ArrowLeft, Download, BarChart3, Package, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

// Interfaces
interface TurarEquipment {
  "Отделение/Блок": string;
  "Помещение/Кабинет": string;
  "Код оборудования": string;
  "Наименование": string;
  "Кол-во": number;
}

interface ConsolidatedEquipment {
  code: string;
  name: string;
  turarQuantity: number;
  floorsQuantity: number;
  difference: number;
  turarDepartments: string[];
  floorsDepartments: string[];
  turarRooms: string[];
  floorsRooms: string[];
}

const ConsolidationPage: React.FC = () => {
  const navigate = useNavigate();
  const [turarData, setTurarData] = useState<ConsolidatedEquipment[]>([]);
  const [floorsData, setFloorsData] = useState<ConsolidatedEquipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAndConsolidateData();
  }, []);

  const loadAndConsolidateData = async () => {
    setIsLoading(true);
    try {
      // Load Turar data
      const turarResponse = await fetch('/src/data/turar_full.json');
      const turarEquipment: TurarEquipment[] = await turarResponse.json();

      // Load Floor data
      const floor1Response = await fetch('/src/data/1F_filled.json');
      const floor2Response = await fetch('/src/data/2F_filled.json');
      const floor1Data = await floor1Response.json();
      const floor2Data = await floor2Response.json();
      const floorsEquipment = [...floor1Data, ...floor2Data];

      // Create maps for consolidation
      const turarMap = new Map<string, {
        name: string;
        quantity: number;
        departments: Set<string>;
        rooms: Set<string>;
      }>();

      const floorsMap = new Map<string, {
        name: string;
        quantity: number;
        departments: Set<string>;
        rooms: Set<string>;
      }>();

      // Process Turar data
      turarEquipment.forEach(item => {
        const code = item["Код оборудования"];
        const name = item["Наименование"];
        const quantity = typeof item["Кол-во"] === 'number' ? item["Кол-во"] : parseInt(item["Кол-во"]) || 0;

        if (turarMap.has(code)) {
          const existing = turarMap.get(code)!;
          existing.quantity += quantity;
          existing.departments.add(item["Отделение/Блок"]);
          existing.rooms.add(item["Помещение/Кабинет"]);
        } else {
          turarMap.set(code, {
            name,
            quantity,
            departments: new Set([item["Отделение/Блок"]]),
            rooms: new Set([item["Помещение/Кабинет"]])
          });
        }
      });

      // Process Floors data
      floorsEquipment.forEach(item => {
        const code = item.equipment_code || '';
        const name = item.equipment_name || '';
        const quantity = item.quantity || 1;

        if (code && floorsMap.has(code)) {
          const existing = floorsMap.get(code)!;
          existing.quantity += quantity;
          existing.departments.add(item.department || '');
          existing.rooms.add(item.room || '');
        } else if (code) {
          floorsMap.set(code, {
            name,
            quantity,
            departments: new Set([item.department || '']),
            rooms: new Set([item.room || ''])
          });
        }
      });

      // Create consolidated data arrays
      const allCodes = new Set([...turarMap.keys(), ...floorsMap.keys()]);
      
      const turarConsolidated: ConsolidatedEquipment[] = [];
      const floorsConsolidated: ConsolidatedEquipment[] = [];

      allCodes.forEach(code => {
        const turarItem = turarMap.get(code);
        const floorsItem = floorsMap.get(code);

        const consolidatedItem: ConsolidatedEquipment = {
          code,
          name: turarItem?.name || floorsItem?.name || '',
          turarQuantity: turarItem?.quantity || 0,
          floorsQuantity: floorsItem?.quantity || 0,
          difference: (turarItem?.quantity || 0) - (floorsItem?.quantity || 0),
          turarDepartments: Array.from(turarItem?.departments || []),
          floorsDepartments: Array.from(floorsItem?.departments || []),
          turarRooms: Array.from(turarItem?.rooms || []),
          floorsRooms: Array.from(floorsItem?.rooms || [])
        };

        // Only include items that exist in Turar for Turar tab
        if (turarItem) {
          turarConsolidated.push(consolidatedItem);
        }

        // Only include items that exist in Floors for Floors tab
        if (floorsItem) {
          floorsConsolidated.push(consolidatedItem);
        }
      });

      // Sort by difference (descending)
      turarConsolidated.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
      floorsConsolidated.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

      setTurarData(turarConsolidated);
      setFloorsData(floorsConsolidated);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = (data: ConsolidatedEquipment[], filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(
      data.map(item => ({
        'Код оборудования': item.code,
        'Наименование': item.name,
        'Количество (Турар)': item.turarQuantity,
        'Количество (Проектировщики)': item.floorsQuantity,
        'Разница': item.difference,
        'Отделения (Турар)': item.turarDepartments.join(', '),
        'Отделения (Проектировщики)': item.floorsDepartments.join(', '),
        'Кабинеты (Турар)': item.turarRooms.join(', '),
        'Кабинеты (Проектировщики)': item.floorsRooms.join(', ')
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Консолидация');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const ConsolidationTable = ({ data }: { data: ConsolidatedEquipment[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Код</TableHead>
          <TableHead>Наименование</TableHead>
          <TableHead className="text-center">Турар</TableHead>
          <TableHead className="text-center">Проектировщики</TableHead>
          <TableHead className="text-center">Разница</TableHead>
          <TableHead>Отделения</TableHead>
          <TableHead>Кабинеты</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={index}>
            <TableCell className="font-mono text-xs">{item.code}</TableCell>
            <TableCell className="max-w-xs truncate" title={item.name}>
              {item.name}
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="outline">{item.turarQuantity}</Badge>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="outline">{item.floorsQuantity}</Badge>
            </TableCell>
            <TableCell className="text-center">
              <Badge 
                variant={item.difference === 0 ? "secondary" : "destructive"}
                className="font-medium"
              >
                {item.difference > 0 ? `+${item.difference}` : item.difference}
              </Badge>
            </TableCell>
            <TableCell className="text-xs">
              <div className="space-y-1">
                {item.turarDepartments.length > 0 && (
                  <div>
                    <span className="font-medium">Т:</span> {item.turarDepartments.join(', ')}
                  </div>
                )}
                {item.floorsDepartments.length > 0 && (
                  <div>
                    <span className="font-medium">П:</span> {item.floorsDepartments.join(', ')}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="text-xs">
              <div className="space-y-1">
                {item.turarRooms.length > 0 && (
                  <div>
                    <span className="font-medium">Т:</span> {item.turarRooms.slice(0, 2).join(', ')}
                    {item.turarRooms.length > 2 && '...'}
                  </div>
                )}
                {item.floorsRooms.length > 0 && (
                  <div>
                    <span className="font-medium">П:</span> {item.floorsRooms.slice(0, 2).join(', ')}
                    {item.floorsRooms.length > 2 && '...'}
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-16">
            <div className="text-lg">Загрузка данных для консолидации...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 gap-2"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Консолидация данных
          </h1>
          <p className="text-muted-foreground text-lg">
            Сравнение данных Турар и Проектировщиков
          </p>
        </div>

        <Tabs defaultValue="turar" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-fit grid-cols-2">
              <TabsTrigger value="turar" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Турар
              </TabsTrigger>
              <TabsTrigger value="floors" className="gap-2">
                <Package className="h-4 w-4" />
                Проектировщики
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="turar" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold">Данные Турар</h2>
                <Badge variant="outline">{turarData.length} записей</Badge>
              </div>
              <Button 
                onClick={() => exportToExcel(turarData, 'consolidation_turar')}
                variant="outline" 
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Экспорт в Excel
              </Button>
            </div>
            
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-0">
                <ConsolidationTable data={turarData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="floors" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold">Данные Проектировщиков</h2>
                <Badge variant="outline">{floorsData.length} записей</Badge>
              </div>
              <Button 
                onClick={() => exportToExcel(floorsData, 'consolidation_floors')}
                variant="outline" 
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Экспорт в Excel
              </Button>
            </div>
            
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-0">
                <ConsolidationTable data={floorsData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ConsolidationPage;