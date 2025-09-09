import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Navigation } from '@/components/Navigation';
import { Download, BarChart3, Package, AlertTriangle, Search, Merge } from 'lucide-react';
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

interface FloorEquipment {
  "ЭТАЖ": number;
  "БЛОК": string;
  "ОТДЕЛЕНИЕ": string;
  "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": string;
  "Код оборудования": string | null;
  "Наименование оборудования": string | null;
  "Кол-во": number | string | null;
}

interface ConsolidatedEquipment {
  code: string;
  name: string;
  turarQuantity: number;
  floorsQuantity: number;
  totalQuantity: number;
  turarDepartments: string[];
  floorsDepartments: string[];
  turarRooms: string[];
  floorsRooms: string[];
  source: 'both' | 'turar' | 'floors';
}

const ConsolidationPage: React.FC = () => {
  const navigate = useNavigate();
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedEquipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAndConsolidateData();
  }, []);

  const loadAndConsolidateData = async () => {
    setIsLoading(true);
    try {
      // Load Turar data
      const turarResponse = await fetch(`/turar_full.json?t=${Date.now()}`);
      const turarEquipment: TurarEquipment[] = await turarResponse.json();

      // Load Floor data
      const floorsResponse = await fetch(`/combined_floors.json?t=${Date.now()}`);
      const floorsEquipment: FloorEquipment[] = await floorsResponse.json();

      // Create maps for consolidation
      const equipmentMap = new Map<string, {
        name: string;
        turarQuantity: number;
        floorsQuantity: number;
        turarDepartments: Set<string>;
        floorsDepartments: Set<string>;
        turarRooms: Set<string>;
        floorsRooms: Set<string>;
        source: Set<'turar' | 'floors'>;
      }>();

      // Process Turar data
      turarEquipment.forEach(item => {
        const code = item["Код оборудования"];
        const name = item["Наименование"];
        const quantity = typeof item["Кол-во"] === 'number' ? item["Кол-во"] : parseInt(String(item["Кол-во"])) || 0;

        if (equipmentMap.has(code)) {
          const existing = equipmentMap.get(code)!;
          existing.turarQuantity += quantity;
          existing.turarDepartments.add(item["Отделение/Блок"]);
          existing.turarRooms.add(item["Помещение/Кабинет"]);
          existing.source.add('turar');
        } else {
          equipmentMap.set(code, {
            name,
            turarQuantity: quantity,
            floorsQuantity: 0,
            turarDepartments: new Set([item["Отделение/Блок"]]),
            floorsDepartments: new Set(),
            turarRooms: new Set([item["Помещение/Кабинет"]]),
            floorsRooms: new Set(),
            source: new Set(['turar'])
          });
        }
      });

      // Process Floors data
      floorsEquipment.forEach(item => {
        const code = String(item["Код оборудования"] || '');
        const name = item["Наименование оборудования"] || '';
        const quantity = typeof item["Кол-во"] === 'number' ? item["Кол-во"] : parseInt(String(item["Кол-во"])) || 1;

        if (!code || !name) return; // Skip items without code or name

        if (equipmentMap.has(code)) {
          const existing = equipmentMap.get(code)!;
          existing.floorsQuantity += quantity;
          existing.floorsDepartments.add(item["ОТДЕЛЕНИЕ"]);
          existing.floorsRooms.add(item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]);
          existing.source.add('floors');
        } else {
          equipmentMap.set(code, {
            name,
            turarQuantity: 0,
            floorsQuantity: quantity,
            turarDepartments: new Set(),
            floorsDepartments: new Set([item["ОТДЕЛЕНИЕ"]]),
            turarRooms: new Set(),
            floorsRooms: new Set([item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]]),
            source: new Set(['floors'])
          });
        }
      });

      // Convert to consolidated data array
      const consolidated: ConsolidatedEquipment[] = [];
      equipmentMap.forEach((item, code) => {
        const sourceArray = Array.from(item.source);
        const source: 'both' | 'turar' | 'floors' = 
          sourceArray.length === 2 ? 'both' : sourceArray[0] as 'turar' | 'floors';

        consolidated.push({
          code,
          name: item.name,
          turarQuantity: item.turarQuantity,
          floorsQuantity: item.floorsQuantity,
          totalQuantity: item.turarQuantity + item.floorsQuantity,
          turarDepartments: Array.from(item.turarDepartments),
          floorsDepartments: Array.from(item.floorsDepartments),
          turarRooms: Array.from(item.turarRooms),
          floorsRooms: Array.from(item.floorsRooms),
          source
        });
      });

      // Sort by total quantity (descending)
      consolidated.sort((a, b) => b.totalQuantity - a.totalQuantity);

      setConsolidatedData(consolidated);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredData.map(item => ({
        'Код оборудования': item.code,
        'Наименование': item.name,
        'Количество Турар': item.turarQuantity,
        'Количество Проектировщики': item.floorsQuantity,
        'Общее количество': item.totalQuantity,
        'Отделения Турар': item.turarDepartments.join(', '),
        'Отделения Проектировщики': item.floorsDepartments.join(', '),
        'Кабинеты Турар': item.turarRooms.join(', '),
        'Кабинеты Проектировщики': item.floorsRooms.join(', '),
        'Источник': item.source === 'both' ? 'Оба' : item.source === 'turar' ? 'Турар' : 'Проектировщики'
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Консолидация');
    XLSX.writeFile(workbook, 'equipment_consolidation.xlsx');
  };

  // Filter data based on search term
  const filteredData = consolidatedData.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.turarDepartments.some(dept => dept.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.floorsDepartments.some(dept => dept.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Statistics
  const stats = {
    total: consolidatedData.length,
    bothSources: consolidatedData.filter(item => item.source === 'both').length,
    turarOnly: consolidatedData.filter(item => item.source === 'turar').length,
    floorsOnly: consolidatedData.filter(item => item.source === 'floors').length,
    totalEquipment: consolidatedData.reduce((sum, item) => sum + item.totalQuantity, 0)
  };

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

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Консолидация данных
          </h1>
          <p className="text-muted-foreground text-lg">
            Объединенные данные по оборудованию из Турар и Проектировщиков
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего позиций</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">В обеих базах</CardTitle>
              <Merge className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.bothSources}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Только Турар</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.turarOnly}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Только Проектировщики</CardTitle>
              <Package className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.floorsOnly}</div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общее кол-во</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalEquipment}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Controls */}
        <div className="flex items-center justify-between mb-6">
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
            <Badge variant="outline">{filteredData.length} из {consolidatedData.length}</Badge>
            <Button 
              onClick={exportToExcel}
              variant="outline" 
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Экспорт в Excel
            </Button>
          </div>
        </div>

        {/* Consolidated Table */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Код</TableHead>
                  <TableHead>Наименование</TableHead>
                  <TableHead className="text-center">Турар</TableHead>
                  <TableHead className="text-center">Проектировщики</TableHead>
                  <TableHead className="text-center">Всего</TableHead>
                  <TableHead>Источник</TableHead>
                  <TableHead>Отделения (Турар)</TableHead>
                  <TableHead>Отделения (Проектировщики)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">{item.code}</TableCell>
                    <TableCell className="break-words max-w-xs" title={item.name}>
                      {item.name}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.turarQuantity > 0 ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {item.turarQuantity}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.floorsQuantity > 0 ? (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {item.floorsQuantity}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="default" className="bg-primary">
                        {item.totalQuantity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        item.source === 'both' ? 'default' : 
                        item.source === 'turar' ? 'secondary' : 'outline'
                      }>
                        {item.source === 'both' ? 'Оба' : 
                         item.source === 'turar' ? 'Турар' : 'Проектировщики'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-xs">
                      {item.turarDepartments.length > 0 ? item.turarDepartments.join(', ') : '-'}
                    </TableCell>
                    <TableCell className="text-xs max-w-xs">
                      {item.floorsDepartments.length > 0 ? item.floorsDepartments.join(', ') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ConsolidationPage;