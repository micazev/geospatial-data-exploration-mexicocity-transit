import React from 'react';
import { useMapStore } from '../../context/mapStore';

const TRANSPORT_MODES = [
  { id: 'METRO', label: '🚇 Metro' },
  { id: 'MB', label: '🚌 Metrobus' },
  { id: 'TROLE', label: '🚎 Trolebus' },
  { id: 'TL', label: '🚊 Light Rail' },
  { id: 'CBB', label: '🚡 Cable Car' },
  { id: 'PUMABUS', label: '🚌 PUMA Bus' },
  { id: 'RTP', label: '🚌 RTP Bus' },
  { id: 'CC', label: '🚌 Corredores' },
  { id: 'SUB', label: '🚉 Suburbano' },
];

function ModeFilter() {
  const modes = useMapStore((state) => state.filters.modes);
  const setModes = useMapStore((state) => state.setModes);

  const handleModeToggle = (modeId) => {
    if (modes.includes(modeId)) {
      setModes(modes.filter((m) => m !== modeId));
    } else {
      setModes([...modes, modeId]);
    }
  };

  return (
    <div className="mode-filter">
      {TRANSPORT_MODES.map((mode) => (
        <label key={mode.id} className="checkbox-label">
          <input
            type="checkbox"
            checked={modes.includes(mode.id)}
            onChange={() => handleModeToggle(mode.id)}
          />
          <span>{mode.label}</span>
        </label>
      ))}
    </div>
  );
}

export default ModeFilter;
