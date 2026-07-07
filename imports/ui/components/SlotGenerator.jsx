/**
 * SlotGenerator.jsx
 * Componente que permite al barbero configurar las horas disponibles para un día.
 * Muestra un selector de fecha (hoy hasta hoy+14) y botones por hora. Al guardar,
 * invoca el método del servidor que crea los slots para la fecha elegida.
 *
 * Métodos Meteor que invoca:
 *  - slots.generateForDay → Crea los slots seleccionados para la fecha dada
 *
 * @param {Date} date - Fecha por defecto a planificar (normalmente el día actual)
 */
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';

const DEFAULT_HOURS = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];

// Formatea un Date a "YYYY-MM-DD" en hora local (para el atributo value del input)
const toInputDate = (d) => {
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function SlotGenerator({ date }) {
  const [selected, setSelected] = useState([]);
  const [saved, setSaved]       = useState(false);
  const [selectedDate, setSelectedDate] = useState(toInputDate(date));

  const todayStr = toInputDate(new Date());
  const maxDate  = new Date();
  maxDate.setDate(maxDate.getDate() + 14);
  const maxStr = toInputDate(maxDate);

  const toggleHour = (hour) => {
    setSelected(prev =>
      prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour]
    );
    setSaved(false);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSaved(false);
  };

  const handleSave = () => {
    // Crear Date en hora local para que coincida con la fecha mostrada al usuario
    const dateObj = new Date(selectedDate + 'T00:00:00');
    Meteor.call('slots.generateForDay', { date: dateObj, hours: selected }, (err) => {
      if (err) { alert(err.reason); return; }
      setSaved(true);
    });
  };

  return (
    <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 24 }}>
      <h3 style={{ marginTop: 0 }}>Configurar horas disponibles</h3>

      {/* Selector de fecha: hoy hasta hoy+14 días */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 14, color: '#374151', marginRight: 8 }}>
          Fecha a planificar:
        </label>
        <input
          type="date"
          value={selectedDate}
          min={todayStr}
          max={maxStr}
          onChange={handleDateChange}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #e5e7eb' }}
        />
      </div>

      {/* Grid de botones de hora: uno por cada franja del sistema */}
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
              background:  selected.includes(hour) ? '#6366f1' : '#fff',
              color:       selected.includes(hour) ? '#fff'    : '#374151',
              cursor: 'pointer',
              fontWeight: selected.includes(hour) ? 'bold' : 'normal',
            }}
          >
            {hour}
          </button>
        ))}
      </div>

      {/* Botón de guardar: deshabilitado si no se seleccionó ninguna hora */}
      <button
        onClick={handleSave}
        disabled={selected.length === 0}
        style={{
          background: selected.length === 0 ? '#e5e7eb' : '#6366f1',
          color:      selected.length === 0 ? '#9ca3af' : '#fff',
          border: 'none', borderRadius: 6,
          padding: '10px 20px', cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        {saved ? '✓ Guardado' : 'Guardar slots'}
      </button>
    </div>
  );
}
