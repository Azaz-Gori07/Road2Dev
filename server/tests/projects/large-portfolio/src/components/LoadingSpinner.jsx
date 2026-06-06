import React from "react";
import "./LoadingSpinner.css";

export default function LoadingSpinner({ children, className = "", ...props }) {
  return (
    <div className={`loadingspinner ${className}`} {...props}>
      <h2>LoadingSpinner</h2>
      <p>LoadingSpinner component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
