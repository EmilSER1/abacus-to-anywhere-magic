import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Crown, UserCheck, User, UserX } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { useUserRole, type UserRole } from "@/hooks/useUserRole";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const roleLabels: Record<UserRole, string> = {
  admin: "Администратор",
  staff: "Сотрудник", 
  user: "Пользователь",
  none: "Нулевой"
};

const roleIcons: Record<UserRole, any> = {
  admin: Crown,
  staff: UserCheck,
  user: User,
  none: UserX
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  staff: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  user: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  none: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

export default function UsersPage() {
  const { users, loading, isSuperAdmin, updateUserRole } = useUsers();
  const { canViewUsers } = useUserRole();
  const { toast } = useToast();
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  if (!canViewUsers()) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <UserX className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Доступ запрещен</h2>
              <p className="text-muted-foreground">У вас нет прав для просмотра этой страницы</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUsers(prev => new Set([...prev, userId]));
    
    const success = await updateUserRole(userId, newRole);
    
    setUpdatingUsers(prev => {
      const updated = new Set(prev);
      updated.delete(userId);
      return updated;
    });

    if (!success) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить роль пользователя",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Управление пользователями</h1>
          <p className="text-muted-foreground">Просмотр и управление уровнями доступа пользователей</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
          <CardDescription>
            Всего пользователей: {users.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-32" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => {
                const RoleIcon = roleIcons[user.role];
                const isUpdating = updatingUsers.has(user.id);
                
                return (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <RoleIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {user.full_name || "Без имени"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {isSuperAdmin ? user.email : `ID: ${user.id.slice(0, 8)}...`}
                          </div>
                          {!isSuperAdmin && (
                            <div className="text-xs text-orange-600">
                              📧 Только суперадмин видит email
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={roleColors[user.role]}>
                        {roleLabels[user.role]}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Select
                        value={user.role}
                        onValueChange={(value: UserRole) => handleRoleChange(user.id, value)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roleLabels).map(([role, label]) => (
                            <SelectItem key={role} value={role}>
                              <div className="flex items-center gap-2">
                                {React.createElement(roleIcons[role as UserRole], { className: "h-4 w-4" })}
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {isUpdating && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {users.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Пользователи не найдены</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Описание ролей</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Crown className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-medium">Администратор</div>
                <div className="text-sm text-muted-foreground">Полный доступ ко всем функциям</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Сотрудник</div>
                <div className="text-sm text-muted-foreground">Видит все, но без админ-панели</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Пользователь</div>
                <div className="text-sm text-muted-foreground">Только просмотр основных разделов</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <UserX className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium">Нулевой</div>
                <div className="text-sm text-muted-foreground">Доступ запрещен</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}