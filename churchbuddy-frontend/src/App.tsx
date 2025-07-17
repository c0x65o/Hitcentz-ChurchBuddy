import React, { useState } from 'react';
import './App.css';
import SlideRenderer from './components/SlideRenderer/SlideRenderer';
import SlideThumbnailList from './components/SlideThumbnailList/SlideThumbnailList';
import { ISlide } from './types/ISlide';

function App() {
  const [currentSlide] = useState<ISlide>({
    id: '1',
    title: 'Amazing Grace',
    html: '<h1>Amazing Grace</h1>',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [slides] = useState<ISlide[]>([
    {
      id: '1',
      title: 'Amazing Grace',
      html: '<h1>Amazing Grace</h1>',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'How Great Thou Art',
      html: '<h1>How Great Thou Art</h1>',
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      title: 'It Is Well',
      html: '<h1>It Is Well</h1>',
      order: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      title: 'Great Is Thy Faithfulness',
      html: '<h1>Great Is Thy Faithfulness</h1>',
      order: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      title: 'What A Friend We Have In Jesus',
      html: '<h1>What A Friend We Have In Jesus</h1>',
      order: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '6',
      title: 'Single Word',
      html: '<h1>Grace</h1>',
      order: 6,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '7',
      title: 'Twenty Words',
      html: '<h1>The Lord is my shepherd I shall not want He makes me lie down in green pastures beside still waters</h1>',
      order: 7,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const handleEdit = (slideId: string) => {
    console.log('Edit slide:', slideId);
  };

  const handleDelete = (slideId: string) => {
    console.log('Delete slide:', slideId);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>ChurchBuddy</h1>
        <p>Worship & Sermon Presentation Tool</p>
      </header>
      <main className="App-main">
        <div className="slide-preview">
          <SlideRenderer slide={currentSlide} />
        </div>
        <div className="slide-list">
          <SlideThumbnailList
            slides={slides}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
