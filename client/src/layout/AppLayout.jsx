import React from 'react';
import './AppLayout.css';
import Sidebar from './Sidebar.jsx';
import { Outlet } from "react-router-dom";
import { useState } from 'react';
import TopBar from './TopBar.jsx';

function AppLayout() {

  return (
    <>
    <div className="app-layout">
        <Sidebar />
      <main className='main-content'>
        {
          window.innerWidth > 801 && <TopBar/>
        }
        <Outlet />
      </main>
    </div>
    </>
  )
}

export default AppLayout
