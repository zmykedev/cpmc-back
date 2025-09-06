// Simple test script to verify Google Cloud Storage integration
// Run with: node test-gcs.js

const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: './webapp.env' });

async function testGCSConnection() {
  try {
    console.log('🔍 Testing Google Cloud Storage connection...');
    
    // Check environment variables
    const projectId = process.env.GCS_PROJECT_ID;
    const bucketName = process.env.GCS_BUCKET_NAME;
    const keyFile = process.env.GCS_KEY_FILE;
    
    console.log('📋 Configuration:');
    console.log(`  Project ID: ${projectId}`);
    console.log(`  Bucket Name: ${bucketName}`);
    console.log(`  Key File: ${keyFile}`);
    
    if (!projectId || !bucketName || !keyFile) {
      throw new Error('Missing required environment variables');
    }
    
    // Check if key file exists
    if (!fs.existsSync(keyFile)) {
      throw new Error(`Key file not found: ${keyFile}`);
    }
    
    // Initialize Storage client
    const storage = new Storage({
      projectId,
      keyFilename: keyFile,
    });
    
    console.log('✅ Storage client initialized successfully');
    
    // Test bucket access
    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();
    
    if (!exists) {
      throw new Error(`Bucket '${bucketName}' does not exist`);
    }
    
    console.log('✅ Bucket access verified');
    
    // Test file upload (create a simple test file)
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file for Google Cloud Storage integration.';
    
    const file = bucket.file(testFileName);
    await file.save(testContent, {
      metadata: {
        contentType: 'text/plain',
        metadata: {
          test: 'true',
          uploadedAt: new Date().toISOString(),
        },
      },
    });
    
    console.log('✅ Test file uploaded successfully');
    
    // Test file download
    const [content] = await file.download();
    const downloadedContent = content.toString();
    
    if (downloadedContent === testContent) {
      console.log('✅ Test file downloaded and verified');
    } else {
      throw new Error('Downloaded content does not match uploaded content');
    }
    
    // Clean up test file
    await file.delete();
    console.log('✅ Test file deleted successfully');
    
    console.log('🎉 All tests passed! Google Cloud Storage integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('💡 Make sure to:');
    console.error('  1. Set up your Google Cloud Storage bucket');
    console.error('  2. Create a service account with Storage Admin permissions');
    console.error('  3. Download the service account key JSON file');
    console.error('  4. Update your environment variables in webapp.env');
    process.exit(1);
  }
}

// Run the test
testGCSConnection();
