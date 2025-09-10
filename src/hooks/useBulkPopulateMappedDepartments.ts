import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Хук для массового заполнения промежуточных таблиц
export const useBulkPopulateMappedDepartments = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      console.log(`🔄 Запускаем массовое заполнение промежуточных таблиц...`);
      
      const { data, error } = await supabase.functions.invoke('bulk-populate-mapped-departments');

      if (error) {
        console.error(`❌ Ошибка вызова функции:`, error);
        throw error;
      }

      console.log(`✅ Массовое заполнение выполнено успешно:`, data);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Массовое заполнение завершено",
        description: `Обработано ${data.processed_mappings} сопоставлений. Скопировано ${data.total_records.toLocaleString()} записей (${data.total_projector_records} проектировщиков + ${data.total_turar_records} Турар)`,
      });
    },
    onError: (error) => {
      console.error("❌ Ошибка массового заполнения:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить массовое заполнение промежуточных таблиц",
        variant: "destructive",
      });
    },
  });
};