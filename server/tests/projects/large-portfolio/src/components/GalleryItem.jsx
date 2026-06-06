import React from "react";
import "./GalleryItem.css";

export default function GalleryItem({ children, className = "", ...props }) {
  return (
    <div className={`galleryitem ${className}`} {...props}>
      <h2>GalleryItem</h2>
      <p>GalleryItem component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
