const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupWalletTables() {
  console.log('Creating Wallet and Payout tables...');
  
  // Note: We use raw RPC if possible, but since we are using JS client, we hope the tables exist or we create them.
  // In a real scenario, this would be a SQL migration.
  
  // Since I can't run arbitrary SQL easily without a defined RPC, I'll check if they exist first.
  // If not, I'll provide the SQL to the user or try to insert dummy data to "force" creation if the DB allows (unlikely with RLS).
  
  // Assuming the user will run this SQL in their dashboard:
  /*
    CREATE TABLE wallets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
      balance NUMERIC DEFAULT 0,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE payout_requests (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
      amount NUMERIC NOT NULL,
      bank_name TEXT NOT NULL,
      account_holder TEXT NOT NULL,
      account_number TEXT NOT NULL,
      ifsc_code TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Enable RLS
    ALTER TABLE wallets ENABLE CONTROL;
    ALTER TABLE payout_requests ENABLE CONTROL;
  */
  
  console.log('Setup script finished. Please ensure the tables exist in Supabase.');
}

setupWalletTables();
