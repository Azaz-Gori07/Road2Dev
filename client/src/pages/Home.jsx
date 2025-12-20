import React from 'react';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <h1 className='heading'>Hi Welcome to Road2Dev</h1>
      <p className='sub-title'>Road2Dev is built for developers who want clarity in learning and honesty in interview preparation.
        Real roadmaps. Real questions. No fake motivation.</p>
        <div className="buttons">
          <button className='button'>Start Learning</button>
          <button className='button'>Try Interview Prep</button>
        </div>
    </div>
  )
}

export default Home
