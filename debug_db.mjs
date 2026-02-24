import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://clwujlyvskclvepwclte.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsd3VqbHl2c2tjbHZlcHdjbHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTE1NDYsImV4cCI6MjA1NTc2NzU0Nn0.8W0C6fEa-_w4iEa-_w4iEa-_w4iEa-_w4iEa-_w4iEa0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: users, error: userError } = await supabase.from('users').select('id, email, name');
    const { data: customers, error: customerError } = await supabase.from('customers').select('id, email, name');
    const { data: admins, error: adminError } = await supabase.from('admins').select('*');

    console.log('--- USERS TABLE ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('--- CUSTOMERS TABLE ---');
    console.log(JSON.stringify(customers, null, 2));
    console.log('--- ADMINS TABLE ---');
    console.log(JSON.stringify(admins, null, 2));

    if (userError) console.error('Users Error:', userError);
    if (customerError) console.error('Customers Error:', customerError);
    if (adminError) console.error('Admins Error:', adminError);
}

check();
