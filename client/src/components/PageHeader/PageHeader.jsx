import React from 'react';
import './pageHeader.scss';

const PageHeader = ({ title, description }) => {
  return (
    <div className="page-header">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
};

export default PageHeader; 