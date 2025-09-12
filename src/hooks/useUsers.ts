import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, UserRole } from "./useUserRole";

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkSuperAdminStatus();
    fetchUsers();
  }, []);

  const checkSuperAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('is_super_admin');
      if (!error) {
        setIsSuperAdmin(data || false);
      }
    } catch (error) {
      console.error('Error checking super admin status:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Use different query based on admin level
      let query;
      if (isSuperAdmin) {
        // Super admins can see all data including emails
        query = supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
      } else {
        // Regular admins only see non-sensitive data
        query = supabase
          .from('profiles')
          .select('id, full_name, role, created_at, updated_at')
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        
        // Handle access denied gracefully
        if (error.message.includes('access denied') || error.code === 'PGRST301') {
          toast({
            title: "Доступ ограничен",
            description: "У вас нет прав для просмотра данных пользователей",
            variant: "destructive",
          });
          setUsers([]);
          return;
        }
        
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список пользователей",
          variant: "destructive",
        });
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке пользователей",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      // Use the secure function for role updates
      const { error } = await supabase.rpc('update_user_role_secure', {
        target_user_id: userId,
        new_role: newRole
      });

      if (error) {
        console.error('Error updating user role:', error);
        
        if (error.message.includes('Access denied')) {
          toast({
            title: "Доступ запрещен",
            description: "У вас нет прав для изменения ролей пользователей",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Ошибка",
            description: "Не удалось обновить роль пользователя",
            variant: "destructive",
          });
        }
        return false;
      }

      toast({
        title: "Успешно",
        description: "Роль пользователя обновлена и записана в аудит",
      });

      // Обновляем локальное состояние
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      return true;
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при обновлении роли",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    users,
    loading,
    isSuperAdmin,
    fetchUsers,
    updateUserRole
  };
}