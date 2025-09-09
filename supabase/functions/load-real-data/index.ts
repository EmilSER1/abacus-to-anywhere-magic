import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Создадим новую Edge function для загрузки реальных данных
// Данные будут загружаться частями для избежания таймаутов

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, batch = 0 } = await req.json()

    if (action === 'load-projector-batch') {
      console.log(`Loading projector data batch ${batch}...`)

      // Загружаем данные из внешнего источника
      const response = await fetch('https://6667da30-9329-43b2-9aff-2cbae5c80f84.sandbox.lovable.dev/combined_floors.json')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }

      const allData = await response.json()
      console.log(`Total records available: ${allData.length}`)

      // Работаем с батчами по 500 записей
      const batchSize = 500
      const startIndex = batch * batchSize
      const endIndex = startIndex + batchSize
      const batchData = allData.slice(startIndex, endIndex)

      if (batchData.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'No more data to load',
            inserted: 0,
            hasMore: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Если это первый батч, очищаем таблицу
      if (batch === 0) {
        console.log('Clearing existing projector data...')
        const { error: deleteError } = await supabase
          .from('projector_floors')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError) {
          console.error('Error clearing projector data:', deleteError)
          throw deleteError
        }
      }

      // Вставляем батч данных
      const { error: insertError } = await supabase
        .from('projector_floors')
        .insert(batchData)

      if (insertError) {
        console.error('Error inserting projector data:', insertError)
        throw insertError
      }

      const hasMore = endIndex < allData.length
      console.log(`Inserted batch ${batch}: ${batchData.length} records. Has more: ${hasMore}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Batch ${batch} loaded: ${batchData.length} records`,
          inserted: batchData.length,
          hasMore: hasMore,
          totalLoaded: endIndex,
          totalAvailable: allData.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'load-turar-batch') {
      console.log(`Loading turar data batch ${batch}...`)

      // Загружаем данные из внешнего источника
      const response = await fetch('https://6667da30-9329-43b2-9aff-2cbae5c80f84.sandbox.lovable.dev/turar_full.json')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`)
      }

      const allData = await response.json()
      console.log(`Total turar records available: ${allData.length}`)

      // Работаем с батчами по 500 записей
      const batchSize = 500
      const startIndex = batch * batchSize
      const endIndex = startIndex + batchSize
      const batchData = allData.slice(startIndex, endIndex)

      if (batchData.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'No more data to load',
            inserted: 0,
            hasMore: false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Если это первый батч, очищаем таблицу
      if (batch === 0) {
        console.log('Clearing existing turar data...')
        const { error: deleteError } = await supabase
          .from('turar_medical')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError) {
          console.error('Error clearing turar data:', deleteError)
          throw deleteError
        }
      }

      // Вставляем батч данных
      const { error: insertError } = await supabase
        .from('turar_medical')
        .insert(batchData)

      if (insertError) {
        console.error('Error inserting turar data:', insertError)
        throw insertError
      }

      const hasMore = endIndex < allData.length
      console.log(`Inserted turar batch ${batch}: ${batchData.length} records. Has more: ${hasMore}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Turar batch ${batch} loaded: ${batchData.length} records`,
          inserted: batchData.length,
          hasMore: hasMore,
          totalLoaded: endIndex,
          totalAvailable: allData.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: load-projector-batch or load-turar-batch' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Load error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Load failed', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})