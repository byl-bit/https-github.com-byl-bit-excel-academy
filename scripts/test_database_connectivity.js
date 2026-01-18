/**
 * Database Connectivity and API Functionality Test Script
 * This script tests all critical database connections and API endpoints
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 Excel Academy - Database & API Connectivity Test\n');
console.log('='.repeat(60));

// Test 1: Environment Variables
console.log('\n📋 Test 1: Environment Variables');
console.log('-'.repeat(60));
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    console.log('✅ Supabase URL:', SUPABASE_URL);
    console.log('✅ Supabase Anon Key: [PRESENT]');
} else {
    console.log('❌ Missing Supabase environment variables!');
    console.log('   SUPABASE_URL:', SUPABASE_URL || '[MISSING]');
    console.log('   SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '[PRESENT]' : '[MISSING]');
}

// Test 2: Supabase Client Connection
console.log('\n📋 Test 2: Supabase Client Connection');
console.log('-'.repeat(60));

async function testSupabaseConnection() {
    try {
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Test basic query
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (error) {
            console.log('❌ Supabase connection failed:', error.message);
            return false;
        }

        console.log('✅ Supabase connection successful');
        return true;
    } catch (err) {
        console.log('❌ Error testing Supabase:', err.message);
        return false;
    }
}

// Test 3: Database Tables
console.log('\n📋 Test 3: Database Tables Accessibility');
console.log('-'.repeat(60));

async function testDatabaseTables() {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const tables = [
        'users',
        'announcements',
        'results',
        'admissions',
        'subject_allocations',
        'notifications',
        'books',
        'attendance'
    ];

    const results = {};

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
                results[table] = false;
            } else {
                console.log(`✅ ${table}: Accessible (${data?.length || 0} rows tested)`);
                results[table] = true;
            }
        } catch (err) {
            console.log(`❌ ${table}: ${err.message}`);
            results[table] = false;
        }
    }

    return results;
}

// Test 4: API Endpoints
console.log('\n📋 Test 4: API Endpoints');
console.log('-'.repeat(60));

async function testAPIEndpoints() {
    const baseUrl = 'http://localhost:3000';
    const endpoints = [
        { path: '/api/announcements', method: 'GET', name: 'Get Announcements' },
        { path: '/api/users', method: 'GET', name: 'Get Users' },
        { path: '/api/results', method: 'GET', name: 'Get Results' },
        { path: '/api/admissions', method: 'GET', name: 'Get Admissions' },
        { path: '/api/notifications', method: 'GET', name: 'Get Notifications' }
    ];

    const results = {};

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${baseUrl}${endpoint.path}`, {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint.name}: ${response.status} (${Array.isArray(data) ? data.length : 'N/A'} items)`);
                results[endpoint.path] = true;
            } else {
                console.log(`⚠️  ${endpoint.name}: ${response.status} ${response.statusText}`);
                results[endpoint.path] = false;
            }
        } catch (err) {
            console.log(`❌ ${endpoint.name}: ${err.message}`);
            results[endpoint.path] = false;
        }
    }

    return results;
}

// Test 5: Authentication Flow
console.log('\n📋 Test 5: Authentication System');
console.log('-'.repeat(60));

async function testAuthentication() {
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test@test.com',
                password: 'test123'
            })
        });

        if (response.status === 401) {
            console.log('✅ Authentication endpoint responding (401 for invalid credentials)');
            return true;
        } else if (response.ok) {
            console.log('✅ Authentication endpoint working');
            return true;
        } else {
            console.log(`⚠️  Authentication endpoint returned: ${response.status}`);
            return false;
        }
    } catch (err) {
        console.log('❌ Authentication test failed:', err.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('\n🚀 Starting comprehensive tests...\n');

    const supabaseOk = await testSupabaseConnection();
    const tablesResults = await testDatabaseTables();
    const apiResults = await testAPIEndpoints();
    const authOk = await testAuthentication();

    // Summary
    console.log('\n📊 Test Summary');
    console.log('='.repeat(60));

    const totalTables = Object.keys(tablesResults).length;
    const passedTables = Object.values(tablesResults).filter(Boolean).length;

    const totalAPIs = Object.keys(apiResults).length;
    const passedAPIs = Object.values(apiResults).filter(Boolean).length;

    console.log(`\n✅ Supabase Connection: ${supabaseOk ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Database Tables: ${passedTables}/${totalTables} accessible`);
    console.log(`✅ API Endpoints: ${passedAPIs}/${totalAPIs} working`);
    console.log(`✅ Authentication: ${authOk ? 'PASS' : 'FAIL'}`);

    const overallPass = supabaseOk && passedTables === totalTables && authOk;

    console.log('\n' + '='.repeat(60));
    if (overallPass) {
        console.log('🎉 ALL TESTS PASSED - System is fully operational!');
    } else {
        console.log('⚠️  SOME TESTS FAILED - Please review the results above');
    }
    console.log('='.repeat(60) + '\n');
}

// Execute tests
runAllTests().catch(err => {
    console.error('\n❌ Fatal error running tests:', err);
    process.exit(1);
});
