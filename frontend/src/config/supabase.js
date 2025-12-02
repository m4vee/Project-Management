import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bwlfzfmrhiebkmujyxto.supabase.co"; // Your URL
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bGZ6Zm1yaGllYmttdWp5eHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MDQ2MjYsImV4cCI6MjA3OTI4MDYyNn0.KRmzS5vBwl5FPRM01QcWqIhMDxmiZpTcW-9pwwSQlEo"; // From Supabase Settings → API

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
