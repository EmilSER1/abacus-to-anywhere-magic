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

    console.log(`🔄 Начинаем массовое заполнение промежуточных таблиц для всех сопоставлений`)

    // Получаем все существующие сопоставления отделений
    const { data: departmentMappings, error: mappingsError } = await supabase
      .from('department_mappings')
      .select('*')
      .order('created_at')

    if (mappingsError) {
      console.error('❌ Ошибка загрузки сопоставлений:', mappingsError)
      throw mappingsError
    }

    console.log(`📊 Найдено ${departmentMappings?.length || 0} сопоставлений отделений`)

    // Очищаем существующие промежуточные данные
    console.log('🧹 Очищаем существующие промежуточные таблицы...')
    await Promise.all([
      supabase.from('mapped_projector_rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      supabase.from('mapped_turar_rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    ])

    let totalProjectorRecords = 0
    let totalTurarRecords = 0
    let processedMappings = 0

    // Обрабатываем каждое сопоставление
    for (const mapping of departmentMappings || []) {
      console.log(`\n🔄 Обрабатываем сопоставление ${processedMappings + 1}/${departmentMappings?.length || 0}`)
      console.log(`📊 Проектировщики: "${mapping.projector_department}", Турар: "${mapping.turar_department}"`)

      // Получаем данные проектировщиков - используем более точный поиск
      const { data: projectorData, error: projectorError } = await supabase
        .from('projector_floors')
        .select('*')
        .or(`"ОТДЕЛЕНИЕ".ilike.%${mapping.projector_department}%,"ОТДЕЛЕНИЕ".ilike.%${mapping.projector_department.trim()}%`)

      if (projectorError) {
        console.error(`❌ Ошибка загрузки данных проектировщиков для "${mapping.projector_department}":`, projectorError)
        continue
      }

      console.log(`📊 Найдено ${projectorData?.length || 0} записей проектировщиков`)

      // Получаем данные Турар
      const { data: turarData, error: turarError } = await supabase
        .from('turar_medical')
        .select('*')
        .ilike('"Отделение/Блок"', `%${mapping.turar_department}%`)

      if (turarError) {
        console.error(`❌ Ошибка загрузки данных Турар для "${mapping.turar_department}":`, turarError)
        continue
      }

      console.log(`🏥 Найдено ${turarData?.length || 0} записей Турар`)

      // Преобразуем данные проектировщиков для вставки с материнским ID
      const mappedProjectorData = projectorData?.map(item => ({
        department_mapping_id: mapping.id,
        original_record_id: item.id, // Материнский ID из основной таблицы
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
        equipment_notes: item["Примечания"],
        is_linked: false // По умолчанию не связано
      })) || []

      // Преобразуем данные Турар для вставки с материнским ID
      const mappedTurarData = turarData?.map(item => ({
        department_mapping_id: mapping.id,
        original_record_id: item.id, // Материнский ID из основной таблицы
        department_name: item["Отделение/Блок"],
        room_name: item["Помещение/Кабинет"],
        equipment_code: item["Код оборудования"],
        equipment_name: item["Наименование"],
        equipment_quantity: item["Кол-во"],
        is_linked: false // По умолчанию не связано
      })) || []

      // Вставляем данные проектировщиков батчами
      if (mappedProjectorData.length > 0) {
        const batchSize = 1000
        for (let i = 0; i < mappedProjectorData.length; i += batchSize) {
          const batch = mappedProjectorData.slice(i, i + batchSize)
          const { error: insertError } = await supabase
            .from('mapped_projector_rooms')
            .insert(batch)

          if (insertError) {
            console.error(`❌ Ошибка вставки проектировщиков (batch ${Math.floor(i/batchSize) + 1}):`, insertError)
          } else {
            console.log(`✅ Вставлено ${batch.length} записей проектировщиков (batch ${Math.floor(i/batchSize) + 1})`)
          }
        }
        totalProjectorRecords += mappedProjectorData.length
      }

      // Вставляем данные Турар батчами
      if (mappedTurarData.length > 0) {
        const batchSize = 1000
        for (let i = 0; i < mappedTurarData.length; i += batchSize) {
          const batch = mappedTurarData.slice(i, i + batchSize)
          const { error: insertError } = await supabase
            .from('mapped_turar_rooms')
            .insert(batch)

          if (insertError) {
            console.error(`❌ Ошибка вставки Турар (batch ${Math.floor(i/batchSize) + 1}):`, insertError)
          } else {
            console.log(`✅ Вставлено ${batch.length} записей Турар (batch ${Math.floor(i/batchSize) + 1})`)
          }
        }
        totalTurarRecords += mappedTurarData.length
      }

      processedMappings++
      console.log(`✅ Сопоставление обработано: ${processedMappings}/${departmentMappings?.length || 0}`)
    }

    const result = {
      success: true,
      processed_mappings: processedMappings,
      total_projector_records: totalProjectorRecords,
      total_turar_records: totalTurarRecords,
      total_records: totalProjectorRecords + totalTurarRecords
    }

    console.log(`\n🎉 Массовое заполнение завершено:`, result)

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
    console.error('❌ Ошибка в функции bulk-populate-mapped-departments:', error)
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