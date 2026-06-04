/**
 * BookingPage.jsx
 * Página de reserva de turnos para clientes en BarberTurn.
 * Implementa un flujo de 3 pasos para reservar un turno:
 *  1. 'slots'   → El cliente selecciona una fecha y ve los slots disponibles
 *  2. 'confirm' → El cliente ingresa su teléfono y confirma la reserva
 *  3. 'done'    → Confirmación visual de la reserva exitosa
 *
 * Hooks utilizados:
 *  - useAuth()      → para obtener el nombre del cliente logueado
 *  - useTracker()   → para suscribirse a 'slots.available' de forma reactiva
 *  - useState()     → para manejar el estado del flujo multi-paso
 *  - useNavigate()  → para el logout y redirección
 *
 * Métodos Meteor que invoca:
 *  - appointments.book → reserva el slot seleccionado para el cliente
 *
 * Estado interno:
 *  - selectedDate      {Date}         Fecha seleccionada en el date picker (default: hoy)
 *  - selectedSlot      {Object|null}  Slot seleccionado en el paso 1
 *  - phone             {String}       Teléfono ingresado en el paso 2
 *  - step              {String}       Paso actual: 'slots' | 'confirm' | 'done'
 *  - error             {String}       Mensaje de error si la reserva falla
 *  - bookedAppointment {Object|null}  Datos del turno confirmado para mostrar en paso 3
 */
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

  // Fecha inicial: hoy a las 05:00 UTC (medianoche Ecuador) para consistencia con la BD
  const today = new Date();
  today.setUTCHours(5, 0, 0, 0);

  // Estado del flujo de reserva
  const [selectedDate, setSelectedDate] = useState(today);     // Fecha seleccionada
  const [selectedSlot, setSelectedSlot] = useState(null);      // Slot elegido
  const [phone, setPhone] = useState('');                      // Teléfono del cliente
  const [step, setStep] = useState('slots');                   // Paso actual del flujo
  const [error, setError] = useState('');                      // Error de validación o del servidor
  const [bookedAppointment, setBookedAppointment] = useState(null); // Datos para la confirmación

  // Suscripción reactiva a los slots disponibles para la fecha seleccionada
  // useTracker con [selectedDate] como dependencia se re-ejecuta cuando cambia la fecha
  const { slots, isLoading } = useTracker(() => {
    // Suscribirse al servidor con la fecha actual para obtener los slots disponibles
    const handle = Meteor.subscribe('slots.available', { date: selectedDate });
    return {
      isLoading: false,
      // Consultar MiniMongo filtrando por fecha y disponibilidad, ordenados por hora
      slots: Slots.find({ date: selectedDate, isAvailable: true },
        { sort: { hour: 1 } }
      ).fetch(),
    };
  }, [selectedDate]);

  /**
   * handleDateChange
   * Actualiza la fecha seleccionada cuando el usuario cambia el date picker.
   * Resetea el slot seleccionado y el paso del flujo para volver al inicio.
   *
   * @param {Event} e - Evento de cambio del input type="date"
   */
  const handleDateChange = (e) => {
    // Crear la fecha desde el string YYYY-MM-DD del input y normalizar a UTC-5
    const date = new Date(e.target.value);
    date.setUTCHours(5, 0, 0, 0);
    setSelectedDate(date);
    // Resetear el flujo al cambiar de fecha
    setSelectedSlot(null);
    setStep('slots');
    setError('');
  };

  /**
   * handleSelectSlot
   * Registra el slot seleccionado por el cliente y avanza al paso de confirmación.
   *
   * @param {Object} slot - Documento del slot seleccionado
   */
  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setStep('confirm');  // Avanzar al paso de confirmación
    setError('');
  };

  /**
   * handleBook
   * Valida el teléfono e invoca el método del servidor para reservar el turno.
   * Si la reserva es exitosa, guarda los datos y avanza al paso 'done'.
   * Si falla (slot ya tomado, sin sesión, etc.), muestra el error.
   */
  const handleBook = () => {
    // Validar que el cliente ingresó su teléfono antes de proceder
    if (!phone.trim()) {
      setError('Ingresa tu número de teléfono');
      return;
    }

    // Invocar el método del servidor para reservar el slot seleccionado
    Meteor.call('appointments.book', {
      slotId: selectedSlot._id,
      clientName: name,           // Nombre del cliente obtenido del perfil de Meteor
      clientPhone: phone.trim(),  // Teléfono ingresado por el cliente
    }, (err, appointmentId) => {
      if (err) {
        // Mostrar el error del servidor (ej: "Este turno ya no está disponible")
        setError(err.reason || 'Error al reservar');
        return;
      }
      // Reserva exitosa: guardar datos para mostrar en la pantalla de confirmación
      setBookedAppointment({
        id: appointmentId,
        hour: selectedSlot.hour,
        date: selectedDate,
      });
      setStep('done');  // Avanzar al paso final
    });
  };

  /**
   * handleNewBooking
   * Resetea todo el estado para permitir hacer una nueva reserva desde cero.
   */
  const handleNewBooking = () => {
    setSelectedSlot(null);
    setPhone('');
    setStep('slots');
    setError('');
    setBookedAppointment(null);
  };

  // Cerrar sesión y redirigir al login
  const handleLogout = () => {
    Meteor.logout(() => navigate('/login'));
  };

  /**
   * formatDateForInput
   * Convierte un objeto Date al formato YYYY-MM-DD requerido por input type="date".
   *
   * @param {Date} date - Fecha a formatear
   * @returns {String} Fecha en formato 'YYYY-MM-DD'
   */
  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  /**
   * formatDateDisplay
   * Formatea una fecha para mostrarla de forma legible en español (Ecuador).
   * Ej: "martes, 4 de junio de 2026"
   *
   * @param {Date} date - Fecha a formatear
   * @returns {String} Fecha formateada en español con día de semana
   */
  const formatDateDisplay = (date) => {
    return date.toLocaleDateString('es-EC', {
      weekday: 'long', year: 'numeric',
      month: 'long', day: 'numeric'
    });
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      {/* Header: título y botón de logout */}
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

      {/* Selector de fecha: el cliente elige el día que quiere reservar */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#374151' }}>
          Selecciona el día
        </label>
        <input
          type="date"
          value={formatDateForInput(selectedDate)}
          min={formatDateForInput(today)}  // No permitir fechas pasadas
          onChange={handleDateChange}
          style={{
            padding: '10px 14px', borderRadius: 8,
            border: '2px solid #e5e7eb', fontSize: 16,
            cursor: 'pointer', width: '100%',
          }}
        />
        {/* Mostrar la fecha seleccionada en formato legible */}
        <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 14 }}>
          📅 {formatDateDisplay(selectedDate)}
        </p>
      </div>

      {/* PASO 1: Selección de slot horario */}
      {step === 'slots' && (
        <div>
          <h2 style={{ marginBottom: 16 }}>Horas disponibles</h2>
          {isLoading ? (
            // Estado de carga
            <p style={{ color: '#9ca3af' }}>Cargando horarios...</p>
          ) : slots.length === 0 ? (
            // Estado vacío: no hay slots disponibles para esa fecha
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
            // Grid de SlotCards: uno por cada slot disponible
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {slots.map(slot => (
                <SlotCard
                  key={slot._id}
                  slot={slot}
                  onSelect={handleSelectSlot}
                  isSelected={selectedSlot?._id === slot._id}  // Resaltar el seleccionado
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* PASO 2: Confirmación de reserva e ingreso de teléfono */}
      {step === 'confirm' && selectedSlot && (
        <div style={{
          background: '#f9fafb', borderRadius: 12,
          padding: 24, border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ marginTop: 0 }}>Confirmar reserva</h2>

          {/* Resumen del turno seleccionado */}
          <div style={{
            background: '#fff', borderRadius: 8, padding: 16,
            marginBottom: 20, border: '2px solid #6366f1',
          }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 'bold' }}>🕐 {selectedSlot.hour}</p>
            <p style={{ margin: '4px 0 0', color: '#6b7280' }}>📅 {formatDateDisplay(selectedDate)}</p>
            <p style={{ margin: '4px 0 0', color: '#6b7280' }}>👤 {name}</p>
          </div>

          {/* Campo para ingresar el teléfono de contacto */}
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

          {/* Mostrar error si la reserva falló */}
          {error && <p style={{ color: '#ef4444', marginBottom: 12 }}>{error}</p>}

          {/* Botones de acción: volver al paso 1 o confirmar la reserva */}
          <div style={{ display: 'flex', gap: 12 }}>
            {/* Volver al listado de slots */}
            <button onClick={() => setStep('slots')} style={{
              flex: 1, padding: '12px', borderRadius: 8,
              border: '2px solid #e5e7eb', background: '#fff',
              cursor: 'pointer', fontWeight: 'bold',
            }}>
              ← Volver
            </button>
            {/* Confirmar la reserva: invoca handleBook que llama a appointments.book */}
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

      {/* PASO 3: Confirmación exitosa de la reserva */}
      {step === 'done' && bookedAppointment && (
        <div style={{
          textAlign: 'center', padding: 40,
          background: '#f0fdf4', borderRadius: 12,
          border: '2px solid #10b981',
        }}>
          <p style={{ fontSize: 48, margin: 0 }}>✅</p>
          <h2 style={{ color: '#059669' }}>¡Turno reservado!</h2>
          {/* Mostrar los datos del turno confirmado */}
          <p style={{ color: '#374151', fontSize: 18 }}><strong>{bookedAppointment.hour}</strong></p>
          <p style={{ color: '#6b7280' }}>{formatDateDisplay(bookedAppointment.date)}</p>
          <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
            El barbero confirmará tu turno pronto
          </p>
          {/* Botón para reiniciar el flujo y hacer otra reserva */}
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
