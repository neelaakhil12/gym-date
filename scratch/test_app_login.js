async function testAppLogin() {
  const res = await fetch('http://localhost:3000/api/auth/partner/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sushmasamadam8@gmail.com',
      password: '12345678'
    })
  });
  const data = await res.json();
  console.log("App Login API Response:", JSON.stringify(data, null, 2));
}

testAppLogin();
