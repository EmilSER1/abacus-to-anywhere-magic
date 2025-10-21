import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FullEquipmentData {
  // Room info
  floor: string;
  block: string;
  department: string;
  room_code: string;
  room_name: string;
  area: number;
  
  // Equipment basic info
  equipment_code: string | null;
  equipment_name: string | null;
  model_name: string | null;
  equipment_code_required: string | null;
  equipment_type: string | null;
  brand: string | null;
  country: string | null;
  specification: string | null;
  standard: string | null;
  quantity: string | null;
  unit: string | null;
  notes: string | null;
  
  // Technical specs
  dimensions: string | null;
  humidity_temperature: string | null;
  voltage: string | null;
  frequency: string | null;
  power_watts: string | null;
  power_watts_peak: string | null;
  ups: string | null;
  floor_load: string | null;
  floor_load_heaviest: string | null;
  ceiling_load_heaviest: string | null;
  chiller: boolean | null;
  precision_ac: boolean | null;
  exhaust: string | null;
  drainage: string | null;
  hot_water: string | null;
  cold_water: string | null;
  distilled_water: string | null;
  neutralization_tank: string | null;
  data_requirements: string | null;
  emergency_buttons: string | null;
  xray_warning_lamps: string | null;
  raised_floor: string | null;
  ceiling_drops: string | null;
  
  // Medical gases
  medical_gas_o2: string | null;
  medical_gas_ma4: string | null;
  medical_gas_ma7: string | null;
  medical_gas_n2o: string | null;
  medical_gas_other: string | null;
  other_requirements: string | null;
  
  // Purchase info
  purchase_price: number | null;
  purchase_currency: string | null;
  price_updated_at: string | null;
  incoterms: string | null;
  supplier: string | null;
  supplier_status: string | null;
  supplier_contacts: any;
  documents: any;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export const useFullEquipmentExport = () => {
  return useQuery({
    queryKey: ["full-equipment-export"],
    queryFn: async () => {
      // Get all equipment with their room information
      const { data, error } = await supabase
        .from("equipment")
        .select(`
          *,
          projector_floors!equipment_room_id_fkey (
            "ЭТАЖ",
            "БЛОК",
            "ОТДЕЛЕНИЕ",
            "КОД ПОМЕЩЕНИЯ",
            "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ",
            "Площадь (м2)"
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching full equipment data:", error);
        throw error;
      }

      // Transform the data into a flattened structure
      const transformedData: FullEquipmentData[] = (data || []).map((item: any) => {
        const room = item.projector_floors;
        
        return {
          // Room info
          floor: room?.["ЭТАЖ"] || "",
          block: room?.["БЛОК"] || "",
          department: room?.["ОТДЕЛЕНИЕ"] || "",
          room_code: room?.["КОД ПОМЕЩЕНИЯ"] || "",
          room_name: room?.["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"] || "",
          area: room?.["Площадь (м2)"] || 0,
          
          // Equipment basic info
          equipment_code: item.equipment_code,
          equipment_name: item.equipment_name,
          model_name: item.model_name,
          equipment_code_required: item.equipment_code_required,
          equipment_type: item.equipment_type,
          brand: item.brand,
          country: item.country,
          specification: item.specification,
          standard: item.standard,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes,
          
          // Technical specs
          dimensions: item.dimensions,
          humidity_temperature: item.humidity_temperature,
          voltage: item.voltage,
          frequency: item.frequency,
          power_watts: item.power_watts,
          power_watts_peak: item.power_watts_peak,
          ups: item.ups,
          floor_load: item.floor_load,
          floor_load_heaviest: item.floor_load_heaviest,
          ceiling_load_heaviest: item.ceiling_load_heaviest,
          chiller: item.chiller,
          precision_ac: item.precision_ac,
          exhaust: item.exhaust,
          drainage: item.drainage,
          hot_water: item.hot_water,
          cold_water: item.cold_water,
          distilled_water: item.distilled_water,
          neutralization_tank: item.neutralization_tank,
          data_requirements: item.data_requirements,
          emergency_buttons: item.emergency_buttons,
          xray_warning_lamps: item.xray_warning_lamps,
          raised_floor: item.raised_floor,
          ceiling_drops: item.ceiling_drops,
          
          // Medical gases
          medical_gas_o2: item.medical_gas_o2,
          medical_gas_ma4: item.medical_gas_ma4,
          medical_gas_ma7: item.medical_gas_ma7,
          medical_gas_n2o: item.medical_gas_n2o,
          medical_gas_other: item.medical_gas_other,
          other_requirements: item.other_requirements,
          
          // Purchase info
          purchase_price: item.purchase_price,
          purchase_currency: item.purchase_currency,
          price_updated_at: item.price_updated_at,
          incoterms: item.incoterms,
          supplier: item.supplier,
          supplier_status: item.supplier_status,
          supplier_contacts: item.supplier_contacts,
          documents: item.documents,
          
          // Timestamps
          created_at: item.created_at,
          updated_at: item.updated_at,
        };
      });

      console.log(`Loaded ${transformedData.length} equipment records for export`);
      return transformedData;
    },
    enabled: false, // Only fetch when explicitly called
  });
};
