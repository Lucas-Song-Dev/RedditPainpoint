import React from 'react';
import './FilterControls.scss';

const FilterControls = ({
  filters,
  onFilterChange,
  onClearFilters,
  showClearButton = true,
  children
}) => {
  return (
    <div className="filter-controls">
      <div className="filter-grid">
        {children}
      </div>
      {showClearButton && (
        <button
          className="clear-filters-button"
          onClick={onClearFilters}
          type="button"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

export default FilterControls; 