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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase
    .from('profiles')
    .select('matric_number')
    .limit(1);
  
  if (error) {
    console.log("Error selecting matric_number:", error.message, error.code);
  } else {
    console.log("Success! Column exists, data:", data);
  }
}

test();
