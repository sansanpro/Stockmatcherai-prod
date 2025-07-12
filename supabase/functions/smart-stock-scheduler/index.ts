import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SectorInfo {
  sector: string;
  oldestUpdate: string | null;
  hoursOld: number;
  needsUpdate: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting smart stock scheduler check...');

    // Check data age for each sector
    const sectors = ['technology', 'healthcare', 'finance', 'energy', 'consumer', 'utilities'];
    const sectorInfo: SectorInfo[] = [];
    const sectorsToUpdate: string[] = [];

    for (const sector of sectors) {
      try {
        const tableName = `${sector}_stocks`;
        
        // Get the oldest last_updated timestamp for this sector
        const { data, error } = await supabase
          .from(tableName)
          .select('last_updated')
          .order('last_updated', { ascending: true })
          .limit(1);

        if (error) {
          console.error(`Error checking ${sector} sector:`, error);
          continue;
        }

        const oldestUpdate = data?.[0]?.last_updated;
        let hoursOld = 0;
        let needsUpdate = false;

        if (oldestUpdate) {
          const lastUpdateTime = new Date(oldestUpdate);
          const now = new Date();
          hoursOld = (now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
          needsUpdate = hoursOld >= 18; // Update if data is 18+ hours old
        } else {
          // No last_updated data, definitely needs update
          needsUpdate = true;
          hoursOld = 999;
        }

        const info: SectorInfo = {
          sector,
          oldestUpdate,
          hoursOld: Math.round(hoursOld * 100) / 100, // Round to 2 decimal places
          needsUpdate
        };

        sectorInfo.push(info);

        if (needsUpdate) {
          sectorsToUpdate.push(sector);
        }

        console.log(`${sector.toUpperCase()}: ${hoursOld.toFixed(1)}h old, needs update: ${needsUpdate}`);

      } catch (error) {
        console.error(`Error processing ${sector}:`, error);
      }
    }

    // If any sectors need updating, trigger the update function
    const updateResults = [];
    if (sectorsToUpdate.length > 0) {
      console.log(`Triggering updates for sectors: ${sectorsToUpdate.join(', ')}`);

      for (const sector of sectorsToUpdate) {
        try {
          console.log(`Updating ${sector} sector...`);
          
          const updateResponse = await fetch(`${supabaseUrl}/functions/v1/update-stock-data`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sector,
              update_type: 'smart_scheduled',
              priority: false
            }),
          });

          const result = await updateResponse.json();
          updateResults.push({
            sector,
            success: updateResponse.ok,
            result
          });

          console.log(`${sector} update result:`, result);

          // Rate limiting between sector updates
          if (sectorsToUpdate.indexOf(sector) < sectorsToUpdate.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

        } catch (error) {
          console.error(`Failed to update ${sector}:`, error);
          updateResults.push({
            sector,
            success: false,
            error: error.message
          });
        }
      }
    } else {
      console.log('All sectors have fresh data (< 18 hours old)');
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      sectorsChecked: sectors.length,
      sectorsNeedingUpdate: sectorsToUpdate.length,
      sectorsUpdated: updateResults.length,
      sectorInfo,
      updateResults,
      message: sectorsToUpdate.length > 0 
        ? `Updated ${sectorsToUpdate.length} sectors with stale data`
        : 'All sectors have fresh data'
    };

    console.log('Smart scheduler completed:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Smart scheduler error:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});