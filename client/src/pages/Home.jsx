import React from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  return (
    <div className="home">
      <h1 className='heading'>Hi Welcome to Road2Dev</h1>
      <p className='sub-title'>Road2Dev is built for developers who want clarity in learning and honesty in interview preparation.
        Real roadmaps. Real questions. No fake motivation.</p>
        <div className="home-buttons">
          <button className='home-button main-action-btn' onClick={() => navigate('/learning')}>Start Learning</button>
          <button className='home-button main-action-btn' onClick={() => navigate('/interview')}>Try Interview Prep</button>
        </div>
    </div>
  )
}

export default Home
