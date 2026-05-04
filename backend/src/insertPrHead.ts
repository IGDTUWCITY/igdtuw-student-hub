import { supabase } from './services/supabase';

async function insertPrHead() {
  const email = 'adharikamahajan@gmail.com';
  const { data, error } = await supabase
    .from('pr_heads')
    .insert([{ email: email, is_active: true }])
    .select();

  if (error) {
    console.error('Error inserting pr_head:', error);
  } else {
    console.log('Successfully inserted pr_head:', data);
  }
  process.exit(0);
}

insertPrHead();
