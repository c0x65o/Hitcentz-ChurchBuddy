import React, { useState, useEffect } from 'react';
import './App.css';
import SlideRenderer from './components/SlideRenderer/SlideRenderer';
import SlideThumbnailList from './components/SlideThumbnailList/SlideThumbnailList';
import Sidebar from './components/Sidebar/Sidebar';
import SlideEditorModal from './components/SlideEditorModal/SlideEditorModal';
import TextEditor from './components/TextEditor/TextEditor';
import MyMediaLibrary from './components/MyMediaLibrary/MyMediaLibrary';
import CreateItemModal from './components/CreateItemModal/CreateItemModal';
import { ISlide } from './types/ISlide';
import { ISong } from './types/ISong';
import { ISermon } from './types/ISermon';
import apiService from './services/api';

function App() {
  const [activeModule, setActiveModule] = useState<'presentation' | 'songs' | 'sermons' | 'asset-decks'>('songs');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<ISlide | null>(null);
  const [songsContent, setSongsContent] = useState('');
  const [sermonsContent, setSermonsContent] = useState('');
  const [showSongTitleModal, setShowSongTitleModal] = useState(false);
  const [songsList, setSongsList] = useState<ISong[]>([]);
  const [selectedSong, setSelectedSong] = useState<ISong | null>(null);
  const [sermonsList, setSermonsList] = useState<ISermon[]>([]);
  const [selectedSermon, setSelectedSermon] = useState<ISermon | null>(null);
  const [showSermonTitleModal, setShowSermonTitleModal] = useState(false);
  const [myMediaModalOpen, setMyMediaModalOpen] = useState(false);
  const [backgroundTargetItem, setBackgroundTargetItem] = useState<string | null>(null);
  const [itemsWithBackgrounds, setItemsWithBackgrounds] = useState<string[]>([]);
  const [backendConnected, setBackendConnected] = useState(false);
  const [isPreachMode, setIsPreachMode] = useState(false);
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
    
    // Extract text content from HTML with proper line break handling
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = lyrics;
    
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
    
    console.log('=== DEBUGGING PASTED LYRICS ===');
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
    // If we have multiple div elements in the original HTML, they represent verses separated by empty lines
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
            onDeleteItem={handleDeleteItem}
            onSelectBackground={handleSelectBackground}
            onRemoveBackground={handleRemoveBackground}
            itemsWithBackgrounds={itemsWithBackgrounds}
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
              />
            </div>
          </main>
          {/* SlideThumbnailList as popout overlay for Sermons */}
          <SlideThumbnailList
            slides={slides.filter(slide => selectedSermon?.slideIds.includes(slide.id) || !selectedSermon)}
            onEdit={handleEdit}
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

      {/* MyMedia Library Modal */}
      <MyMediaLibrary
        isOpen={myMediaModalOpen}
        onClose={() => {
          setMyMediaModalOpen(false);
          setBackgroundTargetItem(null);
        }}
        onSelectMedia={handleMediaSelect}
      />
    </div>
  );
}

export default App;
