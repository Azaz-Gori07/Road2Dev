import React from "react";
import "./SearchBar.css";

export default function SearchBar({ children, className = "", ...props }) {
  return (
    <div className={`searchbar ${className}`} {...props}>
      <h2>SearchBar</h2>
      <p>SearchBar component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
