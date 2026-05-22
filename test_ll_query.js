import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('loading_lists').select('*, loading_list_items(*)').limit(1);
  console.log("Data:", JSON.stringify(data, null, 2));
  if (error) console.log("Error:", error);
}
run();
