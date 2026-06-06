import React from "react";
import "./TeamCard.css";

export default function TeamCard({ children, className = "", ...props }) {
  return (
    <div className={`teamcard ${className}`} {...props}>
      <h2>TeamCard</h2>
      <p>TeamCard component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
