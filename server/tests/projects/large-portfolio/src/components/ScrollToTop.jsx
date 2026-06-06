import React from "react";
import "./ScrollToTop.css";

export default function ScrollToTop({ children, className = "", ...props }) {
  return (
    <div className={`scrolltotop ${className}`} {...props}>
      <h2>ScrollToTop</h2>
      <p>ScrollToTop component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
