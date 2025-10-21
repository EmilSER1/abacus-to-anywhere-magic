import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Search, Package, MapPin, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Interfaces
interface SearchResult {
  department: string;
  room: string;
  code: string;
  name: string;
  quantity: number;
  searchType: SearchType;
  displayValue: string;
}

type SearchType = 'equipment' | 'code' | 'department' | 'room';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchType, setSearchType] = useState<SearchType>('equipment');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchData = async (query: string, type: SearchType) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const searchLower = query.toLowerCase();

    try {
      // Search only Floor data  
      const floorsResponse = await fetch(`/combined_floors.json?t=${Date.now()}`);
      const allFloorData = await floorsResponse.json();
      
      const filteredResults: SearchResult[] = [];
      
      allFloorData.forEach(item => {
        // Skip items with null/empty equipment
        if (!item["Наименование оборудования"]) return;
        
        const department = (item["ОТДЕЛЕНИЕ"] || '').toLowerCase();
        const room = (item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"] || '').toLowerCase();
        const code = String(item["Код оборудования"] || '').toLowerCase();
        const name = (item["Наименование оборудования"] || '').toLowerCase();
        
        let matches = false;
        switch (type) {
          case 'code':
            matches = code.includes(searchLower);
            break;
          case 'department':
            matches = department.includes(searchLower);
            break;
          case 'room':
            matches = room.includes(searchLower);
            break;
          case 'equipment':
          default:
            matches = name.includes(searchLower);
            break;
        }
        
        if (matches) {
          let displayValue = '';
          switch (type) {
            case 'code':
              displayValue = String(item["Код оборудования"] || '');
              break;
            case 'department':
              displayValue = item["ОТДЕЛЕНИЕ"] || '';
              break;
            case 'room':
              displayValue = item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"] || '';
              break;
            case 'equipment':
            default:
              displayValue = item["Наименование оборудования"] || '';
              break;
          }
          
          filteredResults.push({
            department: item["ОТДЕЛЕНИЕ"] || '',
            room: item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"] || '',
            code: String(item["Код оборудования"] || ''),
            name: item["Наименование оборудования"] || '',
            quantity: item["Кол-во"] || 1,
            searchType: type,
            displayValue
          });
        }
      });

      setResults(filteredResults.slice(0, 100)); // Limit to 100 results
    } catch (error) {
      console.error('Error searching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchData(searchTerm, searchType);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, searchType]);

  const ResultCard = ({ result }: { result: SearchResult }) => {
    const handleClick = () => {
      navigate(`/floors?search=${encodeURIComponent(searchTerm)}&department=${encodeURIComponent(result.department)}&room=${encodeURIComponent(result.room)}`);
    };

    return (
      <Card 
        className="bg-card/50 backdrop-blur border-border/50 cursor-pointer hover:bg-card/70 transition-colors"
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{result.displayValue}</h4>
              {result.searchType === 'equipment' && (
                <Badge variant="secondary">{result.quantity} шт.</Badge>
              )}
            </div>
            {result.searchType === 'equipment' && (
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
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Поиск по проекту</h1>
        <p className="text-muted-foreground text-lg">Быстрый поиск оборудования по данным проекта</p>
      </div>
      <main className="max-w-6xl">

        {/* Search Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
            <div className="flex-1">
              <Select value={searchType} onValueChange={(value: SearchType) => setSearchType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип поиска" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipment">По оборудованию</SelectItem>
                  <SelectItem value="code">По коду</SelectItem>
                  <SelectItem value="department">По отделению</SelectItem>
                  <SelectItem value="room">По кабинету</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-[2] relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  searchType === 'equipment' ? "Введите название оборудования..." :
                  searchType === 'code' ? "Введите код оборудования..." :
                  searchType === 'department' ? "Введите название отделения..." :
                  "Введите название кабинета..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Поиск...</div>
          </div>
        )}

        {searchTerm && !isLoading && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-semibold">Результаты</h2>
              <Badge variant="outline">{results.length} найдено</Badge>
            </div>
            {results.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Результаты не найдены
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {results.map((result, index) => (
                  <ResultCard key={`result-${index}`} result={result} />
                ))}
              </div>
            )}
          </div>
        )}

        {!searchTerm && (
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Начните поиск</h3>
              <p className="text-muted-foreground">
                Выберите тип поиска и введите запрос для поиска оборудования
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default SearchPage;