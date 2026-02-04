
import { createClient } from '@supabase/supabase-js';

// Connection details provided for the AXIS Live Node
const supabaseUrl = 'https://ctoeuukutnbqltyvbggr.supabase.co';
const supabaseAnonKey = 'sb_publishable_7m4afemQWnZKVZJCD1zLjA_ShyAV74e';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
