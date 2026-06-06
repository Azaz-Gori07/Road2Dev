import React from "react";
import "./Modal.css";

export default function Modal({ children, className = "", ...props }) {
  return (
    <div className={`modal ${className}`} {...props}>
      <h2>Modal</h2>
      <p>Modal component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
