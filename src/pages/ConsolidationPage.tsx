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
  quantity: number;
  departments: string[];
  rooms: string[];
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
      const floorResponse = await fetch('/src/data/F_filled.json');
      const floorsEquipment = await floorResponse.json();

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
      const turarConsolidated: ConsolidatedEquipment[] = [];
      const floorsConsolidated: ConsolidatedEquipment[] = [];

      // Convert Turar data
      turarMap.forEach((item, code) => {
        turarConsolidated.push({
          code,
          name: item.name,
          quantity: item.quantity,
          departments: Array.from(item.departments),
          rooms: Array.from(item.rooms)
        });
      });

      // Convert Floors data
      floorsMap.forEach((item, code) => {
        floorsConsolidated.push({
          code,
          name: item.name,
          quantity: item.quantity,
          departments: Array.from(item.departments),
          rooms: Array.from(item.rooms)
        });
      });

      // Sort by quantity (descending)
      turarConsolidated.sort((a, b) => b.quantity - a.quantity);
      floorsConsolidated.sort((a, b) => b.quantity - a.quantity);

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
        'Количество': item.quantity,
        'Отделения': item.departments.join(', '),
        'Кабинеты': item.rooms.join(', ')
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
          <TableHead className="text-center">Количество</TableHead>
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
              <Badge variant="outline">{item.quantity}</Badge>
            </TableCell>
            <TableCell className="text-xs">
              {item.departments.join(', ')}
            </TableCell>
            <TableCell className="text-xs">
              {item.rooms.slice(0, 3).join(', ')}
              {item.rooms.length > 3 && '...'}
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
            Консолидированные данные по источникам
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