import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useAuth } from '/imports/ui/hooks/useAuth';
import { useAppointments } from '../hooks/useAppointments';
import { AppointmentCard } from '/imports/ui/components/AppointmentCard';
import { SlotGenerator } from '/imports/ui/components/SlotGenerator';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  const { name } = useAuth();
  const { appointments, isLoading } = useAppointments();
  const navigate = useNavigate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleAnalytics = () => navigate('/analytics');
  const handleLogout = () => {
    Meteor.logout(() => navigate('/login'));
  };

  const pending = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>💈 BarberTurn</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>Hola, {name}</p>
        </div>
        <button onClick={handleAnalytics} style={{
          background: 'transparent', border: '1px solid #e5e7eb',
          borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
        }}>
          Analytics
        </button>
      </div>

      {/* Stats rápidas */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Pendientes', value: pending.length, color: '#f59e0b' },
          { label: 'Confirmados', value: confirmed.length, color: '#10b981' },
          { label: 'Total hoy', value: appointments.length, color: '#6366f1' },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1, background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 8, padding: 16, textAlign: 'center',
            borderTop: `4px solid ${stat.color}`,
          }}>
            <p style={{ fontSize: 32, fontWeight: 'bold', margin: 0, color: stat.color }}>
              {stat.value}
            </p>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Generador de slots */}
      <SlotGenerator date={today} />

      {/* Lista de turnos */}
      <h2>Turnos de hoy</h2>
      {isLoading ? (
        <p>Cargando turnos...</p>
      ) : appointments.length === 0 ? (
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>
          No hay turnos para hoy todavía
        </p>
      ) : (
        appointments.map(appt => (
          <AppointmentCard key={appt._id} appointment={appt} />
        ))
      )}
    </div>
  );
}
