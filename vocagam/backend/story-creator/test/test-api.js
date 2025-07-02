const fetch = require('node-fetch');
const FormData = require('form-data');
const JSZip = require('jszip');
const fs = require('fs').promises;

const BASE_URL = 'http://localhost:3001/api';

async function testHealthCheck() {
  console.log('🔍 Testing health check...');
  try {
    const response = await fetch(`${BASE_URL.replace('/api', '')}/health`);
    const data = await response.json();
    console.log('✅ Health check passed:', data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function createTestStory() {
  console.log('📝 Creating test story...');
  
  // Create test story data
  const storyData = {
    title: "Test Story - The Hero's Journey",
    scenes: [
      {
        greekText: "ὁ ἥρως **ἐν** τῇ ὁδῷ βαδίζει.",
        englishTranslation: "The hero walks on the road.",
        imagePrompt: "A hero walking on a path in ancient Greece"
      },
      {
        greekText: "ὁ ἥρως **τὸν** λόγον ἀκούει.",
        englishTranslation: "The hero hears the word.",
        imagePrompt: "A hero listening to wisdom from an elder"
      }
    ]
  };

  // Create test assets
  const zip = new JSZip();
  
  // Add dummy image files (1x1 pixel PNG)
  const dummyImageData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  zip.file('image_0.png', dummyImageData);
  zip.file('image_1.png', dummyImageData);
  
  // Add dummy audio files (empty WAV)
  const dummyAudioData = Buffer.from('UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
  zip.file('audio_0.wav', dummyAudioData);
  zip.file('audio_1.wav', dummyAudioData);

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

  // Create form data
  const formData = new FormData();
  formData.append('story', Buffer.from(JSON.stringify(storyData)), {
    filename: 'story.json',
    contentType: 'application/json'
  });
  formData.append('assets', zipBuffer, {
    filename: 'assets.zip',
    contentType: 'application/zip'
  });

  try {
    const response = await fetch(`${BASE_URL}/stories/save-with-assets`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Story created successfully:', result);
    return result.storyId;
  } catch (error) {
    console.error('❌ Story creation failed:', error.message);
    return null;
  }
}

async function testListStories() {
  console.log('📋 Testing list stories...');
  try {
    const response = await fetch(`${BASE_URL}/stories/list`);
    const data = await response.json();
    console.log('✅ List stories successful:', data);
    return data.stories.length > 0;
  } catch (error) {
    console.error('❌ List stories failed:', error.message);
    return false;
  }
}

async function testGetStory(storyId) {
  console.log(`📖 Testing get story ${storyId}...`);
  try {
    const response = await fetch(`${BASE_URL}/stories/${storyId}`);
    const data = await response.json();
    console.log('✅ Get story successful:', {
      id: data.story.id,
      title: data.story.title,
      scenesCount: data.story.scenes.length,
      assetsCount: Object.keys(data.story.assets).length
    });
    return true;
  } catch (error) {
    console.error('❌ Get story failed:', error.message);
    return false;
  }
}

async function testDeleteStory(storyId) {
  console.log(`🗑️ Testing delete story ${storyId}...`);
  try {
    const response = await fetch(`${BASE_URL}/stories/${storyId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    console.log('✅ Delete story successful:', data);
    return true;
  } catch (error) {
    console.error('❌ Delete story failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API tests...\n');

  // Test health check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('❌ Health check failed, stopping tests');
    return;
  }

  console.log('');

  // Test story creation
  const storyId = await createTestStory();
  if (!storyId) {
    console.log('❌ Story creation failed, stopping tests');
    return;
  }

  console.log('');

  // Test list stories
  await testListStories();

  console.log('');

  // Test get story
  await testGetStory(storyId);

  console.log('');

  // Test delete story
  await testDeleteStory(storyId);

  console.log('\n🎉 All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  createTestStory,
  testListStories,
  testGetStory,
  testDeleteStory,
  runTests
}; 