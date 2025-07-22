import React, { useState, useEffect } from 'react';
import styles from './AssetDecksPage.module.css';
import { IAssetDeck } from '../../types/IAssetDeck';
import { ISlide } from '../../types/ISlide';
import SlideEditorModal from '../SlideEditorModal/SlideEditorModal';
import SlideThumbnailList from '../SlideThumbnailList/SlideThumbnailList';

interface AssetDecksPageProps {
  // Props for integration with main app
}

export const AssetDecksPage: React.FC<AssetDecksPageProps> = () => {
  const [assetDecks, setAssetDecks] = useState<IAssetDeck[]>([]);
  const [currentDeck, setCurrentDeck] = useState<IAssetDeck | null>(null);
  const [currentSlide, setCurrentSlide] = useState<ISlide>({
    id: `slide-${Date.now()}`,
    title: 'TEXT',
    html: '<h1 style="color: white; text-align: center; font-size: 72px; margin: 0; padding: 20px;">TEXT</h1>',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  const [deckSlides, setDeckSlides] = useState<ISlide[]>([]);

  // Initialize with some sample data for development
  useEffect(() => {
    const sampleDecks: IAssetDeck[] = [
      {
        id: 'deck-1',
        name: 'Sunday Service Graphics',
        listOfSlideIDs: ['slide-1', 'slide-2'],
        autoplayBool: false,
        autoplayLoop: true,
        autoplayTimeInS: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'deck-2', 
        name: 'Welcome Slides',
        listOfSlideIDs: ['slide-3'],
        autoplayBool: true,
        autoplayLoop: true,
        autoplayTimeInS: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    setAssetDecks(sampleDecks);
    setCurrentDeck(sampleDecks[0]);
  }, []);

  // Load slides for current deck
  useEffect(() => {
    if (currentDeck) {
      // In a real app, this would fetch slides from a data store
      const mockSlides: ISlide[] = currentDeck.listOfSlideIDs.map((id, index) => ({
        id,
        title: `Slide ${index + 1}`,
        html: `<h1 style="color: white; text-align: center; font-size: 48px; margin: 0; padding: 20px;">Slide ${index + 1}</h1>`,
        order: index + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      setDeckSlides(mockSlides);
    }
  }, [currentDeck]);

  const handleCreateNewDeck = () => {
    const newDeck: IAssetDeck = {
      id: `deck-${Date.now()}`,
      name: `New Asset Deck ${assetDecks.length + 1}`,
      listOfSlideIDs: [],
      autoplayBool: false,
      autoplayLoop: true,
      autoplayTimeInS: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setAssetDecks([...assetDecks, newDeck]);
    setCurrentDeck(newDeck);
    setDeckSlides([]);
  };

  const handleSelectDeck = (deck: IAssetDeck) => {
    setCurrentDeck(deck);
  };

  const handleAddToDeck = () => {
    if (!currentDeck) return;

    // Create a copy of the current slide with new ID
    const slideToAdd: ISlide = {
      ...currentSlide,
      id: `slide-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add slide to deck's slide list
    const updatedDeck: IAssetDeck = {
      ...currentDeck,
      listOfSlideIDs: [...currentDeck.listOfSlideIDs, slideToAdd.id],
      updatedAt: new Date()
    };

    // Update deck in the list
    setAssetDecks(assetDecks.map(deck => 
      deck.id === currentDeck.id ? updatedDeck : deck
    ));
    setCurrentDeck(updatedDeck);
    setDeckSlides([...deckSlides, slideToAdd]);

    // Create a new blank slide for the editor
    setCurrentSlide({
      id: `slide-${Date.now()}`,
      title: 'TEXT',
      html: '<h1 style="color: white; text-align: center; font-size: 72px; margin: 0; padding: 20px;">TEXT</h1>',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  };

  const handleEditSlide = (slide: ISlide) => {
    setCurrentSlide(slide);
  };

  const handleSaveSlide = (updatedSlide: ISlide) => {
    setCurrentSlide(updatedSlide);
    
    // If this slide is already in the deck, update it
    const slideIndex = deckSlides.findIndex(s => s.id === updatedSlide.id);
    if (slideIndex !== -1) {
      const updatedDeckSlides = [...deckSlides];
      updatedDeckSlides[slideIndex] = updatedSlide;
      setDeckSlides(updatedDeckSlides);
    }
  };

  return (
    <div className={styles.assetDecksPage}>
      {/* Left Sidebar - Asset Decks List */}
      <div className={styles.leftSidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Asset Decks</h2>
          <button 
            className={styles.newDeckButton}
            onClick={handleCreateNewDeck}
          >
            Make New
          </button>
        </div>
        <div className={styles.decksList}>
          {assetDecks.map(deck => (
            <div 
              key={deck.id}
              className={`${styles.deckItem} ${currentDeck?.id === deck.id ? styles.active : ''}`}
              onClick={() => handleSelectDeck(deck)}
            >
              <div className={styles.deckName}>{deck.name}</div>
              <div className={styles.deckInfo}>
                {deck.listOfSlideIDs.length} slides
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center - Slide Editor Workspace */}
      <div className={styles.centerWorkspace}>
        <div className={styles.workspaceHeader}>
          <h2>{currentDeck ? `Editing: ${currentDeck.name}` : 'No Deck Selected'}</h2>
          <button 
            className={styles.addToDeckButton}
            onClick={handleAddToDeck}
            disabled={!currentDeck}
          >
            Add to Deck
          </button>
        </div>
        <div className={styles.editorContainer}>
          <SlideEditorModal
            slide={currentSlide}
            isOpen={true}
            onClose={() => {}} // Not used in embedded mode
            onSave={handleSaveSlide}
            isEmbedded={true}
          />
        </div>
      </div>

      {/* Right Sidebar - Slide Thumbnails */}
      <div className={styles.rightSidebar}>
        <div className={styles.sidebarHeader}>
          <h3>Deck Slides</h3>
          <div className={styles.slideCount}>
            {deckSlides.length} slides
          </div>
        </div>
        <div className={styles.thumbnailContainer}>
          <SlideThumbnailList
            slides={deckSlides}
            onSlideClick={handleEditSlide}
            onSlideEdit={handleEditSlide}
            onSlideDelete={(slideId: string) => {
              // Remove slide from deck
              const updatedSlides = deckSlides.filter(s => s.id !== slideId);
              setDeckSlides(updatedSlides);
              
              if (currentDeck) {
                const updatedDeck: IAssetDeck = {
                  ...currentDeck,
                  listOfSlideIDs: updatedSlides.map(s => s.id),
                  updatedAt: new Date()
                };
                setAssetDecks(assetDecks.map(deck => 
                  deck.id === currentDeck.id ? updatedDeck : deck
                ));
                setCurrentDeck(updatedDeck);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}; 