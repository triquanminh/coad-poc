const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

// Configure DynamoDB client for local development
const ddbClient = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000', // DynamoDB Local endpoint
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
  }
});

async function setupDynamoDB() {
  try {
    console.log('Setting up DynamoDB Local...');

    // Check if table already exists
    const listTablesCommand = new ListTablesCommand({});
    const existingTables = await ddbClient.send(listTablesCommand);
    
    if (existingTables.TableNames.includes('AdImpressionEvents')) {
      console.log('Table AdImpressionEvents already exists');
      return;
    }

    // Create AdImpressionEvents table
    const createTableCommand = new CreateTableCommand({
      TableName: 'AdImpressionEvents',
      KeySchema: [
        {
          AttributeName: 'impressionId',
          KeyType: 'HASH' // Primary key
        },
        {
          AttributeName: 'timestamp',
          KeyType: 'RANGE' // Sort key
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'impressionId',
          AttributeType: 'S' // String
        },
        {
          AttributeName: 'timestamp',
          AttributeType: 'S' // String (ISO timestamp)
        },
        {
          AttributeName: 'adId',
          AttributeType: 'S' // String
        },
        {
          AttributeName: 'publisherId',
          AttributeType: 'S' // String
        }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'AdIdIndex',
          KeySchema: [
            {
              AttributeName: 'adId',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'timestamp',
              KeyType: 'RANGE'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        {
          IndexName: 'PublisherIdIndex',
          KeySchema: [
            {
              AttributeName: 'publisherId',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'timestamp',
              KeyType: 'RANGE'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    });

    const result = await ddbClient.send(createTableCommand);
    console.log('Table created successfully:', result.TableDescription.TableName);
    console.log('Table ARN:', result.TableDescription.TableArn);
    console.log('');
    console.log('Table schema:');
    console.log('- Primary Key: impressionId (String)');
    console.log('- Sort Key: timestamp (String)');
    console.log('- GSI: AdIdIndex (adId + timestamp)');
    console.log('- GSI: PublisherIdIndex (publisherId + timestamp)');
    console.log('');
    console.log('Additional fields stored:');
    console.log('- slot, refererUrl, ip, userAgent, createdAt');

  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('Table AdImpressionEvents already exists');
    } else {
      console.error('Error setting up DynamoDB:', error);
      process.exit(1);
    }
  }
}

// Run setup
setupDynamoDB()
  .then(() => {
    console.log('DynamoDB setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('DynamoDB setup failed:', error);
    process.exit(1);
  });
