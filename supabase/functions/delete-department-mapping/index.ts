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
    console.log('🔧 Инициализация Supabase клиента...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Отсутствуют переменные окружения');
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📥 Получен запрос:', requestBody);
    } catch (parseError) {
      console.error('❌ Ошибка парсинга JSON:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    const { mappingId } = requestBody;
    
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

    // 2. Сначала удаляем саму связь отделений (это должно разорвать зависимости)
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