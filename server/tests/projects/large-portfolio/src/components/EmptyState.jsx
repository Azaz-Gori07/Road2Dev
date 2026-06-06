import React from "react";
import "./EmptyState.css";

export default function EmptyState({ children, className = "", ...props }) {
  return (
    <div className={`emptystate ${className}`} {...props}>
      <h2>EmptyState</h2>
      <p>EmptyState component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
