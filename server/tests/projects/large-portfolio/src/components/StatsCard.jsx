import React from "react";
import "./StatsCard.css";

export default function StatsCard({ children, className = "", ...props }) {
  return (
    <div className={`statscard ${className}`} {...props}>
      <h2>StatsCard</h2>
      <p>StatsCard component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
