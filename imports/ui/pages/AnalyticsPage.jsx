import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../hooks/useAnalytics';

const BAR_COLORS = { confirmados: '#6366f1', cancelados: '#ef4444' };

function MiniBar({ valor, max, color }) {
  const pct = max > 0 ? (valor / max) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 10 }}>
        <div style={{ width: `${pct}%`, background: color, borderRadius: 4, height: 10, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, color: '#6b7280', minWidth: 24 }}>{valor}</span>
    </div>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: 20,
      borderTop: `4px solid ${color}`, border: `1px solid #e5e7eb`,
      borderTopColor: color,
    }}>
      <p style={{ margin: 0, fontSize: 32, fontWeight: 'bold', color }}>{value}</p>
      <p style={{ margin: '4px 0 0', color: '#374151', fontWeight: 'bold' }}>{label}</p>
      {sub && <p style={{ margin: '2px 0 0', color: '#9ca3af', fontSize: 12 }}>{sub}</p>}
    </div>
  );
}

export function AnalyticsPage() {
  const navigate = useNavigate();
  const data = useAnalytics();

  if (data.isLoading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ color: '#9ca3af' }}>Cargando analytics...</p>
    </div>
  );

  const maxDia  = Math.max(...data.demandaPorDia.map(d => d.confirmados));
  const maxHora = Math.max(...data.demandaPorHora.map(h => h.confirmados));

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'Arial, sans-serif' }}>

      {/* Header */}
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

      {/* Stats generales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Slots"      value={data.totalSlots}       color="#6366f1" />
        <StatCard label="Confirmados"      value={data.totalConfirmados}  color="#10b981" />
        <StatCard label="Cancelados"       value={data.totalCancelados}   color="#ef4444" />
        <StatCard label="Ocupación global" value={`${data.ocupacion}%`}  color="#f59e0b" sub="confirmados / slots" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Demanda por día */}
        <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginTop: 0, color: '#1f2937' }}>📅 Demanda por día</h3>
          {data.demandaPorDia.map(d => (
            <div key={d.dia} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 'bold', fontSize: 14 }}>{d.dia}</span>
                <span style={{ fontSize: 12, color: '#6b7280' }}>
                  {d.confirmados} confirmados · {d.cancelados} cancelados
                </span>
              </div>
              <MiniBar valor={d.confirmados} max={maxDia} color={BAR_COLORS.confirmados} />
            </div>
          ))}
        </div>

        {/* Demanda por hora */}
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
              <MiniBar valor={h.confirmados} max={maxHora} color={BAR_COLORS.confirmados} />
            </div>
          ))}
        </div>
      </div>

      {/* Ocupación por barbero */}
      <div style={{ background: '#fff', borderRadius: 10, padding: 20, border: '1px solid #e5e7eb' }}>
        <h3 style={{ marginTop: 0, color: '#1f2937' }}>💈 Ocupación por barbero</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {data.porBarbero.map(b => (
            <div key={b.barberId} style={{
              background: '#f9fafb', borderRadius: 8, padding: 16,
              borderLeft: '4px solid #6366f1',
            }}>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: 16 }}>{b.nombre}</p>
              <p style={{ margin: '4px 0', color: '#6b7280', fontSize: 14 }}>
                {b.confirmados} / {b.totalSlots} slots
              </p>
              <div style={{ background: '#e5e7eb', borderRadius: 4, height: 8, marginTop: 8 }}>
                <div style={{
                  width: `${b.ocupacion}%`, background: '#6366f1',
                  borderRadius: 4, height: 8, transition: 'width 0.3s'
                }} />
              </div>
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
