import React from 'react';
import { useStore } from '../store/useStore';

export default function Home() {
  const { user, isAuthenticated } = useStore();
  return (
    <div className="container">
      <h1>Welcome{isAuthenticated ? `, ${user?.name}` : ''}</h1>
      <p>This is the home page of our medium-sized React application.</p>
      <div className="grid">
        <div className="card">
          <h3>Getting Started</h3>
          <p>Learn how to use this application effectively.</p>
          <button className="btn btn-primary">Learn More</button>
        </div>
        <div className="card">
          <h3>Documentation</h3>
          <p>Browse our comprehensive documentation.</p>
          <button className="btn btn-secondary">Browse Docs</button>
        </div>
      </div>
    </div>
  );
}