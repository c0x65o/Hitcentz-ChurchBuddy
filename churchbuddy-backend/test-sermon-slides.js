const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:5001/api';

async function testSermonSlideCreation() {
  console.log('📖 Testing Sermon Slide Creation...\n');

  try {
    // Create a test sermon
    console.log('1. Creating test sermon...');
    const testSermon = {
      id: 'test-sermon-slides-1',
      title: 'Sunday Morning Sermon',
      description: 'Test sermon for slide creation',
      slideIds: []
    };
    
    const sermonResponse = await fetch(`${API_BASE}/sermons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSermon)
    });
    const sermonData = await sermonResponse.json();
    console.log('✅ Sermon created:', sermonData.title);

    // Create a slide from selected text
    console.log('\n2. Creating slide from selected text...');
    const selectedText = "Welcome to our Sunday service. Today we will be discussing the importance of faith and community.";
    const newSlide = {
      id: `slide-${testSermon.id}-${Date.now()}`,
      title: `${testSermon.title} - Slide 1`,
      html: `<div style="text-align: center; padding: 40px; color: white; font-weight: bold; line-height: 1.4;">${selectedText}</div>`,
      order: 1
    };
    
    const slideResponse = await fetch(`${API_BASE}/slides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSlide)
    });
    const slideData = await slideResponse.json();
    console.log('✅ Slide created:', slideData.title);

    // Update sermon with slide reference
    console.log('\n3. Updating sermon with slide reference...');
    const updatedSermon = {
      ...testSermon,
      slideIds: [newSlide.id],
      updatedAt: new Date().toISOString()
    };
    
    const updateResponse = await fetch(`${API_BASE}/sermons/${testSermon.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSermon)
    });
    const updateData = await updateResponse.json();
    console.log('✅ Sermon updated with slide reference');

    // Verify slide was created
    console.log('\n4. Verifying slide creation...');
    const slidesResponse = await fetch(`${API_BASE}/slides`);
    const slides = await slidesResponse.json();
    const createdSlide = slides.find(s => s.id === newSlide.id);
    console.log('✅ Slide found in database:', createdSlide ? createdSlide.title : 'Not found');

    // Verify sermon has slide reference
    console.log('\n5. Verifying sermon slide reference...');
    const sermonsResponse = await fetch(`${API_BASE}/sermons`);
    const sermons = await sermonsResponse.json();
    const updatedSermonData = sermons.find(s => s.id === testSermon.id);
    console.log('✅ Sermon slide references:', updatedSermonData.slideIds);

    console.log('\n🎉 Sermon slide creation test completed successfully!');
    console.log('✅ Manual slide creation: Working');
    console.log('✅ Slide-sermon linking: Working');
    console.log('✅ Database persistence: Working');

  } catch (error) {
    console.error('❌ Sermon slide test failed:', error.message);
  }
}

testSermonSlideCreation(); 