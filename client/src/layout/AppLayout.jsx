import React from 'react';
import './AppLayout.css';
import Sidebar from './Sidebar.jsx';
import { Outlet } from "react-router-dom";

function AppLayout() {
  return (
    <div className="app-layout">
        <Sidebar />
      <main className='main-content'>
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
