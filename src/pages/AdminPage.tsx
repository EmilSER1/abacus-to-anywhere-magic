import React from 'react';

import { DataSyncPanel } from '@/components/DataSyncPanel';
import { CsvUploadPanel } from '@/components/CsvUploadPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Database, Users, FileText, Upload } from 'lucide-react';

const AdminPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Администрирование</h1>
        <p className="text-muted-foreground">Управление данными и системными настройками</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Панель администрирования</h1>
          <p className="text-muted-foreground">
            Управление данными и настройками системы
          </p>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          
          {/* Data Sync Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Database className="h-5 w-5" />
              Управление данными
            </h2>
            <DataSyncPanel />
            
            {/* CSV Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Загрузка CSV файлов
              </h3>
              <CsvUploadPanel />
            </div>
          </div>

          {/* Statistics Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Статистика системы
            </h2>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Информация о данных
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Статистика будет обновляться после синхронизации данных.
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-lg border">
                    <div className="text-2xl font-bold text-primary">-</div>
                    <div className="text-sm text-muted-foreground">Проектировщики</div>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <div className="text-2xl font-bold text-primary">-</div>
                    <div className="text-sm text-muted-foreground">Турар</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Инструкции по использованию</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Синхронизация данных</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Нажмите "Все данные" для полной синхронизации</li>
                  <li>• Используйте отдельные кнопки для частичной синхронизации</li>
                  <li>• Процесс может занять несколько минут</li>
                  <li>• Старые данные будут заменены новыми</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Формат данных</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• JSON файлы должны быть в public директории</li>
                  <li>• Поля автоматически преобразуются</li>
                  <li>• Русские названия → английские поля в БД</li>
                  <li>• Валидация данных происходит автоматически</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;