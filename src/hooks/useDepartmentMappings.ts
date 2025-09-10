import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DepartmentMapping {
  id: string;
  turar_department: string;
  projector_department: string;
  created_at: string;
  updated_at: string;
}

export const useDepartmentMappings = () => {
  return useQuery({
    queryKey: ["department-mappings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("department_mappings")
        .select("*")
        .order("turar_department, projector_department");

      if (error) {
        throw error;
      }

      return data as DepartmentMapping[];
    },
  });
};

export const useCreateDepartmentMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mapping: Omit<DepartmentMapping, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("department_mappings")
        .insert([mapping])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-mappings"] });
    },
  });
};

export const useDeleteDepartmentMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("department_mappings")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["department-mappings"] });
    },
  });
};

// Хук для получения уникальных отделений из базы данных
export const useGetAllDepartments = () => {
  return useQuery({
    queryKey: ["all-departments"],
    queryFn: async () => {
      // Получаем уникальные отделения Турар
      const { data: turarDepts, error: turarError } = await supabase
        .from("turar_medical")
        .select("Отделение/Блок")
        .order("Отделение/Блок");

      if (turarError) throw turarError;

      // Получаем уникальные отделения Проектировщиков
      const { data: projectorDepts, error: projectorError } = await supabase
        .from("projector_floors")
        .select("ОТДЕЛЕНИЕ")
        .not("ОТДЕЛЕНИЕ", "is", null)
        .order("ОТДЕЛЕНИЕ");

      if (projectorError) throw projectorError;

      const uniqueTurarDepts = [...new Set(turarDepts?.map(item => item["Отделение/Блок"]) || [])];
      const uniqueProjectorDepts = [...new Set(projectorDepts?.map(item => item["ОТДЕЛЕНИЕ"]?.trim()) || [])].filter(Boolean);

      return {
        turarDepartments: uniqueTurarDepts,
        projectorDepartments: uniqueProjectorDepts
      };
    },
  });
};