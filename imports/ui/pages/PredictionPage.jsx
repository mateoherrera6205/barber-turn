/**
 * PredictionPage.jsx
 * Página de predicciones de demanda de BarberTurn, accesible solo para barberos.
 * Muestra las predicciones calculadas por el algoritmo, organizadas por día
 * en tabs navegables, con alertas visuales para situaciones problemáticas.
 *
 * Estructura de la página:
 *  1. Header: título, botón de Analytics y botón de recalcular predicciones
 *  2. Banner de alertas: aparece si hay franjas con situación anómala
 *  3. Tabs de días: un botón por día (Lun-Sáb) con badge de alertas si las hay
 *  4. Tabla de franjas: por cada hora del día seleccionado, muestra:
 *     - Hora, clientes esperados, barberos necesarios, ocupación histórica, estado/alerta
 *
 * Componentes auxiliares internos:
 *  - AlertaBadge: badge coloreado que muestra el tipo de alerta de una franja
 *  - FranjaRow: fila de la tabla con los datos de una franja horaria
 *
 * Hooks utilizados:
 *  - usePredictions() → suscrito a 'predictions.all'; retorna datos agrupados por día
 *  - useNavigate()    → para navegar a analytics
 *
 * Métodos Meteor que invoca:
 *  - predictions.calculate → recalcula todas las predicciones desde el historial actual
 */
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { usePredictions } from '../hooks/usePredictions';
import { useStaffingPlan } from '../hooks/useStaffingPlan';
import { formatoCorto } from '/imports/utils/fechas';

const TIPO_EMOJI = { agregar: '➕', reasignar: '🔁', reducir: '➖', confirmar: '📞' };

/**
 * ALERTA_CONFIG
 * Configuración visual para cada tipo de alerta del sistema de predicciones.
 * Define el color de texto, fondo y etiqueta para cada estado.
 */
const ALERTA_CONFIG = {
  ok:             { color: '#10b981', bg: '#f0fdf4', label: '✅ Óptimo' },        // Verde: situación normal
  demanda_alta:   { color: '#f59e0b', bg: '#fffbeb', label: '🔥 Demanda alta' },   // Amarillo: ocupación > 85%
  overbooking:    { color: '#ef4444', bg: '#fef2f2', label: '🚨 Overbooking' },    // Rojo: más clientes que barberos
  sobrecapacidad: { color: '#6366f1', bg: '#eef2ff', label: '💤 Sobrecapacidad' }, // Púrpura: demasiados barberos para poca demanda
};

/**
 * AlertaBadge
 * Badge inline que muestra el tipo de alerta con su color y etiqueta correspondiente.
 *
 * @param {String} alerta - Código de alerta: 'ok' | 'demanda_alta' | 'overbooking' | 'sobrecapacidad'
 */
function AlertaBadge({ alerta }) {
  // Usar la configuración del tipo de alerta; caer en 'ok' si el código no está definido
  const cfg = ALERTA_CONFIG[alerta] || ALERTA_CONFIG.ok;
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: '2px 8px', borderRadius: 10,
      fontSize: 11, fontWeight: 'bold',
      border: `1px solid ${cfg.color}`,
    }}>
      {cfg.label}
    </span>
  );
}

/**
 * FranjaRow
 * Fila de la tabla de predicciones que muestra todos los datos de una franja horaria.
 * El fondo y borde de la fila cambian de color si la franja tiene una alerta activa.
 *
 * @param {Object} franja - Documento de predicción con hora, métricas y tipo de alerta
 */
function FranjaRow({ franja }) {
  const cfg = ALERTA_CONFIG[franja.alerta] || ALERTA_CONFIG.ok;
  return (
    // Grid de 5 columnas: hora | clientes esperados | barberos | ocupación | estado
    <div style={{
      display: 'grid',
      gridTemplateColumns: '80px 1fr 1fr 1fr 140px',
      gap: 12, alignItems: 'center',
      padding: '10px 16px',
      // Resaltar el fondo si hay una alerta activa; blanco si está 'ok'
      background: franja.alerta !== 'ok' ? cfg.bg : '#fff',
      borderRadius: 6, marginBottom: 4,
      // Borde coloreado para alertas, gris claro para franjas normales
      border: `1px solid ${franja.alerta !== 'ok' ? cfg.color : '#e5e7eb'}`,
    }}>
      {/* Columna 1: Hora de la franja */}
      <span style={{ fontWeight: 'bold', color: '#374151' }}>🕐 {franja.hora}</span>

      {/* Columna 2: Clientes esperados (promedio histórico por semana) */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 'bold', color: '#6366f1' }}>
          {franja.clientesEsperados}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>clientes esperados</p>
      </div>

      {/* Columna 3: Barberos programados vs recomendados */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 'bold', color: (franja.gap ?? 0) > 0 ? '#ef4444' : '#10b981' }}>
          {franja.capacidadProgramada ?? 0} → {franja.barberosRecomendados}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>programados → necesarios</p>
      </div>

      {/* Columna 4: Ocupación histórica en porcentaje */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 'bold', color: '#f59e0b' }}>
          {(franja.ocupacionHistorica * 100).toFixed(0)}%
        </p>
        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>ocupación histórica</p>
      </div>

      {/* Columna 5: Badge de estado/alerta */}
      <AlertaBadge alerta={franja.alerta} />
    </div>
  );
}

export function PredictionPage() {
  const navigate = useNavigate();
  const { isLoading, porDia, predictions, totalAlertas, totalOverbooking } = usePredictions();
  const { accionesPorDia, isLoading: isLoadingPlan } = useStaffingPlan();

  // Día activo en los tabs (1=Lunes por defecto al cargar la página)
  const [diaActivo, setDiaActivo] = useState(1);
  // Estado de carga del botón de recalcular para deshabilitar mientras procesa
  const [calculando, setCalculando] = useState(false);

  /**
   * recalcular
   * Invoca el método del servidor que recalcula todas las predicciones
   * basándose en el historial actual de appointments.
   * Deshabilita el botón mientras procesa para evitar llamadas duplicadas.
   */
  const recalcular = () => {
    setCalculando(true);
    Meteor.call('predictions.calculate', (err) => {
      setCalculando(false);  // Rehabilitar el botón al terminar (éxito o error)
      if (err) alert(err.reason);
    });
  };

  // Mostrar indicador de carga mientras la suscripción no ha terminado
  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ color: '#9ca3af' }}>Cargando predicciones...</p>
    </div>
  );

  // Ventana de planificación: [hoy, hoy+6]
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hoyPlus6 = new Date(hoy);
  hoyPlus6.setDate(hoy.getDate() + 6);
  const ventana = `${formatoCorto(hoy)} – ${formatoCorto(hoyPlus6)}`;

  const updatedAt = predictions?.[0]?.updatedAt;
  const calculadoEl = updatedAt
    ? `${formatoCorto(new Date(updatedAt))} ${new Date(updatedAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
    : null;

  // Encontrar los datos del día actualmente seleccionado en los tabs
  const diaSeleccionado = porDia.find(d => d.dia === diaActivo);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'Arial, sans-serif' }}>

      {/* Header: título con semanas de historial, botones de analytics y recalcular */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>🔮 Predicciones — BarberTurn</h1>
          {/* Mostrar cuántas semanas de historial, ventana de planificación y timestamp del cálculo */}
          <p style={{ margin: 0, color: '#6b7280' }}>
            Recomendación de plantilla basada en {porDia[0]?.franjas[0]?.semanasTomadas || 0} semanas de historial
            {` · ventana: ${ventana}`}
            {calculadoEl && ` · calculado el ${calculadoEl}`}
          </p>
          {predictions?.[0]?.fuenteCapacidad && (
            <p style={{ margin: '2px 0 0', color: '#9ca3af', fontSize: 12 }}>
              Capacidad comparada:{' '}
              {predictions[0].fuenteCapacidad === 'proxima_semana'
                ? 'slots de la próxima semana'
                : 'promedio histórico'}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Botón de regreso al dashboard */}
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'transparent', border: '1px solid #e5e7eb',
            borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
          }}>
            ← Dashboard
          </button>
          {/* Botón de navegación a la página de analytics */}
          <button onClick={() => navigate('/analytics')} style={{
            background: 'transparent', border: '1px solid #e5e7eb',
            borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
          }}>
            📊 Analytics
          </button>
          <button onClick={() => navigate('/planner')} style={{
            background: 'transparent', border: '1px solid #e5e7eb',
            borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
          }}>
            🗓️ Planificador
          </button>
          {/* Botón de recalcular: deshabilitado mientras procesa */}
          <button onClick={recalcular} disabled={calculando} style={{
            background: calculando ? '#e5e7eb' : '#6366f1',
            color: calculando ? '#9ca3af' : '#fff',
            border: 'none', borderRadius: 6,
            padding: '8px 16px', cursor: calculando ? 'not-allowed' : 'pointer',
          }}>
            {calculando ? 'Calculando...' : '🔄 Recalcular'}
          </button>
        </div>
      </div>

      {/* Banner de alertas: solo visible cuando hay franjas con situación anómala */}
      {totalAlertas > 0 && (
        <div style={{
          background: '#fef2f2', border: '1px solid #ef4444',
          borderRadius: 10, padding: 16, marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <span style={{ fontSize: 32 }}>🚨</span>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#ef4444' }}>
              {totalAlertas} franjas con alertas detectadas
            </p>
            <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>
              {totalOverbooking} riesgos de overbooking — revisa las franjas marcadas en rojo
            </p>
          </div>
        </div>
      )}

      {/* Plan de acción para el día activo */}
      {(() => {
        const acciones = isLoadingPlan ? [] : (accionesPorDia[diaActivo] || []);
        return (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, color: '#1f2937' }}>
              📋 Plan de acción — {diaSeleccionado?.nombre || ''} {diaSeleccionado?.fechaCorta || ''}
            </h3>
            {acciones.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic', margin: 0 }}>
                Sin ajustes necesarios ✅
              </p>
            ) : (
              acciones.map((accion, idx) => (
                <div key={accion._id || idx} style={{
                  border: `1px solid ${accion.prioridad === 1 ? '#ef4444' : '#f59e0b'}`,
                  background: accion.prioridad === 1 ? '#fef2f2' : '#fffbeb',
                  borderRadius: 6, padding: '10px 16px', marginBottom: 8,
                }}>
                  {TIPO_EMOJI[accion.tipo] || '•'} 🕐 {accion.hora} — {accion.mensaje}
                </div>
              ))
            )}
          </div>
        );
      })()}

      {/* Tabs de navegación por día de semana (Lunes a Sábado) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {porDia.map(d => (
          <button
            key={d.dia}
            onClick={() => setDiaActivo(d.dia)}  // Cambiar el día activo al hacer clic
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: '2px solid',
              // Resaltar el tab del día activo en púrpura
              borderColor: diaActivo === d.dia ? '#6366f1' : '#e5e7eb',
              background:  diaActivo === d.dia ? '#6366f1' : '#fff',
              color:       diaActivo === d.dia ? '#fff'    : '#374151',
              cursor: 'pointer', fontWeight: 'bold',
              position: 'relative',
            }}
          >
            {d.nombre}
            <span style={{ display: 'block', fontSize: 11, opacity: 0.8 }}>{d.fechaCorta}</span>
            {/* Badge rojo con contador de alertas si el día tiene franjas problemáticas */}
            {d.alertas > 0 && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: '#ef4444', color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: 11, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold',
              }}>
                {d.alertas}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabla de franjas del día seleccionado */}
      {diaSeleccionado && (
        <div style={{ background: '#f9fafb', borderRadius: 12, padding: 20 }}>
          {/* Cabecera de la sección con la fecha del día y el pico de demanda */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>{diaSeleccionado.fechaLarga}</h2>
            <span style={{ color: '#6b7280', fontSize: 14, alignSelf: 'center' }}>
              Pico de demanda: {diaSeleccionado.maxDemanda} clientes/hora
            </span>
          </div>

          {/* Encabezados de columnas de la tabla */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 1fr 1fr 140px',
            gap: 12, padding: '0 16px', marginBottom: 8,
          }}>
            {['Hora', 'Clientes esperados', 'Programados → necesarios', 'Ocupación histórica', 'Estado'].map(h => (
              <span key={h} style={{ fontSize: 12, color: '#9ca3af', fontWeight: 'bold' }}>{h}</span>
            ))}
          </div>

          {/* Filas de predicción: una por franja horaria del día */}
          {diaSeleccionado.franjas.map(f => (
            // Clave compuesta para identificar unívocamente la franja día+hora
            <FranjaRow key={`${f.diaSemana}-${f.hora}`} franja={f} />
          ))}
        </div>
      )}

    </div>
  );
}
