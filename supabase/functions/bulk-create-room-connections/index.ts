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

    console.log('Starting bulk room connections creation...');

    // Получаем все записи из projector_floors с связями отделений
    const { data: projectorFloors, error: projectorError } = await supabaseClient
      .from('projector_floors')
      .select(`
        id,
        "ОТДЕЛЕНИЕ",
        "НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ",
        connected_turar_department
      `)
      .not('connected_turar_department', 'is', null);

    if (projectorError) {
      console.error('Error fetching projector floors:', projectorError);
      throw projectorError;
    }

    console.log(`Found ${projectorFloors?.length || 0} projector floor records with turar department connections`);

    // Получаем все комнаты из turar_medical для сопоставления
    const { data: turarRooms, error: turarError } = await supabaseClient
      .from('turar_medical')
      .select(`
        id,
        "Отделение/Блок",
        "Помещение/Кабинет"
      `);

    if (turarError) {
      console.error('Error fetching turar rooms:', turarError);
      throw turarError;
    }

    console.log(`Found ${turarRooms?.length || 0} turar room records`);

    // Проверяем существующие связи комнат
    const { data: existingConnections, error: connectionsError } = await supabaseClient
      .from('room_connections')
      .select('projector_department, projector_room, turar_department, turar_room');

    if (connectionsError) {
      console.error('Error fetching existing connections:', connectionsError);
      throw connectionsError;
    }

    console.log(`Found ${existingConnections?.length || 0} existing room connections`);

    // Создаем Set для быстрой проверки существующих связей
    const existingConnectionsSet = new Set(
      existingConnections?.map(conn => 
        `${conn.projector_department}|${conn.projector_room}|${conn.turar_department}|${conn.turar_room}`
      ) || []
    );

    // Группируем projector floors по отделениям и комнатам
    const projectorRoomGroups = new Map<string, Array<any>>();
    projectorFloors?.forEach(floor => {
      const key = `${floor["ОТДЕЛЕНИЕ"]}|${floor["НАИМЕНОВАНИЕ ПОМЕЩЕНИЯ"]}`;
      if (!projectorRoomGroups.has(key)) {
        projectorRoomGroups.set(key, []);
      }
      projectorRoomGroups.get(key)!.push(floor);
    });

    console.log(`Grouped into ${projectorRoomGroups.size} unique projector rooms`);

    // Создаем новые связи
    const newConnections: any[] = [];
    let skippedCount = 0;
    let processedCount = 0;

    for (const [roomKey, floors] of projectorRoomGroups) {
      const [projectorDept, projectorRoom] = roomKey.split('|');
      const turarDepartment = floors[0].connected_turar_department;
      
      // Находим все комнаты в соответствующем отделении Турар
      const matchingTurarRooms = turarRooms?.filter(room => 
        room["Отделение/Блок"] === turarDepartment
      ) || [];

      processedCount++;
      
      // Создаем связи с первыми несколькими комнатами (чтобы не создавать слишком много связей)
      const roomsToConnect = matchingTurarRooms.slice(0, 3); // Максимум 3 связи на комнату проектировщиков
      
      for (const turarRoom of roomsToConnect) {
        const connectionKey = `${projectorDept}|${projectorRoom}|${turarDepartment}|${turarRoom["Помещение/Кабинет"]}`;
        
        // Проверяем, не существует ли уже такая связь
        if (!existingConnectionsSet.has(connectionKey)) {
          newConnections.push({
            projector_department: projectorDept,
            projector_room: projectorRoom,
            turar_department: turarDepartment,
            turar_room: turarRoom["Помещение/Кабинет"],
            projector_room_id: floors[0].id,
            turar_room_id: turarRoom.id
          });
        } else {
          skippedCount++;
        }
      }

      // Логирование прогресса каждые 100 записей
      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount}/${projectorRoomGroups.size} rooms, created ${newConnections.length} connections, skipped ${skippedCount}`);
      }
    }

    console.log(`Prepared ${newConnections.length} new connections to create`);
    console.log(`Skipped ${skippedCount} existing connections`);

    // Вставляем новые связи пакетами по 100
    let insertedCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < newConnections.length; i += batchSize) {
      const batch = newConnections.slice(i, i + batchSize);
      
      const { error: insertError } = await supabaseClient
        .from('room_connections')
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, insertError);
        throw insertError;
      }

      insertedCount += batch.length;
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}, total inserted: ${insertedCount}/${newConnections.length}`);
    }

    const result = {
      success: true,
      message: `Successfully created ${insertedCount} new room connections`,
      details: {
        totalProjectorRooms: projectorRoomGroups.size,
        newConnectionsCreated: insertedCount,
        existingConnectionsSkipped: skippedCount,
        totalProcessed: processedCount
      }
    };

    console.log('Bulk room connections creation completed:', result);

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
    console.error('Error in bulk-create-room-connections:', error);
    
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