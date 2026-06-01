import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const dummy = {
    user_id: 'c9f9af4a-5c78-4b90-aeef-7bb367cd0168',
    title: 'test',
    message: 'test',
    is_read: false,
    created_at: new Date().toISOString(),
    foobar: 'hello'
  };
  const { data, error } = await supabase.from('notifications').insert(dummy).select();
  if (error) {
    console.error("Error inserting:", error);
  } else {
    console.log("Data:", data);
  }
}
run();
