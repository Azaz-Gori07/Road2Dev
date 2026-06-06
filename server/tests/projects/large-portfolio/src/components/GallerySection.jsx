import React from "react";
import "./GallerySection.css";

export default function GallerySection({ children, className = "", ...props }) {
  return (
    <div className={`gallerysection ${className}`} {...props}>
      <h2>GallerySection</h2>
      <p>GallerySection component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
