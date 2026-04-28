// No require needed for fetch in modern Node
require('dotenv').config({ path: '.env.local' });

async function testGoogleMaps() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const address = "Hyderabad, India";
  
  console.log("Testing API Key:", apiKey);
  
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log("-----------------------------------------");
    console.log("GOOGLE RESPONSE STATUS:", data.status);
    if (data.error_message) {
      console.log("ERROR MESSAGE:", data.error_message);
    }
    console.log("-----------------------------------------");
    
    if (data.status === "OK") {
      console.log("SUCCESS! Your API is working correctly.");
    } else if (data.status === "REQUEST_DENIED") {
      console.log("ACTION NEEDED: Google is still denying the request.");
    }
  } catch (error) {
    console.error("Fetch Error:", error.message);
  }
}

testGoogleMaps();
