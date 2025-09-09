import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function loadJsonData(url: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Error loading JSON from ${url}:`, error)
    throw error
  }
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
      console.log('Starting projector data sync from JSON files...')

      // Load data from JSON file
      const jsonData = await loadJsonData('https://6667da30-9329-43b2-9aff-2cbae5c80f84.sandbox.lovable.dev/combined_floors.json')
      
      // Clear existing data
      const { error: deleteError } = await supabase
        .from('projector_floors')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError) {
        console.error('Error clearing projector data:', deleteError)
        throw deleteError
      }

      // Insert JSON data
      const { error: insertError } = await supabase
        .from('projector_floors')
        .insert(jsonData)

      if (insertError) {
        console.error('Error inserting projector data:', insertError)
        throw insertError
      }

      console.log(`Inserted ${jsonData.length} projector records`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully synced ${jsonData.length} projector records`,
          inserted: jsonData.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'sync-turar-data') {
      console.log('Starting turar data sync from JSON files...')

      // Load data from JSON file
      const jsonData = await loadJsonData('https://6667da30-9329-43b2-9aff-2cbae5c80f84.sandbox.lovable.dev/turar_full.json')
      
      // Clear existing data
      const { error: deleteError } = await supabase
        .from('turar_medical')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError) {
        console.error('Error clearing turar data:', deleteError)
        throw deleteError
      }

      // Insert JSON data
      const { error: insertError } = await supabase
        .from('turar_medical')
        .insert(jsonData)

      if (insertError) {
        console.error('Error inserting turar data:', insertError)
        throw insertError
      }

      console.log(`Inserted ${jsonData.length} turar records`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully synced ${jsonData.length} turar records`,
          inserted: jsonData.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'sync-all') {
      console.log('Syncing all data from JSON files...')

      let totalInserted = 0
      let messages = []

      // Sync projector data from JSON
      try {
        const projectorData = await loadJsonData('https://6667da30-9329-43b2-9aff-2cbae5c80f84.sandbox.lovable.dev/combined_floors.json')
        
        const { error: deleteError1 } = await supabase
          .from('projector_floors')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError1) {
          throw deleteError1
        }

        const { error: insertError1 } = await supabase
          .from('projector_floors')
          .insert(projectorData)

        if (insertError1) {
          throw insertError1
        }

        totalInserted += projectorData.length
        messages.push(`${projectorData.length} projector records`)
        console.log(`Inserted ${projectorData.length} projector records`)
      } catch (error) {
        console.error('Error syncing projector data:', error)
        messages.push('projector data failed')
      }

      // Sync turar data from JSON
      try {
        const turarData = await loadJsonData('https://6667da30-9329-43b2-9aff-2cbae5c80f84.sandbox.lovable.dev/turar_full.json')
        
        const { error: deleteError2 } = await supabase
          .from('turar_medical')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError2) {
          throw deleteError2
        }

        const { error: insertError2 } = await supabase
          .from('turar_medical')
          .insert(turarData)

        if (insertError2) {
          throw insertError2
        }

        totalInserted += turarData.length
        messages.push(`${turarData.length} turar records`)
        console.log(`Inserted ${turarData.length} turar records`)
      } catch (error) {
        console.error('Error syncing turar data:', error)
        messages.push('turar data failed')
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