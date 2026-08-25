const { DEFAULT_USER_TERMS, DEFAULT_PARTNER_TERMS } = require("./src/lib/termsData.ts");
// Using the api directly
async function restoreRealTerms() {
  const payload = {
    userTerms: DEFAULT_USER_TERMS,
    partnerTerms: DEFAULT_PARTNER_TERMS
  };
  const res = await fetch("https://gymdate.in/api/terms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  console.log("RESTORED_REAL_TERMS:", data);
}

restoreRealTerms().catch(console.error);
