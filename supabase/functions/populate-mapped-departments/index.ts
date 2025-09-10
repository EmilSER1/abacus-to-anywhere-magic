import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { department_mapping_id, projector_department, turar_department } = await req.json()

    console.log(`🔄 Начинаем заполнение промежуточных таблиц для mapping: ${department_mapping_id}`)
    console.log(`📊 Проектировщики: "${projector_department}", Турар: "${turar_department}"`)

    // Получаем данные проектировщиков
    const { data: projectorData, error: projectorError } = await supabase
      .from('projector_floors')
      .select('*')
      .ilike('ОТДЕЛЕНИЕ', `%${projector_department}%`)

    if (projectorError) {
      console.error('❌ Ошибка загрузки данных проектировщиков:', projectorError)
      throw projectorError
    }

    console.log(`📊 Найдено ${projectorData?.length || 0} записей проектировщиков`)

    // Получаем данные Турар
    const { data: turarData, error: turarError } = await supabase
      .from('turar_medical')
      .select('*')
      .ilike('Отделение/Блок', `%${turar_department}%`)

    if (turarError) {
      console.error('❌ Ошибка загрузки данных Турар:', turarError)
      throw turarError
    }

    console.log(`🏥 Найдено ${turarData?.length || 0} записей Турар`)

    // Преобразуем данные проектировщиков для вставки
    const mappedProjectorData = projectorData?.map(item => ({
      department_mapping_id,
      original_record_id: item.id,
      floor_number: item["ЭТАЖ"],
      block_name: item["БЛОК"],
      department_name: item["ОТДЕЛЕНИЕ"],
      room_code: item["КОД ПОМЕЩЕНИЯ"],
      room_name: item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"],
      room_area: item["Площадь (м2)"],
      equipment_code: item["Код оборудования"],
      equipment_name: item["Наименование оборудования"],
      equipment_unit: item["Ед. изм."],
      equipment_quantity: item["Кол-во"],
      equipment_notes: item["Примечания"]
    })) || []

    // Преобразуем данные Турар для вставки
    const mappedTurarData = turarData?.map(item => ({
      department_mapping_id,
      original_record_id: item.id,
      department_name: item["Отделение/Блок"],
      room_name: item["Помещение/Кабинет"],
      equipment_code: item["Код оборудования"],
      equipment_name: item["Наименование"],
      equipment_quantity: item["Кол-во"]
    })) || []

    // Вставляем данные проектировщиков
    if (mappedProjectorData.length > 0) {
      const { error: insertProjectorError } = await supabase
        .from('mapped_projector_rooms')
        .insert(mappedProjectorData)

      if (insertProjectorError) {
        console.error('❌ Ошибка вставки данных проектировщиков:', insertProjectorError)
        throw insertProjectorError
      }

      console.log(`✅ Вставлено ${mappedProjectorData.length} записей проектировщиков`)
    }

    // Вставляем данные Турар
    if (mappedTurarData.length > 0) {
      const { error: insertTurarError } = await supabase
        .from('mapped_turar_rooms')
        .insert(mappedTurarData)

      if (insertTurarError) {
        console.error('❌ Ошибка вставки данных Турар:', insertTurarError)
        throw insertTurarError
      }

      console.log(`✅ Вставлено ${mappedTurarData.length} записей Турар`)
    }

    const result = {
      success: true,
      department_mapping_id,
      projector_records: mappedProjectorData.length,
      turar_records: mappedTurarData.length
    }

    console.log(`🎉 Успешно заполнены промежуточные таблицы:`, result)

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )

  } catch (error) {
    console.error('❌ Ошибка в функции populate-mapped-departments:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      },
    )
  }
})