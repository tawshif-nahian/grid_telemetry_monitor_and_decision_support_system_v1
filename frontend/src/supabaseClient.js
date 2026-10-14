import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dvihcmjxeooanargzpxb.supabase.co";
const SUPABASE_KEY = "sb_publishable_IV9_rKRHgagioYNfVquMlA_O7p-ux7B"; // The same sb_publishable_... key from earlier

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
