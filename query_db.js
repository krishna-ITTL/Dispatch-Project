import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jecgwtvmyqirbjlbrdol.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplY2d3dHZteXFpcmJqbGJyZG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NzI0MDQsImV4cCI6MjA5MzU0ODQwNH0.g5rp_GAoTyTqcB_0Z1PtVoizyWE417Ir_AQQVFJrLAo'
)

async function run() {
  // Check loading_lists columns
  const { data: ll, error: llErr } = await supabase.from('loading_lists').select('*').limit(0)
  console.log("loading_lists error:", llErr)

  // Check loading_list_items columns
  const { data: lli, error: lliErr } = await supabase.from('loading_list_items').select('*').limit(0)
  console.log("loading_list_items error:", lliErr)
  
  // Check work_orders columns
  const { data: wo, error: woErr } = await supabase.from('work_orders').select('*').limit(1)
  console.log("work_orders columns:", wo && wo.length > 0 ? Object.keys(wo[0]) : "empty")
  console.log("work_orders error:", woErr)
  
  // Check packing_items columns
  const { data: pi, error: piErr } = await supabase.from('packing_items').select('*').limit(1)
  console.log("packing_items columns:", pi && pi.length > 0 ? Object.keys(pi[0]) : "empty")
  console.log("packing_items error:", piErr)
  
  // Check activity_log columns
  const { data: al, error: alErr } = await supabase.from('activity_log').select('*').limit(1)
  console.log("activity_log columns:", al && al.length > 0 ? Object.keys(al[0]) : al)
  console.log("activity_log error:", alErr)
  
  // Check existing loading lists
  const { data: existingLL } = await supabase.from('loading_lists').select('ll_num')
  console.log("Existing loading lists:", existingLL)
}
run()
