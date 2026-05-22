const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}=(.*)`));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function register(email, password, fullName) {
  console.log(`Registering ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        is_onboarded: true
      }
    }
  });

  if (error) {
    console.error(`Failed to register ${email}:`, error.message);
  } else {
    console.log(`Successfully registered ${email}! User ID: ${data.user?.id || 'Unknown'}`);
  }
}

async function run() {
  await register('appreview@chana.com', 'AppReview123!', 'App Reviewer');
  await register('apple@chana.com', 'AppReview123!', 'App Reviewer');
  console.log('Done!');
}

run();
