import { createClient } from '@supabase/supabase-js';

// Use the service role key approach - we'll use the REST API directly
const SUPABASE_URL = 'https://jecgwtvmyqirbjlbrdol.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplY2d3dHZteXFpcmJqbGJyZG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NzI0MDQsImV4cCI6MjA5MzU0ODQwNH0.g5rp_GAoTyTqcB_0Z1PtVoizyWE417Ir_AQQVFJrLAo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkRLS() {
  // Try inserting into loading_lists to see the exact error
  const { data, error } = await supabase.from('loading_lists').select('*').limit(1);
  console.log('SELECT test:', data ? 'OK' : 'FAIL', error?.message || '');
  
  // Check if we can read loading_list_items  
  const { data: d2, error: e2 } = await supabase.from('loading_list_items').select('*').limit(1);
  console.log('SELECT loading_list_items:', d2 ? 'OK' : 'FAIL', e2?.message || '');
}

checkRLS();
