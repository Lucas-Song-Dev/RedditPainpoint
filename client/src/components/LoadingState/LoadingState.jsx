import React from 'react';
import './LoadingState.scss';

const LoadingState = ({ message = "Loading..." }) => {
  return (
    <div className="loading-state">
      <div className="loading-animation">
        <div className="loading-circle"></div>
        <div className="loading-circle"></div>
        <div className="loading-circle"></div>
      </div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingState; 