import React from 'react';
import { useMapStore } from '../context/mapStore';
import ModeFilter from './filters/ModeFilter';
import TimeFilter from './filters/TimeFilter';
import DistrictSearch from './filters/DistrictSearch';

function FilterPanel() {
  const { resetFilters } = useMapStore();

  return (
    <div className="filter-panel">
      <h2>Filters</h2>

      <div className="filter-section">
        <h3>Transportation Mode</h3>
        <ModeFilter />
      </div>

      <div className="filter-section">
        <h3>Time of Day</h3>
        <TimeFilter />
      </div>

      <div className="filter-section">
        <h3>Geographic Area</h3>
        <DistrictSearch />
      </div>

      <button onClick={resetFilters} className="btn-reset">
        Reset Filters
      </button>
    </div>
  );
}

export default FilterPanel;
