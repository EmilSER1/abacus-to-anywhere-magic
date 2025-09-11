import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, UserRole } from "./useUserRole";

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
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
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось обновить роль пользователя",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Успешно",
        description: "Роль пользователя обновлена",
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
    fetchUsers,
    updateUserRole
  };
}