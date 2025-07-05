const axios = require('axios');

const TRACKING_SERVER_URL = 'http://localhost:3002';

async function testTrackingServer() {
  console.log('Testing COAD Tracking Server...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${TRACKING_SERVER_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);

    // Test 2: Track impression
    console.log('\n2. Testing impression tracking...');
    const impressionUrl = `${TRACKING_SERVER_URL}/track/impression?adId=test_ad_123&slot=header&publisherId=test_pub_456`;
    
    const impressionResponse = await axios.get(impressionUrl, {
      headers: {
        'User-Agent': 'COAD-Test-Client/1.0',
        'Referer': 'http://localhost:3000/test-page'
      },
      responseType: 'arraybuffer'
    });

    if (impressionResponse.status === 200 && impressionResponse.headers['content-type'] === 'image/gif') {
      console.log('✅ Impression tracking passed: Received 1x1 pixel');
      console.log('   Content-Type:', impressionResponse.headers['content-type']);
      console.log('   Content-Length:', impressionResponse.headers['content-length']);
    } else {
      console.log('❌ Impression tracking failed: Invalid response');
    }

    // Test 3: Stats endpoint
    console.log('\n3. Testing stats endpoint...');
    const statsResponse = await axios.get(`${TRACKING_SERVER_URL}/stats`);
    console.log('✅ Stats endpoint passed:', statsResponse.data.status);

    console.log('\n🎉 All tests passed! Tracking server is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the tracking server is running:');
      console.log('   cd coad/coad-tracking && npm start');
    }
    
    process.exit(1);
  }
}

// Run tests
testTrackingServer();
