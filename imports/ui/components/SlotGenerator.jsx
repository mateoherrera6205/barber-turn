/**
 * SlotGenerator.jsx
 * Componente que permite al barbero configurar las horas disponibles para un día.
 * Muestra botones para cada hora posible del sistema, y el barbero puede seleccionar
 * cuáles quiere habilitar. Al guardar, invoca el método del servidor que crea los slots.
 *
 * Métodos Meteor que invoca:
 *  - slots.generateForDay → Crea los slots seleccionados para la fecha dada
 *
 * Estado interno:
 *  - selected {Array<String>} Lista de horas actualmente seleccionadas (ej: ['09:00','10:00'])
 *  - saved    {Boolean}       true después de guardar exitosamente; se resetea al cambiar selección
 *
 * @param {Date} date - La fecha para la que se generarán los slots (normalmente el día actual)
 */
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';

// Franjas horarias disponibles en el sistema (excluye hora de almuerzo 13:00)
const DEFAULT_HOURS = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];

export function SlotGenerator({ date }) {
  // Lista de horas que el barbero ha seleccionado para habilitar
  const [selected, setSelected] = useState([]);
  // Flag que indica si el barbero ya guardó la configuración actual
  const [saved, setSaved] = useState(false);

  /**
   * toggleHour
   * Agrega o quita una hora de la selección actual.
   * Si la hora ya está seleccionada, la elimina del array (deseleccionar).
   * Si no está, la agrega (seleccionar).
   * También resetea el estado 'saved' para indicar que hay cambios sin guardar.
   *
   * @param {String} hour - La hora a agregar/quitar (ej: '09:00')
   */
  const toggleHour = (hour) => {
    setSelected(prev =>
      prev.includes(hour)
        ? prev.filter(h => h !== hour)  // Quitar hora de la selección
        : [...prev, hour]                // Agregar hora a la selección
    );
    setSaved(false);  // Indicar que hay cambios sin guardar
  };

  /**
   * handleSave
   * Invoca el método del servidor 'slots.generateForDay' con la fecha y horas seleccionadas.
   * El servidor elimina los slots disponibles previos de ese día y crea los nuevos.
   * Si hay éxito, muestra el estado "Guardado"; si hay error, muestra alerta.
   */
  const handleSave = () => {
    Meteor.call('slots.generateForDay', { date, hours: selected }, (err) => {
      if (err) { alert(err.reason); return; }
      // Mostrar feedback visual de guardado exitoso
      setSaved(true);
    });
  };

  return (
    <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 24 }}>
      <h3 style={{ marginTop: 0 }}>Configurar horas disponibles</h3>

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
              // Resaltar con púrpura las horas seleccionadas
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
        disabled={selected.length === 0}  // No permitir guardar sin horas seleccionadas
        style={{
          // Apariencia gris cuando está deshabilitado, púrpura cuando está activo
          background: selected.length === 0 ? '#e5e7eb' : '#6366f1',
          color:      selected.length === 0 ? '#9ca3af' : '#fff',
          border: 'none', borderRadius: 6,
          padding: '10px 20px', cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        {/* Cambiar el texto del botón después de guardar exitosamente */}
        {saved ? '✓ Guardado' : 'Guardar slots'}
      </button>
    </div>
  );
}
