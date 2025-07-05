const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Configure DynamoDB client for local development
const ddbClient = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
  }
});

const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

async function viewAllImpressions(limit = 20) {
  try {
    console.log(`\n📊 Fetching last ${limit} impressions...\n`);

    const scanCommand = new ScanCommand({
      TableName: 'AdImpressionEvents',
      Limit: limit
    });

    const result = await ddbDocClient.send(scanCommand);
    
    if (result.Items.length === 0) {
      console.log('No impressions found. Try generating some test impressions first:');
      console.log('npm run test-impression');
      return;
    }

    // Sort by timestamp (most recent first)
    const sortedItems = result.Items.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    console.log('Recent Ad Impressions:');
    console.log('='.repeat(80));
    
    sortedItems.forEach((item, index) => {
      console.log(`${index + 1}. Impression ID: ${item.impressionId}`);
      console.log(`   Ad ID: ${item.adId}`);
      console.log(`   Publisher: ${item.publisherId}`);
      console.log(`   Slot: ${item.slot}`);
      console.log(`   Timestamp: ${item.timestamp}`);
      console.log(`   Referer: ${item.refererUrl}`);
      console.log(`   IP: ${item.ip}`);
      console.log(`   User Agent: ${item.userAgent.substring(0, 50)}...`);
      console.log('-'.repeat(80));
    });

    console.log(`\nTotal impressions shown: ${sortedItems.length}`);
    console.log(`Total impressions in table: ${result.Count}`);

  } catch (error) {
    console.error('Error fetching impressions:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('\n💡 Table not found. Make sure to run: npm run setup-dynamodb');
    } else if (error.code === 'NetworkingError') {
      console.log('\n💡 Cannot connect to DynamoDB Local. Make sure it\'s running: npm run start-dynamodb');
    }
  }
}

async function viewImpressionsByAdId(adId) {
  try {
    console.log(`\n📊 Fetching impressions for Ad ID: ${adId}\n`);

    const queryCommand = new QueryCommand({
      TableName: 'AdImpressionEvents',
      IndexName: 'AdIdIndex',
      KeyConditionExpression: 'adId = :adId',
      ExpressionAttributeValues: {
        ':adId': adId
      },
      ScanIndexForward: false // Most recent first
    });

    const result = await ddbDocClient.send(queryCommand);
    
    if (result.Items.length === 0) {
      console.log(`No impressions found for Ad ID: ${adId}`);
      return;
    }

    console.log(`Impressions for Ad ID: ${adId}`);
    console.log('='.repeat(80));
    
    result.Items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.timestamp} - ${item.publisherId} (${item.slot})`);
      console.log(`   Referer: ${item.refererUrl}`);
      console.log(`   IP: ${item.ip}`);
      console.log('-'.repeat(40));
    });

    console.log(`\nTotal impressions for this ad: ${result.Items.length}`);

  } catch (error) {
    console.error('Error fetching impressions by Ad ID:', error.message);
  }
}

async function viewImpressionsByPublisher(publisherId) {
  try {
    console.log(`\n📊 Fetching impressions for Publisher: ${publisherId}\n`);

    const queryCommand = new QueryCommand({
      TableName: 'AdImpressionEvents',
      IndexName: 'PublisherIdIndex',
      KeyConditionExpression: 'publisherId = :publisherId',
      ExpressionAttributeValues: {
        ':publisherId': publisherId
      },
      ScanIndexForward: false // Most recent first
    });

    const result = await ddbDocClient.send(queryCommand);
    
    if (result.Items.length === 0) {
      console.log(`No impressions found for Publisher: ${publisherId}`);
      return;
    }

    console.log(`Impressions for Publisher: ${publisherId}`);
    console.log('='.repeat(80));
    
    // Group by ad ID
    const groupedByAd = result.Items.reduce((acc, item) => {
      if (!acc[item.adId]) {
        acc[item.adId] = [];
      }
      acc[item.adId].push(item);
      return acc;
    }, {});

    Object.entries(groupedByAd).forEach(([adId, impressions]) => {
      console.log(`\n📱 Ad ID: ${adId} (${impressions.length} impressions)`);
      impressions.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.timestamp} - ${item.slot}`);
      });
      if (impressions.length > 5) {
        console.log(`   ... and ${impressions.length - 5} more`);
      }
    });

    console.log(`\nTotal impressions for this publisher: ${result.Items.length}`);

  } catch (error) {
    console.error('Error fetching impressions by Publisher:', error.message);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const param = args[1];

async function main() {
  console.log('🔍 COAD Impression Data Viewer');
  
  switch (command) {
    case 'all':
      const limit = param ? parseInt(param) : 20;
      await viewAllImpressions(limit);
      break;
      
    case 'ad':
      if (!param) {
        console.log('Usage: node scripts/view-impressions.js ad <adId>');
        process.exit(1);
      }
      await viewImpressionsByAdId(param);
      break;
      
    case 'publisher':
      if (!param) {
        console.log('Usage: node scripts/view-impressions.js publisher <publisherId>');
        process.exit(1);
      }
      await viewImpressionsByPublisher(param);
      break;
      
    default:
      console.log('\nUsage:');
      console.log('  node scripts/view-impressions.js all [limit]           - View all impressions (default: 20)');
      console.log('  node scripts/view-impressions.js ad <adId>             - View impressions for specific ad');
      console.log('  node scripts/view-impressions.js publisher <pubId>     - View impressions for specific publisher');
      console.log('\nExamples:');
      console.log('  node scripts/view-impressions.js all 50');
      console.log('  node scripts/view-impressions.js ad test_ad_123');
      console.log('  node scripts/view-impressions.js publisher test_pub_456');
      process.exit(1);
  }
}

main().catch(console.error);
