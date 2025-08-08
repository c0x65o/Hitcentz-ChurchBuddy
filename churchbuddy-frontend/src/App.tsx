import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import SlideRenderer from './components/SlideRenderer/SlideRenderer';
import SlideThumbnailList from './components/SlideThumbnailList/SlideThumbnailList';
import SlideThumbnail from './components/SlideThumbnail/SlideThumbnail';
import SlideGrid from './components/SlideGrid/SlideGrid';
import Sidebar from './components/Sidebar/Sidebar';
import SlideEditorModal from './components/SlideEditorModal/SlideEditorModal';
import TextEditor from './components/TextEditor/TextEditor';
import MyMediaLibrary from './components/MyMediaLibrary/MyMediaLibrary';
import CreateItemModal from './components/CreateItemModal/CreateItemModal';
import { ISlide } from './types/ISlide';
import { ISong } from './types/ISong';
import { ISermon } from './types/ISermon';
import { IAssetDeck } from './types/IAssetDeck';
import { IFlow } from './types/IFlow';
import apiService from './services/api';
import BulletinOverlay from './components/BulletinOverlay/BulletinOverlay';
import { v4 as uuidv4 } from 'uuid';
import { IBulletinMessage } from './types/IBulletinMessage';

function App() {
  console.log('🚀 App component rendering...');
  
  const [activeModule, setActiveModule] = useState<'presentation' | 'songs' | 'sermons' | 'asset-decks' | 'flows'>('songs');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<ISlide | null>(null);
  const [songsContent, setSongsContent] = useState('');
  const [sermonsContent, setSermonsContent] = useState('');
  const [showSongTitleModal, setShowSongTitleModal] = useState(false);
  const [songsList, setSongsList] = useState<ISong[]>([
    { id: 'song-1', title: 'Amazing Grace', description: 'Amazing grace, how sweet the sound...', slideIds: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 'song-2', title: 'How Great Thou Art', description: 'O Lord my God, when I in awesome wonder...', slideIds: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 'song-3', title: 'It Is Well', description: 'When peace like a river attendeth my way...', slideIds: [], createdAt: new Date(), updatedAt: new Date() }
  ]);
  
  const [sermonsList, setSermonsList] = useState<ISermon[]>([
    { id: 'sermon-1', title: 'The Prodigal Son', description: 'Luke 15:11-32...', slideIds: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 'sermon-2', title: 'Walking in Faith', description: 'Hebrews 11:1...', slideIds: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 'sermon-3', title: 'God\'s Love', description: 'John 3:16...', slideIds: [], createdAt: new Date(), updatedAt: new Date() }
  ]);
  
  const [assetDecksList, setAssetDecksList] = useState<IAssetDeck[]>([
    { id: 'deck-1', title: "click 'New Asset' to start", slideIds: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 'deck-2', title: 'Announcements', slideIds: [], createdAt: new Date(), updatedAt: new Date() },
    { id: 'deck-3', title: 'Prayer Requests', slideIds: [], createdAt: new Date(), updatedAt: new Date() }
  ]);
  const [selectedSong, setSelectedSong] = useState<ISong | null>(null);
  const [selectedSermon, setSelectedSermon] = useState<ISermon | null>(null);
  const [showSermonTitleModal, setShowSermonTitleModal] = useState(false);
  const [myMediaModalOpen, setMyMediaModalOpen] = useState(false);
  const [backgroundTargetItem, setBackgroundTargetItem] = useState<string | null>(null);
  const [itemsWithBackgrounds, setItemsWithBackgrounds] = useState<string[]>([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [isPreachMode, setIsPreachMode] = useState(false);
  
  // Asset Decks state
  const [selectedAssetDeck, setSelectedAssetDeck] = useState<IAssetDeck | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showAssetDeckTitleModal, setShowAssetDeckTitleModal] = useState(false);
  
  // Flows state
  const [flowsList, setFlowsList] = useState<IFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<IFlow | null>(null);
  const [showFlowTitleModal, setShowFlowTitleModal] = useState(false);
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  
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

  const handleDelete = async (slideId: string) => {
    console.log('Delete slide:', slideId);
    
    try {
      // Delete from backend
      if (backendConnected) {
        const response = await fetch(`http://localhost:5001/api/slides/${slideId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          console.error('Failed to delete slide from backend:', response.statusText);
        }
      }
      
      // Remove from local state
      setSlides(prev => prev.filter(slide => slide.id !== slideId));
      
      // Remove from collections that reference this slide
      setSongsList(prev => prev.map(song => ({
        ...song,
        slideIds: song.slideIds.filter(id => id !== slideId)
      })));
      
      setSermonsList(prev => prev.map(sermon => ({
        ...sermon,
        slideIds: sermon.slideIds.filter(id => id !== slideId)
      })));
      
      setAssetDecksList(prev => prev.map(deck => ({
        ...deck,
        slideIds: deck.slideIds.filter(id => id !== slideId)
      })));
      
      console.log('Slide deleted successfully');
    } catch (error) {
      console.error('Error deleting slide:', error);
    }
  };

  const handleSongsSave = (content: string) => {
    console.log('=== HANDLE SONGS SAVE CALLED ===');
    console.log('Content received:', content);
    console.log('Selected song:', selectedSong);
    console.log('Content trimmed:', content.trim());
    console.log('Content length:', content.length);
    
    setSongsContent(content);
    
    // Sync content to backend
    if (selectedSong && backendConnected) {
      const storageKey = `song-lyrics-${selectedSong.id}`;
      syncContentToBackend(storageKey, content, selectedSong.id, 'song');
    }
    
    // Generate slides from lyrics if a song is selected
    if (selectedSong && content.trim()) {
      console.log('Calling generateSlidesFromLyrics...');
      generateSlidesFromLyrics(content, selectedSong);
    } else {
      console.log('Not calling generateSlidesFromLyrics - no selected song or empty content');
    }
  };

  const generateSlidesFromLyrics = (lyrics: string, song: ISong) => {
    console.log('Generating slides from lyrics:', lyrics);
    console.log('Selected song:', song);
    
    // First, check if the content is plain text (no HTML tags)
    const isPlainText = !lyrics.includes('<') && !lyrics.includes('>');
    
    let textContent = '';
    
    if (isPlainText) {
      // Handle plain text directly - preserve empty lines
      console.log('Detected plain text input');
      textContent = lyrics;
    } else {
    // Extract text content from HTML with proper line break handling
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = lyrics;
    
      console.log('=== DEBUGGING PASTED LYRICS ===');
      console.log('Original HTML:', tempDiv.innerHTML);
      
      // First, handle consecutive <br> tags that represent empty lines
      // Replace consecutive <br> tags with double newlines to preserve empty lines
      let processedHtml = tempDiv.innerHTML
        .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '\n\n') // Consecutive <br> tags become double newlines
        .replace(/<br\s*\/?>/gi, '\n') // Single <br> tags become single newlines
      .replace(/<\/div>/gi, '\n')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/&nbsp;/gi, ' ') // Convert non-breaking spaces to regular spaces
      .replace(/\n\s*\n/g, '\n\n'); // Normalize multiple newlines
    
      console.log('Processed HTML:', processedHtml);
    
    // Create a new temp div with the converted HTML
    const cleanDiv = document.createElement('div');
      cleanDiv.innerHTML = processedHtml;
    
    // Use innerText to get the final text with proper line breaks
      textContent = cleanDiv.innerText || cleanDiv.textContent || '';
      
      console.log('Final text content:', textContent);
    }
    
    console.log('Final text content:', textContent);
    console.log('Text content length:', textContent.length);
    console.log('Text content contains newlines:', textContent.includes('\n'));
    console.log('Text content split by newlines:', textContent.split('\n'));
    console.log('Character codes of first 100 chars:', textContent.substring(0, 100).split('').map(c => c.charCodeAt(0)));
    
    // Check for empty lines specifically
    const lines = textContent.split('\n');
    console.log('All lines:', lines);
    console.log('Empty lines found:', lines.filter(line => line.trim() === ''));
    console.log('Non-empty lines:', lines.filter(line => line.trim() !== ''));
    console.log('=== END DEBUGGING ===');
    
    // Split lyrics by empty lines to create slides
    // Look for double newlines (empty lines) to split slides
    // Also handle cases where there might be spaces or other whitespace
    const slideTexts = textContent
      .split(/\n\s*\n/) // Split on double newlines with optional whitespace
      .map(text => text.trim()) // Trim each section
      .filter(text => text.length > 0); // Remove empty sections
    
    console.log('Detected slide texts:', slideTexts);
    console.log('Number of slides detected:', slideTexts.length);
    
    // Check if this song has a background set
    const hasBackground = itemsWithBackgrounds.includes(song.title);
    let backgroundUrl = '';
    
    if (hasBackground) {
      // Find the background URL from existing slides in this song
      const existingSlides = slides.filter(slide => song.slideIds.includes(slide.id));
      if (existingSlides.length > 0) {
        const commentRegex = /<!--BACKGROUND:(.*?)-->/i;
        const bgMatch = existingSlides[0].html.match(commentRegex);
        backgroundUrl = bgMatch ? bgMatch[1] : '';
        console.log('Found background URL for new slides:', backgroundUrl);
      }
    }
    
    // Remove all existing slides for this song
    setSlides(prev => prev.filter(slide => !song.slideIds.includes(slide.id)));
    
    // Clear the song's slideIds
    const updatedSong = { ...song, slideIds: [], updatedAt: new Date() };
    setSongsList(prev => prev.map(s => 
      s.id === song.id ? updatedSong : s
    ));
    
    // Update the selected song to keep it selected
    setSelectedSong(updatedSong);
    
    if (slideTexts.length === 0) {
      console.log('No slide texts detected - cleared all slides for this song');
      return;
    }
    
    // Create new slides for each verse/chorus
    const newSlides: ISlide[] = slideTexts.map((text, index) => {
      console.log(`Processing slide ${index + 1}:`, text);
      
      // Clean up the text and ensure proper line breaks
      const cleanText = text
        .trim()
        .replace(/\n/g, '<br/>') // Convert newlines to HTML breaks
        .replace(/\s+/g, ' ') // Normalize multiple spaces
        .trim();
      
      console.log(`Clean text for slide ${index + 1}:`, cleanText);
      
      // Add background comment if this song has a background
      const slideHtml = hasBackground && backgroundUrl 
        ? `<!--BACKGROUND:${backgroundUrl}--><div style="text-align: center; padding: 40px; color: white; font-weight: bold; line-height: 1.4;">${cleanText}</div>`
        : `<div style="text-align: center; padding: 40px; color: white; font-weight: bold; line-height: 1.4;">${cleanText}</div>`;
      
      return {
        id: `slide-${song.id}-${Date.now()}-${index}`,
        title: `${song.title} - Slide ${index + 1}`,
        html: slideHtml,
        order: index + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    console.log('Created slides:', newSlides);
    
    // Add new slides to the slides array
    setSlides(prev => [...prev, ...newSlides]);
    
    // Update the song's slideIds with the new slides
    const newSlideIds = newSlides.map(slide => slide.id);
    const finalUpdatedSong = { ...updatedSong, slideIds: newSlideIds, updatedAt: new Date() };
    setSongsList(prev => prev.map(s => 
      s.id === song.id ? finalUpdatedSong : s
    ));
    
    // Keep the song selected with updated slideIds
    setSelectedSong(finalUpdatedSong);
    
    console.log(`Generated ${newSlides.length} slides for song: ${song.title}`);
  };

  const handleSermonsSave = (content: string) => {
    console.log('Saving sermons content:', content);
    setSermonsContent(content);
    
    // Sync content to backend
    if (selectedSermon && backendConnected) {
      const storageKey = `sermon-notes-${selectedSermon.id}`;
      syncContentToBackend(storageKey, content, selectedSermon.id, 'sermon');
    }
    
    // Note: Sermon slides are created manually via "Make Slide" button
    // No auto-generation like songs
  };

  const generateSlidesFromSermon = (sermonContent: string, sermon: ISermon) => {
    console.log('Generating slides from sermon:', sermonContent);
    console.log('Selected sermon:', sermon);
    
    // Extract text content from HTML with proper line break handling
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sermonContent;
    
    // Convert HTML elements to newlines for better parsing
    // Replace <br> and <br/> with newlines
    const htmlWithNewlines = tempDiv.innerHTML
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<div[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/&nbsp;/gi, ' ') // Convert non-breaking spaces to regular spaces
      .replace(/\n\s*\n/g, '\n\n'); // Normalize multiple newlines
    
    console.log('=== DEBUGGING PASTED SERMON ===');
    console.log('Original HTML:', tempDiv.innerHTML);
    console.log('HTML with newlines:', htmlWithNewlines);
    console.log('HTML contains <br> tags:', tempDiv.innerHTML.includes('<br'));
    console.log('HTML contains </div> tags:', tempDiv.innerHTML.includes('</div>'));
    console.log('HTML contains <p> tags:', tempDiv.innerHTML.includes('<p>'));
    
    // Create a new temp div with the converted HTML
    const cleanDiv = document.createElement('div');
    cleanDiv.innerHTML = htmlWithNewlines;
    
    // Use innerText to get the final text with proper line breaks
    let textContent = cleanDiv.innerText || cleanDiv.textContent || '';
    
    // Special handling for Google Docs structure: look for multiple div elements
    // If we have multiple div elements in the original HTML, they represent sections separated by empty lines
    const divMatches = tempDiv.innerHTML.match(/<div[^>]*>/g);
    if (divMatches && divMatches.length > 1) {
      console.log('Detected multiple div elements (Google Docs structure)');
      // Split by div elements and add empty lines between them
      const divSections = tempDiv.innerHTML.split(/<div[^>]*>/);
      const processedSections = [];
      
      for (let i = 1; i < divSections.length; i++) { // Skip first empty section
        const section = divSections[i];
        if (section.trim()) {
          // Convert this div section to text
          const sectionDiv = document.createElement('div');
          sectionDiv.innerHTML = section;
          const sectionText = sectionDiv.innerText || sectionDiv.textContent || '';
          if (sectionText.trim()) {
            processedSections.push(sectionText.trim());
          }
        }
      }
      
      // Join sections with double newlines (empty lines)
      textContent = processedSections.join('\n\n');
      console.log('Processed Google Docs structure:', textContent);
    }
    
    console.log('Final text content:', textContent);
    console.log('Text content length:', textContent.length);
    console.log('Text content contains newlines:', textContent.includes('\n'));
    console.log('Text content split by newlines:', textContent.split('\n'));
    console.log('Character codes of first 100 chars:', textContent.substring(0, 100).split('').map(c => c.charCodeAt(0)));
    
    // Check for empty lines specifically
    const lines = textContent.split('\n');
    console.log('All lines:', lines);
    console.log('Empty lines found:', lines.filter(line => line.trim() === ''));
    console.log('Non-empty lines:', lines.filter(line => line.trim() !== ''));
    console.log('=== END DEBUGGING ===');
    
    // Split sermon by empty lines to create slides
    // Look for double newlines (empty lines) to split slides
    // Also handle cases where there might be spaces or other whitespace
    const slideTexts = textContent
      .split(/\n\s*\n/) // Split on double newlines with optional whitespace
      .map(text => text.trim()) // Trim each section
      .filter(text => text.length > 0); // Remove empty sections
    
    console.log('Detected slide texts:', slideTexts);
    console.log('Number of slides detected:', slideTexts.length);
    
    // Check if this sermon has a background set
    const hasBackground = itemsWithBackgrounds.includes(sermon.title);
    let backgroundUrl = '';
    
    if (hasBackground) {
      // Find the background URL from existing slides in this sermon
      const existingSlides = slides.filter(slide => sermon.slideIds.includes(slide.id));
      if (existingSlides.length > 0) {
        const commentRegex = /<!--BACKGROUND:(.*?)-->/i;
        const bgMatch = existingSlides[0].html.match(commentRegex);
        backgroundUrl = bgMatch ? bgMatch[1] : '';
        console.log('Found background URL for new slides:', backgroundUrl);
      }
    }
    
    // Remove all existing slides for this sermon
    setSlides(prev => prev.filter(slide => !sermon.slideIds.includes(slide.id)));
    
    // Clear the sermon's slideIds
    const updatedSermon = { ...sermon, slideIds: [], updatedAt: new Date() };
    setSermonsList(prev => prev.map(s => 
      s.id === sermon.id ? updatedSermon : s
    ));
    
    // Update the selected sermon to keep it selected
    setSelectedSermon(updatedSermon);
    
    if (slideTexts.length === 0) {
      console.log('No slide texts detected - cleared all slides for this sermon');
      return;
    }
    
    // Create new slides for each section
    const newSlides: ISlide[] = slideTexts.map((text, index) => {
      console.log(`Processing slide ${index + 1}:`, text);
      
      // Clean up the text and ensure proper line breaks
      const cleanText = text
        .trim()
        .replace(/\n/g, '<br/>') // Convert newlines to HTML breaks
        .replace(/\s+/g, ' ') // Normalize multiple spaces
        .trim();
      
      console.log(`Clean text for slide ${index + 1}:`, cleanText);
      
      // Add background comment if this sermon has a background
      const slideHtml = hasBackground && backgroundUrl 
        ? `<!--BACKGROUND:${backgroundUrl}--><div style="text-align: center; padding: 40px; color: white; font-weight: bold; line-height: 1.4;">${cleanText}</div>`
        : `<div style="text-align: center; padding: 40px; color: white; font-weight: bold; line-height: 1.4;">${cleanText}</div>`;
      
      return {
        id: `slide-${sermon.id}-${Date.now()}-${index}`,
        title: `${sermon.title} - Slide ${index + 1}`,
        html: slideHtml,
        order: index + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    console.log('Created slides:', newSlides);
    
    // Add new slides to the slides array
    setSlides(prev => [...prev, ...newSlides]);
    
    // Update the sermon's slideIds with the new slides
    const newSlideIds = newSlides.map(slide => slide.id);
    const finalUpdatedSermon = { ...updatedSermon, slideIds: newSlideIds, updatedAt: new Date() };
    setSermonsList(prev => prev.map(s => 
      s.id === sermon.id ? finalUpdatedSermon : s
    ));
    
    // Keep the sermon selected with updated slideIds
    setSelectedSermon(finalUpdatedSermon);
    
    console.log(`Generated ${newSlides.length} slides for sermon: ${sermon.title}`);
  };

  const handleMakeNewSong = () => {
    setShowSongTitleModal(true);
  };

  const handleSongSelect = (songTitle: string) => {
    console.log('Selected song:', songTitle);
    const song = songsList.find(s => s.title === songTitle);
    setSelectedSong(song || null);
  };

  const handleCreateSong = (title: string) => {
    if (title.trim()) {
      const newSong: ISong = {
        id: `song-${Date.now()}`,
        title: title.trim(),
        slideIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setSongsList(prev => [...prev, newSong]);
      setSelectedSong(newSong);
      setShowSongTitleModal(false);
      
      // Sync to backend
      if (backendConnected) {
        apiService.createSong(newSong).catch(err => {
          console.error('Failed to sync song to backend:', err);
        });
      }
    }
  };

  const handleMakeNewSermon = () => {
    setShowSermonTitleModal(true);
  };

  const handleSermonSelect = (sermonTitle: string) => {
    console.log('Selected sermon:', sermonTitle);
    const sermon = sermonsList.find(s => s.title === sermonTitle);
    setSelectedSermon(sermon || null);
  };

  const handleCreateSermon = (title: string) => {
    if (title.trim()) {
      const newSermon: ISermon = {
        id: `sermon-${Date.now()}`,
        title: title.trim(),
        slideIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setSermonsList(prev => [...prev, newSermon]);
      setSelectedSermon(newSermon);
      setShowSermonTitleModal(false);
      
      // Sync to backend
      if (backendConnected) {
        apiService.createSermon(newSermon).catch(err => {
          console.error('Failed to sync sermon to backend:', err);
        });
      }
    }
  };

  const handleMakeSermonSlide = async (selectedText: string) => {
    console.log('Creating sermon slide from text:', selectedText);
    
    if (!selectedSermon) {
      alert('Please select a sermon first.');
      return;
    }

    // Create a new slide from the selected text
    const newSlide: ISlide = {
      id: `slide-${selectedSermon.id}-${Date.now()}`,
      title: `${selectedSermon.title} - Slide`,
      html: `<div style="text-align: center; padding: 40px; color: white; font-weight: bold; line-height: 1.4;">${selectedText}</div>`,
      order: slides.filter(slide => selectedSermon.slideIds.includes(slide.id)).length + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add the slide to the slides array
    setSlides(prev => [...prev, newSlide]);

    // Update the sermon's slideIds
    const updatedSermon = {
      ...selectedSermon,
      slideIds: [...selectedSermon.slideIds, newSlide.id],
      updatedAt: new Date()
    };

    setSermonsList(prev => prev.map(s => 
      s.id === selectedSermon.id ? updatedSermon : s
    ));
    setSelectedSermon(updatedSermon);

    // Sync to backend
    if (backendConnected) {
      // Save the slide
      apiService.createSlide(newSlide).catch(err => {
        console.error('Failed to sync slide to backend:', err);
      });

      // Update the sermon
      apiService.updateSermon(updatedSermon.id, updatedSermon).catch(err => {
        console.error('Failed to sync sermon to backend:', err);
      });
    }

    console.log(`Created slide "${newSlide.title}" for sermon "${selectedSermon.title}"`);
    
    // Return the slide info for the TextEditor to create the button
    return {
      slideId: newSlide.id,
      slideTitle: newSlide.title,
      originalText: selectedText
    };
  };

  const handleClearSermonSlides = () => {
    if (!selectedSermon) {
      alert('Please select a sermon first.');
      return;
    }

    if (window.confirm('Are you sure you want to clear all slides for this sermon? This action cannot be undone.')) {
      // Remove all slide buttons from the editor content
      const editorContent = localStorage.getItem(`sermon-notes-${selectedSermon.id}`);
      if (editorContent) {
        // Remove all slide buttons from the content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = editorContent;
        const slideButtons = tempDiv.querySelectorAll('.slide-button');
        slideButtons.forEach(button => {
          button.remove();
        });
        
        // Update localStorage with cleaned content
        const cleanedContent = tempDiv.innerHTML;
        localStorage.setItem(`sermon-notes-${selectedSermon.id}`, cleanedContent);
      }

      // Clear slide buttons from the currently rendered editor
      const editorElement = document.querySelector('[contenteditable="true"]');
      if (editorElement) {
        const slideButtons = editorElement.querySelectorAll('.slide-button');
        slideButtons.forEach(button => {
          button.remove();
        });
      }

      // Remove slides from the slides array
      setSlides(prev => prev.filter(slide => !selectedSermon.slideIds.includes(slide.id)));

      // Clear the sermon's slideIds
      const updatedSermon = {
        ...selectedSermon,
        slideIds: [],
        updatedAt: new Date()
      };

      setSermonsList(prev => prev.map(s => 
        s.id === selectedSermon.id ? updatedSermon : s
      ));
      setSelectedSermon(updatedSermon);

      // Sync to backend
      if (backendConnected) {
        // Update the sermon
        apiService.updateSermon(updatedSermon.id, updatedSermon).catch(err => {
          console.error('Failed to sync sermon to backend:', err);
        });
      }

      console.log(`Cleared all slides for sermon "${selectedSermon.title}"`);
    }
  };

  // Asset Decks handlers
  const handleMakeNewAssetDeck = () => {
    setShowAssetDeckTitleModal(true);
  };

  const handleAssetDeckSelect = (assetDeckTitle: string) => {
    const assetDeck = assetDecksList.find(deck => deck.title === assetDeckTitle);
    if (assetDeck) {
      setSelectedAssetDeck(assetDeck);
      setCurrentSlideIndex(0); // Start with first slide
      
      // Load the first slide if the deck has slides
      if (assetDeck.slideIds.length > 0) {
        const firstSlideId = assetDeck.slideIds[0];
        const firstSlide = slides.find(s => s.id === firstSlideId);
        if (firstSlide) {
          setEditingSlide(firstSlide);
        }
      } else {
        // If deck is empty, automatically create a new asset (like clicking "New Asset")
        const newSlide: ISlide = {
          id: `slide-${Date.now()}`,
          title: 'New Asset',
          html: '<h1>New Asset</h1>',
          order: slides.length + 1,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setSlides(prev => [...prev, newSlide]);
        setEditingSlide(newSlide); // Load the new slide into the editor
        
        // Add the new slide to the selected asset deck
        const updatedAssetDeck = {
          ...assetDeck,
          slideIds: [newSlide.id],
          updatedAt: new Date()
        };
        
        setAssetDecksList(prev => prev.map(deck => 
          deck.id === assetDeck.id ? updatedAssetDeck : deck
        ));
        setSelectedAssetDeck(updatedAssetDeck);
        
        console.log('Auto-created new asset for empty deck:', newSlide);
      }
      
      console.log('Selected asset deck:', assetDeck);
    }
  };

  const handleCreateAssetDeck = (title: string) => {
    // Create a new blank slide first with proper div wrapper for activation
    const newSlide: ISlide = {
      id: `slide-${Date.now()}`,
      title: 'New Asset',
      html: '<div style="text-align: center; padding: 40px; color: white; font-weight: bold; line-height: 1.4;"><h1>New Asset</h1></div>',
      order: slides.length + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create the new asset deck
    const newAssetDeck: IAssetDeck = {
      id: `asset-deck-${Date.now()}`,
      title,
      slideIds: [newSlide.id], // Add the new slide to the deck immediately
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Update state
    setSlides(prev => [...prev, newSlide]);
    setAssetDecksList(prev => [...prev, newAssetDeck]);
    setSelectedAssetDeck(newAssetDeck);
    setCurrentSlideIndex(0);
    setEditingSlide(newSlide); // Load the new slide into the editor
    setShowAssetDeckTitleModal(false);
    
    console.log('Created new asset deck with initial slide:', newAssetDeck);
  };

  const handleAddToDeck = () => {
    if (selectedAssetDeck && editingSlide) {
      // Check if the slide is already in the deck
      const isSlideAlreadyInDeck = selectedAssetDeck.slideIds.includes(editingSlide.id);
      
      if (!isSlideAlreadyInDeck) {
        // Only add the slide if it's not already in the deck
        const updatedAssetDeck = {
          ...selectedAssetDeck,
          slideIds: [...selectedAssetDeck.slideIds, editingSlide.id],
          updatedAt: new Date()
        };
        
        setAssetDecksList(prev => prev.map(deck => 
          deck.id === selectedAssetDeck.id ? updatedAssetDeck : deck
        ));
        setSelectedAssetDeck(updatedAssetDeck);
        
        console.log('Added slide to asset deck:', editingSlide.id);
      } else {
        console.log('Slide already in asset deck:', editingSlide.id);
      }
    }
  };

  const handleNewAsset = () => {
    // Create a new blank slide with proper div wrapper for activation
    const newSlide: ISlide = {
      id: `slide-${Date.now()}`,
      title: 'New Asset',
      html: '', // Completely empty HTML for a truly blank slide
      order: slides.length + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setSlides(prev => [...prev, newSlide]);
    setEditingSlide(newSlide); // Load the new slide into the editor
    
    console.log('Created new asset slide:', newSlide);
  };

  const handlePreviousSlide = () => {
    if (selectedAssetDeck && currentSlideIndex > 0) {
      const newIndex = currentSlideIndex - 1;
      setCurrentSlideIndex(newIndex);
      const slideId = selectedAssetDeck.slideIds[newIndex];
      const slide = slides.find(s => s.id === slideId);
      if (slide) {
        setEditingSlide(slide);
      }
    }
  };

  const handleNextSlide = () => {
    if (selectedAssetDeck && currentSlideIndex < selectedAssetDeck.slideIds.length - 1) {
      const newIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(newIndex);
      const slideId = selectedAssetDeck.slideIds[newIndex];
      const slide = slides.find(s => s.id === slideId);
      if (slide) {
        setEditingSlide(slide);
      }
    }
  };

  // Flows handlers
  const handleMakeNewFlow = () => {
    setShowFlowTitleModal(true);
  };

  const handleFlowSelect = (flowTitle: string) => {
    const flow = flowsList.find(f => f.title === flowTitle);
    if (flow) {
      setSelectedFlow(flow);
      console.log('Selected flow:', flow);
    }
  };

  const handleCreateFlow = (title: string) => {
    const newFlow: IFlow = {
      id: `flow-${Date.now()}`,
      title,
      flowItems: [], // Start with empty flow
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setFlowsList(prev => [...prev, newFlow]);
    setSelectedFlow(newFlow);
    setShowFlowTitleModal(false);
    
    console.log('Created new flow:', newFlow);
  };

  const handleAddCollectionToFlow = (collectionId: string, collectionType: 'song' | 'sermon' | 'asset-deck') => {
    if (selectedFlow) {
      // Find the collection title
      const song = songsList.find(s => s.id === collectionId);
      const sermon = sermonsList.find(s => s.id === collectionId);
      const assetDeck = assetDecksList.find(a => a.id === collectionId);
      
      const collection = song || sermon || assetDeck;
      if (!collection) return;
      
      const newOrder = selectedFlow.flowItems.length;
      const newItem = {
        type: 'collection' as const,
        id: collectionId,
        title: collection.title,
        order: newOrder
      };
      
      const updatedFlow = {
        ...selectedFlow,
        flowItems: [...selectedFlow.flowItems, newItem],
        updatedAt: new Date()
      };
      
      setFlowsList(prev => prev.map(flow => 
        flow.id === selectedFlow.id ? updatedFlow : flow
      ));
      setSelectedFlow(updatedFlow);
      
      console.log('Added collection to flow:', collectionId);
    }
  };

  const handleAddNoteToFlow = (note: string) => {
    if (selectedFlow) {
      const newOrder = selectedFlow.flowItems.length;
      const newItem = {
        type: 'note' as const,
        id: `note-${Date.now()}`,
        title: note,
        note: note,
        order: newOrder
      };
      
      const updatedFlow = {
        ...selectedFlow,
        flowItems: [...selectedFlow.flowItems, newItem],
        updatedAt: new Date()
      };
      
      setFlowsList(prev => prev.map(flow => 
        flow.id === selectedFlow.id ? updatedFlow : flow
      ));
      setSelectedFlow(updatedFlow);
      
      console.log('Added note to flow:', note);
    }
  };

  const handleEditNote = (index: number, newNote: string) => {
    if (!selectedFlow) return;
    
    const updatedFlowItems = [...selectedFlow.flowItems];
    updatedFlowItems[index] = {
      ...updatedFlowItems[index],
      note: newNote
    };
    
    const updatedFlow = {
      ...selectedFlow,
      flowItems: updatedFlowItems,
      updatedAt: new Date()
    };
    
    setFlowsList(prev => prev.map(flow => 
      flow.id === selectedFlow.id ? updatedFlow : flow
    ));
    setSelectedFlow(updatedFlow);
    setEditingNoteIndex(null);
  };

  const handlePrintFlow = () => {
    if (selectedFlow) {
      console.log('Printing flow:', selectedFlow.title);
      
      // Get flow items in user-created order
      const flowItems = selectedFlow.flowItems.sort((a, b) => a.order - b.order);
      
      // Generate HTML for printing
      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${selectedFlow.title} - ChurchBuddy Flow</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .header { display: flex; align-items: center; margin-bottom: 20px; }
              .logo { width: 50px; height: 50px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 15px; }
              .flow-title { font-size: 24px; font-weight: bold; }
              .flow-subtitle { font-size: 16px; color: #666; margin-top: 5px; }
              .flow-item { 
                padding: 12px 15px; 
                margin: 2px 0; 
                border-radius: 6px; 
                border-left: 4px solid #667eea;
                background: white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              .note-item { 
                background: #f5f5f5 !important; 
                border-left-color: #FFC107;
                color: #666;
                font-style: italic;
              }
              .item-title { font-weight: bold; font-size: 14px; }
              .divider { height: 1px; background: #eee; margin: 8px 0; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">CB</div>
            <div>
              <div class="flow-title">${selectedFlow.title}</div>
              <div class="flow-subtitle">ChurchBuddy Flow</div>
            </div>
          </div>
          
          ${flowItems.map((item, index) => {
            if (item.type === 'collection') {
              const song = songsList.find(s => s.id === item.id);
              const sermon = sermonsList.find(s => s.id === item.id);
              const assetDeck = assetDecksList.find(a => a.id === item.id);
              
              const collection = song || sermon || assetDeck;
              const icon = song ? '🎵' : sermon ? '📖' : assetDeck ? '📚' : '📄';
              
              return `
                <div class="flow-item">
                  <div class="item-title">${icon} ${collection?.title || `Collection ${index + 1}`}</div>
                </div>
                ${index < flowItems.length - 1 ? '<div class="divider"></div>' : ''}
              `;
            } else if (item.type === 'note') {
              return `
                <div class="flow-item note-item">
                  <div class="item-title">📝 ${item.note || 'Note'}</div>
                </div>
                ${index < flowItems.length - 1 ? '<div class="divider"></div>' : ''}
              `;
            }
            return '';
          }).join('')}
        </body>
        </html>
      `;
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printHTML);
        printWindow.document.close();
        printWindow.focus();
        
        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    }
  };

  const handleFlowCollectionClick = (collectionId: string, collectionType: 'song' | 'sermon' | 'asset-deck') => {
    setSelectedFlowCollection({ id: collectionId, type: collectionType });
  };

  const handleReorderFlowItems = (fromIndex: number, toIndex: number, fromType: 'collection' | 'note') => {
    if (!selectedFlow) return;
    
    // Get the sorted flow items by order
    const sortedItems = [...selectedFlow.flowItems].sort((a, b) => a.order - b.order);
    
    // Move the item from fromIndex to toIndex
    const [movedItem] = sortedItems.splice(fromIndex, 1);
    sortedItems.splice(toIndex, 0, movedItem);
    
    // Update the order numbers to reflect the new positions
    const updatedFlowItems = sortedItems.map((item, index) => ({
      ...item,
      order: index
    }));
    
    const updatedFlow = {
      ...selectedFlow,
      flowItems: updatedFlowItems,
      updatedAt: new Date()
    };
    
    setFlowsList(prev => prev.map(flow => 
      flow.id === selectedFlow.id ? updatedFlow : flow
    ));
    setSelectedFlow(updatedFlow);
    
    console.log('Reordered flow items:', { fromIndex, toIndex, fromType });
  };

  const [draggedItem, setDraggedItem] = useState<{type: 'collection' | 'note', index: number} | null>(null);
  const [flowsSearchTerm, setFlowsSearchTerm] = useState<string>('');
  const [selectedFlowCollection, setSelectedFlowCollection] = useState<{id: string, type: 'song' | 'sermon' | 'asset-deck'} | null>(null);

  // Get current slide from selected asset deck
  const getCurrentSlide = () => {
    if (selectedAssetDeck && selectedAssetDeck.slideIds.length > 0) {
      const currentSlideId = selectedAssetDeck.slideIds[currentSlideIndex];
      const slide = slides.find(s => s.id === currentSlideId);
      return slide || currentSlide;
    }
    return currentSlide;
  };

  const handlePreachMode = () => {
    // Toggle between preach mode and edit mode
    setIsPreachMode(prev => !prev);
    console.log('Toggling preach mode:', !isPreachMode);
  };

  // Backend integration functions
  const checkBackendConnection = async () => {
    try {
      await apiService.healthCheck();
      setBackendConnected(true);
      console.log('✅ Backend connected successfully');
    } catch (error) {
      setBackendConnected(false);
      console.log('❌ Backend not available, using localStorage only');
    }
  };

  const loadDataFromBackend = async () => {
    if (!backendConnected) return;

    try {
      // Load songs from backend
      const backendSongs = await apiService.getSongs();
      setSongsList(backendSongs);

      // Load sermons from backend
      const backendSermons = await apiService.getSermons();
      setSermonsList(backendSermons);

      // Load slides from backend
      const backendSlides = await apiService.getSlides();
      setSlides(backendSlides);

      console.log('📊 Loaded data from backend:', {
        songs: backendSongs.length,
        sermons: backendSermons.length,
        slides: backendSlides.length
      });
    } catch (error) {
      console.error('Failed to load data from backend:', error);
    }
  };

  const syncContentToBackend = async (storageKey: string, content: string, itemId: string, itemType: string) => {
    if (!backendConnected) return;

    try {
      await apiService.saveContent({
        itemId,
        itemType,
        content,
        storageKey
      });
      console.log('💾 Synced content to backend:', storageKey);
    } catch (error) {
      console.error('Failed to sync content to backend:', error);
    }
  };

  // Initialize backend connection on app start
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Load data when backend connects
  useEffect(() => {
    if (backendConnected) {
      loadDataFromBackend();
    }
  }, [backendConnected]);

  const handleDeleteItem = (itemTitle: string) => {
    if (activeModule === 'songs') {
      setSongsList(prev => prev.filter(song => song.title !== itemTitle));
      if (selectedSong?.title === itemTitle) {
        setSelectedSong(null);
        setSongsContent('');
      }
    } else if (activeModule === 'sermons') {
      setSermonsList(prev => prev.filter(sermon => sermon.title !== itemTitle));
      if (selectedSermon?.title === itemTitle) {
        setSelectedSermon(null);
        setSermonsContent('');
      }
    } else if (activeModule === 'asset-decks') {
      setAssetDecksList(prev => prev.filter(deck => deck.title !== itemTitle));
      if (selectedAssetDeck?.title === itemTitle) {
        setSelectedAssetDeck(null);
        setEditingSlide(null);
        setCurrentSlideIndex(0);
      }
    }
    // Remove from backgrounds list if it was there
    setItemsWithBackgrounds(prev => prev.filter(item => item !== itemTitle));
  };

  const handleSelectBackground = (itemTitle: string) => {
    setBackgroundTargetItem(itemTitle);
    setMyMediaModalOpen(true);
  };

  const handleRemoveBackground = (itemTitle: string) => {
    // Remove background from all slides in this collection
    if (activeModule === 'songs') {
      const song = songsList.find(s => s.title === itemTitle);
      if (song) {
        const updatedSlides = slides.map(slide => {
          if (song.slideIds.includes(slide.id)) {
            return {
              ...slide,
              html: slide.html.replace(/<!--BACKGROUND:.*?-->/g, '')
            };
          }
          return slide;
        });
        setSlides(updatedSlides);
      }
    } else if (activeModule === 'sermons') {
      const sermon = sermonsList.find(s => s.title === itemTitle);
      if (sermon) {
        const updatedSlides = slides.map(slide => {
          if (sermon.slideIds.includes(slide.id)) {
            return {
              ...slide,
              html: slide.html.replace(/<!--BACKGROUND:.*?-->/g, '')
            };
          }
          return slide;
        });
        setSlides(updatedSlides);
      }
    }
    setItemsWithBackgrounds(prev => prev.filter(item => item !== itemTitle));
  };

  const handleMediaSelect = (media: any) => {
    console.log('Media selected:', media);
    
    // Handle collection backgrounds (for Presentation tab)
    if (backgroundTargetCollection) {
      const song = songsList.find(s => s.id === backgroundTargetCollection);
      const sermon = sermonsList.find(s => s.id === backgroundTargetCollection);
      const assetDeck = assetDecksList.find(a => a.id === backgroundTargetCollection);
      
      if (song) {
        const updatedSlides = slides.map(slide => {
          if (song.slideIds.includes(slide.id)) {
            const cleanHtml = slide.html.replace(/<!--BACKGROUND:.*?-->/g, '');
            const newHtml = `<!--BACKGROUND:${media.url}-->${cleanHtml}`;
            return {
              ...slide,
              html: newHtml
            };
          }
          return slide;
        });
        setSlides(updatedSlides);
        setCollectionsWithBackgrounds(prev => [...prev, backgroundTargetCollection]);
      } else if (sermon) {
        const updatedSlides = slides.map(slide => {
          if (sermon.slideIds.includes(slide.id)) {
            const cleanHtml = slide.html.replace(/<!--BACKGROUND:.*?-->/g, '');
            const newHtml = `<!--BACKGROUND:${media.url}-->${cleanHtml}`;
            return {
              ...slide,
              html: newHtml
            };
          }
          return slide;
        });
        setSlides(updatedSlides);
        setCollectionsWithBackgrounds(prev => [...prev, backgroundTargetCollection]);
      } else if (assetDeck) {
        const updatedSlides = slides.map(slide => {
          if (assetDeck.slideIds.includes(slide.id)) {
            const cleanHtml = slide.html.replace(/<!--BACKGROUND:.*?-->/g, '');
            const newHtml = `<!--BACKGROUND:${media.url}-->${cleanHtml}`;
            return {
              ...slide,
              html: newHtml
            };
          }
          return slide;
        });
        setSlides(updatedSlides);
        setCollectionsWithBackgrounds(prev => [...prev, backgroundTargetCollection]);
      }
      setMyMediaModalOpen(false);
      setBackgroundTargetCollection(null);
      return;
    }
    
    // Handle existing sidebar functionality
    if (backgroundTargetItem && activeModule === 'songs') {
      const song = songsList.find(s => s.title === backgroundTargetItem);
      console.log('Found song:', song);
      if (song) {
        // Apply background to all slides in this song using HTML comment format
        const updatedSlides = slides.map(slide => {
          if (song.slideIds.includes(slide.id)) {
            console.log('Applying background to slide:', slide.id);
            // Remove any existing background comments and add new one
            const cleanHtml = slide.html.replace(/<!--BACKGROUND:.*?-->/g, '');
            const newHtml = `<!--BACKGROUND:${media.url}-->${cleanHtml}`;
            console.log('New HTML:', newHtml);
            return {
              ...slide,
              html: newHtml
            };
          }
          return slide;
        });
        setSlides(updatedSlides);
        setItemsWithBackgrounds(prev => [...prev, backgroundTargetItem]);
      }
    } else if (backgroundTargetItem && activeModule === 'sermons') {
      const sermon = sermonsList.find(s => s.title === backgroundTargetItem);
      console.log('Found sermon:', sermon);
      if (sermon) {
        const updatedSlides = slides.map(slide => {
          if (sermon.slideIds.includes(slide.id)) {
            console.log('Applying background to slide:', slide.id);
            // Remove any existing background comments and add new one
            const cleanHtml = slide.html.replace(/<!--BACKGROUND:.*?-->/g, '');
            const newHtml = `<!--BACKGROUND:${media.url}-->${cleanHtml}`;
            console.log('New HTML:', newHtml);
            return {
              ...slide,
              html: newHtml
            };
          }
          return slide;
        });
        setSlides(updatedSlides);
        setItemsWithBackgrounds(prev => [...prev, backgroundTargetItem]);
      }
    }
    setMyMediaModalOpen(false);
    setBackgroundTargetItem(null);
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

  // Presentation tab state
  const [selectedPresentationFlow, setSelectedPresentationFlow] = useState<IFlow | null>(null);
  const [activeSlide, setActiveSlide] = useState<ISlide | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<{
    type: 'collection' | 'note';
    id: string;
    title: string;
    slides?: ISlide[];
    noteText?: string;
  } | null>(null);
  
  // Second display connection state
  const [isConnectedToSecondDisplay, setIsConnectedToSecondDisplay] = useState(false);
  const [secondDisplayWindow, setSecondDisplayWindow] = useState<Window | null>(null);

  // Active slide management
  const handleSlideActivation = (slide: ISlide) => {
    console.warn('🎯 HANDLE SLIDE ACTIVATION CALLED!');
    console.warn('Selected slide:', slide);
    console.warn('Selected slide ID:', slide.id);
    console.warn('Selected slide title:', slide.title);
    console.warn('Current isPreachMode:', isPreachMode);
    console.warn('Current activeModule:', activeModule);
    
    // Simply set the active slide without modifying HTML
    setActiveSlide(slide);
    
    console.warn('🚨 ACTIVE SLIDE SET TO:', slide.id);
    console.warn('🚨 ACTIVE SLIDE TITLE:', slide.title);
  };

  // Function to find the currently active slide
  const getActiveSlide = () => {
    return activeSlide || null;
  };

  // Keyboard navigation for Presentation tab
  const handleKeyDown = (event: KeyboardEvent) => {
    if (activeModule !== 'presentation' || !selectedPresentationFlow) return;
    
    const activeSlide = getActiveSlide();
    if (!activeSlide) return;
    
    // Get all slides from the current flow
    const allFlowSlides: ISlide[] = [];
    const sortedFlowItems = selectedPresentationFlow.flowItems.sort((a, b) => a.order - b.order);
    
    sortedFlowItems.forEach((item) => {
      if (item.type === 'collection') {
        const song = songsList.find(s => s.id === item.id);
        const sermon = sermonsList.find(s => s.id === item.id);
        const assetDeck = assetDecksList.find(a => a.id === item.id);
        
        if (song) {
          const songSlides = slides.filter(slide => song.slideIds.includes(slide.id));
          allFlowSlides.push(...songSlides);
        } else if (sermon) {
          const sermonSlides = slides.filter(slide => sermon.slideIds.includes(slide.id));
          allFlowSlides.push(...sermonSlides);
        } else if (assetDeck) {
          const assetSlides = slides.filter(slide => assetDeck.slideIds.includes(slide.id));
          allFlowSlides.push(...assetSlides);
        }
      }
    });
    
    const currentIndex = allFlowSlides.findIndex(slide => slide.id === activeSlide.id);
    
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        if (currentIndex > 0) {
          handleSlideActivation(allFlowSlides[currentIndex - 1]);
        }
        break;
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
        event.preventDefault();
        if (currentIndex < allFlowSlides.length - 1) {
          handleSlideActivation(allFlowSlides[currentIndex + 1]);
        }
        break;
    }
  };

  // Add keyboard event listener
  useEffect(() => {
    if (activeModule === 'presentation') {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [activeModule, selectedPresentationFlow, slides, songsList, sermonsList, assetDecksList]);

  // Auto-cycle state for collections
  const [autoCycleStates, setAutoCycleStates] = useState<{ [key: string]: boolean }>({});
  const [autoCycleTimers, setAutoCycleTimers] = useState<{ [key: string]: NodeJS.Timeout | null }>({});
  const [autoCycleTiming, setAutoCycleTiming] = useState<{ [key: string]: number }>({});
  const [collectionsWithBackgrounds, setCollectionsWithBackgrounds] = useState<string[]>([]);
  const [backgroundTargetCollection, setBackgroundTargetCollection] = useState<string | null>(null);

  // Auto-cycle function for a collection
  const handleAutoCycle = (collectionId: string, slides: ISlide[]) => {
    const isCurrentlyCycling = autoCycleStates[collectionId];
    
    if (isCurrentlyCycling) {
      // Stop cycling
      const timer = autoCycleTimers[collectionId];
      if (timer) {
        clearInterval(timer);
      }
      setAutoCycleStates(prev => ({ ...prev, [collectionId]: false }));
      setAutoCycleTimers(prev => ({ ...prev, [collectionId]: null }));
    } else {
      // Start cycling
      let currentIndex = 0;
      const timing = autoCycleTiming[collectionId] || 1000; // Default to 1 second
      const timer = setInterval(() => {
        if (slides.length > 0) {
          handleSlideActivation(slides[currentIndex]);
          currentIndex = (currentIndex + 1) % slides.length; // Loop back to beginning
        }
      }, timing);
      
      setAutoCycleStates(prev => ({ ...prev, [collectionId]: true }));
      setAutoCycleTimers(prev => ({ ...prev, [collectionId]: timer }));
    }
  };

  // Handle timing change
  const handleTimingChange = (collectionId: string, timing: number) => {
    setAutoCycleTiming(prev => ({ ...prev, [collectionId]: timing }));
    
    // If currently cycling, restart with new timing
    if (autoCycleStates[collectionId]) {
      const timer = autoCycleTimers[collectionId];
      if (timer) {
        clearInterval(timer);
      }
      
      const collectionSlides: ISlide[] = (() => {
        const song = songsList.find(s => s.id === collectionId);
        const sermon = sermonsList.find(s => s.id === collectionId);
        const assetDeck = assetDecksList.find(a => a.id === collectionId);
        
        if (song) {
          return slides.filter(slide => song.slideIds.includes(slide.id));
        } else if (sermon) {
          return slides.filter(slide => sermon.slideIds.includes(slide.id));
        } else if (assetDeck) {
          return slides.filter(slide => assetDeck.slideIds.includes(slide.id));
        }
        return [];
      })();
      
      let currentIndex = 0;
      const newTimer = setInterval(() => {
        if (collectionSlides.length > 0) {
          handleSlideActivation(collectionSlides[currentIndex]);
          currentIndex = (currentIndex + 1) % collectionSlides.length;
        }
      }, timing);
      
      setAutoCycleTimers(prev => ({ ...prev, [collectionId]: newTimer }));
    }
  };

  // Handle background selection for collections
  const handleCollectionBackgroundSelect = (collectionId: string) => {
    setBackgroundTargetCollection(collectionId);
    setMyMediaModalOpen(true);
  };

  // Handle background removal for collections
    const handleCollectionBackgroundRemove = (collectionId: string) => {
    const song = songsList.find(s => s.id === collectionId);
    const sermon = sermonsList.find(s => s.id === collectionId);
    const assetDeck = assetDecksList.find(a => a.id === collectionId);

    if (song) {
      const updatedSlides = slides.map(slide => {
        if (song.slideIds.includes(slide.id)) {
          return {
            ...slide,
            html: slide.html.replace(/<!--BACKGROUND:.*?-->/g, '')
          };
        }
        return slide;
      });
      setSlides(updatedSlides);
    } else if (sermon) {
      const updatedSlides = slides.map(slide => {
        if (sermon.slideIds.includes(slide.id)) {
          return {
            ...slide,
            html: slide.html.replace(/<!--BACKGROUND:.*?-->/g, '')
          };
        }
        return slide;
      });
      setSlides(updatedSlides);
    } else if (assetDeck) {
      const updatedSlides = slides.map(slide => {
        if (assetDeck.slideIds.includes(slide.id)) {
          return {
            ...slide,
            html: slide.html.replace(/<!--BACKGROUND:.*?-->/g, '')
          };
        }
        return slide;
      });
      setSlides(updatedSlides);
    }

    setCollectionsWithBackgrounds(prev => prev.filter(id => id !== collectionId));
  };

  // Second display connection functions
  const handleConnectToSecondDisplay = () => {
    if (isConnectedToSecondDisplay) {
      // Disconnect
      if (secondDisplayWindow && !secondDisplayWindow.closed) {
        secondDisplayWindow.close();
      }
      setIsConnectedToSecondDisplay(false);
      setSecondDisplayWindow(null);
    } else {
      // Connect
      const activeSlide = getActiveSlide();
      if (!activeSlide) {
        alert('Please select an active slide first');
        return;
      }

      const newWindow = window.open(
        '/second-display.html',
        'secondDisplay',
        'width=1920,height=1080,fullscreen=yes,scrollbars=no,resizable=no'
      );

      if (newWindow) {
        setSecondDisplayWindow(newWindow);
        setIsConnectedToSecondDisplay(true);
        
        // Send the active slide data immediately and after load
        newWindow.postMessage({
          type: 'SLIDE_DATA',
          slide: activeSlide
        }, '*');
        
        newWindow.addEventListener('load', () => {
          newWindow.postMessage({
            type: 'SLIDE_DATA',
            slide: activeSlide
          }, '*');
        });
      } else {
        alert('Failed to open second display window. Please allow popups for this site.');
      }
    }
  };

  // Update second display when active slide changes
  useEffect(() => {
    if (isConnectedToSecondDisplay && secondDisplayWindow && !secondDisplayWindow.closed) {
      const activeSlide = getActiveSlide();
      if (activeSlide) {
        secondDisplayWindow.postMessage({
          type: 'SLIDE_DATA',
          slide: activeSlide
        }, '*');
      }
    }
  }, [activeSlide, isConnectedToSecondDisplay, secondDisplayWindow]);

  // Listen for messages from second display window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'REQUEST_SLIDE_DATA') {
        const activeSlide = getActiveSlide();
        console.log('Second display requested slide data:', activeSlide);
        if (activeSlide && secondDisplayWindow) {
          secondDisplayWindow.postMessage({
            type: 'SLIDE_DATA',
            slide: activeSlide
          }, '*');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [secondDisplayWindow]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(autoCycleTimers).forEach(timer => {
        if (timer) clearInterval(timer);
      });
    };
  }, [autoCycleTimers]);

  // Bulletin overlay state
  const [bulletinOverlayOpen, setBulletinOverlayOpen] = useState(false);
  const toggleBulletinOverlay = () => {
    setBulletinOverlayOpen(prev => !prev);
  };

  // Bulletin messages state
  const [bulletinMessages, setBulletinMessages] = useState<IBulletinMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const MESSAGES_PER_PAGE = 10;

  // Function to add a new bulletin message
  const handleAddBulletin = (name: string, messageText: string, messageTitle?: string) => {
    const newBulletin: IBulletinMessage = {
      id: uuidv4(),
      name,
      messageText,
      messageTitle: messageTitle || '', // Ensure it's a string even if optional
      timestamp: new Date(),
    };
    setBulletinMessages(prev => [newBulletin, ...prev]); // Add new message to the top
    // In a real app, this would send to backend
  };

  // Simulate fetching initial/more bulletins
  useEffect(() => {
    // Load from localStorage or simulate initial data
    const storedBulletins = localStorage.getItem('churchbuddyBulletins');
    if (storedBulletins) {
      setBulletinMessages(JSON.parse(storedBulletins).map((b: any) => ({
        ...b,
        timestamp: new Date(b.timestamp) // Convert timestamp string back to Date object
      })));
    } else {
      // Simulate some initial bulletins
      const initialBulletins: IBulletinMessage[] = Array.from({ length: 15 }).map((_, i) => ({
        id: uuidv4(),
        name: `Admin${15 - i}`,
        messageTitle: i % 3 === 0 ? `Important Announcement ${15 - i}` : undefined,
        messageText: `This is a simulated bulletin message number ${15 - i}. It contains important information for the congregation.`,
        timestamp: new Date(Date.now() - (15 - i) * 3600 * 1000),
      }));
      setBulletinMessages(initialBulletins);
    }
  }, []);

  // Save bulletins to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('churchbuddyBulletins', JSON.stringify(bulletinMessages));
  }, [bulletinMessages]);

  return (
    <div className="App">
      {/* Module Navigation Tabs */}
      <div className="module-tabs">
        <div className="brand-section">
          <div className="brand-logo">⛪</div>
          <span className="brand-name">ChurchBuddy</span>
        </div>
        <div className="tab-group-main">
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
          <button 
            className={`tab ${activeModule === 'flows' ? 'active' : ''}`}
            onClick={() => setActiveModule('flows')}
          >
            Flows
          </button>
        </div>
        <div className="tab-group-presentation">
          <button 
            className={`tab ${activeModule === 'presentation' ? 'active' : ''}`}
            onClick={() => setActiveModule('presentation')}
          >
            Presentation
          </button>
        </div>
      </div>
      
      {/* Conditional rendering based on active module */}
      {activeModule === 'asset-decks' ? (
        <>
          {/* Module-aware Sidebar */}
          <Sidebar 
            activeModule={activeModule}
            onSelectItem={handleAssetDeckSelect}
            onMakeNew={handleMakeNewAssetDeck}
            customAssetDecksList={assetDecksList}
            onDeleteItem={handleDeleteItem}
            onSelectBackground={handleSelectBackground}
            onRemoveBackground={handleRemoveBackground}
            itemsWithBackgrounds={itemsWithBackgrounds}
          />

          {/* Asset Decks: SlideEditor as primary workspace */}
          <main className="App-main asset-decks-workspace">
            <div className="asset-decks-editor">
              {/* Asset Decks Toolbar */}
              <div className="asset-decks-toolbar">
                <div className="toolbar-left">
                  <button 
                    className="toolbar-button"
                    onClick={handleAddToDeck}
                    title="Add current slide to selected asset deck"
                    disabled={!selectedAssetDeck}
                  >
                    Save
                  </button>
                  <button 
                    className="toolbar-button"
                    onClick={handleNewAsset}
                    title="Create a new blank slide"
                  >
                    New Slide
                  </button>
                </div>
                
                <div className="toolbar-right">
                  <button 
                    className="toolbar-button"
                    onClick={handlePreviousSlide}
                    title="Previous slide"
                    disabled={!selectedAssetDeck || currentSlideIndex === 0}
                  >
                    Previous
                  </button>
                  <span className="slide-counter">
                    {selectedAssetDeck ? `${currentSlideIndex + 1} / ${selectedAssetDeck.slideIds.length}` : '0 / 0'}
                  </span>
                  <button 
                    className="toolbar-button"
                    onClick={handleNextSlide}
                    title="Next slide"
                    disabled={!selectedAssetDeck || currentSlideIndex >= (selectedAssetDeck?.slideIds.length || 0) - 1}
                  >
                    Next
                  </button>
                </div>
              </div>
              
              {/* Slide Editor or Welcome Message */}
              {editingSlide ? (
              <SlideEditorModal 
                  key={editingSlide.id} // Force re-render when slide changes
                  slide={editingSlide}
                isOpen={true}
                onClose={() => {}} // No-op since it's not a modal
                onSave={handleSaveSlide}
                isEmbedded={true}
              />
              ) : (
              <div className="asset-decks-welcome">
                <div className="welcome-content">
                  <h2>Welcome to Asset Decks</h2>
                  <p>Select an asset deck from the sidebar to start creating slides, or click "New Slide" to create a new slide.</p>
                  <div className="welcome-actions">
                    <button 
                      className="welcome-button"
                      onClick={handleNewAsset}
                    >
                      Create New Slide
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>
          </main>
          
          {/* SlideThumbnailList as popout overlay */}
          <SlideThumbnailList
            slides={slides.filter(slide => selectedAssetDeck?.slideIds.includes(slide.id) || !selectedAssetDeck)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            title={selectedAssetDeck?.title || "Asset Deck Slides"}
            hideEditButton={true}
          />
        </>
      ) : activeModule === 'songs' ? (
        <>
          {/* Module-aware Sidebar */}
          <Sidebar 
            activeModule={activeModule}
            onSelectItem={handleSongSelect}
            onMakeNew={handleMakeNewSong}
            customSongsList={songsList}
            onDeleteItem={handleDeleteItem}
            onSelectBackground={handleSelectBackground}
            onRemoveBackground={handleRemoveBackground}
            itemsWithBackgrounds={itemsWithBackgrounds}
          />

          {/* Songs: TextEditor as primary workspace */}
          <main className="App-main">
            <div className="text-editor-workspace">
              <TextEditor
                onSave={handleSongsSave}
                placeholder="Start writing your song lyrics..."
                title={selectedSong ? selectedSong.title : "Song Editor"}
                storageKey={selectedSong ? `song-lyrics-${selectedSong.id}` : 'songs-content'}
              />
            </div>
          </main>
          {/* SlideThumbnailList as popout overlay for Songs */}
          <SlideThumbnailList
            slides={slides.filter(slide => selectedSong?.slideIds.includes(slide.id) || !selectedSong)}
            onEdit={handleEdit}
            title={selectedSong?.title || "Songs"}
          />
        </>
      ) : activeModule === 'flows' ? (
        <>
          {/* Module-aware Sidebar */}
          <Sidebar 
            activeModule={activeModule}
            onSelectItem={handleFlowSelect}
            onMakeNew={handleMakeNewFlow}
            customFlowsList={flowsList}
            onDeleteItem={handleDeleteItem}
            onSelectBackground={handleSelectBackground}
            onRemoveBackground={handleRemoveBackground}
            itemsWithBackgrounds={itemsWithBackgrounds}
          />

          {/* Flows: Main workspace */}
          <main className="App-main">
            <div className="flows-workspace">
              <div className="flows-editor">
                {/* Flow Content */}
                <div className="flow-content">
                  {selectedFlow ? (
                    <div className="flows-drag-drop-workspace">
                      {/* Search Bar and Add Note */}
                      <div className="flows-search-bar">
                        <input
                          type="text"
                          placeholder="Search collections..."
                          className="flows-search-input"
                          value={flowsSearchTerm}
                          onChange={(e) => setFlowsSearchTerm(e.target.value)}
                        />
                        <button
                          className="add-note-button"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', JSON.stringify({
                              type: 'note',
                              id: `note-${Date.now()}`,
                              title: 'New Note'
                            }));
                          }}
                          title="Drag to add note to flow"
                        >
                          📝 Sticky Note
                        </button>
                      </div>
                      
                      {/* Main Content Area - Side by Side */}
                      <div className="flows-main-content">
                        {/* Collections Container - Vertical Stack */}
                        <div className="collections-container">
                          {/* Songs Section */}
                          <div className="collection-section">
                            <h4 className="section-title">Songs</h4>
                            <div className="collection-items">
                              {songsList
                                .filter(song => 
                                  flowsSearchTerm === '' || 
                                  song.title.toLowerCase().includes(flowsSearchTerm.toLowerCase())
                                )
                                .map((song) => (
                              <div
                                key={song.id}
                                className="draggable-item"
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', JSON.stringify({
                                    type: 'song',
                                    id: song.id,
                                    title: song.title
                                  }));
                                }}
                              >
                                🎵 {song.title}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                          {/* Sermons Section */}
                          <div className="collection-section">
                            <h4 className="section-title">Sermons</h4>
                            <div className="collection-items">
                              {sermonsList
                                .filter(sermon => 
                                  flowsSearchTerm === '' || 
                                  sermon.title.toLowerCase().includes(flowsSearchTerm.toLowerCase())
                                )
                                .map((sermon) => (
                              <div
                                key={sermon.id}
                                className="draggable-item"
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', JSON.stringify({
                                    type: 'sermon',
                                    id: sermon.id,
                                    title: sermon.title
                                  }));
                                }}
                              >
                                📖 {sermon.title}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                          {/* Asset Decks Section */}
                          <div className="collection-section">
                            <h4 className="section-title">Asset Decks</h4>
                            <div className="collection-items">
                              {assetDecksList
                                .filter(assetDeck => 
                                  flowsSearchTerm === '' || 
                                  assetDeck.title.toLowerCase().includes(flowsSearchTerm.toLowerCase())
                                )
                                .map((assetDeck) => (
                              <div
                                key={assetDeck.id}
                                className="draggable-item"
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', JSON.stringify({
                                    type: 'asset-deck',
                                    id: assetDeck.id,
                                    title: assetDeck.title
                                  }));
                                }}
                              >
                                📚 {assetDeck.title}
                              </div>
                            ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Current Flow Column */}
                        <div className="flow-column current-flow">
                          <h4 className="column-title">Current Flow: {selectedFlow.title}</h4>
                          <div 
                            className="column-items drop-zone"
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('drag-over');
                              
                              try {
                                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                
                                // Only handle external drops (from source columns), ignore internal reordering
                                if (!data.isInternal && (data.type === 'song' || data.type === 'sermon' || data.type === 'asset-deck' || data.type === 'note')) {
                                  if (data.type === 'note') {
                                    handleAddNoteToFlow('Click to type');
                                  } else {
                                    handleAddCollectionToFlow(data.id, data.type);
                                  }
                                }
                                // Internal reordering is handled by individual flow items
                              } catch (error) {
                                console.error('Error parsing drag data:', error);
                              }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add('drag-over');
                            }}
                            onDragLeave={(e) => {
                              e.currentTarget.classList.remove('drag-over');
                            }}
                          >
                            {selectedFlow.flowItems.length > 0 ? (
                              <>
                                {/* Display flow items in user-created order */}
                                {selectedFlow.flowItems
                                  .sort((a, b) => a.order - b.order) // Sort by user order
                                  .map((item, index) => {
                                    if (item.type === 'collection') {
                                      const song = songsList.find(s => s.id === item.id);
                                      const sermon = sermonsList.find(s => s.id === item.id);
                                      const assetDeck = assetDecksList.find(a => a.id === item.id);
                                      
                                      const collection = song || sermon || assetDeck;
                                      const icon = song ? '🎵' : sermon ? '📖' : assetDeck ? '📚' : '📄';
                                      
                                      return (
                                        <div 
                                          key={`collection-${item.id}`} 
                                          className={`flow-item draggable-flow-item ${selectedFlowCollection?.id === item.id ? 'selected' : ''}`}
                                          draggable
                                          onClick={() => {
                                            if (song) {
                                              handleFlowCollectionClick(item.id, 'song');
                                            } else if (sermon) {
                                              handleFlowCollectionClick(item.id, 'sermon');
                                            } else if (assetDeck) {
                                              handleFlowCollectionClick(item.id, 'asset-deck');
                                            }
                                          }}
                                          onDragStart={(e) => {
                                            e.dataTransfer.setData('text/plain', JSON.stringify({
                                              type: 'collection',
                                              index: index,
                                              collectionId: item.id,
                                              isInternal: true
                                            }));
                                          }}
                                          onDragOver={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.add('drag-over');
                                          }}
                                          onDragLeave={(e) => {
                                            e.currentTarget.classList.remove('drag-over');
                                          }}
                                          onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('drag-over');
                                            try {
                                              const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                              if (data.isInternal) {
                                                handleReorderFlowItems(data.index, index, data.type);
                                              }
                                            } catch (error) {
                                              console.error('Error reordering flow items:', error);
                                            }
                                          }}
                                        >
                                          <span className="flow-item-content">
                                            {collection?.title || `Collection ${index + 1}`}
                                          </span>
                                          <button 
                                            className="delete-flow-item"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const updatedFlow = {
                                                ...selectedFlow,
                                                flowItems: selectedFlow.flowItems.filter((_, i) => i !== index),
                                                updatedAt: new Date()
                                              };
                                              setFlowsList(prev => prev.map(flow => 
                                                flow.id === selectedFlow.id ? updatedFlow : flow
                                              ));
                                              setSelectedFlow(updatedFlow);
                                            }}
                                            title="Remove from flow"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      );
                                    } else if (item.type === 'note') {
                                      return (
                                        <div 
                                          key={`note-${item.id}`} 
                                          className="flow-item note-flow-item draggable-flow-item"
                                          draggable
                                          onDragStart={(e) => {
                                            e.dataTransfer.setData('text/plain', JSON.stringify({
                                              type: 'note',
                                              index: index,
                                              noteId: item.id,
                                              isInternal: true
                                            }));
                                          }}
                                          onDragOver={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.add('drag-over');
                                          }}
                                          onDragLeave={(e) => {
                                            e.currentTarget.classList.remove('drag-over');
                                          }}
                                          onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('drag-over');
                                            try {
                                              const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                                              if (data.isInternal) {
                                                handleReorderFlowItems(data.index, index, data.type);
                                              }
                                            } catch (error) {
                                              console.error('Error reordering flow items:', error);
                                            }
                                          }}
                                        >
                                          {editingNoteIndex === index ? (
                                            <input
                                              type="text"
                                              className="note-input"
                                              value={item.note || ''}
                                              onChange={(e) => {
                                                const updatedFlowItems = [...selectedFlow.flowItems];
                                                updatedFlowItems[index] = {
                                                  ...updatedFlowItems[index],
                                                  note: e.target.value
                                                };
                                                const updatedFlow = {
                                                  ...selectedFlow,
                                                  flowItems: updatedFlowItems,
                                                  updatedAt: new Date()
                                                };
                                                setFlowsList(prev => prev.map(flow => 
                                                  flow.id === selectedFlow.id ? updatedFlow : flow
                                                ));
                                                setSelectedFlow(updatedFlow);
                                              }}
                                              onBlur={() => setEditingNoteIndex(null)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  setEditingNoteIndex(null);
                                                } else if (e.key === 'Escape') {
                                                  setEditingNoteIndex(null);
                                                }
                                              }}
                                              autoFocus
                                            />
                                          ) : (
                                            <span 
                                              className="flow-item-content"
                                              onClick={() => setEditingNoteIndex(index)}
                                              style={{ cursor: 'pointer' }}
                                            >
                                              {item.note || 'Click to type'}
                                            </span>
                                          )}
                                          <button 
                                            className="delete-flow-item"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const updatedFlow = {
                                                ...selectedFlow,
                                                flowItems: selectedFlow.flowItems.filter((_, i) => i !== index),
                                                updatedAt: new Date()
                                              };
                                              setFlowsList(prev => prev.map(flow => 
                                                flow.id === selectedFlow.id ? updatedFlow : flow
                                              ));
                                              setSelectedFlow(updatedFlow);
                                            }}
                                            title="Remove from flow"
                                          >
                                            🗑️
                                          </button>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                              </>
                            ) : (
                              <div className="empty-flow">
                                <p>Drag items here to build your flow</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Print Flow Button */}
                          <div className="flow-print-section">
                            <button 
                              className="print-flow-button"
                              onClick={handlePrintFlow}
                              title="Print flow"
                              disabled={!selectedFlow}
                            >
                              🖨️ Print Flow
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-flow-selected">
                      <h3>Flows Module</h3>
                      <p>Select a flow from the sidebar or create a new one to get started.</p>
                      <p>Flows organize sequences of Songs, Sermons, and Asset Decks with editable notes.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
          
          {/* SlideThumbnailList as popout overlay for Flows */}
          <SlideThumbnailList
            slides={(() => {
              if (selectedFlowCollection) {
                const song = songsList.find(s => s.id === selectedFlowCollection.id);
                const sermon = sermonsList.find(s => s.id === selectedFlowCollection.id);
                const assetDeck = assetDecksList.find(a => a.id === selectedFlowCollection.id);
                
                const collection = song || sermon || assetDeck;
                if (collection) {
                  return slides.filter(slide => collection.slideIds.includes(slide.id));
                }
              }
              return slides;
            })()}
            onEdit={handleEdit}
            onDelete={handleDelete}
            title={selectedFlowCollection ? (() => {
              const song = songsList.find(s => s.id === selectedFlowCollection.id);
              const sermon = sermonsList.find(s => s.id === selectedFlowCollection.id);
              const assetDeck = assetDecksList.find(a => a.id === selectedFlowCollection.id);
              
              const collection = song || sermon || assetDeck;
              return collection?.title || "Flows";
            })() : "Flows"}
          />
        </>
      ) : activeModule === 'sermons' ? (
        <>
          {/* Module-aware Sidebar */}
          <Sidebar 
            activeModule={activeModule}
            onSelectItem={handleSermonSelect}
            onMakeNew={handleMakeNewSermon}
            customSermonsList={sermonsList}
            onDeleteItem={handleDeleteItem}
            onSelectBackground={handleSelectBackground}
            onRemoveBackground={handleRemoveBackground}
            itemsWithBackgrounds={itemsWithBackgrounds}
          />

          {/* Sermons: TextEditor as primary workspace */}
          <main className="App-main">
            <div className="text-editor-workspace">
              <TextEditor
                onSave={handleSermonsSave}
                placeholder="Start writing your sermon notes..."
                title={selectedSermon ? selectedSermon.title : "Sermon Editor"}
                storageKey={selectedSermon ? `sermon-notes-${selectedSermon.id}` : 'sermons-content'}
                onMakeSlide={handleMakeSermonSlide}
                showMakeSlideButton={true}
                onClearSlides={handleClearSermonSlides}
                showClearSlidesButton={true}
                onPreachMode={handlePreachMode}
                showPreachButton={true}
                isPreachMode={isPreachMode}
                onSlideButtonClick={isPreachMode ? (slideId: string) => {
                  const slide = slides.find(s => s.id === slideId);
                  if (slide) {
                    handleSlideActivation(slide);
                  }
                } : undefined}
                activeSlideId={activeSlide?.id}
              />
            </div>
          </main>
          {/* SlideThumbnailList as popout overlay for Sermons */}
          <SlideThumbnailList
            slides={slides.filter(slide => selectedSermon?.slideIds.includes(slide.id) || !selectedSermon)}
            onEdit={handleEdit}
            onSlideClick={isPreachMode ? handleSlideActivation : undefined}
            title={selectedSermon?.title || "Sermons"}
          />
        </>
      ) : activeModule !== 'presentation' && (
        <>
          {/* Module-aware Sidebar */}
          <Sidebar 
            activeModule={activeModule}
            onSelectItem={(item) => console.log(`Selected ${activeModule}:`, item)}
            onDeleteItem={handleDeleteItem}
            onSelectBackground={handleSelectBackground}
            onRemoveBackground={handleRemoveBackground}
            itemsWithBackgrounds={itemsWithBackgrounds}
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

      {/* Create Item Modal */}
      <CreateItemModal
        isOpen={showSongTitleModal}
        onClose={() => {
          setShowSongTitleModal(false);
        }}
        onSubmit={handleCreateSong}
        title="Create New Song"
        placeholder="Enter song title..."
        itemType="song"
      />

      {/* Create Item Modal for Sermons */}
      <CreateItemModal
        isOpen={showSermonTitleModal}
        onClose={() => {
          setShowSermonTitleModal(false);
        }}
        onSubmit={handleCreateSermon}
        title="Create New Sermon"
        placeholder="Enter sermon title..."
        itemType="sermon"
      />

      {/* Create Item Modal for Asset Decks */}
      <CreateItemModal
        isOpen={showAssetDeckTitleModal}
        onClose={() => {
          setShowAssetDeckTitleModal(false);
        }}
        onSubmit={handleCreateAssetDeck}
        title="Create New Asset Deck"
        placeholder="Enter asset deck title..."
        itemType="asset-deck"
      />

      {/* Create Item Modal for Flows */}
      <CreateItemModal
        isOpen={showFlowTitleModal}
        onClose={() => {
          setShowFlowTitleModal(false);
        }}
        onSubmit={handleCreateFlow}
        title="Create New Flow"
        placeholder="Enter flow title..."
        itemType="flow"
      />

      {/* MyMedia Library Modal */}
      <MyMediaLibrary
        isOpen={myMediaModalOpen}
        onClose={() => {
          setMyMediaModalOpen(false);
          setBackgroundTargetItem(null);
        }}
        onSelectMedia={handleMediaSelect}
      />

      {/* Presentation Module */}
      {activeModule === 'presentation' && (
        <div className="presentation-module">
          {/* Left Sidebar - Flows or Flow Collections */}
          <div className="presentation-sidebar">
            {!selectedPresentationFlow ? (
              // Show flows list when no flow is selected
              <div className="flows-selection">
                <div className="sidebar-title">Select a Flow</div>
                <div className="flows-list">
                  {flowsList.map(flow => (
                    <div 
                      key={flow.id} 
                      className={`flow-item ${selectedPresentationFlow && (selectedPresentationFlow as IFlow).id === flow.id ? 'selected' : ''}`}
                      onClick={() => {
                        // Only set the flow if it's not already selected
                        const isCurrentlySelected = selectedPresentationFlow && (selectedPresentationFlow as IFlow).id === flow.id;
                        if (!isCurrentlySelected) {
                          setSelectedPresentationFlow(flow);
                          setActiveSlide(null);
                          // Clear active state from all slides when flow changes
                          const clearedSlides = slides.map(s => ({
                            ...s,
                            html: s.html.replace(/ data-active="true"/g, '').replace(/ class="[^"]*active[^"]*"/g, (match) => {
                              return match.replace(/active/g, '').replace(/\s+/g, ' ').trim();
                            })
                          }));
                          setSlides(clearedSlides);
                        }
                      }}
                    >
                      {flow.title}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Show collections within the selected flow
              <div className="flow-collections">
                <div className="sidebar-header">
                  <button 
                    className="back-button"
                    onClick={() => {
                      setSelectedPresentationFlow(null);
                      setActiveSlide(null);
                      // Clear active state from all slides when going back
                      const clearedSlides = slides.map(s => ({
                        ...s,
                        html: s.html.replace(/ data-active="true"/g, '').replace(/ class="[^"]*active[^"]*"/g, (match) => {
                          return match.replace(/active/g, '').replace(/\s+/g, ' ').trim();
                        })
                      }));
                      setSlides(clearedSlides);
                    }}
                  >
                    ← Back to Flows
                  </button>
                  <div className="flow-title">{selectedPresentationFlow.title}</div>
                </div>
                <div className="collections-list">
                  {(() => {
                    const flowItems: Array<{
                      type: 'collection' | 'note';
                      id: string;
                      title: string;
                      slides?: ISlide[];
                      noteText?: string;
                    }> = [];

                    // Get flow items in user-created order
                    const sortedFlowItems = selectedPresentationFlow.flowItems.sort((a, b) => a.order - b.order);
                    
                    sortedFlowItems.forEach((item) => {
                      if (item.type === 'collection') {
                        const song = songsList.find(s => s.id === item.id);
                        const sermon = sermonsList.find(s => s.id === item.id);
                        const assetDeck = assetDecksList.find(a => a.id === item.id);

                        if (song) {
                          const songSlides = slides.filter(slide => song.slideIds.includes(slide.id));
                          flowItems.push({
                            type: 'collection',
                            id: song.id,
                            title: `Song: ${song.title}`,
                            slides: songSlides
                          });
                        } else if (sermon) {
                          const sermonSlides = slides.filter(slide => sermon.slideIds.includes(slide.id));
                          flowItems.push({
                            type: 'collection',
                            id: sermon.id,
                            title: `Sermon: ${sermon.title}`,
                            slides: sermonSlides
                          });
                        } else if (assetDeck) {
                          const assetSlides = slides.filter(slide => assetDeck.slideIds.includes(slide.id));
                          flowItems.push({
                            type: 'collection',
                            id: assetDeck.id,
                            title: `Asset Deck: ${assetDeck.title}`,
                            slides: assetSlides
                          });
                        }
                      } else if (item.type === 'note') {
                        flowItems.push({
                          type: 'note',
                          id: item.id,
                          title: 'Note',
                          noteText: item.note || ''
                        });
                      }
                    });

                    return flowItems.map((item, index) => (
                      <div key={item.id} className="collection-item">
                        {item.type === 'note' ? (
                          <div className="note-item">
                            <span className="note-icon">📝</span>
                            <span className="note-text">{item.noteText}</span>
                          </div>
                        ) : (
                          <div className="collection-item-content">
                            <div className="collection-title">{item.title}</div>
                            {item.slides && item.slides.length > 0 && (
                              <div className="slide-count">{item.slides.length} slides</div>
                            )}
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="presentation-main-content">
            {selectedPresentationFlow ? (
              <div className="presentation-flow-display">
                {/* Flow Title */}
                <div className="presentation-flow-title">
                  <h2>{selectedPresentationFlow.title}</h2>
                </div>

                {/* Collection Slides Grid */}
                {selectedCollection ? (
                  <div className="collection-slides-display">
                    {selectedCollection.type === 'note' ? (
                      <div className="note-display">
                        <p>{selectedCollection.noteText}</p>
                      </div>
                    ) : selectedCollection.slides && selectedCollection.slides.length > 0 ? (
                      <div className="slides-grid">
                        <SlideGrid
                          slides={selectedCollection.slides}
                          onSlideClick={(slide) => handleSlideActivation(slide)} // Updated to use handleSlideActivation
                          activeSlideId={activeSlide?.id}
                        />
                      </div>
                    ) : (
                      <div className="no-slides">
                        <p>No slides available for this collection.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flow-items-display">
                    {(() => {
                      const flowItems: Array<{
                        type: 'collection' | 'note';
                        id: string;
                        title: string;
                        content?: string;
                        slides?: ISlide[];
                      }> = [];

                      // Get flow items in user-created order
                      const sortedFlowItems = selectedPresentationFlow.flowItems.sort((a, b) => a.order - b.order);
                      
                      sortedFlowItems.forEach((item) => {
                        if (item.type === 'collection') {
                          const song = songsList.find(s => s.id === item.id);
                          const sermon = sermonsList.find(s => s.id === item.id);
                          const assetDeck = assetDecksList.find(a => a.id === item.id);

                          if (song) {
                            const songSlides = slides.filter(slide => song.slideIds.includes(slide.id));
                            flowItems.push({
                              type: 'collection',
                              id: song.id,
                              title: song.title,
                              slides: songSlides
                            });
                          } else if (sermon) {
                            const sermonSlides = slides.filter(slide => sermon.slideIds.includes(slide.id));
                            flowItems.push({
                              type: 'collection',
                              id: sermon.id,
                              title: sermon.title,
                              slides: sermonSlides
                            });
                          } else if (assetDeck) {
                            const assetSlides = slides.filter(slide => assetDeck.slideIds.includes(slide.id));
                            flowItems.push({
                              type: 'collection',
                              id: assetDeck.id,
                              title: assetDeck.title,
                              slides: assetSlides
                            });
                          }
                        } else if (item.type === 'note') {
                          flowItems.push({
                            type: 'note',
                            id: item.id,
                            title: `Note`,
                            content: item.note || ''
                          });
                        }
                      });

                      return flowItems.map((item, index) => (
                        <div key={item.id} className="flow-item-section">
                          <div className="flow-item-label">
                            <span className="flow-item-title">
                              {item.type === 'note' ? item.content : item.title}
                            </span>
                            {item.type === 'collection' && item.slides && item.slides.length > 0 && (
                              <div className="auto-cycle-controls">
                                <select
                                  className="timing-dropdown"
                                  value={autoCycleTiming[item.id] || 1000}
                                  onChange={(e) => handleTimingChange(item.id, parseInt(e.target.value))}
                                  title="Auto-cycle timing"
                                >
                                  <option value={1000}>1s</option>
                                  <option value={5000}>5s</option>
                                  <option value={10000}>10s</option>
                                  <option value={30000}>30s</option>
                                </select>
                                <button
                                  className={`auto-cycle-button ${autoCycleStates[item.id] ? 'active' : ''}`}
                                  onClick={() => handleAutoCycle(item.id, item.slides!)}
                                  title={autoCycleStates[item.id] ? 'Stop Auto-Cycle' : 'Start Auto-Cycle'}
                                >
                                  {autoCycleStates[item.id] ? '⏸️' : '▶️'}
                                </button>
                                <button
                                  className="background-button"
                                  onClick={() => collectionsWithBackgrounds.includes(item.id) 
                                    ? handleCollectionBackgroundRemove(item.id)
                                    : handleCollectionBackgroundSelect(item.id)
                                  }
                                  title={collectionsWithBackgrounds.includes(item.id) ? 'Remove background' : 'Add background'}
                                >
                                  {collectionsWithBackgrounds.includes(item.id) ? '❌' : '🖼️'}
                                </button>
                              </div>
                            )}
                          </div>
                          {item.type === 'collection' && item.slides && (
                            <div className="presentation-slides-grid">
                              <SlideGrid
                                slides={item.slides}
                                onSlideClick={(slide) => handleSlideActivation(slide)} // Updated to use handleSlideActivation
                                activeSlideId={activeSlide?.id}
                              />
                            </div>
                          )}
                          {index < flowItems.length - 1 && <div className="flow-item-divider" />}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className="presentation-welcome">
                <div className="welcome-content">
                  <h2>Welcome to Presentation Mode</h2>
                  <p>Select a flow from the sidebar to begin presenting.</p>
                </div>
              </div>
            )}
          </div>

          {/* Top-Right Active Slide Window */}
          <div className="presentation-active-slide">
            {getActiveSlide() ? (
              <div className="active-slide-container">
                <div className="active-slide-title">
                  <h3>Active Slide</h3>
                </div>
                <div className="active-slide-content">
                  <SlideRenderer
                    slide={getActiveSlide()!}
                    editMode={false}
                    onTextEdit={() => {}} // No editing in presentation mode
                    isActive={true} // Enable video playback for active slide
                    activeSlideId={activeSlide?.id}
                  />
                </div>
                <div className="connect-button-container">
                  <button
                    className={`connect-button ${isConnectedToSecondDisplay ? 'connected' : ''}`}
                    onClick={handleConnectToSecondDisplay}
                    title={isConnectedToSecondDisplay ? 'Disconnect from second display' : 'Connect to second display'}
                  >
                    {isConnectedToSecondDisplay ? '🔌 Disconnect' : '🔗 Connect'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="active-slide-placeholder">
                <div className="placeholder-content">
                  <h3>Active Slide</h3>
                  <p>Click on a slide to preview it here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulletin Overlay */}
      <BulletinOverlay
        isOpen={bulletinOverlayOpen}
        onToggle={toggleBulletinOverlay}
        messages={bulletinMessages.slice(0, currentPage * MESSAGES_PER_PAGE)}
        onAddMessage={handleAddBulletin}
        onLoadMore={() => setCurrentPage(prev => prev + 1)}
        hasMoreMessages={bulletinMessages.length > currentPage * MESSAGES_PER_PAGE}
      />
    </div>
  );
}

export default App;