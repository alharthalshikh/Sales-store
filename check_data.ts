import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clwujlyvskclvepwclte.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsd3VqbHl2c2tjbHZlcHdjbHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTE1NDYsImV4cCI6MjA1NTc2NzU0Nn0.8W0C6fEa-_w4iEa-_w4iEa-_w4iEa-_w4iEa-_w4iEa0'; // I'll assume it's in env or I can check supabase.ts

async function checkTables() {
    const { count: userCount, error: userError } = await (await import('./src/lib/supabase')).supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: customerCount, error: customerError } = await (await import('./src/lib/supabase')).supabase.from('customers').select('*', { count: 'exact', head: true });

    console.log('--- Table Check ---');
    console.log('Users count:', userCount);
    console.log('Customers count:', customerCount);
    if (userError) console.error('Users error:', userError);
    if (customerError) console.error('Customers error:', customerError);
}

checkTables();
