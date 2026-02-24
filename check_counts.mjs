import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gxxnuxowzufouzfzoxun.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4eG51eG93enVmb3V6ZnpveHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTE0MDksImV4cCI6MjA4NzE4NzQwOX0.jCapQvv9qHUgVZgJ6IooS3--hyPMXAI6xs1HZBFj-ec';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    try {
        const { data: users, error: userError } = await supabase.from('users').select('role, is_suspended');
        const { data: admins, error: adminError } = await supabase.from('admins').select('*');
        const { data: customers, error: customerError } = await supabase.from('customers').select('*');

        console.log('--- RESULTS ---');
        console.log('URL Used:', SUPABASE_URL);

        if (users) {
            console.log('Total in users table:', users.length);
            const roles = users.reduce((acc, u) => {
                acc[u.role] = (acc[u.role] || 0) + 1;
                return acc;
            }, {});
            console.log('Roles distribution:', roles);
            console.log('Banned (suspended) users:', users.filter(u => u.is_suspended).length);
        } else {
            console.log('Users table error or empty:', userError?.message);
        }

        console.log('Total in admins table:', admins ? admins.length : 0);
        console.log('Total in customers table:', customers ? customers.length : 0);

    } catch (e) {
        console.error('Error:', e);
    }
}

check();
