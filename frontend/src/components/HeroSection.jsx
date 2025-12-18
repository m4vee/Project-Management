import React from 'react';
import Button from './Button';
import './HeroSection.css';

function HeroSection() {
  return (
    <div className='hero-container'>
      <video 
        src='/videos/business-loop.mp4' 
        autoPlay 
        loop 
        muted 
        playsInline 
      />
      <h1>CAMPUS MARKETPLACE</h1>
      <p>What are you waiting for?</p>
      <div className='hero-btns'>
        <Button
          className='btns'
          buttonStyle='btn--outline'
          buttonSize='btn--large'
        >
          GET STARTED
        </Button>
      </div>
    </div>
  );
}

export default HeroSection;