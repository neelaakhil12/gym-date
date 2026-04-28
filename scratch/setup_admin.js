const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupMasterAdmin() {
  const email = 'santoedgepvtltd@gmail.com';
  const password = 'AdminPassword123!'; // Temp password

  console.log(`Setting up master admin: ${email}`);

  // 1. Create user in Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('User already exists in Auth.');
    } else {
      console.error('Auth Error:', authError);
      return;
    }
  }

  const userId = authData?.user?.id;

  // 2. Fetch user ID if they already existed
  let finalId = userId;
  if (!finalId) {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users.users.find(u => u.email === email);
    if (existingUser) finalId = existingUser.id;
  }

  if (!finalId) {
    console.error('Could not determine User ID.');
    return;
  }

  // 3. Set role to super_admin in profiles
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: finalId,
      email: email,
      role_id: 'super_admin'
    });

  if (profileError) {
    console.error('Profile Error:', profileError);
  } else {
    console.log('SUCCESS! Account created and promoted to Super Admin.');
    console.log('--------------------------------------------------');
    console.log(`Email: ${email}`);
    console.log(`Temporary Password: ${password}`);
    console.log('--------------------------------------------------');
  }
}

setupMasterAdmin();
