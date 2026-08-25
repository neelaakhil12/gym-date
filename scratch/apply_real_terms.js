const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'gymdate_user',
  password: 'GymDate@DB2024!',
  database: 'gymdate_db',
});

// Load the compiled termsData or direct definitions
const fs = require('fs');
const path = require('path');

const termsFile = fs.readFileSync(path.join(__dirname, 'src/lib/termsData.ts'), 'utf8');

const userTermsMatch = termsFile.match(/export const DEFAULT_USER_TERMS = `([\s\S]*?)`;/);
const partnerTermsMatch = termsFile.match(/export const DEFAULT_PARTNER_TERMS = `([\s\S]*?)`;/);

const userTerms = userTermsMatch ? userTermsMatch[1] : '';
const partnerTerms = partnerTermsMatch ? partnerTermsMatch[1] : '';

async function run() {
  console.log("Saving real User Terms (length: " + userTerms.length + ")...");
  console.log("Saving real Partner Terms (length: " + partnerTerms.length + ")...");

  await pool.query(`
    INSERT INTO platform_config (key, value, description)
    VALUES ('user_terms_conditions', $1, 'User terms and conditions')
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, description = EXCLUDED.description
  `, [userTerms]);

  await pool.query(`
    INSERT INTO platform_config (key, value, description)
    VALUES ('partner_terms_conditions', $1, 'Partner terms and conditions')
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, description = EXCLUDED.description
  `, [partnerTerms]);

  await pool.query(`
    INSERT INTO platform_config (key, value, description)
    VALUES ('terms_updated_at', '24 August 2026', 'Terms updated at date')
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, description = EXCLUDED.description
  `);

  console.log("SUCCESSFULLY SAVED REAL TERMS IN DATABASE!");
  await pool.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
