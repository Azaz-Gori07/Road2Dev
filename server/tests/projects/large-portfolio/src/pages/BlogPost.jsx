import React from "react";

export default function BlogPost() {
  return (
    <div className="blogpost-page">
      <div className="container">
        <h1>Blog Post</h1>
        <section className="section">
          <p>Welcome to the Blog Post page. This page contains detailed information and interactive components for the portfolio website.</p>
          <div className="grid grid-2">
            <div className="card"><h3>Section 1</h3><p>Content for section 1 of the blog post page.</p></div>
            <div className="card"><h3>Section 2</h3><p>Content for section 2 of the blog post page.</p></div>
          </div>
        </section>
      </div>
    </div>
  );
}
