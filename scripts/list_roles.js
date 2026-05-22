import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jecgwtvmyqirbjlbrdol.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplY2d3dHZteXFpcmJqbGJyZG9sIiwibm9uZSI6ImFub24iLCJpYXQiOjE3Nzc5NzI0MDQsImV4cCI6MjA5MzU0ODQwNH0.g5rp_GAoTyTqcB_0Z1PtVoizyWE417Ir_AQQVFJrLAo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listRoles() {
  const { data, error } = await supabase.from('profiles').select('role').order('role');
  if (error) {
    console.error('Error fetching roles:', error);
  } else {
    console.log('Distinct roles in profiles:', [...new Set(data.map(r => r.role))]);
  }
}

listRoles();
