const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testGeocode() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const address = "D cross gym the ministry of fitness";
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  
  const res = await fetch(url);
  const data = await res.json();
  console.log(JSON.stringify(data.results[0].geometry.location, null, 2));
}
testGeocode();
