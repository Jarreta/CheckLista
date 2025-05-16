import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wrkwqpgnbncvkxcrsdky.supabase.co"; // Copie do painel Supabase
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indya3dxcGduYm5jdmt4Y3JzZGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNDc1MzQsImV4cCI6MjA2MjcyMzUzNH0.oGw15UNH9g5aKtDVvGZqRIQtM_Xfo-c6lf-mlVysZ7A"; // Obtenha em Project Settings > API no Supabase

export const supabase = createClient(supabaseUrl, supabaseKey);
