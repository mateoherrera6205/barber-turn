import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import { usePredictions } from '../hooks/usePredictions';

const ALERTA_CONFIG = {
  ok:             { color: '#10b981', bg: '#f0fdf4', label: '✅ Óptimo' },
  demanda_alta:   { color: '#f59e0b', bg: '#fffbeb', label: '🔥 Demanda alta' },
  overbooking:    { color: '#ef4444', bg: '#fef2f2', label: '🚨 Overbooking' },
  sobrecapacidad: { color: '#6366f1', bg: '#eef2ff', label: '💤 Sobrecapacidad' },
};

function AlertaBadge({ alerta }) {
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

function FranjaRow({ franja }) {
  const cfg = ALERTA_CONFIG[franja.alerta] || ALERTA_CONFIG.ok;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '80px 1fr 1fr 1fr 140px',
      gap: 12, alignItems: 'center',
      padding: '10px 16px',
      background: franja.alerta !== 'ok' ? cfg.bg : '#fff',
      borderRadius: 6, marginBottom: 4,
      border: `1px solid ${franja.alerta !== 'ok' ? cfg.color : '#e5e7eb'}`,
    }}>
      <span style={{ fontWeight: 'bold', color: '#374151' }}>🕐 {franja.hora}</span>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 'bold', color: '#6366f1' }}>
          {franja.clientesEsperados}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>clientes esperados</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 'bold', color: '#10b981' }}>
          {franja.barberosRecomendados}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>barberos necesarios</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 'bold', color: '#f59e0b' }}>
          {(franja.ocupacionHistorica * 100).toFixed(0)}%
        </p>
        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>ocupación histórica</p>
      </div>
      <AlertaBadge alerta={franja.alerta} />
    </div>
  );
}

export function PredictionPage() {
  const navigate = useNavigate();
  const { isLoading, porDia, totalAlertas, totalOverbooking } = usePredictions();
  const [diaActivo, setDiaActivo] = useState(1);
  const [calculando, setCalculando] = useState(false);

  const recalcular = () => {
    setCalculando(true);
    Meteor.call('predictions.calculate', (err) => {
      setCalculando(false);
      if (err) alert(err.reason);
    });
  };

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <p style={{ color: '#9ca3af' }}>Cargando predicciones...</p>
    </div>
  );

  const diaSeleccionado = porDia.find(d => d.dia === diaActivo);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>🔮 Predicciones — BarberTurn</h1>
          <p style={{ margin: 0, color: '#6b7280' }}>
            Recomendación de plantilla basada en {porDia[0]?.franjas[0]?.semanasTomadas || 0} semanas de historial
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/analytics')} style={{
            background: 'transparent', border: '1px solid #e5e7eb',
            borderRadius: 6, padding: '8px 16px', cursor: 'pointer',
          }}>
            📊 Analytics
          </button>
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

      {/* Resumen de alertas */}
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

      {/* Tabs por día */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {porDia.map(d => (
          <button
            key={d.dia}
            onClick={() => setDiaActivo(d.dia)}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: '2px solid',
              borderColor: diaActivo === d.dia ? '#6366f1' : '#e5e7eb',
              background: diaActivo === d.dia ? '#6366f1' : '#fff',
              color: diaActivo === d.dia ? '#fff' : '#374151',
              cursor: 'pointer', fontWeight: 'bold',
              position: 'relative',
            }}
          >
            {d.nombre}
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

      {/* Franjas del día seleccionado */}
      {diaSeleccionado && (
        <div style={{ background: '#f9fafb', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>{diaSeleccionado.nombre}</h2>
            <span style={{ color: '#6b7280', fontSize: 14, alignSelf: 'center' }}>
              Pico de demanda: {diaSeleccionado.maxDemanda} clientes/hora
            </span>
          </div>

          {/* Header de columnas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 1fr 1fr 140px',
            gap: 12, padding: '0 16px', marginBottom: 8,
          }}>
            {['Hora', 'Clientes esperados', 'Barberos necesarios', 'Ocupación histórica', 'Estado'].map(h => (
              <span key={h} style={{ fontSize: 12, color: '#9ca3af', fontWeight: 'bold' }}>{h}</span>
            ))}
          </div>

          {diaSeleccionado.franjas.map(f => (
            <FranjaRow key={`${f.diaSemana}-${f.hora}`} franja={f} />
          ))}
        </div>
      )}

    </div>
  );
}
