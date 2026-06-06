import React from "react";
import "./BlogCard.css";

export default function BlogCard({ children, className = "", ...props }) {
  return (
    <div className={`blogcard ${className}`} {...props}>
      <h2>BlogCard</h2>
      <p>BlogCard component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
