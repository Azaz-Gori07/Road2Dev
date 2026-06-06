import React from "react";
import "./ErrorBoundary.css";

export default function ErrorBoundary({ children, className = "", ...props }) {
  return (
    <div className={`errorboundary ${className}`} {...props}>
      <h2>ErrorBoundary</h2>
      <p>ErrorBoundary component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
