import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan las variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_PUBLISHABLE_KEY (archivo .env)');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Carries an employee invite code from the "join with a code" signup form,
// across the moment the session flips and LoginScreen unmounts, so
// AppContext can redeem it right after the new account's data first loads.
export const PENDING_INVITE_STORAGE_KEY = 'monedero_pending_invite_code';
