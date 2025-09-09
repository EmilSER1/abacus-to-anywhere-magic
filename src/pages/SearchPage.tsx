import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Navigation } from '@/components/Navigation';
import { Search, Package, MapPin, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Interfaces
interface TurarEquipment {
  "Отделение/Блок": string;
  "Помещение/Кабинет": string;
  "Код оборудования": string;
  "Наименование": string;
  "Кол-во": number;
}

interface FloorEquipment {
  department: string;
  room: string;
  code: string;
  name: string;
  quantity: number;
}

interface SearchResult {
  department: string;
  room: string;
  code: string;
  name: string;
  quantity: number;
  source: 'turar' | 'floors';
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [turarResults, setTurarResults] = useState<SearchResult[]>([]);
  const [floorResults, setFloorResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchData = async (query: string) => {
    if (!query.trim()) {
      setTurarResults([]);
      setFloorResults([]);
      return;
    }

    setIsLoading(true);
    const searchLower = query.toLowerCase();

    try {
      // Search Turar data
      const turarResponse = await fetch(`/turar_full.json?t=${Date.now()}`);
      const turarData: TurarEquipment[] = await turarResponse.json();
      
      const filteredTurarResults = turarData
        .filter(item => 
          item["Отделение/Блок"].toLowerCase().includes(searchLower) ||
          item["Помещение/Кабинет"].toLowerCase().includes(searchLower) ||
          item["Код оборудования"].toLowerCase().includes(searchLower) ||
          item["Наименование"].toLowerCase().includes(searchLower)
        )
        .map(item => ({
          department: item["Отделение/Блок"],
          room: item["Помещение/Кабинет"],
          code: item["Код оборудования"],
          name: item["Наименование"],
          quantity: typeof item["Кол-во"] === 'number' ? item["Кол-во"] : parseInt(item["Кол-во"]) || 0,
          source: 'turar' as const
        }));

      // Search Floor data  
      const floorsResponse = await fetch(`/combined_floors.json?t=${Date.now()}`);
      const allFloorData = await floorsResponse.json();
      
      const filteredFloorResults: SearchResult[] = [];
      
      allFloorData.forEach(item => {
        // Skip items with null/empty equipment
        if (!item["Наименование оборудования"]) return;
        
        const department = (item["ОТДЕЛЕНИЕ"] || '').toLowerCase();
        const room = (item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"] || '').toLowerCase();
        const code = String(item["Код оборудования"] || '').toLowerCase();
        const name = (item["Наименование оборудования"] || '').toLowerCase();
        
        if (department.includes(searchLower) ||
            room.includes(searchLower) ||
            code.includes(searchLower) ||
            name.includes(searchLower)) {
          filteredFloorResults.push({
            department: item["ОТДЕЛЕНИЕ"] || '',
            room: item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"] || '',
            code: String(item["Код оборудования"] || ''),
            name: item["Наименование оборудования"] || '',
            quantity: item["Кол-во"] || 1,
            source: 'floors'
          });
        }
      });

      setTurarResults(filteredTurarResults.slice(0, 50)); // Limit results
      setFloorResults(filteredFloorResults.slice(0, 50)); // Limit results
    } catch (error) {
      console.error('Error searching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchData(searchTerm);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const handleClick = () => {
      if (result.source === 'turar') {
        navigate(`/turar?search=${encodeURIComponent(result.name)}&department=${encodeURIComponent(result.department)}&room=${encodeURIComponent(result.room)}`);
      } else {
        navigate(`/floors?search=${encodeURIComponent(result.name)}&department=${encodeURIComponent(result.department)}&room=${encodeURIComponent(result.room)}`);
      }
    };

    return (
      <Card 
        className="bg-card/50 backdrop-blur border-border/50 cursor-pointer hover:bg-card/70 transition-colors"
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{result.name}</h4>
              <Badge variant="secondary">{result.quantity} шт.</Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {result.department}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {result.room}
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {result.code}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Поиск оборудования
          </h1>
          <p className="text-muted-foreground text-lg">
            Поиск по данным Турар и Проектировщиков
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по коду, наименованию, отделению или кабинету..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Поиск...</div>
          </div>
        )}

        {searchTerm && !isLoading && (
          <div className="space-y-8">
            {/* Turar Results */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-semibold">Турар</h2>
                <Badge variant="outline">{turarResults.length} результатов</Badge>
              </div>
              {turarResults.length === 0 ? (
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Результаты не найдены в данных Турар
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {turarResults.map((result, index) => (
                    <ResultCard key={`turar-${index}`} result={result} />
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Floor Results */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-semibold">Проектировщики</h2>
                <Badge variant="outline">{floorResults.length} результатов</Badge>
              </div>
              {floorResults.length === 0 ? (
                <Card className="bg-card/50 backdrop-blur border-border/50">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Результаты не найдены в данных Проектировщиков
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {floorResults.map((result, index) => (
                    <ResultCard key={`floor-${index}`} result={result} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!searchTerm && (
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Начните поиск</h3>
              <p className="text-muted-foreground">
                Введите код оборудования, наименование, отделение или кабинет для поиска
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SearchPage;