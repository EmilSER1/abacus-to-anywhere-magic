import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type UserRole = 'admin' | 'staff' | 'user' | 'none';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export function useUserRole() {
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUserRole();
  }, []);

  const getCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCurrentUserRole(null);
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        setCurrentUserRole('none');
      } else {
        setCurrentUserRole(profile?.role || 'none');
      }
    } catch (error) {
      console.error('Error in getCurrentUserRole:', error);
      setCurrentUserRole('none');
    } finally {
      setLoading(false);
    }
  };

  const canAccess = (requiredRoles: UserRole[]) => {
    if (!currentUserRole) return false;
    return requiredRoles.includes(currentUserRole);
  };

  const canEdit = () => {
    return canAccess(['admin', 'staff']);
  };

  const canViewAdminPanel = () => {
    return canAccess(['admin']);
  };

  const canViewUsers = () => {
    return canAccess(['admin']);
  };

  return {
    currentUserRole,
    loading,
    canAccess,
    canEdit,
    canViewAdminPanel,
    canViewUsers,
    refreshRole: getCurrentUserRole
  };
}