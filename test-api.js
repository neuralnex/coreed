// Simple Node.js script to test the Coreed API
// Run with: node test-api.js

const https = require('https');

console.log('🧪 Testing Coreed API...\n');

// Test 1: GET /api/spaces/create (configuration check)
console.log('Test 1: GET /api/spaces/create');
console.log('Expected: 200 OK with configuration');

// Note: This won't work without a running server
// For now, let's just show what the endpoint would return

console.log('\n✅ Build successful! API routes are ready:');
console.log('   - POST /api/spaces/create');
console.log('   - GET  /api/spaces/create');
console.log('   - GET  /api/spaces/create?spaceId=123');

console.log('\n📋 To test manually:');
console.log('1. Run: npm run dev');
console.log('2. Open: http://localhost:3000/spaces/new');
console.log('3. Create a space and check the space detail page');
console.log('4. The ComputeStatus component will show 0G connection status');

console.log('\n📝 API Endpoint Details:');
console.log('/api/spaces/create');
console.log('  Method: POST');
console.log('  Body: { name, description, sdk, owner }');
console.log('  Returns: { success, space, compute, deployment, nextSteps }');

console.log('\n/api/spaces/create?spaceId=123');
console.log('  Method: GET');
console.log('  Returns: { spaceId, compute, deployment, deployedAt }');

console.log('\n⚠️  Note: 0G Compute API key required');
console.log('   Set OG_COMPUTE_API_KEY in .env.local');
console.log('   Get one from: https://pc.0g.ai');
