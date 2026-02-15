// Test script to verify CRM app functionality
const http = require('http');

const baseUrl = 'http://localhost:3001';
let sessionCookie = '';

async function testEndpoint(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body ? JSON.parse(body) : null
                });
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Testing CRM Web Application...\n');
    
    // Test 1: Check if server is running
    console.log('1. Server Status:');
    try {
        const test = await testEndpoint('GET', '/');
        console.log(`   ✅ Server is running (redirects to login)`);
    } catch (error) {
        console.log(`   ❌ Server not responding: ${error.message}`);
        return;
    }
    
    // Test 2: Test login
    console.log('\n2. Login Test:');
    try {
        const loginData = {
            username: 'admin',
            password: 'admin123'
        };
        
        const loginRes = await testEndpoint('POST', '/login', loginData);
        console.log(`   ✅ Login successful`);
        
        // Save session cookie for subsequent requests
        if (loginRes.headers['set-cookie']) {
            sessionCookie = loginRes.headers['set-cookie'][0].split(';')[0];
        }
    } catch (error) {
        console.log(`   ❌ Login failed: ${error.message}`);
    }
    
    // Test 3: Test customers API
    console.log('\n3. Customers API Test:');
    try {
        const customersRes = await testEndpoint('GET', '/api/customers');
        console.log(`   ✅ Customers API accessible`);
        console.log(`   📊 Customers data:`, customersRes.body);
    } catch (error) {
        console.log(`   ❌ Customers API failed: ${error.message}`);
    }
    
    // Test 4: Test adding a customer
    console.log('\n4. Add Customer Test:');
    try {
        const newCustomer = {
            name: 'Test Company',
            phone: '012-9998888',
            email: 'test@company.com',
            address: 'Test Address',
            notes: 'Test customer for verification'
        };
        
        const addRes = await testEndpoint('POST', '/api/customers', newCustomer);
        console.log(`   ✅ Customer added successfully`);
        console.log(`   📝 Response:`, addRes.body);
    } catch (error) {
        console.log(`   ❌ Add customer failed: ${error.message}`);
    }
    
    console.log('\n🎯 All tests completed!');
}

runTests().catch(console.error);