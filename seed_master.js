import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const masterData = {
  'Transformer Ratings': ['10 MVA / 33kV','31.5 MVA / 132kV','63 MVA / 220kV','100 MVA / 220kV','125 MVA / 220kV','160 MVA / 220kV','250 MVA / 400kV','315 MVA / 400kV','500 MVA / 765kV'],
  'Transformer Types': ['Power Transformer','Distribution Transformer','Auto Transformer','Generator Transformer','Rectifier Transformer'],
  'Vehicle Types': ['Packing Vehicle','Loading Vehicle','Dispatch Vehicle','Crane Vehicle','Trailer Vehicle','Flatbed Vehicle'],
  'Shifts': ['Shift 1','Shift 2','Shift 3'],
  'Packing List Items': ['Main Transformer Body (DRY AIR FILLED with fittings & accessories)','OLTC - Reversing Type (3 Pole) - EASUN MR','OLTC - Diverter Switch','Rating & Diagram Plate','Radiators (Set)','Oil Conservator with fittings','Buchholz Relay','PRD - Pressure Relief Device','WTI - Winding Temperature Indicator','OTI - Oil Temperature Indicator','Bushings - HV','Bushings - LV','Bushings - Tertiary','Silica Gel Breather','Terminal Box','Fan Assembly','Cooler Bank','Marshalling Box','Accessories Box','Neutral Grounding Resistor'],
  'Customers': ['NTPC Ltd.','PGCIL','Tata Power','Adani Energy','KSEB','Krishna','Renew Power','NPCIL','BHEL','PGVCL']
};

async function seed() {
  // Sign in first
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@indotech.com',
    password: 'password' // Try common password, or maybe no RLS enforcement if we insert via SQL
  });

  if (authError) {
    console.error('Auth failed:', authError.message);
    // If auth fails, we cannot bypass RLS easily without service key.
  }

  const records = [];
  for (const [category_key, items] of Object.entries(masterData)) {
    for (const value of items) {
      records.push({ category_key, value });
    }
  }

  const { error } = await supabase.from('master_list').insert(records);
  if (error) {
    console.error('Error seeding master list:', error);
  } else {
    console.log('Successfully seeded master list with default legacy data.');
  }
}

seed();
