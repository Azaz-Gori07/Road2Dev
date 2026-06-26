import React, { useState, useEffect } from 'react';
import './AppLayout.css';
import Sidebar from './Sidebar.jsx';
import { Outlet } from "react-router-dom";
import TopBar from './TopBar.jsx';

function AppLayout() {
  const [isWide, setIsWide] = useState(window.innerWidth > 801);

  useEffect(() => {
    const handleResize = () => setIsWide(window.innerWidth > 801);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
    <div className="app-layout">
        <Sidebar />
      <main className='main-content'>
        {isWide && <TopBar />}
        <Outlet />
      </main>
    </div>
    </>
  )
}

export default AppLayout
