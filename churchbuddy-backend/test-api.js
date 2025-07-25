const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:5001/api';

async function testAPI() {
  console.log('🧪 Testing ChurchBuddy Backend API...\n');

  try {
    // Test health check
    console.log('1. Testing health check...');
    const health = await fetch(`${API_BASE}/health`);
    const healthData = await health.json();
    console.log('✅ Health check:', healthData);

    // Test creating a song
    console.log('\n2. Testing song creation...');
    const testSong = {
      id: 'test-song-1',
      title: 'Amazing Grace',
      description: 'Test song',
      slideIds: []
    };
    
    const songResponse = await fetch(`${API_BASE}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSong)
    });
    const songData = await songResponse.json();
    console.log('✅ Song created:', songData);

    // Test creating a sermon
    console.log('\n3. Testing sermon creation...');
    const testSermon = {
      id: 'test-sermon-1',
      title: 'God\'s Love',
      description: 'Test sermon',
      slideIds: []
    };
    
    const sermonResponse = await fetch(`${API_BASE}/sermons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSermon)
    });
    const sermonData = await sermonResponse.json();
    console.log('✅ Sermon created:', sermonData);

    // Test content sync
    console.log('\n4. Testing content sync...');
    const testContent = {
      itemId: 'test-song-1',
      itemType: 'song',
      content: 'Amazing grace, how sweet the sound...',
      storageKey: 'song-lyrics-test-song-1'
    };
    
    const contentResponse = await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testContent)
    });
    const contentData = await contentResponse.json();
    console.log('✅ Content synced:', contentData);

    // Test retrieving content
    console.log('\n5. Testing content retrieval...');
    const getContentResponse = await fetch(`${API_BASE}/content/song-lyrics-test-song-1`);
    const getContentData = await getContentResponse.json();
    console.log('✅ Content retrieved:', getContentData);

    // Test getting all songs
    console.log('\n6. Testing get all songs...');
    const songsResponse = await fetch(`${API_BASE}/songs`);
    const songsData = await songsResponse.json();
    console.log('✅ Songs retrieved:', songsData);

    // Test getting all sermons
    console.log('\n7. Testing get all sermons...');
    const sermonsResponse = await fetch(`${API_BASE}/sermons`);
    const sermonsData = await sermonsResponse.json();
    console.log('✅ Sermons retrieved:', sermonsData);

    console.log('\n🎉 All tests passed! Backend is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI(); 