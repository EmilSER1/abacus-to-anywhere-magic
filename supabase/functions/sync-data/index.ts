import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Тестовые данные в формате реальных JSON файлов
const sampleProjectorData = [
  {
    "ЭТАЖ": 1.0,
    "БЛОК": "В",
    "ОТДЕЛЕНИЕ": "Экстренное приемное отделение",
    "КОД ПОМЕЩЕНИЯ": "1.EMR-01",
    "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": "Тамбур",
    "Код помещения": "1.EMR-01",
    "Наименование помещения": "Тамбур",
    "Площадь (м2)": 20.43,
    "Код оборудования": "TEST-001",
    "Наименование оборудования": "Тестовое оборудование",
    "Ед. изм.": "шт.",
    "Кол-во": "1",
    "Примечания": "Тестовая запись"
  },
  {
    "ЭТАЖ": 1.0,
    "БЛОК": "В", 
    "ОТДЕЛЕНИЕ": "Экстренное приемное отделение",
    "КОД ПОМЕЩЕНИЯ": "1.EMR-02",
    "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": "Приемная",
    "Код помещения": "1.EMR-02",
    "Наименование помещения": "Приемная",
    "Площадь (м2)": 35.5,
    "Код оборудования": "TEST-002",
    "Наименование оборудования": "Другое оборудование",
    "Ед. изм.": "шт.",
    "Кол-во": "2",
    "Примечания": null
  }
];

const sampleTurarData = [
  {
    "Отделение/Блок": "Травмпункт",
    "Помещение/Кабинет": "помещение/ниша для кресло-колясок, каталок",
    "Код оборудования": "11-320",
    "Наименование": "Каталка медицинская больничная",
    "Кол-во": 2
  },
  {
    "Отделение/Блок": "Травмпункт",
    "Помещение/Кабинет": "помещение/ниша для кресло-колясок, каталок",
    "Код оборудования": "11-321",
    "Наименование": "Кресло-коляска больничная",
    "Кол-во": 2
  }
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client with user's auth token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Invalid authentication token:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has admin role
    const { data: userRole, error: roleError } = await supabase.rpc('get_user_primary_role', { _user_id: user.id });
    
    if (roleError || userRole !== 'admin') {
      console.error('Access denied. User role:', userRole, 'Error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated admin user:', user.email);

    // Use service role key for data operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action } = await req.json()

    if (action === 'sync-projector-data') {
      console.log('Starting projector data sync by admin:', user.email)

      try {
        console.log(`Using ${sampleProjectorData.length} sample projector records`)
        
        // Clear existing data
        const { error: deleteError } = await supabaseAdmin
          .from('projector_floors')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError) {
          console.error('Error clearing projector data:', deleteError)
          throw deleteError
        }

        // Insert sample data
        const { error: insertError } = await supabaseAdmin
          .from('projector_floors')
          .insert(sampleProjectorData)

        if (insertError) {
          console.error('Error inserting projector data:', insertError)
          throw insertError
        }

        console.log(`Successfully inserted ${sampleProjectorData.length} projector records`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Successfully synced ${sampleProjectorData.length} projector records`,
            inserted: sampleProjectorData.length 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('Error in projector sync:', error)
        throw error
      }
    }

    if (action === 'sync-turar-data') {
      console.log('Starting turar data sync by admin:', user.email)

      try {
        console.log(`Using ${sampleTurarData.length} sample turar records`)
        
        // Clear existing data
        const { error: deleteError } = await supabaseAdmin
          .from('turar_medical')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError) {
          console.error('Error clearing turar data:', deleteError)
          throw deleteError
        }

        // Insert sample data
        const { error: insertError } = await supabaseAdmin
          .from('turar_medical')
          .insert(sampleTurarData)

        if (insertError) {
          console.error('Error inserting turar data:', insertError)
          throw insertError
        }

        console.log(`Successfully inserted ${sampleTurarData.length} turar records`)

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Successfully synced ${sampleTurarData.length} turar records`,
            inserted: sampleTurarData.length 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('Error in turar sync:', error)
        throw error
      }
    }

    if (action === 'sync-all') {
      console.log('Syncing all sample data by admin:', user.email)

      let totalInserted = 0
      let messages = []

      // Sync projector data
      try {
        const { error: deleteError1 } = await supabaseAdmin
          .from('projector_floors')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError1) {
          throw deleteError1
        }

        const { error: insertError1 } = await supabaseAdmin
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
        messages.push('projector data failed')
      }

      // Sync turar data
      try {
        const { error: deleteError2 } = await supabaseAdmin
          .from('turar_medical')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (deleteError2) {
          throw deleteError2
        }

        const { error: insertError2 } = await supabaseAdmin
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