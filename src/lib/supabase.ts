// ============================================================
// 🔗 إعداد Supabase - قاعدة البيانات السحابية
// ============================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxxnuxowzufouzfzoxun.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4eG51eG93enVmb3V6ZnpveHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTE0MDksImV4cCI6MjA4NzE4NzQwOX0.jCapQvv9qHUgVZgJ6IooS3--hyPMXAI6xs1HZBFj-ec';

// تصدير نسخة واحدة بسيطة
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sales-store-auth',
        // حل مشكلة التعليق (Hanging) في بيئة التطوير بسبب Vite HMR
        lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
            return await fn();
        },
    }
});

export default supabase;
