const { createClient } = require('c:/Users/Destiny Onoja/Desktop/younimart/node_modules/@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('c:/Users/Destiny Onoja/Desktop/younimart/.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables!", env);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  console.log("Checking tables...");
  
  // Try querying profiles
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (profileError) {
    console.error("Error fetching from profiles:", profileError);
  } else {
    console.log("Profiles columns:", Object.keys(profileData[0] || {}));
    console.log("Profiles sample:", profileData[0]);
  }

  // Try querying verification_requests
  const { data: reqData, error: reqError } = await supabase
    .from('verification_requests')
    .select('*')
    .limit(1);

  if (reqError) {
    console.error("Error fetching from verification_requests:", reqError);
  } else {
    console.log("verification_requests columns:", Object.keys(reqData[0] || {}));
    console.log("verification_requests sample:", reqData[0]);
  }

  // Try querying universities
  const { data: uniData, error: uniError } = await supabase
    .from('universities')
    .select('*')
    .limit(1);

  if (uniError) {
    console.error("Error fetching from universities:", uniError);
  } else {
    console.log("universities columns:", Object.keys(uniData[0] || {}));
    console.log("universities sample:", uniData[0]);
  }
}

inspect();
