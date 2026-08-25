async function testEditGym() {
  const res = await fetch('http://localhost:3000/api/partner/edit-gym', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'sushmasamadam8@gmail.com',
      name: 'harsha fit',
      description: 'asdfgnh updated'
    })
  });
  const data = await res.json();
  console.log("Edit Gym API Response:", JSON.stringify(data, null, 2));
}

testEditGym();
