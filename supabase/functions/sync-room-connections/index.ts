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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting simple room connections sync...');

    // Получаем существующие связи комнат
    const { data: existingConnections, error: existingError } = await supabaseClient
      .from('room_connections')
      .select('projector_department, projector_room, turar_department, turar_room');

    if (existingError) {
      console.error('Error fetching existing connections:', existingError);
      throw existingError;
    }

    console.log(`Found ${existingConnections?.length || 0} existing room connections`);

    // Создаем Set для быстрой проверки
    const existingSet = new Set(
      existingConnections?.map(conn => 
        `${conn.projector_department}|${conn.projector_room}|${conn.turar_department}|${conn.turar_room}`
      ) || []
    );

    // Получаем данные из projector_floors с связями отделений
    const { data: projectorData, error: projectorError } = await supabaseClient
      .from('projector_floors')
      .select(`
        "ОТДЕЛЕНИЕ",
        "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ", 
        connected_turar_department,
        id
      `)
      .not('connected_turar_department', 'is', null)
      .limit(500); // Ограничиваем для начала

    if (projectorError) {
      console.error('Error fetching projector data:', projectorError);
      throw projectorError;
    }

    console.log(`Found ${projectorData?.length || 0} projector records with turar connections`);

    // Получаем данные комнат из turar_medical
    const { data: turarData, error: turarError } = await supabaseClient
      .from('turar_medical')
      .select(`
        "Отделение/Блок",
        "Помещение/Кабинет",
        id
      `);

    if (turarError) {
      console.error('Error fetching turar data:', turarError);
      throw turarError;
    }

    console.log(`Found ${turarData?.length || 0} turar room records`);

    // Создаем новые связи
    const newConnections: any[] = [];
    let skippedCount = 0;

    // Группируем projector данные по комнатам
    const projectorRooms = new Map<string, any>();
    projectorData?.forEach(item => {
      const key = `${item["ОТДЕЛЕНИЕ"]}|${item["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]}`;
      if (!projectorRooms.has(key)) {
        projectorRooms.set(key, item);
      }
    });

    console.log(`Processing ${projectorRooms.size} unique projector rooms`);

    // Для каждой комнаты проектировщиков создаем связи с комнатами Турар
    for (const [roomKey, projectorRoom] of projectorRooms) {
      const [projectorDept, projectorRoomName] = roomKey.split('|');
      
      // Находим первую подходящую комнату в соответствующем отделении Турар
      const matchingTurarRoom = turarData?.find(turarRoom => 
        turarRoom["Отделение/Блок"] === projectorRoom.connected_turar_department
      );

      if (matchingTurarRoom) {
        const connectionKey = `${projectorDept}|${projectorRoomName}|${projectorRoom.connected_turar_department}|${matchingTurarRoom["Помещение/Кабинет"]}`;
        
        if (!existingSet.has(connectionKey)) {
          newConnections.push({
            projector_department: projectorDept,
            projector_room: projectorRoomName,
            turar_department: projectorRoom.connected_turar_department,
            turar_room: matchingTurarRoom["Помещение/Кабинет"],
            projector_room_id: projectorRoom.id,
            turar_room_id: matchingTurarRoom.id
          });
        } else {
          skippedCount++;
        }
      }

      // Ограничиваем количество для первого запуска
      if (newConnections.length >= 200) {
        break;
      }
    }

    console.log(`Prepared ${newConnections.length} new connections`);

    // Вставляем новые связи
    let insertedCount = 0;
    if (newConnections.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('room_connections')
        .insert(newConnections);

      if (insertError) {
        console.error('Error inserting connections:', insertError);
        throw insertError;
      }
      insertedCount = newConnections.length;
    }

    const result = {
      success: true,
      message: `Successfully created ${insertedCount} new room connections`,
      details: {
        newConnectionsCreated: insertedCount,
        existingConnectionsSkipped: skippedCount,
        totalProjectorRooms: projectorRooms.size,
        totalTurarRooms: turarData?.length || 0
      }
    };

    console.log('Simple room connections sync completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in sync-room-connections:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
})