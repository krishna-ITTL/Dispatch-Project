import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jecgwtvmyqirbjlbrdol.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplY2d3dHZteXFpcmJqbGJyZG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NzI0MDQsImV4cCI6MjA5MzU0ODQwNH0.g5rp_GAoTyTqcB_0Z1PtVoizyWE417Ir_AQQVFJrLAo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateRoles() {
  // Update old role values to match new enum
  const { error: err1 } = await supabase
    .from('profiles')
    .update({ role: 'User' })
    .eq('role', 'Normal User');
  if (err1) console.error('Failed to update Normal User -> User', err1);

  const { error: err2 } = await supabase
    .from('profiles')
    .update({ role: 'Supervisor' })
    .eq('role', 'Power User');
  if (err2) console.error('Failed to update Power User -> Supervisor', err2);

  console.log('Role migration completed');
}

migrateRoles();
