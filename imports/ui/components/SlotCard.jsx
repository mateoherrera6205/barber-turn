/**
 * SlotCard.jsx
 * Componente de botón que representa un slot horario disponible en la página de reservas.
 * El cliente hace clic en un SlotCard para seleccionarlo, y el componente cambia
 * visualmente para indicar que está seleccionado (fondo y borde púrpura).
 *
 * Es un componente puramente visual (no invoca métodos Meteor directamente).
 * La lógica de reserva se maneja en BookingPage a través del callback onSelect.
 *
 * @param {Object}   slot       - Documento de slot con al menos el campo 'hour'
 * @param {Function} onSelect   - Callback que se invoca cuando el usuario selecciona este slot
 *                                Recibe el objeto slot completo como argumento
 * @param {Boolean}  isSelected - true si este slot está actualmente seleccionado
 *                                Controla el estilo visual del botón
 */
import React from 'react';

export function SlotCard({ slot, onSelect, isSelected }) {
  return (
    // Botón estilizado que cambia de apariencia según si está seleccionado o no
    <button
      onClick={() => onSelect(slot)}  // Pasar el slot completo al callback para acceder a su _id
      style={{
        padding: '12px 20px',
        borderRadius: 8,
        border: '2px solid',
        // Borde y fondo cambian de color cuando el slot está seleccionado
        borderColor: isSelected ? '#6366f1' : '#e5e7eb',  // Púrpura si seleccionado, gris si no
        background:  isSelected ? '#6366f1' : '#fff',     // Fondo púrpura o blanco
        color:       isSelected ? '#fff'    : '#1f2937',  // Texto blanco sobre púrpura, oscuro sobre blanco
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: 16,
        transition: 'all 0.15s',  // Transición suave al seleccionar/deseleccionar
        minWidth: 100,
      }}
    >
      🕐 {slot.hour}  {/* Mostrar la hora del slot con el ícono de reloj */}
    </button>
  );
}
