import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Navigation } from '@/components/Navigation';
import { Download, BarChart3, Package, Search, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useTurarMedicalData } from '@/hooks/useTurarMedicalData';
import { useFloorsData } from '@/hooks/useFloorsData';

interface ConsolidatedEquipment {
  code: string;
  name: string;
  quantity: number;
  departments: string[];
  rooms: string[];
}

const ConsolidationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('turar');
  
  const { data: turarRawData, isLoading: turarLoading } = useTurarMedicalData();
  const { data: floorsRawData, isLoading: floorsLoading } = useFloorsData();

  // Consolidate data using useMemo for performance
  const turarData = useMemo(() => {
    if (!turarRawData) return [];

    const turarMap = new Map<string, {
      name: string;
      quantity: number;
      departments: Set<string>;
      rooms: Set<string>;
    }>();

    turarRawData.forEach(item => {
      const code = item["Код оборудования"];
      const name = item["Наименование"];
      const quantity = item["Кол-во"] || 0;

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

    const turarConsolidated: ConsolidatedEquipment[] = [];
    turarMap.forEach((item, code) => {
      turarConsolidated.push({
        code,
        name: item.name,
        quantity: item.quantity,
        departments: Array.from(item.departments),
        rooms: Array.from(item.rooms)
      });
    });

    return turarConsolidated.sort((a, b) => b.quantity - a.quantity);
  }, [turarRawData]);

  const floorsData = useMemo(() => {
    if (!floorsRawData) return [];

    const floorsMap = new Map<string, {
      name: string;
      quantity: number;
      departments: Set<string>;
      rooms: Set<string>;
    }>();

    floorsRawData.forEach(item => {
      const code = String(item["Код оборудования"] || '');
      const name = item["Наименование оборудования"] || '';
      const quantity = typeof item["Кол-во"] === 'number' ? parseInt(String(item["Кол-во"])) || 1 : 
                      typeof item["Кол-во"] === 'string' ? parseInt(item["Кол-во"]) || 1 : 1;

      if (!code || !name) return;

      if (floorsMap.has(code)) {
        const existing = floorsMap.get(code)!;
        existing.quantity += quantity;
        existing.departments.add(item["ОТДЕЛЕНИЕ"]);
        existing.rooms.add(item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]);
      } else {
        floorsMap.set(code, {
          name,
          quantity,
          departments: new Set([item["ОТДЕЛЕНИЕ"]]),
          rooms: new Set([item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]])
        });
      }
    });

    const floorsConsolidated: ConsolidatedEquipment[] = [];
    floorsMap.forEach((item, code) => {
      floorsConsolidated.push({
        code,
        name: item.name,
        quantity: item.quantity,
        departments: Array.from(item.departments),
        rooms: Array.from(item.rooms)
      });
    });

    return floorsConsolidated.sort((a, b) => b.quantity - a.quantity);
  }, [floorsRawData]);

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

  // Filter current data based on active tab and search term
  const getCurrentData = () => activeTab === 'turar' ? turarData : floorsData;
  const filteredData = getCurrentData().filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.departments.some(dept => dept.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            <TableCell className="break-words" title={item.name}>
              {item.name}
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="outline">{item.quantity}</Badge>
            </TableCell>
            <TableCell className="text-xs max-w-xs">
              {item.departments.join(', ')}
            </TableCell>
            <TableCell className="text-xs max-w-xs">
              {item.rooms.slice(0, 3).join(', ')}
              {item.rooms.length > 3 && '...'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const isLoading = turarLoading || floorsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Navigation />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center py-16">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
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

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Консолидация данных
          </h1>
          <p className="text-muted-foreground text-lg">
            Консолидированные данные по источникам с группировкой по коду и наименованию
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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

          {/* Search and Controls */}
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по коду, названию или отделению..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{filteredData.length} из {getCurrentData().length}</Badge>
            </div>
          </div>

          <TabsContent value="turar" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold">Данные Турар</h2>
                <Badge variant="outline">{turarData.length} консолидированных записей</Badge>
              </div>
              <Button 
                onClick={() => exportToExcel(filteredData, 'consolidation_turar')}
                variant="outline" 
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Экспорт в Excel
              </Button>
            </div>
            
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-0">
                <ConsolidationTable data={filteredData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="floors" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold">Данные Проектировщиков</h2>
                <Badge variant="outline">{floorsData.length} консолидированных записей</Badge>
              </div>
              <Button 
                onClick={() => exportToExcel(filteredData, 'consolidation_floors')}
                variant="outline" 
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Экспорт в Excel
              </Button>
            </div>
            
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-0">
                <ConsolidationTable data={filteredData} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ConsolidationPage;