import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCleanupUnknownRooms = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      console.log('🧹 Starting cleanup of unknown room connections...');

      // 1. Clean up room_connections table
      const { data: deletedConnections, error: connectionsError } = await supabase
        .from('room_connections')
        .delete()
        .or('turar_room.eq.Неизвестный кабинет,turar_room.ilike.%неизвестный%,projector_room.eq.Неизвестный кабинет,projector_room.ilike.%неизвестный%')
        .select();

      if (connectionsError) {
        console.error('❌ Error deleting room connections:', connectionsError);
        throw connectionsError;
      }

      console.log('✅ Deleted room connections:', deletedConnections?.length || 0);

      // 2. Clean up projector_floors table
      const { data: updatedProjectorFloors, error: projectorError } = await supabase
        .from('projector_floors')
        .update({
          connected_turar_room: null,
          connected_turar_department: null,
          connected_turar_room_id: null
        })
        .or('connected_turar_room.eq.Неизвестный кабинет,connected_turar_room.ilike.%неизвестный%')
        .select();

      if (projectorError) {
        console.error('❌ Error cleaning projector floors:', projectorError);
        throw projectorError;
      }

      console.log('✅ Cleaned projector floors:', updatedProjectorFloors?.length || 0);

      // 3. Clean up turar_medical table
      const { data: updatedTurarMedical, error: turarError } = await supabase
        .from('turar_medical')
        .update({
          connected_projector_room: null,
          connected_projector_department: null,
          connected_projector_room_id: null
        })
        .or('connected_projector_room.eq.Неизвестный кабинет,connected_projector_room.ilike.%неизвестный%')
        .select();

      if (turarError) {
        console.error('❌ Error cleaning turar medical:', turarError);
        throw turarError;
      }

      console.log('✅ Cleaned turar medical:', updatedTurarMedical?.length || 0);

      return {
        deletedConnections: deletedConnections?.length || 0,
        cleanedProjectorFloors: updatedProjectorFloors?.length || 0,
        cleanedTurarMedical: updatedTurarMedical?.length || 0
      };
    },
    onSuccess: (result) => {
      console.log('🎉 Cleanup completed successfully:', result);
      
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['room-connections'] });
      queryClient.invalidateQueries({ queryKey: ['floors-data'] });
      queryClient.invalidateQueries({ queryKey: ['turar-medical-data'] });
      
      toast({
        title: "Очистка завершена",
        description: `Удалено связей: ${result.deletedConnections}, очищено записей: ${result.cleanedProjectorFloors + result.cleanedTurarMedical}`,
      });
    },
    onError: (error) => {
      console.error('❌ Cleanup failed:', error);
      toast({
        title: "Ошибка очистки",
        description: "Не удалось удалить связи с неизвестными кабинетами",
        variant: "destructive",
      });
    },
  });
};