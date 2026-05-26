import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';

const DEFAULT_HOURS = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];

export function SlotGenerator({ date }) {
  const [selected, setSelected] = useState([]);
  const [saved, setSaved] = useState(false);

  const toggleHour = (hour) => {
    setSelected(prev =>
      prev.includes(hour)
        ? prev.filter(h => h !== hour)
        : [...prev, hour]
    );
    setSaved(false);
  };

  const handleSave = () => {
    Meteor.call('slots.generateForDay', { date, hours: selected }, (err) => {
      if (err) { alert(err.reason); return; }
      setSaved(true);
    });
  };

  return (
    <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 24 }}>
      <h3 style={{ marginTop: 0 }}>Configurar horas disponibles</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {DEFAULT_HOURS.map(hour => (
          <button
            key={hour}
            onClick={() => toggleHour(hour)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '2px solid',
              borderColor: selected.includes(hour) ? '#6366f1' : '#e5e7eb',
              background: selected.includes(hour) ? '#6366f1' : '#fff',
              color: selected.includes(hour) ? '#fff' : '#374151',
              cursor: 'pointer',
              fontWeight: selected.includes(hour) ? 'bold' : 'normal',
            }}
          >
            {hour}
          </button>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={selected.length === 0}
        style={{
          background: selected.length === 0 ? '#e5e7eb' : '#6366f1',
          color: selected.length === 0 ? '#9ca3af' : '#fff',
          border: 'none', borderRadius: 6,
          padding: '10px 20px', cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        {saved ? '✓ Guardado' : 'Guardar slots'}
      </button>
    </div>
  );
}
