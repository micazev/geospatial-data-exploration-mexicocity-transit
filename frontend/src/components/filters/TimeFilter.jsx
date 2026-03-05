import React from 'react';
import { useMapStore } from '../../context/mapStore';

function TimeFilter() {
  const hour = useMapStore((state) => state.filters.hour);
  const setHour = useMapStore((state) => state.setHour);

  const handleTimeChange = (e) => {
    const value = e.target.value === '' ? null : parseInt(e.target.value);
    setHour(value);
  };

  const formatHour = (h) => {
    if (h === null) return 'All Hours';
    return `${h.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="time-filter">
      <div className="time-display">
        <p>Selected: <strong>{formatHour(hour)}</strong></p>
      </div>
      <input
        type="range"
        min="0"
        max="23"
        value={hour !== null ? hour : ''}
        onChange={handleTimeChange}
        className="time-slider"
      />
      <div className="time-labels">
        <span>00:00</span>
        <span>12:00</span>
        <span>23:00</span>
      </div>
      <button
        onClick={() => setHour(null)}
        className="btn-clear-time"
      >
        Clear Time Filter
      </button>
    </div>
  );
}

export default TimeFilter;
