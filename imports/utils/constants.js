/**
 * constants.js
 * Constantes globales compartidas entre el servidor y el cliente en BarberTurn.
 * Centralizar estas constantes evita strings mágicos dispersos en el código
 * y garantiza consistencia en los valores usados en métodos, publicaciones y UI.
 *
 * Exportaciones:
 *  - ROLES             → Roles de usuario del sistema
 *  - ROUTES            → Rutas de navegación de React Router
 *  - APPOINTMENT_STATUS → Estados posibles de un turno (appointment)
 */

/**
 * ROLES
 * Define los roles de usuario disponibles en el sistema.
 * Usado en:
 *  - accounts.js (validación al crear usuario)
 *  - PrivateRoute.jsx (control de acceso por rol)
 *  - seed.js (asignación de rol al crear usuarios de prueba)
 */
export const ROLES = {
  BARBERO: 'barbero',  // Barbero: accede a dashboard, analytics y predicciones
  CLIENTE: 'cliente',  // Cliente: accede únicamente a la página de reservas
};

/**
 * ROUTES
 * Rutas de navegación de la SPA definidas en App.jsx.
 * Centralizar las rutas facilita cambiarlas sin buscar strings en múltiples archivos.
 * Actualmente no se usa en todos los archivos (algunos usan el string directamente),
 * pero están definidas aquí como referencia canónica del sistema de rutas.
 */
export const ROUTES = {
  LOGIN:     '/login',     // Página de inicio de sesión
  REGISTER:  '/register',  // Página de registro de nuevos usuarios
  DASHBOARD: '/dashboard', // Panel de control del barbero
  BOOKING:   '/booking',   // Página de reservas del cliente
};

/**
 * APPOINTMENT_STATUS
 * Estados posibles de un turno (appointment) a lo largo de su ciclo de vida.
 * Usado en:
 *  - appointments.methods.js (validación y asignación de estados)
 *  - AppointmentCard.jsx (colores y botones según estado)
 *  - useAnalytics.js (filtrado por estado para métricas)
 *
 * Ciclo de vida típico:
 *  pending → confirmed (barbero confirma)
 *  pending → cancelled (barbero o cliente cancela)
 */
export const APPOINTMENT_STATUS = {
  PENDING:   'pending',    // Estado inicial: esperando confirmación del barbero
  CONFIRMED: 'confirmed',  // Turno confirmado: el barbero atenderá al cliente
  CANCELLED: 'cancelled',  // Turno cancelado: el slot asociado queda libre de nuevo
};
