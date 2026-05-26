import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Slots } from '/imports/api/slots/slots';
import { useAuth } from '../hooks/useAuth';
import { SlotCard } from '../components/SlotCard';
import { useNavigate } from 'react-router-dom';

export function BookingPage() {
  const { name } = useAuth();
  const navigate = useNavigate();

  const today = new Date();
  today.setUTCHours(5, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('slots');
  const [error, setError] = useState('');
  const [bookedAppointment, setBookedAppointment] = useState(null);

  const { slots, isLoading } = useTracker(() => {
    const handle = Meteor.subscribe('slots.available', { date: selectedDate });
    return {
      isLoading: false,
      slots: Slots.find({ date: selectedDate, isAvailable: true },
        { sort: { hour: 1 } }
      ).fetch(),
    };
  }, [selectedDate]);

  const handleDateChange = (e) => {
    const date = new Date(e.target.value);
    date.setUTCHours(5, 0, 0, 0);
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep('slots');
    setError('');
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setStep('confirm');
    setError('');
  };

  const handleBook = () => {
    if (!phone.trim()) {
      setError('Ingresa tu número de teléfono');
      return;
    }
    Meteor.call('appointments.book', {
      slotId: selectedSlot._id,
      clientName: name,
      clientPhone: phone.trim(),
    }, (err, appointmentId) => {
      if (err) {
        setError(err.reason || 'Error al reservar');
        return;
      }
      setBookedAppointment({
        id: appointmentId,
        hour: selectedSlot.hour,
        date: selectedDate,
      });
      setStep('done');
    });
  };

  const handleNewBooking = () => {
    setSelectedSlot(null);
    setPhone('');
    setStep('slots');
    setError('');
    setBookedAppointment(null);
  };

  const handleLogout = () => {
    Meteor.logout(() => navigate('/login'));
  };

  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('es-EC', {
      weekday: 'long', year: 'numeric',
      month: 'long', day: 'numeric'
    });
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0 }}>✂️ BarberTurn</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>Hola, {name}</p>
        </div>
        <button onClick={handleLogout} style={{
          background: 'transparent', border: '1px solid #e5e7eb',
          borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
        }}>
          Cerrar sesión
        </button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#374151' }}>
          Selecciona el día
        </label>
        <input
          type="date"
          value={formatDateForInput(selectedDate)}
          min={formatDateForInput(today)}
          onChange={handleDateChange}
          style={{
            padding: '10px 14px', borderRadius: 8,
            border: '2px solid #e5e7eb', fontSize: 16,
            cursor: 'pointer', width: '100%',
          }}
        />
        <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 14 }}>
          📅 {formatDateDisplay(selectedDate)}
        </p>
      </div>

      {step === 'slots' && (
        <div>
          <h2 style={{ marginBottom: 16 }}>Horas disponibles</h2>
          {isLoading ? (
            <p style={{ color: '#9ca3af' }}>Cargando horarios...</p>
          ) : slots.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 40,
              background: '#f9fafb', borderRadius: 12,
              border: '2px dashed #e5e7eb',
            }}>
              <p style={{ fontSize: 32 }}>😕</p>
              <p style={{ color: '#6b7280', margin: 0 }}>No hay turnos disponibles para este día</p>
              <p style={{ color: '#9ca3af', fontSize: 14 }}>Prueba con otra fecha</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {slots.map(slot => (
                <SlotCard
                  key={slot._id}
                  slot={slot}
                  onSelect={handleSelectSlot}
                  isSelected={selectedSlot?._id === slot._id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {step === 'confirm' && selectedSlot && (
        <div style={{
          background: '#f9fafb', borderRadius: 12,
          padding: 24, border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ marginTop: 0 }}>Confirmar reserva</h2>
          <div style={{
            background: '#fff', borderRadius: 8, padding: 16,
            marginBottom: 20, border: '2px solid #6366f1',
          }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 'bold' }}>🕐 {selectedSlot.hour}</p>
            <p style={{ margin: '4px 0 0', color: '#6b7280' }}>📅 {formatDateDisplay(selectedDate)}</p>
            <p style={{ margin: '4px 0 0', color: '#6b7280' }}>👤 {name}</p>
          </div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>Tu teléfono</label>
          <input
            type="tel"
            placeholder="Ej: 0991234567"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={{
              display: 'block', width: '100%', padding: '10px 14px',
              borderRadius: 8, border: '2px solid #e5e7eb',
              fontSize: 16, marginBottom: 16, boxSizing: 'border-box',
            }}
          />
          {error && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setStep('slots')} style={{
              flex: 1, padding: '12px', borderRadius: 8,
              border: '2px solid #e5e7eb', background: '#fff',
              cursor: 'pointer', fontWeight: 'bold',
            }}>
              ← Volver
            </button>
            <button onClick={handleBook} style={{
              flex: 2, padding: '12px', borderRadius: 8,
              border: 'none', background: '#6366f1',
              color: '#fff', cursor: 'pointer',
              fontWeight: 'bold', fontSize: 16,
            }}>
              Reservar turno
            </button>
          </div>
        </div>
      )}

      {step === 'done' && bookedAppointment && (
        <div style={{
          textAlign: 'center', padding: 40,
          background: '#f0fdf4', borderRadius: 12,
          border: '2px solid #10b981',
        }}>
          <p style={{ fontSize: 48, margin: 0 }}>✅</p>
          <h2 style={{ color: '#059669' }}>¡Turno reservado!</h2>
          <p style={{ color: '#374151', fontSize: 18 }}><strong>{bookedAppointment.hour}</strong></p>
          <p style={{ color: '#6b7280' }}>{formatDateDisplay(bookedAppointment.date)}</p>
          <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
            El barbero confirmará tu turno pronto
          </p>
          <button onClick={handleNewBooking} style={{
            padding: '12px 24px', borderRadius: 8,
            border: 'none', background: '#6366f1',
            color: '#fff', cursor: 'pointer',
            fontWeight: 'bold', fontSize: 16,
          }}>
            Reservar otro turno
          </button>
        </div>
      )}
    </div>
  );
}
