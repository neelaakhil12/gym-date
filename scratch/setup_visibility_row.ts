import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VISIBILITY_ID = '00000000-0000-0000-0000-000000000000';

async function setupVisibility() {
  console.log("--- Setting up Section Visibility Row ---");
  
  const { data, error } = await supabase
    .from('platform_stats')
    .upsert({ 
        id: VISIBILITY_ID,
        label: 'Section Visibility',
        value: 'true',
        display_order: 999 // Put it at the end
    }, { onConflict: 'id' });

  if (error) {
    console.error("Error setting up visibility row:", error);
  } else {
    console.log("Visibility row created successfully.");
  }
}

setupVisibility();
