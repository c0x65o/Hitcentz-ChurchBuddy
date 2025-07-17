import React, { useState } from 'react';
import './App.css';
import SlideRenderer from './components/SlideRenderer/SlideRenderer';
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
      </main>
    </div>
  );
}

export default App;
