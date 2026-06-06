import React from "react";
import "./BlogSection.css";

export default function BlogSection({ children, className = "", ...props }) {
  return (
    <div className={`blogsection ${className}`} {...props}>
      <h2>BlogSection</h2>
      <p>BlogSection component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
