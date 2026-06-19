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
  const profileCols = ['id', 'university_id', 'full_name', 'email', 'phone', 'avatar_url', 'verification_status', 'is_verified', 'is_admin', 'created_at', 'updated_at', 'matric_number', 'verification_code', 'otp', 'otp_code', 'otp_expires_at'];
  const reqCols = ['id', 'user_id', 'university_id', 'matric_number', 'id_card_url', 'status', 'rejection_reason', 'reviewed_at', 'created_at', 'updated_at', 'otp', 'verification_code', 'otp_code', 'otp_expires_at', 'document_type', 'document_url'];

  console.log("--- Testing Profiles Columns ---");
  for (const c of profileCols) {
    const { error } = await supabase.from('profiles').select(c).limit(1);
    if (error && error.code === 'PGRST205') {
      console.log(`Column profiles.${c}: DOES NOT EXIST`);
    } else if (error) {
      console.log(`Column profiles.${c}: exists (query returned error: ${error.message} [${error.code}])`);
    } else {
      console.log(`Column profiles.${c}: EXISTS`);
    }
  }

  console.log("--- Testing Verification Requests Columns ---");
  for (const c of reqCols) {
    const { error } = await supabase.from('verification_requests').select(c).limit(1);
    if (error && error.code === 'PGRST205') {
      console.log(`Column verification_requests.${c}: DOES NOT EXIST`);
    } else if (error) {
      console.log(`Column verification_requests.${c}: exists (query returned error: ${error.message} [${error.code}])`);
    } else {
      console.log(`Column verification_requests.${c}: EXISTS`);
    }
  }
}

test();
