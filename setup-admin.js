import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dmsktiqvbqpjsrqepeym.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2t0aXF2YnFwanNycWVwZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzMzgyNzcsImV4cCI6MjA5NjkxNDI3N30.advbcFLp1Ybg46UOIZ-1yg8ikOO8ypRKG5VvYX3ZaF4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupAdmin() {
  console.log("Mencoba membuat akun superadmin...");
  
  const { data, error } = await supabase.auth.signUp({
    email: 'superadmin@salqaura.com',
    password: 'olivia',
  });

  if (error) {
    console.error("Gagal membuat akun:", error.message);
  } else {
    console.log("Berhasil! Akun Superadmin telah diciptakan di Supabase.");
    console.log("Pastikan Anda sudah me-RUN v2_auth_schema.sql di Supabase SEBELUM menjalankan script ini agar Trigger otomatis aktif!");
  }
}

setupAdmin();
