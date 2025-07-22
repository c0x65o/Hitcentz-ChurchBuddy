import React, { useState } from 'react';
import './App.css';
import SlideRenderer from './components/SlideRenderer/SlideRenderer';
import SlideThumbnailList from './components/SlideThumbnailList/SlideThumbnailList';
import Sidebar from './components/Sidebar/Sidebar';
import SlideEditorModal from './components/SlideEditorModal/SlideEditorModal';
import { AssetDecksPage } from './components/AssetDecksPage/AssetDecksPage';
import { ISlide } from './types/ISlide';

type ActiveTab = 'presentation' | 'asset-decks' | 'songs' | 'sermons' | 'flows' | 'bulletin';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('asset-decks');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<ISlide | null>(null);
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

  const tabs = [
    { id: 'presentation' as const, label: 'Presentation' },
    { id: 'asset-decks' as const, label: 'Asset Decks' },
    { id: 'songs' as const, label: 'Songs' },
    { id: 'sermons' as const, label: 'Sermons' },
    { id: 'flows' as const, label: 'Flows' },
    { id: 'bulletin' as const, label: 'Bulletin' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'asset-decks':
        return <AssetDecksPage />;
      case 'presentation':
      case 'songs':
      case 'sermons':
      case 'flows':
      case 'bulletin':
      default:
        return (
          <div className="coming-soon">
            <h2>{tabs.find(tab => tab.id === activeTab)?.label} Module</h2>
            <p>Coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="App">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default App;
