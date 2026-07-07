/**
 * PlannerPage.jsx
 * Planificador semanal de turnos: muestra una cuadrícula (días × horas) donde
 * se pueden asignar y desasignar barberos en cada franja, integrado con las
 * predicciones de demanda para indicar si falta o sobra personal.
 *
 * Estructura:
 *  1. Header con botones de navegación y "Recalcular predicciones"
 *  2. Leyenda de colores de borde
 *  3. Cuadrícula: 6 columnas (días) × 8 filas (horas)
 *     - Chips de barberos asignados (× para quitar, 🔒 si tiene reserva)
 *     - Select "+ asignar…" con barberos aún no asignados
 *     - Indicador "N/M" (asignados/necesarios)
 *  4. Banner de error para 'slot-ocupado'
 */
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { usePlanner } from '../hooks/usePlanner';

const HORAS = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00'];

// Determina el color del borde de la celda según el staffing vs. demanda
function borderColor(asignados, necesarios, clientesEsperados) {
  if (asignados < necesarios) return '#ef4444';                                    // rojo: falta personal
  if (asignados > necesarios && clientesEsperados < asignados * 0.5) return '#f59e0b'; // ámbar: demasiados para poca demanda
  return '#e5e7eb';                                                                // gris: ok
}

export function PlannerPage() {
  const navigate  = useNavigate();
  const { isLoading, dias, barberos } = usePlanner();

  const [errorMsg,     setErrorMsg]     = useState(null);
  const [recalcStatus, setRecalcStatus] = useState(null); // null | 'loading' | 'done'

  const mostrarError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const handleAssign = (fecha, hora, barberId) => {
    Meteor.call('slots.assign', { barberId, date: fecha, hour: hora }, (err) => {
      if (err) mostrarError(err.reason || err.error);
    });
  };

  const handleUnassign = (fecha, hora, barberId) => {
    Meteor.call('slots.unassign', { barberId, date: fecha, hour: hora }, (err) => {
      if (err) mostrarError(err.reason || err.error);
    });
  };

  const handleRecalcular = () => {
    setRecalcStatus('loading');
    Meteor.call('predictions.calculate', (err) => {
      if (err) { mostrarError(err.reason); setRecalcStatus(null); return; }
      setRecalcStatus('done');
      setTimeout(() => setRecalcStatus(null), 3000);
    });
  };

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ color: '#9ca3af' }}>Cargando planificador...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24, fontFamily: 'Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>🗓️ Planificador semanal</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Asigna barberos a cada franja horaria de los próximos 7 días
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'transparent', border: '1px solid #e5e7eb',
            borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
          }}>
            ← Dashboard
          </button>
          <button onClick={() => navigate('/predictions')} style={{
            background: 'transparent', border: '1px solid #e5e7eb',
            borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
          }}>
            🔮 Predicciones
          </button>
          <button onClick={handleRecalcular} disabled={recalcStatus === 'loading'} style={{
            background: recalcStatus === 'loading' ? '#e5e7eb' : '#6366f1',
            color:      recalcStatus === 'loading' ? '#9ca3af' : '#fff',
            border: 'none', borderRadius: 6,
            padding: '8px 16px', cursor: recalcStatus === 'loading' ? 'not-allowed' : 'pointer',
          }}>
            {recalcStatus === 'loading' ? 'Calculando...' : recalcStatus === 'done' ? '✅ Plan actualizado' : '🔄 Recalcular predicciones'}
          </button>
        </div>
      </div>

      {/* Banner de error */}
      {errorMsg && (
        <div style={{
          background: '#fef2f2', border: '1px solid #ef4444', borderRadius: 8,
          padding: '10px 16px', marginBottom: 16, color: '#ef4444', fontSize: 14,
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 12, color: '#6b7280' }}>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#ef4444', borderRadius: 2, marginRight: 4 }}></span>Faltan barberos</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#f59e0b', borderRadius: 2, marginRight: 4 }}></span>Exceso de personal</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#e5e7eb', borderRadius: 2, marginRight: 4 }}></span>Staffing correcto</span>
      </div>

      {/* Cuadrícula */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `70px repeat(${dias.length}, minmax(140px, 1fr))`,
          gap: 4,
        }}>

          {/* Encabezados: celda vacía + un header por día */}
          <div />
          {dias.map(dia => (
            <div key={dia.diaSemana} style={{
              textAlign: 'center', padding: '6px 4px',
              background: '#f3f4f6', borderRadius: 6,
              fontSize: 13, fontWeight: 'bold', color: '#374151',
            }}>
              {dia.etiqueta}
            </div>
          ))}

          {/* Filas: una por hora */}
          {HORAS.map(hora => (
            <React.Fragment key={hora}>
              {/* Etiqueta de hora */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 'bold', color: '#6b7280',
              }}>
                🕐 {hora}
              </div>

              {/* Celdas: una por día */}
              {dias.map(dia => {
                const celda   = dia.celdas[hora];
                const borde   = borderColor(celda.asignados.length, celda.necesarios, celda.clientesEsperados);
                const disponibles = barberos.filter(b =>
                  !celda.asignados.some(a => a.barberId === b._id)
                );

                return (
                  <div key={dia.diaSemana} style={{
                    border: `2px solid ${borde}`, borderRadius: 6,
                    padding: '6px 8px', background: '#fff', minHeight: 70,
                  }}>
                    {/* Chips de barberos asignados */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                      {celda.asignados.map(a => (
                        <span key={a.barberId} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 2,
                          background: '#ede9fe', color: '#5b21b6',
                          borderRadius: 4, padding: '2px 6px', fontSize: 11,
                        }}>
                          {a.nombre}
                          {a.ocupado ? (
                            <span title="Tiene reserva — cancélala desde el Dashboard" style={{ cursor: 'default' }}>
                              🔒
                            </span>
                          ) : (
                            <button
                              onClick={() => handleUnassign(dia.fecha, hora, a.barberId)}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#7c3aed', padding: 0, fontSize: 11, lineHeight: 1,
                              }}
                              title="Quitar barbero"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>

                    {/* Select para asignar barberos disponibles */}
                    {disponibles.length > 0 && (
                      <select
                        defaultValue=""
                        onChange={e => {
                          if (e.target.value) {
                            handleAssign(dia.fecha, hora, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        style={{
                          fontSize: 11, color: '#6b7280',
                          border: '1px dashed #d1d5db', borderRadius: 4,
                          padding: '2px 4px', background: '#f9fafb',
                          cursor: 'pointer', width: '100%',
                        }}
                      >
                        <option value="">+ asignar…</option>
                        {disponibles.map(b => (
                          <option key={b._id} value={b._id}>{b.nombre}</option>
                        ))}
                      </select>
                    )}

                    {/* Indicador asignados/necesarios */}
                    <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2, textAlign: 'right' }}>
                      {celda.asignados.length}/{celda.necesarios}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

    </div>
  );
}
