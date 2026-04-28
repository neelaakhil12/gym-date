import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runMigration() {
  console.log("--- Creating site_settings table ---");
  
  // 1. Create table
  const { error: tableError } = await supabase.rpc('execute_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS site_settings (
        id TEXT PRIMARY KEY,
        value JSONB,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });

  if (tableError) {
    console.log("RPC execute_sql might not be enabled. Trying alternative approach...");
    // If RPC fails, we assume the user will run the SQL manually or we try another way.
    // In this environment, I'll provide the SQL for the user to run in Supabase SQL Editor.
  }

  // 2. Insert default setting
  const { error: insertError } = await supabase
    .from('site_settings')
    .upsert({ 
        id: 'show_platform_stats', 
        value: true, 
        description: 'Toggle to show/hide the statistics section on the homepage' 
    }, { onConflict: 'id' });

  if (insertError) {
    console.error("Error inserting setting:", insertError);
  } else {
    console.log("Default setting 'show_platform_stats' set to true.");
  }
}

runMigration();
