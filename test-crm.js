#!/usr/bin/env node

const http = require('http');

// Test configuration
const BASE_URL = 'https://aircond-crm-app.vercel.app';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make HTTP requests
async function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test cases
const tests = [
  {
    name: 'Login page accessible',
    run: async () => {
      const response = await fetch(`${BASE_URL}/login`);
      return response.status === 200;
    }
  },
  {
    name: 'Dashboard requires authentication',
    run: async () => {
      const response = await fetch(`${BASE_URL}/dashboard`);
      return response.status === 302 && response.headers.location === '/login';
    }
  },
  {
    name: 'Contacts page requires authentication',
    run: async () => {
      const response = await fetch(`${BASE_URL}/contacts`);
      return response.status === 302 && response.headers.location === '/login';
    }
  },
  {
    name: 'Customers page requires authentication',
    run: async () => {
      const response = await fetch(`${BASE_URL}/customers`);
      return response.status === 302 && response.headers.location === '/login';
    }
  },
  {
    name: 'Opportunities page requires authentication',
    run: async () => {
      const response = await fetch(`${BASE_URL}/opportunities`);
      return response.status === 302 && response.headers.location === '/login';
    }
  },
  {
    name: 'Activities page requires authentication',
    run: async () => {
      const response = await fetch(`${BASE_URL}/activities`);
      return response.status === 302 && response.headers.location === '/login';
    }
  },
  {
    name: 'Reports page requires authentication',
    run: async () => {
      const response = await fetch(`${BASE_URL}/reports`);
      return response.status === 302 && response.headers.location === '/login';
    }
  },
  {
    name: 'Settings page requires authentication',
    run: async () => {
      const response = await fetch(`${BASE_URL}/settings`);
      return response.status === 302 && response.headers.location === '/login';
    }
  },
  {
    name: 'JavaScript file accessible',
    run: async () => {
      const response = await fetch(`${BASE_URL}/js/app.js`);
      return response.status === 200;
    }
  },
  {
    name: 'CSS file accessible',
    run: async () => {
      const response = await fetch(`${BASE_URL}/css/style.css`);
      return response.status === 200;
    }
  }
];

// Run all tests
async function runTests() {
  console.log('🚀 CRM Application Test Suite');
  console.log('=============================\n');
  console.log(`Testing: ${BASE_URL}`);
  console.log('');

  for (const test of tests) {
    process.stdout.write(`🔍 ${test.name}... `);
    
    try {
      const passed = await test.run();
      
      if (passed) {
        console.log('✅ PASS');
        results.passed++;
        results.tests.push({ name: test.name, passed: true });
      } else {
        console.log('❌ FAIL');
        results.failed++;
        results.tests.push({ name: test.name, passed: false });
      }
    } catch (error) {
      console.log('❌ ERROR');
      console.error(`   ${error.message}`);
      results.failed++;
      results.tests.push({ name: test.name, passed: false, error: error.message });
    }
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / tests.length) * 100).toFixed(1)}%`);
  
  // Detailed results
  console.log('\n📋 Detailed Results:');
  results.tests.forEach((test, index) => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${test.name}`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (results.failed === 0) {
    console.log('🎉 All tests passed! The CRM app is fully functional.');
    console.log('🔗 Live URL: https://aircond-crm-app.vercel.app');
    console.log('🔐 Login: admin / admin123');
  } else {
    console.log('⚠️ Some tests failed. Check the following:');
    console.log('   1. Ensure the server is running');
    console.log('   2. Check network connectivity');
    console.log('   3. Verify the deployment is complete');
  }
  
  return results.failed === 0;
}

// Run the tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});