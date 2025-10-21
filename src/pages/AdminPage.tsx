import React, { useState } from 'react';
import { ImportWithValidationPanel } from '@/components/ImportWithValidationPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Database, 
  Import,
  BarChart3,
  Users,
  Shield,
  Info,
  RefreshCw
} from 'lucide-react';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('import-export');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Панель администрирования</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Централизованное управление данными и настройками системы
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              Только для администраторов
            </Badge>
            <Badge variant="outline" className="gap-1">
              <BarChart3 className="h-3 w-3" />
              Система управления данными
            </Badge>
          </div>
        </div>

        <Separator className="max-w-4xl mx-auto" />

        {/* Main Admin Tabs */}
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="import-export" className="gap-2">
                <Import className="h-4 w-4" />
                Импорт данных
              </TabsTrigger>
              <TabsTrigger value="system-settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Настройки системы
              </TabsTrigger>
            </TabsList>

            {/* Import/Export Tab */}
            <TabsContent value="import-export" className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">Импорт данных</h2>
                <p className="text-muted-foreground">
                  Импорт данных проектировщиков с валидацией
                </p>
              </div>
              
              <div className="max-w-4xl mx-auto">
                <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <Import className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      Импорт с валидацией
                    </CardTitle>
                    <CardDescription>
                      Импорт данных с расширенной валидацией и проверкой целостности
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImportWithValidationPanel />
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        СТАТУС СИСТЕМЫ
                      </CardTitle>
                      <Database className="h-4 w-4 text-blue-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Готов</div>
                    <p className="text-xs text-muted-foreground">
                      Система готова к работе
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        ПОСЛЕДНЕЕ ОБНОВЛЕНИЕ
                      </CardTitle>
                      <RefreshCw className="h-4 w-4 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-muted-foreground">
                      Данные еще не обновлялись
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        ОБЩЕЕ КОЛИЧЕСТВО
                      </CardTitle>
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">--</div>
                    <p className="text-xs text-muted-foreground">
                      Записей в системе
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* System Settings Tab */}
            <TabsContent value="system-settings" className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">Настройки системы</h2>
                <p className="text-muted-foreground">
                  Конфигурация системы и административные параметры
                </p>
              </div>
              
              <div className="max-w-4xl mx-auto">
                <Card className="shadow-lg border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      Системные настройки
                    </CardTitle>
                    <CardDescription>
                      Конфигурация параметров системы и настройки безопасности
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Параметры базы данных</h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Статус подключения:</span>
                            <Badge variant="outline" className="text-green-600">Подключено</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Версия схемы:</span>
                            <span>1.0.0</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Последнее обновление:</span>
                            <span>--</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="font-medium">Безопасность</h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Уровень доступа:</span>
                            <Badge variant="outline" className="text-red-600">Администратор</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Аутентификация:</span>
                            <Badge variant="outline" className="text-green-600">Активна</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Логирование:</span>
                            <Badge variant="outline" className="text-blue-600">Включено</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Информация о системе
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-200">
                          Эта панель предоставляет полный контроль над данными системы. 
                          Будьте осторожны при выполнении операций, которые могут повлиять на целостность данных.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
