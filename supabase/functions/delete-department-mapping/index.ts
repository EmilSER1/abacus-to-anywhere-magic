import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  console.log('🔵 Получен запрос:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Обрабатываем OPTIONS запрос');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { mappingId } = await req.json()
    
    if (!mappingId) {
      throw new Error('mapping ID is required')
    }

    console.log('🗑️ НАЧИНАЕМ БЕЗОПАСНОЕ УДАЛЕНИЕ СВЯЗИ:', { mappingId })

    // 1. Получаем информацию о связи перед удалением
    const { data: mapping, error: mappingError } = await supabase
      .from('department_mappings')
      .select('*')
      .eq('id', mappingId)
      .single()

    if (mappingError || !mapping) {
      console.error('❌ Связь не найдена:', mappingError)
      throw new Error('Department mapping not found')
    }

    console.log('📋 Найдена связь:', mapping)

    // 2. Очищаем связанные данные в projector_floors
    console.log('🧹 Очищаем данные в projector_floors...')
    const { error: projectorUpdateError } = await supabase
      .from('projector_floors')
      .update({
        connected_turar_department: null,
        connected_turar_room: null,
        connected_turar_room_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('department_id', mapping.projector_department_id)

    if (projectorUpdateError) {
      console.error('❌ Ошибка очистки projector_floors:', projectorUpdateError)
    } else {
      console.log('✅ projector_floors очищена')
    }

    // 3. Очищаем связанные данные в turar_medical
    console.log('🧹 Очищаем данные в turar_medical...')
    const { error: turarUpdateError } = await supabase
      .from('turar_medical')
      .update({
        connected_projector_department: null,
        connected_projector_room: null,
        connected_projector_room_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('department_id', mapping.turar_department_id)

    if (turarUpdateError) {
      console.error('❌ Ошибка очистки turar_medical:', turarUpdateError)
    } else {
      console.log('✅ turar_medical очищена')
    }

    // 4. Удаляем связи кабинетов
    console.log('🧹 Удаляем связи кабинетов...')
    const { error: roomConnectionsError } = await supabase
      .from('room_connections')
      .delete()
      .or(`projector_department_id.eq.${mapping.projector_department_id},turar_department_id.eq.${mapping.turar_department_id}`)

    if (roomConnectionsError) {
      console.error('❌ Ошибка удаления room_connections:', roomConnectionsError)
    } else {
      console.log('✅ room_connections очищены')
    }

    // 5. Удаляем mapped_projector_rooms
    console.log('🧹 Удаляем mapped_projector_rooms...')
    const { error: mappedProjectorError } = await supabase
      .from('mapped_projector_rooms')
      .delete()
      .eq('department_mapping_id', mappingId)

    if (mappedProjectorError) {
      console.error('❌ Ошибка удаления mapped_projector_rooms:', mappedProjectorError)
    } else {
      console.log('✅ mapped_projector_rooms очищены')
    }

    // 6. Удаляем mapped_turar_rooms
    console.log('🧹 Удаляем mapped_turar_rooms...')
    const { error: mappedTurarError } = await supabase
      .from('mapped_turar_rooms')
      .delete()
      .eq('department_mapping_id', mappingId)

    if (mappedTurarError) {
      console.error('❌ Ошибка удаления mapped_turar_rooms:', mappedTurarError)
    } else {
      console.log('✅ mapped_turar_rooms очищены')
    }

    // 7. Наконец, удаляем саму связь отделений
    console.log('🗑️ Удаляем связь отделений...')
    const { error: deleteError } = await supabase
      .from('department_mappings')
      .delete()
      .eq('id', mappingId)

    if (deleteError) {
      console.error('❌ Ошибка удаления связи отделений:', deleteError)
      throw deleteError
    }

    console.log('✅ СВЯЗЬ УСПЕШНО УДАЛЕНА:', mappingId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Department mapping deleted successfully',
        deletedMappingId: mappingId 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})