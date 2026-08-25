async function test() {
  const payload = {
    userTerms: "# TEST LONG TERMS\n\n" + "A".repeat(25000),
    partnerTerms: "# TEST LONG PARTNER TERMS\n\n" + "B".repeat(25000)
  };
  const res = await fetch("https://gymdate.in/api/terms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log("RESPONSE:", data);
}

test().catch(console.error);
