import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EquipmentDocument {
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export const useEquipmentFiles = () => {
  const uploadFile = async (file: File, equipmentId: string): Promise<EquipmentDocument | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${equipmentId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('equipment-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('equipment-documents')
        .getPublicUrl(fileName);

      return {
        name: file.name,
        url: fileName,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Ошибка при загрузке файла");
      return null;
    }
  };

  const deleteFile = async (fileUrl: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('equipment-documents')
        .remove([fileUrl]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Ошибка при удалении файла");
      return false;
    }
  };

  const getFileUrl = (fileUrl: string): string => {
    const { data: { publicUrl } } = supabase.storage
      .from('equipment-documents')
      .getPublicUrl(fileUrl);
    return publicUrl;
  };

  return {
    uploadFile,
    deleteFile,
    getFileUrl,
  };
};
