import React from 'react';

export default function About() {
  return (
    <div className="container">
      <h1>About Us</h1>
      <p>This application demonstrates a full-stack React architecture with routing, state management, and component composition.</p>
      <h2>Architecture</h2>
      <ul>
        <li>React 18 with concurrent features</li>
        <li>React Router v6 for client-side routing</li>
        <li>Zustand for state management</li>
        <li>Axios for HTTP requests</li>
        <li>JWT-based authentication</li>
        <li>RESTful API with Express</li>
        <li>MongoDB with Mongoose ODM</li>
      </ul>
    </div>
  );
}