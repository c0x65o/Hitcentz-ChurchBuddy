import React, { useState } from 'react';
import './App.css';
import SlideRenderer from './components/SlideRenderer/SlideRenderer';
import SlideThumbnailList from './components/SlideThumbnailList/SlideThumbnailList';
import Sidebar from './components/Sidebar/Sidebar';
import SlideEditorModal from './components/SlideEditorModal/SlideEditorModal';
import TextEditor from './components/TextEditor/TextEditor';
import { ISlide } from './types/ISlide';

function App() {
  const [activeModule, setActiveModule] = useState<'presentation' | 'songs' | 'sermons' | 'asset-decks'>('songs');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<ISlide | null>(null);
  const [songsContent, setSongsContent] = useState('');
  const [sermonsContent, setSermonsContent] = useState('');
  const [currentSlide] = useState<ISlide>({
    id: '1',
    title: 'Welcome',
    html: '<h1>Welcome</h1>',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [slides, setSlides] = useState<ISlide[]>([
    {
      id: '1',
      title: 'Welcome',
      html: '<h1>Welcome</h1>',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Short Title',
      html: '<h1>Grace</h1>',
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      title: 'Medium Length',
      html: '<h1>Amazing Grace How Sweet</h1>',
      order: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      title: 'Long Text',
      html: '<h1>The Lord is my shepherd I shall not want</h1>',
      order: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      title: 'Very Long Text',
      html: '<h1>For God so loved the world that he gave his one and only Son that whoever believes in him shall not perish but have eternal life</h1>',
      order: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '6',
      title: 'Multi-line Text',
      html: '<h1>Line One<br/>Line Two<br/>Line Three</h1>',
      order: 6,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '7',
      title: 'Mixed Content',
      html: '<h1>Main Title</h1><p>Subtitle text here</p>',
      order: 7,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const handleEdit = (slideId: string) => {
    console.log('Edit slide:', slideId);
    // Find the slide to edit
    const slideToEdit = slides.find(slide => slide.id === slideId);
    if (slideToEdit) {
      setEditingSlide(slideToEdit);
      setModalOpen(true);
    }
  };

  const handleDelete = (slideId: string) => {
    console.log('Delete slide:', slideId);
  };

  const handleSongsSave = (content: string) => {
    console.log('Saving songs content:', content);
    setSongsContent(content);
  };

  const handleSermonsSave = (content: string) => {
    console.log('Saving sermons content:', content);
    setSermonsContent(content);
  };

  const handleSaveSlide = (updatedSlide: ISlide, shouldCloseModal = true) => {
    console.log('Saving slide:', updatedSlide, 'shouldCloseModal:', shouldCloseModal);
    
    // Update the slides array
    setSlides(prevSlides => 
      prevSlides.map(slide => 
        slide.id === updatedSlide.id ? updatedSlide : slide
      )
    );
    
    // Update currentSlide if it's the one being edited
    if (currentSlide.id === updatedSlide.id) {
      // Note: currentSlide is read-only in this demo, but in a real app you'd update it too
    }
    
    // Only close modal if explicitly requested (not for auto-saves)
    if (shouldCloseModal) {
      console.log('Closing modal after save');
      setModalOpen(false);
      setEditingSlide(null);
    } else {
      console.log('Auto-save completed, keeping modal open');
    }
  };

  return (
    <div className="App">
      {/* Module Navigation Tabs */}
      <div className="module-tabs">
        <div className="brand-section">
          <div className="brand-logo">⛪</div>
          <span className="brand-name">ChurchBuddy</span>
        </div>
        <div className="tab-group">
          <button 
            className={`tab ${activeModule === 'presentation' ? 'active' : ''}`}
            onClick={() => setActiveModule('presentation')}
          >
            Presentation
          </button>
        </div>
        <div className="tab-group">
          <button 
            className={`tab ${activeModule === 'songs' ? 'active' : ''}`}
            onClick={() => setActiveModule('songs')}
          >
            Songs
          </button>
          <button 
            className={`tab ${activeModule === 'sermons' ? 'active' : ''}`}
            onClick={() => setActiveModule('sermons')}
          >
            Sermons
          </button>
          <button 
            className={`tab ${activeModule === 'asset-decks' ? 'active' : ''}`}
            onClick={() => setActiveModule('asset-decks')}
          >
            Asset Decks
          </button>
        </div>
      </div>
      
      {/* Conditional rendering based on active module */}
      {activeModule === 'asset-decks' ? (
        <>
          {/* Module-aware Sidebar */}
          <Sidebar 
            activeModule={activeModule}
            onSelectItem={(item) => console.log(`Selected ${activeModule}:`, item)}
          />

          {/* Asset Decks: SlideEditor as primary workspace */}
          <main className="App-main asset-decks-workspace">
            <div className="asset-decks-editor">
              <SlideEditorModal 
                slide={currentSlide}
                isOpen={true}
                onClose={() => {}} // No-op since it's not a modal
                onSave={handleSaveSlide}
                isEmbedded={true}
              />
            </div>
          </main>
          
          {/* SlideThumbnailList as popout overlay */}
          <SlideThumbnailList
            slides={slides}
            onEdit={handleEdit}
            onDelete={handleDelete}
            title="Asset Deck Slides"
          />
        </>
      ) : activeModule === 'songs' ? (
        <>
          {/* Module-aware Sidebar */}
          <Sidebar 
            activeModule={activeModule}
            onSelectItem={(item) => console.log(`Selected ${activeModule}:`, item)}
          />

          {/* Songs: TextEditor as primary workspace */}
          <main className="App-main">
            <div className="text-editor-workspace">
              <TextEditor
                content={songsContent}
                onSave={handleSongsSave}
                placeholder="Start writing your song lyrics..."
                title="Song Editor"
              />
            </div>
          </main>
          {/* SlideThumbnailList as popout overlay for Songs */}
          <SlideThumbnailList
            slides={slides}
            onEdit={handleEdit}
            onDelete={handleDelete}
            title="Songs"
          />
        </>
      ) : activeModule === 'sermons' ? (
        <>
          {/* Module-aware Sidebar */}
          <Sidebar 
            activeModule={activeModule}
            onSelectItem={(item) => console.log(`Selected ${activeModule}:`, item)}
          />

          {/* Sermons: TextEditor as primary workspace */}
          <main className="App-main">
            <div className="text-editor-workspace">
              <TextEditor
                content={sermonsContent}
                onSave={handleSermonsSave}
                placeholder="Start writing your sermon notes..."
                title="Sermon Editor"
              />
            </div>
          </main>
          {/* SlideThumbnailList as popout overlay for Sermons */}
          <SlideThumbnailList
            slides={slides}
            onEdit={handleEdit}
            onDelete={handleDelete}
            title="Sermons"
          />
        </>
      ) : activeModule !== 'presentation' && (
        <>
          {/* Module-aware Sidebar */}
          <Sidebar 
            activeModule={activeModule}
            onSelectItem={(item) => console.log(`Selected ${activeModule}:`, item)}
          />

          <main className="App-main">
            {/* Fixed Slide Thumbnails */}
            <SlideThumbnailList
              slides={slides}
              onEdit={handleEdit}
              onDelete={handleDelete}
              title="Slides"
            />
          </main>
        </>
      )}

      {/* Test Modal */}
      <SlideEditorModal 
        slide={editingSlide || currentSlide}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSlide(null);
        }}
        onSave={handleSaveSlide}
      />
    </div>
  );
}

export default App;
