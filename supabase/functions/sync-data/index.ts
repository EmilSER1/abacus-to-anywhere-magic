import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FloorData {
  "ЭТАЖ": number;
  "БЛОК": string;
  "ОТДЕЛЕНИЕ": string;
  "КОД ПОМЕЩЕНИЯ": string;
  "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": string;
  "Код помещения": string;
  "Наименование помещения": string;
  "Площадь (м2)": number;
  "Код оборудования": string | null;
  "Наименование оборудования": string | null;
  "Ед. изм.": string | null;
  "Кол-во": number | string | null;
  "Примечания": string | null;
}

interface TurarData {
  "Отделение/Блок": string;
  "Помещение/Кабинет": string;
  "Код оборудования": string;
  "Наименование": string;
  "Кол-во": number;
}

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
      console.log('Starting projector data sync...')
      
      // Fetch JSON data from public URL
      const response = await fetch(`${supabaseUrl.replace('//', '//').replace('supabase.co', 'supabase.co')}/storage/v1/object/public/combined_floors.json`)
      
      if (!response.ok) {
        // Try alternative URL
        const altResponse = await fetch(`${supabaseUrl}/storage/v1/object/public/data/combined_floors.json`)
        if (!altResponse.ok) {
          throw new Error(`Failed to fetch projector data: ${response.status}`)
        }
        var jsonData: FloorData[] = await altResponse.json()
      } else {
        var jsonData: FloorData[] = await response.json()
      }

      console.log(`Loaded ${jsonData.length} projector records`)

      // Clear existing data
      const { error: deleteError } = await supabase
        .from('projector_equipment')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (deleteError) {
        console.error('Error clearing projector data:', deleteError)
        throw deleteError
      }

      // Transform and insert data in batches
      const batchSize = 1000
      let inserted = 0

      for (let i = 0; i < jsonData.length; i += batchSize) {
        const batch = jsonData.slice(i, i + batchSize)
        
        const transformedBatch = batch.map(item => ({
          code: item["Код оборудования"] || '',
          name: item["Наименование оборудования"] || '',
          quantity: typeof item["Кол-во"] === 'number' ? item["Кол-во"] : parseInt(String(item["Кол-во"])) || 0,
          department: item["ОТДЕЛЕНИЕ"],
          room: item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"],
          floor: String(item["ЭТАЖ"]),
          block: item["БЛОК"],
          room_code: item["КОД ПОМЕЩЕНИЯ"],
          room_name: item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"],
          area_m2: item["Площадь (м2)"] || 0,
          unit: item["Ед. изм."],
          notes: item["Примечания"]
        }))

        const { error: insertError } = await supabase
          .from('projector_equipment')
          .insert(transformedBatch)

        if (insertError) {
          console.error(`Error inserting projector batch ${i}:`, insertError)
          throw insertError
        }

        inserted += transformedBatch.length
        console.log(`Inserted ${inserted}/${jsonData.length} projector records`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully synced ${inserted} projector records`,
          inserted 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'sync-turar-data') {
      console.log('Starting turar data sync...')
      
      // Fetch JSON data from public URL
      const response = await fetch(`${supabaseUrl}/storage/v1/object/public/turar_full.json`)
      
      if (!response.ok) {
        // Try alternative URL
        const altResponse = await fetch(`${supabaseUrl}/storage/v1/object/public/data/turar_full.json`)
        if (!altResponse.ok) {
          throw new Error(`Failed to fetch turar data: ${response.status}`)
        }
        var jsonData: TurarData[] = await altResponse.json()
      } else {
        var jsonData: TurarData[] = await response.json()
      }

      console.log(`Loaded ${jsonData.length} turar records`)

      // Clear existing data
      const { error: deleteError } = await supabase
        .from('turar_equipment')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

      if (deleteError) {
        console.error('Error clearing turar data:', deleteError)
        throw deleteError
      }

      // Transform and insert data in batches
      const batchSize = 1000
      let inserted = 0

      for (let i = 0; i < jsonData.length; i += batchSize) {
        const batch = jsonData.slice(i, i + batchSize)
        
        const transformedBatch = batch.map(item => ({
          code: item["Код оборудования"],
          name: item["Наименование"],
          quantity: item["Кол-во"],
          department: item["Отделение/Блок"],
          room: item["Помещение/Кабинет"]
        }))

        const { error: insertError } = await supabase
          .from('turar_equipment')
          .insert(transformedBatch)

        if (insertError) {
          console.error(`Error inserting turar batch ${i}:`, insertError)
          throw insertError
        }

        inserted += transformedBatch.length
        console.log(`Inserted ${inserted}/${jsonData.length} turar records`)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully synced ${inserted} turar records`,
          inserted 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'sync-all') {
      // Sync both datasets
      const projectorResponse = await fetch(req.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-projector-data' })
      })
      const projectorResult = await projectorResponse.json()

      const turarResponse = await fetch(req.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync-turar-data' })
      })
      const turarResult = await turarResponse.json()

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Successfully synced all data',
          projector: projectorResult,
          turar: turarResult
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