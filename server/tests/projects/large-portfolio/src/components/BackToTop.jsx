import React from "react";
import "./BackToTop.css";

export default function BackToTop({ children, className = "", ...props }) {
  return (
    <div className={`backtotop ${className}`} {...props}>
      <h2>BackToTop</h2>
      <p>BackToTop component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
