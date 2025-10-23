import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building2, Search, Settings, Plus, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Панель управления!</h1>
        <p className="text-muted-foreground text-lg">Добро пожаловать в систему управления медицинского центра МГБ</p>
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Проекты</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Active Project - МГБ */}
          <Link to="/floors">
            <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 border-primary/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-md bg-primary">
                    <Building2 className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-sm font-medium">Проект МГБ</CardTitle>
                </div>
                <Badge variant="default">Активный</Badge>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-3">
                  Медицинский центр МГБ - управление этажами, отделениями и оборудованием
                </CardDescription>
                <div className="space-y-1 text-xs">
                  <p className="text-muted-foreground">Этажи, отделения, помещения</p>
                  <p className="font-medium text-primary">Полный доступ к данным</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Placeholder for future projects */}
          <Card className="h-full border-dashed border-2 border-muted-foreground/20 hover:border-primary/40 transition-colors">
            <CardHeader className="h-full">
              <CardContent className="flex flex-col items-center justify-center h-full p-6">
                <Plus className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">Добавить новый проект</p>
              </CardContent>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* System Functions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Системные функции</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link to="/search">
            <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 border-border/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Поиск</CardTitle>
                <div className="p-2 rounded-md bg-purple-500">
                  <Search className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-2">Быстрый поиск по данным проекта</CardDescription>
                <p className="text-xs font-medium text-primary">Мгновенный поиск</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin">
            <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 border-border/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Администрирование</CardTitle>
                <div className="p-2 rounded-md bg-gray-500">
                  <Settings className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-2">Управление системой и пользователями</CardDescription>
                <p className="text-xs font-medium text-primary">Системные настройки</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
