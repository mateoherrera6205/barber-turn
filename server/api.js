/**
 * server/api.js  (refactorizado — patrón Repository + DIP)
 *
 * Los endpoints ya no importan ni consultan las colecciones Mongo directamente.
 * Dependen de los repositorios (DIP), que encapsulan las operaciones de base
 * de datos y exponen métodos con nombres de dominio.
 */
import { WebApp } from 'meteor/webapp';
import { AppointmentsRepository } from '../imports/api/repositories/AppointmentsRepository';
import { SlotsRepository } from '../imports/api/repositories/SlotsRepository';

const appointmentsRepo = new AppointmentsRepository();
const slotsRepo = new SlotsRepository();

// Helper: serializa la respuesta JSON con el status HTTP correcto
const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

// CORS: aplica a todas las rutas /api/*
WebApp.handlers.use('/api', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  next();
});

// GET /api/slots
// Query params opcionales:
//   date   = YYYY-MM-DD         → filtra por rango del día
//   status = available | unavailable → mapea a isAvailable boolean
WebApp.handlers.get('/api/slots', async (req, res) => {
  try {
    const { date, status } = req.query;
    const data = await slotsRepo.findWithFilters({ date, status });
    json(res, 200, { ok: true, data });
  } catch (err) {
    json(res, 500, { ok: false, error: err.message });
  }
});

// GET /api/appointments
// Query param opcional:
//   status = pending | confirmed | cancelled
WebApp.handlers.get('/api/appointments', async (req, res) => {
  try {
    const { status } = req.query;
    const data = await appointmentsRepo.findWithFilters({ status });
    json(res, 200, { ok: true, data });
  } catch (err) {
    json(res, 500, { ok: false, error: err.message });
  }
});

// GET /api/appointments/:id
WebApp.handlers.get('/api/appointments/:id', async (req, res) => {
  try {
    const data = await appointmentsRepo.findById(req.params.id);
    if (!data) return json(res, 404, { ok: false, error: 'Turno no encontrado' });
    json(res, 200, { ok: true, data });
  } catch (err) {
    json(res, 500, { ok: false, error: err.message });
  }
});
