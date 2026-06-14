import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dmsktiqvbqpjsrqepeym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2t0aXF2YnFwanNycWVwZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzgyNzcsImV4cCI6MjA5NjkxNDI3N30.advbcFLp1Ybg46UOIZ-1yg8ikOO8ypRKG5VvYX3ZaF4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
