import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCleanupUnknownRooms = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      console.log('🧹 Starting complete cleanup of all room connections...');

      // 1. Delete ALL room connections
      const { data: deletedConnections, error: connectionsError } = await supabase
        .from('room_connections')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows
        .select();

      if (connectionsError) {
        console.error('❌ Error deleting room connections:', connectionsError);
        throw connectionsError;
      }

      console.log('✅ Deleted ALL room connections:', deletedConnections?.length || 0);

      // 2. Clean ALL projector_floors connections
      const { data: updatedProjectorFloors, error: projectorError } = await supabase
        .from('projector_floors')
        .update({
          connected_turar_room: null,
          connected_turar_department: null,
          connected_turar_room_id: null
        })
        .not('connected_turar_room', 'is', null)
        .select();

      if (projectorError) {
        console.error('❌ Error cleaning projector floors:', projectorError);
        throw projectorError;
      }

      console.log('✅ Cleaned ALL projector floors:', updatedProjectorFloors?.length || 0);

      // 3. Clean ALL turar_medical connections
      const { data: updatedTurarMedical, error: turarError } = await supabase
        .from('turar_medical')
        .update({
          connected_projector_room: null,
          connected_projector_department: null,
          connected_projector_room_id: null
        })
        .not('connected_projector_room', 'is', null)
        .select();

      if (turarError) {
        console.error('❌ Error cleaning turar medical:', turarError);
        throw turarError;
      }

      console.log('✅ Cleaned ALL turar medical:', updatedTurarMedical?.length || 0);

      return {
        deletedConnections: deletedConnections?.length || 0,
        cleanedProjectorFloors: updatedProjectorFloors?.length || 0,
        cleanedTurarMedical: updatedTurarMedical?.length || 0
      };
    },
    onSuccess: (result) => {
      console.log('🎉 Complete cleanup completed successfully:', result);
      
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['room-connections'] });
      queryClient.invalidateQueries({ queryKey: ['floors-data'] });
      queryClient.invalidateQueries({ queryKey: ['turar-medical-data'] });
      
      toast({
        title: "Полная очистка завершена",
        description: `Удалено связей: ${result.deletedConnections}, очищено записей: ${result.cleanedProjectorFloors + result.cleanedTurarMedical}`,
      });
    },
    onError: (error) => {
      console.error('❌ Complete cleanup failed:', error);
      toast({
        title: "Ошибка очистки",
        description: "Не удалось удалить все связи между комнатами",
        variant: "destructive",
      });
    },
  });
};