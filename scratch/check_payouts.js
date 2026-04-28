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

async function checkPayoutData() {
  const { data, error } = await supabase
    .from('payout_requests')
    .select('*');
  
  if (error) {
    console.error(error);
  } else {
    console.log('Payout Requests found:', data.length);
    data.forEach(d => {
      console.log('Request ID:', d.id);
      console.log('Amount:', d.amount);
      console.log('Bank:', d.bank_name);
      console.log('Holder:', d.account_holder);
      console.log('Number:', d.account_number);
      console.log('IFSC:', d.ifsc_code);
    });
  }
}

checkPayoutData();
