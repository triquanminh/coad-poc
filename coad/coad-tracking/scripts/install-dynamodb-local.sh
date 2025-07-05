#!/bin/bash

# Script to download and setup DynamoDB Local for COAD Tracking

echo "Setting up DynamoDB Local for COAD Tracking..."

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "Error: Java is required but not installed."
    echo "Please install Java 8 or later and try again."
    exit 1
fi

# Create directory for DynamoDB Local if it doesn't exist
mkdir -p dynamodb-local
cd dynamodb-local

# Download DynamoDB Local if not already present
if [ ! -f "DynamoDBLocal.jar" ]; then
    echo "Downloading DynamoDB Local..."
    curl -O https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
    
    if [ $? -eq 0 ]; then
        echo "Extracting DynamoDB Local..."
        tar -xzf dynamodb_local_latest.tar.gz
        rm dynamodb_local_latest.tar.gz
        echo "DynamoDB Local downloaded and extracted successfully!"
    else
        echo "Error: Failed to download DynamoDB Local"
        exit 1
    fi
else
    echo "DynamoDB Local already exists, skipping download."
fi

cd ..

echo ""
echo "Setup complete! You can now:"
echo "1. Start DynamoDB Local: npm run start-dynamodb"
echo "2. Setup database tables: npm run setup-dynamodb"
echo "3. Start tracking server: npm start"
echo ""
echo "DynamoDB Local will run on: http://localhost:8000"
echo "Tracking server will run on: http://localhost:3001"
