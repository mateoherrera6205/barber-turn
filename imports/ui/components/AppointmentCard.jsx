/**
 * AppointmentCard.jsx
 * Componente de tarjeta que representa un turno individual en el Dashboard del barbero.
 * Muestra los datos del turno (hora, cliente, teléfono, estado) y permite al barbero
 * confirmar o cancelar turnos que están en estado 'pending'.
 *
 * Métodos Meteor que invoca:
 *  - appointments.updateStatus → para confirmar (→ 'confirmed') o cancelar (→ 'cancelled')
 *
 * El componente usa un mapa de colores (statusColor) para distinguir visualmente
 * los estados: amarillo=pendiente, verde=confirmado, rojo=cancelado.
 *
 * @param {Object} appointment - Documento de appointment con los campos:
 *   - _id         {String} ID del turno
 *   - clientName  {String} Nombre del cliente
 *   - clientPhone {String} Teléfono del cliente
 *   - hour        {String} Hora del turno ('HH:MM')
 *   - status      {String} Estado actual ('pending' | 'confirmed' | 'cancelled')
 */
import React from 'react';
import { Meteor } from 'meteor/meteor';
import { APPOINTMENT_STATUS } from '/imports/utils/constants';

export function AppointmentCard({ appointment }) {
  // Desestructurar solo los campos necesarios para renderizado y acciones
  const { _id, clientName, clientPhone, hour, status } = appointment;

  /**
   * handleConfirm
   * Invoca el método del servidor para marcar el turno como 'confirmed'.
   * Si ocurre un error (ej: sin permisos), lo muestra con alert().
   */
  const handleConfirm = () => {
    Meteor.call('appointments.updateStatus', {
      appointmentId: _id,
      status: APPOINTMENT_STATUS.CONFIRMED,  // 'confirmed'
    }, (err) => {
      if (err) alert(err.reason);
    });
  };

  /**
   * handleCancel
   * Invoca el método del servidor para marcar el turno como 'cancelled'.
   * Al cancelar, el servidor también libera el slot asociado automáticamente.
   */
  const handleCancel = () => {
    Meteor.call('appointments.updateStatus', {
      appointmentId: _id,
      status: APPOINTMENT_STATUS.CANCELLED,  // 'cancelled'
    }, (err) => {
      if (err) alert(err.reason);
    });
  };

  // Mapa de colores para el indicador visual de estado de la tarjeta
  // Amarillo=pendiente, Verde=confirmado, Rojo=cancelado
  const statusColor = {
    [APPOINTMENT_STATUS.PENDING]:   '#f59e0b',  // Amarillo: esperando acción del barbero
    [APPOINTMENT_STATUS.CONFIRMED]: '#10b981',  // Verde: turno confirmado
    [APPOINTMENT_STATUS.CANCELLED]: '#ef4444',  // Rojo: turno cancelado
  };

  return (
    // Tarjeta con borde izquierdo coloreado según el estado del turno
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderLeft: `4px solid ${statusColor[status]}`,  // Indicador visual de estado
      background: '#fff',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Columna izquierda: datos del turno y del cliente */}
        <div>
          <p style={{ fontWeight: 'bold', margin: 0, fontSize: 18 }}>🕐 {hour}</p>
          <p style={{ margin: '4px 0', color: '#374151' }}>👤 {clientName}</p>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>📞 {clientPhone}</p>
        </div>

        {/* Columna derecha: badge de estado y botones de acción */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Badge que muestra el estado actual del turno */}
          <span style={{
            background: statusColor[status],
            color: '#fff',
            padding: '2px 10px',
            borderRadius: 12,
            fontSize: 12,
            textAlign: 'center',
          }}>
            {status}
          </span>

          {/* Solo mostrar botones de acción cuando el turno está pendiente */}
          {status === APPOINTMENT_STATUS.PENDING && (
            <>
              {/* Botón para confirmar el turno: lo marca como 'confirmed' */}
              <button onClick={handleConfirm} style={{
                background: '#10b981', color: '#fff',
                border: 'none', borderRadius: 6,
                padding: '6px 12px', cursor: 'pointer',
              }}>
                Confirmar
              </button>

              {/* Botón para cancelar el turno: lo marca como 'cancelled' y libera el slot */}
              <button onClick={handleCancel} style={{
                background: '#ef4444', color: '#fff',
                border: 'none', borderRadius: 6,
                padding: '6px 12px', cursor: 'pointer',
              }}>
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
