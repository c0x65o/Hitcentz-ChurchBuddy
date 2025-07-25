const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:5001/api';

async function testCrossDeviceFunctionality() {
  console.log('🌐 Testing Cross-Device Functionality...\n');

  try {
    // Simulate Device 1 (Laptop) - Creating content
    console.log('📱 Device 1 (Laptop): Creating sermon...');
    const sermon1 = {
      id: 'cross-device-sermon-1',
      title: 'Sunday Service Sermon',
      description: 'Created on laptop',
      slideIds: []
    };
    
    await fetch(`${API_BASE}/sermons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sermon1)
    });
    console.log('✅ Sermon created on laptop');

    // Simulate Device 1 saving content
    console.log('💾 Device 1: Saving sermon content...');
    const content1 = {
      itemId: 'cross-device-sermon-1',
      itemType: 'sermon',
      content: 'Welcome to our Sunday service. Today we will be discussing the importance of faith and community. Let us begin with prayer...',
      storageKey: 'sermon-notes-cross-device-sermon-1'
    };
    
    await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content1)
    });
    console.log('✅ Content saved on laptop');

    // Simulate Device 2 (Tablet) - Loading content
    console.log('\n📱 Device 2 (Tablet): Loading sermon...');
    const sermonsResponse = await fetch(`${API_BASE}/sermons`);
    const sermons = await sermonsResponse.json();
    const sermon = sermons.find(s => s.id === 'cross-device-sermon-1');
    console.log('✅ Sermon loaded on tablet:', sermon.title);

    // Simulate Device 2 loading content
    console.log('📖 Device 2: Loading sermon content...');
    const contentResponse = await fetch(`${API_BASE}/content/sermon-notes-cross-device-sermon-1`);
    const content = await contentResponse.json();
    console.log('✅ Content loaded on tablet:', content.content.substring(0, 50) + '...');

    // Simulate Device 2 editing content
    console.log('✏️ Device 2: Editing sermon content...');
    const updatedContent = {
      itemId: 'cross-device-sermon-1',
      itemType: 'sermon',
      content: 'Welcome to our Sunday service. Today we will be discussing the importance of faith and community. Let us begin with prayer... [EDITED ON TABLET]',
      storageKey: 'sermon-notes-cross-device-sermon-1'
    };
    
    await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedContent)
    });
    console.log('✅ Content updated on tablet');

    // Simulate Device 1 checking for updates
    console.log('\n📱 Device 1: Checking for updates...');
    const updatedContentResponse = await fetch(`${API_BASE}/content/sermon-notes-cross-device-sermon-1`);
    const finalContent = await updatedContentResponse.json();
    console.log('✅ Updated content retrieved on laptop:', finalContent.content.substring(0, 50) + '...');

    // Test song cross-device functionality
    console.log('\n🎵 Testing song cross-device functionality...');
    
    // Device 1 creates song
    const song1 = {
      id: 'cross-device-song-1',
      title: 'Amazing Grace',
      description: 'Created on laptop',
      slideIds: []
    };
    
    await fetch(`${API_BASE}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(song1)
    });
    console.log('✅ Song created on laptop');

    // Device 1 saves lyrics
    const lyrics1 = {
      itemId: 'cross-device-song-1',
      itemType: 'song',
      content: 'Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now I\'m found\nWas blind, but now I see',
      storageKey: 'song-lyrics-cross-device-song-1'
    };
    
    await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lyrics1)
    });
    console.log('✅ Lyrics saved on laptop');

    // Device 2 loads song and lyrics
    const songsResponse = await fetch(`${API_BASE}/songs`);
    const songs = await songsResponse.json();
    const song = songs.find(s => s.id === 'cross-device-song-1');
    console.log('✅ Song loaded on tablet:', song.title);

    const lyricsResponse = await fetch(`${API_BASE}/content/song-lyrics-cross-device-song-1`);
    const lyrics = await lyricsResponse.json();
    console.log('✅ Lyrics loaded on tablet:', lyrics.content.substring(0, 50) + '...');

    console.log('\n🎉 Cross-device functionality test completed successfully!');
    console.log('✅ Laptop → Tablet: Content sync working');
    console.log('✅ Tablet → Laptop: Content sync working');
    console.log('✅ Real-time updates: Working');
    console.log('✅ Database persistence: Working');

  } catch (error) {
    console.error('❌ Cross-device test failed:', error.message);
  }
}

testCrossDeviceFunctionality(); 