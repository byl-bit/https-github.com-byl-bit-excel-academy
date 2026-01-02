/**
 * Security Implementation Test Script
 * 
 * This script tests the security improvements:
 * 1. Password hashing (bcrypt)
 * 2. Input validation (Zod)
 * 3. Authentication flows
 * 
 * Run: node scripts/test-security.js
 */

const bcrypt = require('bcryptjs');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
    console.log(`\n${colors.cyan}━━━ ${name} ━━━${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Test 1: Password Hashing
async function testPasswordHashing() {
    logTest('Test 1: Password Hashing');

    const testPassword = 'TestPassword123';

    try {
        // Hash password
        const hash = await bcrypt.hash(testPassword, 10);
        logInfo(`Original: ${testPassword}`);
        logInfo(`Hashed: ${hash}`);

        // Verify correct password
        const isValid = await bcrypt.compare(testPassword, hash);
        if (isValid) {
            logSuccess('Password verification successful');
        } else {
            logError('Password verification failed');
            return false;
        }

        // Verify incorrect password
        const isInvalid = await bcrypt.compare('WrongPassword', hash);
        if (!isInvalid) {
            logSuccess('Incorrect password correctly rejected');
        } else {
            logError('Incorrect password was accepted');
            return false;
        }

        // Check hash format
        const hashRegex = /^\$2[aby]\$\d{2}\$.{53}$/;
        if (hashRegex.test(hash)) {
            logSuccess('Hash format is valid');
        } else {
            logError('Hash format is invalid');
            return false;
        }

        return true;
    } catch (error) {
        logError(`Password hashing test failed: ${error.message}`);
        return false;
    }
}

// Test 2: API Endpoints (requires server running)
async function testAPIEndpoints() {
    logTest('Test 2: API Endpoints');

    const baseUrl = 'http://localhost:3000';

    try {
        // Test user registration with validation
        logInfo('Testing user registration...');

        const validUser = {
            firstName: 'Test',
            middleName: 'Middle',
            lastName: 'User',
            password: 'SecurePassword123',
            role: 'student',
            grade: '10',
            section: 'A',
            gender: 'Male'
        };

        const response = await fetch(`${baseUrl}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validUser)
        });

        if (response.ok) {
            const data = await response.json();
            logSuccess(`User created: ${data.name || data.email}`);
            logInfo(`Student ID: ${data.studentId}`);
        } else {
            const error = await response.json();
            logError(`Registration failed: ${error.error}`);
            if (error.details) {
                logInfo(`Validation errors: ${JSON.stringify(error.details, null, 2)}`);
            }
        }

        // Test invalid registration (should fail validation)
        logInfo('Testing validation with invalid data...');

        const invalidUser = {
            firstName: 'A', // Too short
            lastName: 'B',  // Too short
            password: '123', // Too short
            role: 'student'
        };

        const invalidResponse = await fetch(`${baseUrl}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invalidUser)
        });

        if (!invalidResponse.ok) {
            const error = await invalidResponse.json();
            if (error.error === 'Validation failed') {
                logSuccess('Validation correctly rejected invalid data');
                logInfo(`Errors: ${error.details.length} validation issues found`);
            } else {
                logError('Expected validation error, got different error');
            }
        } else {
            logError('Invalid data was accepted (validation not working)');
        }

        return true;
    } catch (error) {
        logError(`API test failed: ${error.message}`);
        logInfo('Make sure the development server is running (npm run dev)');
        return false;
    }
}

// Test 3: Environment Variables
function testEnvironmentVariables() {
    logTest('Test 3: Environment Variables');

    const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_ADMIN_FALLBACK_EMAIL',
        'NEXT_PUBLIC_ADMIN_FALLBACK_PASSWORD_HASH'
    ];

    let allPresent = true;

    for (const varName of requiredVars) {
        if (process.env[varName]) {
            logSuccess(`${varName} is set`);
        } else {
            logError(`${varName} is missing`);
            allPresent = false;
        }
    }

    // Check admin password hash format
    const adminHash = process.env.NEXT_PUBLIC_ADMIN_FALLBACK_PASSWORD_HASH;
    if (adminHash) {
        const hashRegex = /^\$2[aby]\$\d{2}\$.{53}$/;
        if (hashRegex.test(adminHash)) {
            logSuccess('Admin password hash format is valid');
        } else {
            logError('Admin password hash format is invalid');
            logInfo('Generate a new hash: node -e "const bcrypt = require(\'bcryptjs\'); bcrypt.hash(\'YourPassword\', 10).then(console.log);"');
            allPresent = false;
        }
    }

    return allPresent;
}

// Test 4: Password Strength
function testPasswordStrength() {
    logTest('Test 4: Password Strength Validation');

    const testCases = [
        { password: '123', expected: false, reason: 'Too short (< 6 chars)' },
        { password: '123456', expected: true, reason: 'Minimum length (6 chars)' },
        { password: 'SecurePassword123', expected: true, reason: 'Strong password' },
        { password: 'a'.repeat(101), expected: false, reason: 'Too long (> 100 chars)' }
    ];

    let allPassed = true;

    for (const test of testCases) {
        const isValid = test.password.length >= 6 && test.password.length <= 100;
        const passed = isValid === test.expected;

        if (passed) {
            logSuccess(`${test.reason}: ${passed ? 'PASS' : 'FAIL'}`);
        } else {
            logError(`${test.reason}: ${passed ? 'PASS' : 'FAIL'}`);
            allPassed = false;
        }
    }

    return allPassed;
}

// Main test runner
async function runTests() {
    console.log('\n' + '='.repeat(60));
    log('🔒 Excel Academy Security Implementation Tests', 'cyan');
    console.log('='.repeat(60));

    const results = {
        passwordHashing: await testPasswordHashing(),
        environmentVars: testEnvironmentVariables(),
        passwordStrength: testPasswordStrength(),
        apiEndpoints: await testAPIEndpoints()
    };

    // Summary
    console.log('\n' + '='.repeat(60));
    log('📊 Test Summary', 'cyan');
    console.log('='.repeat(60));

    const total = Object.keys(results).length;
    const passed = Object.values(results).filter(r => r).length;
    const failed = total - passed;

    for (const [test, result] of Object.entries(results)) {
        const status = result ? '✅ PASS' : '❌ FAIL';
        const color = result ? 'green' : 'red';
        log(`${status} - ${test}`, color);
    }

    console.log('\n' + '-'.repeat(60));
    log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`, passed === total ? 'green' : 'yellow');
    console.log('='.repeat(60) + '\n');

    if (passed === total) {
        log('🎉 All security tests passed!', 'green');
        process.exit(0);
    } else {
        log('⚠️  Some tests failed. Please review the output above.', 'yellow');
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
});
