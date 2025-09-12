import React from 'react';

import { DataSyncPanel } from '@/components/DataSyncPanel';
import { CsvUploadPanel } from '@/components/CsvUploadPanel';
import { ExportWithConnectionsPanel } from '@/components/ExportWithConnectionsPanel';
import { ImportWithValidationPanel } from '@/components/ImportWithValidationPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Database, Users, FileText, Upload } from 'lucide-react';

const AdminPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Администрирование</h1>
        <p className="text-muted-foreground">Управление данными и системными настройками</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Синхронизация данных
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataSyncPanel />
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Загрузка CSV файлов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CsvUploadPanel />
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Экспорт со связями
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExportWithConnectionsPanel />
          </CardContent>
        </Card>

        <Card className="p-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Импорт с валидацией
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImportWithValidationPanel />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;