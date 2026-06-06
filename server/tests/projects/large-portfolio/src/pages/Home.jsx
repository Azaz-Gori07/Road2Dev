import React from "react";

export default function Home() {
  return (
    <div className="home-page">
      <div className="container">
        <h1>Home</h1>
        <section className="section">
          <p>Welcome to the Home page. This page contains detailed information and interactive components for the portfolio website.</p>
          <div className="grid grid-2">
            <div className="card"><h3>Section 1</h3><p>Content for section 1 of the home page.</p></div>
            <div className="card"><h3>Section 2</h3><p>Content for section 2 of the home page.</p></div>
          </div>
        </section>
      </div>
    </div>
  );
}
