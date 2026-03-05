import React, { useState } from 'react';
import { useMapStore } from '../../context/mapStore';

const MEXICO_CITY_DISTRICTS = [
  'Álvaro Obregón',
  'Azcapotzalco',
  'Benito Juárez',
  'Coyoacán',
  'Cuauhtémoc',
  'Cuajimalpa',
  'Gustavo A. Madero',
  'Iztacalco',
  'Iztapalapa',
  'La Magdalena Contreras',
  'Miguel Hidalgo',
  'Milpa Alta',
  'Tláhuac',
  'Tlalpan',
  'Venustiano Carranza',
  'Xochimilco',
];

function DistrictSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const district = useMapStore((state) => state.filters.district);
  const setDistrict = useMapStore((state) => state.setDistrict);

  const filteredDistricts = MEXICO_CITY_DISTRICTS.filter((d) =>
    d.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectDistrict = (d) => {
    setDistrict(d === district ? null : d);
    setSearchTerm('');
  };

  return (
    <div className="district-search">
      <input
        type="text"
        placeholder="Search district..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="district-input"
      />

      {district && (
        <div className="selected-district">
          <span>{district}</span>
          <button onClick={() => setDistrict(null)} className="btn-clear">×</button>
        </div>
      )}

      {searchTerm && (
        <ul className="district-list">
          {filteredDistricts.map((d) => (
            <li
              key={d}
              onClick={() => handleSelectDistrict(d)}
              className={district === d ? 'selected' : ''}
            >
              {d}
            </li>
          ))}
        </ul>
      )}

      <div className="districts-grid">
        {filteredDistricts.slice(0, 6).map((d) => (
          <button
            key={d}
            onClick={() => handleSelectDistrict(d)}
            className={`district-btn ${district === d ? 'selected' : ''}`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

export default DistrictSearch;
