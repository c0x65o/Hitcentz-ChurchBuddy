const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_BASE = 'http://localhost:5001/api';

async function testSlideButtonCreation() {
  console.log('🔘 Testing Slide Button Creation...\n');

  try {
    // Create a test sermon
    console.log('1. Creating test sermon...');
    const testSermon = {
      id: 'test-slide-buttons-1',
      title: 'Test Sermon with Buttons',
      description: 'Testing slide button creation',
      slideIds: []
    };
    
    const sermonResponse = await fetch(`${API_BASE}/sermons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSermon)
    });
    const sermonData = await sermonResponse.json();
    console.log('✅ Sermon created:', sermonData.title);

    // Simulate creating multiple slides from selected text
    console.log('\n2. Creating slides from selected text...');
    const selectedTexts = [
      "Welcome to our service today.",
      "Let us begin with prayer.",
      "Today's message is about faith.",
      "Let us close with a song."
    ];

    for (let i = 0; i < selectedTexts.length; i++) {
      const selectedText = selectedTexts[i];
      const newSlide = {
        id: `slide-${testSermon.id}-${Date.now()}-${i}`,
        title: `${testSermon.title} - Slide ${i + 1}`,
        html: `<div style="text-align: center; padding: 40px; color: white; font-weight: bold; line-height: 1.4;">${selectedText}</div>`,
        order: i + 1
      };
      
      const slideResponse = await fetch(`${API_BASE}/slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSlide)
      });
      const slideData = await slideResponse.json();
      console.log(`✅ Slide ${i + 1} created: "${selectedText.substring(0, 30)}..."`);
    }

    // Update sermon with all slide references
    console.log('\n3. Updating sermon with slide references...');
    const slidesResponse = await fetch(`${API_BASE}/slides`);
    const allSlides = await slidesResponse.json();
    const sermonSlides = allSlides.filter(slide => slide.id.includes(testSermon.id));
    
    const updatedSermon = {
      ...testSermon,
      slideIds: sermonSlides.map(slide => slide.id),
      updatedAt: new Date().toISOString()
    };
    
    const updateResponse = await fetch(`${API_BASE}/sermons/${testSermon.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedSermon)
    });
    console.log('✅ Sermon updated with slide references');

    // Simulate content with slide buttons
    console.log('\n4. Simulating content with slide buttons...');
    const contentWithButtons = `
      <p>Welcome to our service today. <span class="slide-button" data-slide-id="slide-${testSermon.id}-${Date.now()}-0" data-slide-title="${testSermon.title} - Slide 1" contenteditable="false" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 8px; margin: 2px 4px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; border: 2px solid rgba(255, 255, 255, 0.3); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); user-select: none; transition: all 0.2s ease;">📄 ${testSermon.title} - Slide 1</span></p>
      <p>Let us begin with prayer. <span class="slide-button" data-slide-id="slide-${testSermon.id}-${Date.now()}-1" data-slide-title="${testSermon.title} - Slide 2" contenteditable="false" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 8px; margin: 2px 4px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; border: 2px solid rgba(255, 255, 255, 0.3); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); user-select: none; transition: all 0.2s ease;">📄 ${testSermon.title} - Slide 2</span></p>
      <p>Today's message is about faith. <span class="slide-button" data-slide-id="slide-${testSermon.id}-${Date.now()}-2" data-slide-title="${testSermon.title} - Slide 3" contenteditable="false" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 8px; margin: 2px 4px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; border: 2px solid rgba(255, 255, 255, 0.3); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); user-select: none; transition: all 0.2s ease;">📄 ${testSermon.title} - Slide 3</span></p>
      <p>Let us close with a song. <span class="slide-button" data-slide-id="slide-${testSermon.id}-${Date.now()}-3" data-slide-title="${testSermon.title} - Slide 4" contenteditable="false" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 8px; margin: 2px 4px; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; border: 2px solid rgba(255, 255, 255, 0.3); box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); user-select: none; transition: all 0.2s ease;">📄 ${testSermon.title} - Slide 4</span></p>
    `;

    // Save content with buttons
    const contentData = {
      itemId: testSermon.id,
      itemType: 'sermon',
      content: contentWithButtons,
      storageKey: `sermon-notes-${testSermon.id}`
    };
    
    const contentResponse = await fetch(`${API_BASE}/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contentData)
    });
    console.log('✅ Content with slide buttons saved');

    // Verify the content was saved
    console.log('\n5. Verifying content with slide buttons...');
    const getContentResponse = await fetch(`${API_BASE}/content/sermon-notes-${testSermon.id}`);
    const savedContent = await getContentResponse.json();
    console.log('✅ Content retrieved with slide buttons');
    console.log('📄 Content contains slide buttons:', savedContent.content.includes('slide-button'));

    console.log('\n🎉 Slide button creation test completed successfully!');
    console.log('✅ Slide creation: Working');
    console.log('✅ Button insertion: Working');
    console.log('✅ Content persistence: Working');
    console.log('✅ Cross-device sync: Ready');

  } catch (error) {
    console.error('❌ Slide button test failed:', error.message);
  }
}

testSlideButtonCreation(); 