import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useProjectorDepartments = () => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setIsLoading(true);
        console.log('🏗️ Fetching projector departments from database function...');
        
        const { data, error } = await supabase.rpc('get_unique_projector_departments');
        
        if (error) {
          console.error('❌ Error fetching projector departments:', error);
          setError(error);
          return;
        }
        
        const departmentNames = data?.map((item: any) => item.department_name) || [];
        console.log('✅ Successfully fetched projector departments:', {
          count: departmentNames.length,
          departments: departmentNames
        });
        
        setDepartments(departmentNames);
        setError(null);
      } catch (err) {
        console.error('❌ Exception fetching projector departments:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  return { departments, isLoading, error };
};