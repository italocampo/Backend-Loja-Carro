import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Variáveis de ambiente do Supabase não estão configuradas.");
}

// Usamos a Service Role Key aqui porque o backend precisa de permissões elevadas para gerenciar o storage (como criar signed URLs e deletar arquivos).
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // É importante desabilitar a persistência do lado do servidor
    persistSession: false,
    autoRefreshToken: false,
  },
});
