import React from 'react';
import { Meteor } from 'meteor/meteor';
import { APPOINTMENT_STATUS } from '/imports/utils/constants';

export function AppointmentCard({ appointment }) {
  const { _id, clientName, clientPhone, hour, status } = appointment;

  const handleConfirm = () => {
    Meteor.call('appointments.updateStatus', {
      appointmentId: _id,
      status: APPOINTMENT_STATUS.CONFIRMED,
    }, (err) => {
      if (err) alert(err.reason);
    });
  };

  const handleCancel = () => {
    Meteor.call('appointments.updateStatus', {
      appointmentId: _id,
      status: APPOINTMENT_STATUS.CANCELLED,
    }, (err) => {
      if (err) alert(err.reason);
    });
  };

  const statusColor = {
    [APPOINTMENT_STATUS.PENDING]: '#f59e0b',
    [APPOINTMENT_STATUS.CONFIRMED]: '#10b981',
    [APPOINTMENT_STATUS.CANCELLED]: '#ef4444',
  };

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderLeft: `4px solid ${statusColor[status]}`,
      background: '#fff',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontWeight: 'bold', margin: 0, fontSize: 18 }}>🕐 {hour}</p>
          <p style={{ margin: '4px 0', color: '#374151' }}>👤 {clientName}</p>
          <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>📞 {clientPhone}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          {status === APPOINTMENT_STATUS.PENDING && (
            <>
              <button onClick={handleConfirm} style={{
                background: '#10b981', color: '#fff',
                border: 'none', borderRadius: 6,
                padding: '6px 12px', cursor: 'pointer',
              }}>
                Confirmar
              </button>
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
