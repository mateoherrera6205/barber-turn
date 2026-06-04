/**
 * DashboardPage.jsx
 * Panel de control principal del barbero en BarberTurn.
 * Muestra el resumen de turnos del día actual y permite gestionar slots y appointments.
 *
 * Estructura de la página:
 *  1. Header: nombre del barbero, botón de Analytics y botón de cerrar sesión
 *  2. Stats rápidas: tarjetas con contadores de turnos pendientes, confirmados y total
 *  3. SlotGenerator: herramienta para configurar las horas disponibles del día
 *  4. Lista de turnos: AppointmentCard por cada turno del día
 *
 * Hooks utilizados:
 *  - useAuth()         → para obtener el nombre del barbero logueado
 *  - useAppointments() → para obtener los turnos del día (suscrito a 'appointments.today')
 *  - useNavigate()     → para redirigir a analytics o al logout
 *
 * No invoca métodos Meteor directamente (las acciones se delegan a los subcomponentes).
 */
import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useAuth } from '/imports/ui/hooks/useAuth';
import { useAppointments } from '../hooks/useAppointments';
import { AppointmentCard } from '/imports/ui/components/AppointmentCard';
import { SlotGenerator } from '/imports/ui/components/SlotGenerator';
import { useNavigate } from 'react-router-dom';

export function DashboardPage() {
  // Obtener el nombre del barbero para el saludo en el header
  const { name } = useAuth();
  // Obtener los turnos del día y el estado de carga
  const { appointments, isLoading } = useAppointments();
  const navigate = useNavigate();

  // Calcular la fecha de hoy para pasarla al SlotGenerator
  // Se resetean horas para usar solo la fecha sin componente de tiempo
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Navegar a la página de analytics
  const handleAnalytics = () => navigate('/analytics');

  // Cerrar sesión de Meteor y redirigir al login
  const handleLogout = () => {
    Meteor.logout(() => navigate('/login'));
  };

  // Filtrar los turnos del día por estado para los contadores
  const pending   = appointments.filter(a => a.status === 'pending');
  const confirmed = appointments.filter(a => a.status === 'confirmed');

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>

      {/* Header: título, saludo al barbero y botones de navegación */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>💈 BarberTurn</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>Hola, {name}</p>
        </div>
        {/* Botón que navega a la página de analytics histórico */}
        <button onClick={handleAnalytics} style={{
          background: 'transparent', border: '1px solid #e5e7eb',
          borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
        }}>
          Analytics
        </button>
      </div>

      {/* Stats rápidas: tarjetas con contadores del día actual */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Pendientes',  value: pending.length,      color: '#f59e0b' },  // Amarillo
          { label: 'Confirmados', value: confirmed.length,    color: '#10b981' },  // Verde
          { label: 'Total hoy',   value: appointments.length, color: '#6366f1' },  // Púrpura
        ].map(stat => (
          // Tarjeta de estadística con borde superior del color del estado
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

      {/* Generador de slots: permite al barbero configurar sus horas disponibles de hoy */}
      <SlotGenerator date={today} />

      {/* Lista de turnos del día actual */}
      <h2>Turnos de hoy</h2>
      {isLoading ? (
        // Mostrar indicador de carga mientras llegan los datos del servidor
        <p>Cargando turnos...</p>
      ) : appointments.length === 0 ? (
        // Mensaje de estado vacío cuando no hay turnos para hoy
        <p style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>
          No hay turnos para hoy todavía
        </p>
      ) : (
        // Renderizar una AppointmentCard por cada turno del día
        appointments.map(appt => (
          <AppointmentCard key={appt._id} appointment={appt} />
        ))
      )}
    </div>
  );
}
