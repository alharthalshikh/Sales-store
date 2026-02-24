const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://clwujlyvskclvepwclte.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsd3VqbHl2c2tjbHZlcHdjbHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAxOTE1NDYsImV4cCI6MjA1NTc2NzU0Nn0.8W0C6fEa-_w4iEa-_w4iEa-_w4iEa-_w4iEa-_w4iEa0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    try {
        const { data: users, error: userError } = await supabase.from('users').select('role, is_suspended');
        const { data: admins, error: adminError } = await supabase.from('admins').select('*');
        const { data: customers, error: customerError } = await supabase.from('customers').select('*');

        console.log('--- RESULTS ---');
        if (users) {
            console.log('Total in users table:', users.length);
            const roles = users.reduce((acc, u) => {
                acc[u.role] = (acc[u.role] || 0) + 1;
                return acc;
            }, {});
            console.log('Roles distribution:', roles);
            console.log('Banned (suspended) users:', users.filter(u => u.is_suspended).length);
        } else {
            console.log('Users table error or empty');
        }

        console.log('Total in admins table:', admins ? admins.length : 0);
        console.log('Total in customers table:', customers ? customers.length : 0);

        // Count total unique identity (dummy logic just to see)
        const uniqueIds = new Set();
        if (users) users.forEach(u => uniqueIds.add(u.id));
        if (customers) customers.forEach(c => uniqueIds.add(c.id));
        console.log('Total Unique Identities:', uniqueIds.size);

    } catch (e) {
        console.error('Error:', e);
    }
}

check();
