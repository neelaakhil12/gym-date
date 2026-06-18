const http = require('https');

function testOptions() {
  const req = http.request({
    hostname: 'gymdate.in',
    port: 443,
    path: '/api/user/sync-profile',
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:8081',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type',
    }
  }, (res) => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', res.headers);
  });

  req.on('error', (e) => {
    console.error('Error:', e.message);
  });

  req.end();
}

testOptions();
