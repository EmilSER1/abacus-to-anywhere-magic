import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Создаем временные данные для тестирования
const sampleProjectorData = [
  {
    "ЭТАЖ": 1,
    "БЛОК": "А",
    "ОТДЕЛЕНИЕ": "Хирургическое отделение",
    "КОД ПОМЕЩЕНИЯ": "1.SUR-01",
    "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": "Операционная 1",
    "Код помещения": "1.SUR-01",
    "Наименование помещения": "Операционная 1",
    "Площадь (м2)": 25.5,
    "Код оборудования": "SUR-001",
    "Наименование оборудования": "Операционный стол",
    "Ед. изм.": "шт.",
    "Кол-во": "1",
    "Примечания": "Основное оборудование"
  },
  {
    "ЭТАЖ": 1,
    "БЛОК": "А",
    "ОТДЕЛЕНИЕ": "Хирургическое отделение",
    "КОД ПОМЕЩЕНИЯ": "1.SUR-01",
    "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": "Операционная 1",
    "Код помещения": "1.SUR-01",
    "Наименование помещения": "Операционная 1",
    "Площадь (м2)": 25.5,
    "Код оборудования": "SUR-002",
    "Наименование оборудования": "Хирургическая лампа",
    "Ед. изм.": "шт.",
    "Кол-во": "2",
    "Примечания": null
  }
];

const sampleTurarData = [
  {
    "Отделение/Блок": "Травмпункт",
    "Помещение/Кабинет": "Кабинет врача",
    "Код оборудования": "TR-001",
    "Наименование": "Кушетка медицинская",
    "Кол-во": 1
  },
  {
    "Отделение/Блок": "Травмпункт",
    "Помещение/Кабинет": "Кабинет врача",
    "Код оборудования": "TR-002",
    "Наименование": "Термометр медицинский",
    "Кол-во": 3
  }
];

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

    const { action } = await req.json()

    if (action === 'sync-projector-data') {
      console.log('Starting projector data sync with sample data...')

      // Clear existing data
      const { error: deleteError } = await supabase
        .from('projector_floors')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError) {
        console.error('Error clearing projector data:', deleteError)
        throw deleteError
      }

      // Insert sample data
      const { error: insertError } = await supabase
        .from('projector_floors')
        .insert(sampleProjectorData)

      if (insertError) {
        console.error('Error inserting projector data:', insertError)
        throw insertError
      }

      console.log(`Inserted ${sampleProjectorData.length} projector records`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully synced ${sampleProjectorData.length} projector records`,
          inserted: sampleProjectorData.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'sync-turar-data') {
      console.log('Starting turar data sync with sample data...')

      // Clear existing data
      const { error: deleteError } = await supabase
        .from('turar_medical')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError) {
        console.error('Error clearing turar data:', deleteError)
        throw deleteError
      }

      // Insert sample data
      const { error: insertError } = await supabase
        .from('turar_medical')
        .insert(sampleTurarData)

      if (insertError) {
        console.error('Error inserting turar data:', insertError)
        throw insertError
      }

      console.log(`Inserted ${sampleTurarData.length} turar records`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully synced ${sampleTurarData.length} turar records`,
          inserted: sampleTurarData.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'sync-all') {
      console.log('Syncing all data...')

      let totalInserted = 0
      let messages = []

      // Sync projector data
      try {
        const { error: deleteError1 } = await supabase
          .from('projector_floors')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError1) {
          throw deleteError1
        }

        const { error: insertError1 } = await supabase
          .from('projector_floors')
          .insert(sampleProjectorData)

        if (insertError1) {
          throw insertError1
        }

        totalInserted += sampleProjectorData.length
        messages.push(`${sampleProjectorData.length} projector records`)
        console.log(`Inserted ${sampleProjectorData.length} projector records`)
      } catch (error) {
        console.error('Error syncing projector data:', error)
      }

      // Sync turar data
      try {
        const { error: deleteError2 } = await supabase
          .from('turar_medical')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError2) {
          throw deleteError2
        }

        const { error: insertError2 } = await supabase
          .from('turar_medical')
          .insert(sampleTurarData)

        if (insertError2) {
          throw insertError2
        }

        totalInserted += sampleTurarData.length
        messages.push(`${sampleTurarData.length} turar records`)
        console.log(`Inserted ${sampleTurarData.length} turar records`)
      } catch (error) {
        console.error('Error syncing turar data:', error)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully synced all data: ${messages.join(', ')}`,
          inserted: totalInserted
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: sync-projector-data, sync-turar-data, or sync-all' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Sync failed', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})