/**
 * AnalyticsPage.jsx
 * Página de analytics históricos de BarberTurn, accesible solo para barberos.
 * Muestra estadísticas globales del sistema usando los datos calculados por useAnalytics().
 *
 * Estructura de la página:
 *  1. Header: título y botón de regreso al Dashboard
 *  2. Stats generales: 4 tarjetas con totales (slots, confirmados, cancelados, ocupación)
 *  3. Gráficos de barras horizontales:
 *     - Demanda por día de semana (Lun-Sáb)
 *     - Demanda por franja horaria (09:00-17:00)
 *  4. Ocupación por barbero: tarjeta por barbero con barra de progreso
 *
 * Componentes auxiliares internos:
 *  - MiniBar:  barra horizontal proporcional para visualizar valores relativos
 *  - StatCard: tarjeta de estadística con número grande y etiqueta
 *
 * Hooks utilizados:
 *  - useAnalytics() → suscrito a 'analytics.overview'; retorna todas las métricas calculadas
 *  - useNavigate()  → para navegar de vuelta al dashboard
 */
import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';

// Colores para las barras de los gráficos: púrpura para confirmados, rojo para cancelados
const BAR_COLORS = { confirmados: '#6366f1', cancelados: '#ef4444' };

/**
 * MiniBar
 * Barra horizontal que representa un valor como porcentaje del máximo del conjunto.
 * Se usa para mostrar la demanda relativa de cada día u hora de forma visual.
 *
 * @param {Number} valor - El valor a representar
 * @param {Number} max   - El valor máximo del conjunto (para calcular el porcentaje)
 * @param {String} color - Color de la barra (hex)
 */
function MiniBar({ valor, max, color }) {
  // Calcular el porcentaje de la barra respecto al máximo; 0 si max es 0 (evita NaN)
  const pct = max > 0 ? (valor / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Contenedor gris de fondo + barra coloreada proporcional */}
      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 10 }}>
        <div style={{ width: `${pct}%`, background: color, borderRadius: 4, height: 10, transition: 'width 0.3s' }} />
      </div>
      {/* Valor numérico al final de la barra */}
      <span style={{ fontSize: 12, color: '#6b7280', minWidth: 24 }}>{valor}</span>
    </div>
  );
}

/**
 * StatCard
 * Tarjeta de estadística con un número destacado, etiqueta y subtexto opcional.
 * El borde superior tiene el color del indicador para distinguir cada métrica visualmente.
 *
 * @param {String} label - Etiqueta descriptiva de la métrica
 * @param {*}      value - Valor a mostrar (puede ser número o string con %)
 * @param {String} color - Color del borde superior y del número
 * @param {String} sub   - Texto adicional debajo de la etiqueta (opcional)
 */
function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: 20,
      borderTop: `4px solid ${color}`, border: `1px solid #e5e7eb`,
      borderTopColor: color,
    }}>
      <p style={{ margin: 0, fontSize: 32, fontWeight: 'bold', color }}>{value}</p>
      <p style={{ margin: '4px 0 0', color: '#374151', fontWeight: 'bold' }}>{label}</p>
      {/* Subtexto opcional, ej: "confirmados / slots" para la ocupación */}
      {sub && <p style={{ margin: '2px 0 0', color: '#9ca3af', fontSize: 12 }}>{sub}</p>}
    </div>
  );
}

export function AnalyticsPage() {
  const navigate = useNavigate();
  // Obtener todas las métricas calculadas del hook de analytics
  const data = useAnalytics();

  // Mostrar indicador de carga mientras la suscripción no ha completado
  if (data.isLoading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ color: '#9ca3af' }}>Cargando analytics...</p>
    </div>
  );

  // Calcular el máximo de confirmados para normalizar las barras proporcionales
  const maxDia  = Math.max(...data.demandaPorDia.map(d => d.confirmados));   // Para el gráfico de días
  const maxHora = Math.max(...data.demandaPorHora.map(h => h.confirmados));  // Para el gráfico de horas

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'Arial, sans-serif' }}>

      {/* Header: título y botón de regreso al dashboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0 }}>📊 Analytics — BarberTurn</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>Comportamiento histórico del sistema</p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={{
          background: 'transparent', border: '1px solid #e5e7eb',
          borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
        }}>
          ← Dashboard
        </button>
      </div>

      {/* Stats generales: 4 tarjetas con KPIs globales del sistema */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Slots"      value={data.totalSlots}       color="#6366f1" />
        <StatCard label="Confirmados"      value={data.totalConfirmados}  color="#10b981" />
        <StatCard label="Cancelados"       value={data.totalCancelados}   color="#ef4444" />
        {/* Ocupación = confirmados/slots × 100, con subtexto explicativo */}
        <StatCard label="Ocupación global" value={`${data.ocupacion}%`}  color="#f59e0b" sub="confirmados / slots" />
      </div>

      {/* Sección de gráficos de demanda: dos columnas lado a lado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Gráfico de barras: demanda por día de semana */}
        <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginTop: 0, color: '#1f2937' }}>📅 Demanda por día</h3>
          {data.demandaPorDia.map(d => (
            <div key={d.dia} style={{ marginBottom: 12 }}>
              {/* Fila con nombre del día y contadores numéricos */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 'bold', fontSize: 14 }}>{d.dia}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  {d.confirmados} confirmados · {d.cancelados} cancelados
                </span>
              </div>
              {/* Barra proporcional al máximo del conjunto de días */}
              <MiniBar valor={d.confirmados} max={maxDia} color={BAR_COLORS.confirmados} />
            </div>
          ))}
        </div>

        {/* Gráfico de barras: demanda por franja horaria */}
        <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginTop: 0, color: '#1f2937' }}>🕐 Demanda por hora</h3>
          {data.demandaPorHora.map(h => (
            <div key={h.hora} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 'bold', fontSize: 14 }}>{h.hora}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  {h.confirmados} confirmados · {h.cancelados} cancelados
                </span>
              </div>
              {/* Barra proporcional al máximo del conjunto de horas */}
              <MiniBar valor={h.confirmados} max={maxHora} color={BAR_COLORS.confirmados} />
            </div>
          ))}
        </div>
      </div>

      {/* Sección de ocupación por barbero: tarjeta por barbero con barra de progreso */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb' }}>
        <h3 style={{ marginTop: 0, color: '#1f2937' }}>💈 Ocupación por barbero</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {data.porBarbero.map(b => (
            <div key={b.barberId} style={{
              background: '#f9fafb', borderRadius: 8, padding: 16,
              borderLeft: '4px solid #6366f1',  // Línea izquierda distintiva
            }}>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: 16 }}>{b.nombre}</p>
              {/* Ratio de slots confirmados vs total */}
              <p style={{ margin: '4px 0', color: '#6b7280', fontSize: 14 }}>
                {b.confirmados} / {b.totalSlots} slots
              </p>
              {/* Barra de ocupación: ancho = porcentaje de ocupación */}
              <div style={{ background: '#e5e7eb', borderRadius: 4, height: 8, marginTop: 8 }}>
                <div style={{
                  width: `${b.ocupacion}%`, background: '#6366f1',
                  borderRadius: 4, height: 8, transition: 'width 0.3s'
                }} />
              </div>
              {/* Porcentaje de ocupación como texto destacado */}
              <p style={{ margin: '4px 0 0', fontWeight: 'bold', color: '#6366f1' }}>
                {b.ocupacion}% ocupación
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
