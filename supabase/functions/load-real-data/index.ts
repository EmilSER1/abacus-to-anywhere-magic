import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Реальные данные из JSON файлов (первые 20 записей для демонстрации)
const realProjectorData = [
  {
    "ЭТАЖ": 1.0,
    "БЛОК": "В",
    "ОТДЕЛЕНИЕ": "Экстренное приемное отделение ",
    "КОД ПОМЕЩЕНИЯ": "1.EMR-01",
    "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": "Тамбур",
    "Код помещения": "1.EMR-01",
    "Наименование помещения": "Тамбур",
    "Площадь (м2)": 20.43,
    "Код оборудования": null,
    "Наименование оборудования": null,
    "Ед. изм.": null,
    "Кол-во": null,
    "Примечания": null
  },
  {
    "ЭТАЖ": 1.0,
    "БЛОК": "В",
    "ОТДЕЛЕНИЕ": "Экстренное приемное отделение ",
    "КОД ПОМЕЩЕНИЯ": "1.EMR-02",
    "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": "Вестибюль",
    "Код помещения": "1.EMR-02",
    "Наименование помещения": "Вестибюль",
    "Площадь (м2)": 291.89,
    "Код оборудования": 74,
    "Наименование оборудования": "Стул для ожидания",
    "Ед. изм.": "шт.",
    "Кол-во": 15,
    "Примечания": null
  },
  {
    "ЭТАЖ": 1.0,
    "БЛОК": "В",
    "ОТДЕЛЕНИЕ": "Экстренное приемное отделение ",
    "КОД ПОМЕЩЕНИЯ": "1.EMR-02",
    "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": "Вестибюль",
    "Код помещения": "1.EMR-02",
    "Наименование помещения": "Вестибюль",
    "Площадь (м2)": 291.89,
    "Код оборудования": null,
    "Наименование оборудования": "Мусорное ведро",
    "Ед. изм.": "шт.",
    "Кол-во": 1,
    "Примечания": null
  },
  {
    "ЭТАЖ": 1.0,
    "БЛОК": "В",
    "ОТДЕЛЕНИЕ": "Экстренное приемное отделение ",
    "КОД ПОМЕЩЕНИЯ": "1.EMR-03",
    "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": "Кладовая чистого белья",
    "Код помещения": "1.EMR-03",
    "Наименование помещения": "Кладовая чистого белья",
    "Площадь (м2)": 4.16,
    "Код оборудования": "M-936",
    "Наименование оборудования": "Стеллаж стальной (без колес)",
    "Ед. изм.": "шт.",
    "Кол-во": 1,
    "Примечания": null
  },
  {
    "ЭТАЖ": 1.0,
    "БЛОК": "В",
    "ОТДЕЛЕНИЕ": "Экстренное приемное отделение ",
    "КОД ПОМЕЩЕНИЯ": "1.EMR-04",
    "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ": "Диспетчерская",
    "Код помещения": "1.EMR-04",
    "Наименование помещения": "Диспетчерская",
    "Площадь (м2)": 18.45,
    "Код оборудования": 1018,
    "Наименование оборудования": "Моноблочный ПК",
    "Ед. изм.": "шт.",
    "Кол-во": 1,
    "Примечания": null
  }
];

const realTurarData = [
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
  },
  {
    "Отделение/Блок": "Травмпункт",
    "Помещение/Кабинет": "кабинет заведующего травмпунктом",
    "Код оборудования": "11-002",
    "Наименование": "оборудование для очистки и/или обеззараживания воздуха",
    "Кол-во": 1
  },
  {
    "Отделение/Блок": "Травмпункт",
    "Помещение/Кабинет": "ординаторская",
    "Код оборудования": "11-002",
    "Наименование": "оборудование для очистки и/или обеззараживания воздуха",
    "Кол-во": 1
  },
  {
    "Отделение/Блок": "Травмпункт",
    "Помещение/Кабинет": "сестринская",
    "Код оборудования": "11-002",
    "Наименование": "оборудование для очистки и/или обеззараживания воздуха",
    "Кол-во": 1
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

    if (action === 'load-projector-batch') {
      console.log('Loading real projector data by admin:', user.email)

      // Clear existing data
      const { error: deleteError } = await supabaseAdmin
        .from('projector_floors')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError) {
        console.error('Error clearing projector data:', deleteError)
        throw deleteError
      }

      // Insert real data
      const { error: insertError } = await supabaseAdmin
        .from('projector_floors')
        .insert(realProjectorData)

      if (insertError) {
        console.error('Error inserting projector data:', insertError)
        throw insertError
      }

      console.log(`Inserted ${realProjectorData.length} real projector records`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Loaded ${realProjectorData.length} real projector records`,
          inserted: realProjectorData.length,
          hasMore: false,
          totalLoaded: realProjectorData.length,
          totalAvailable: realProjectorData.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'load-turar-batch') {
      console.log('Loading real turar data by admin:', user.email)

      // Clear existing data
      const { error: deleteError } = await supabaseAdmin
        .from('turar_medical')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError) {
        console.error('Error clearing turar data:', deleteError)
        throw deleteError
      }

      // Insert real data
      const { error: insertError } = await supabaseAdmin
        .from('turar_medical')
        .insert(realTurarData)

      if (insertError) {
        console.error('Error inserting turar data:', insertError)
        throw insertError
      }

      console.log(`Inserted ${realTurarData.length} real turar records`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Loaded ${realTurarData.length} real turar records`,
          inserted: realTurarData.length,
          hasMore: false,
          totalLoaded: realTurarData.length,
          totalAvailable: realTurarData.length
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