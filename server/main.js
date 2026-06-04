/**
 * server/main.js
 * Punto de entrada del servidor de BarberTurn.
 * Este archivo es el primero que Meteor ejecuta en el servidor.
 * Su responsabilidad es:
 *  1. Importar todos los módulos del servidor (methods, publications, startup hooks)
 *  2. Ejecutar la inicialización de la aplicación en el evento Meteor.startup()
 *
 * La secuencia de inicialización garantiza que:
 *  - Siempre existe al menos un usuario barbero de demostración
 *  - Si la BD tiene pocos datos, se ejecuta el seed de datos históricos
 *  - Si no hay predicciones calculadas, se calculan automáticamente
 */
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Appointments } from '../imports/api/appointments/appointments';
import { Predictions } from '../imports/api/predictions/predictions';

// Importar definiciones de métodos Meteor del servidor
import '../imports/api/appointments/appointments.methods';
import '../imports/api/appointments/appointments.publications';
import '../imports/api/slots/slots.methods';
import '../imports/api/slots/slots.publications';

// Importar configuración del sistema de cuentas (validación y hooks de usuario)
import '../imports/startup/server/accounts';

// Importar métodos y publicaciones del resto de módulos
import '../imports/api/users/users.methods';
import '../imports/api/analytics/analytics.publications';
import '../imports/api/predictions/predictions.methods';
import '../imports/api/predictions/predictions.publications';

// Importar la función de seed y la de cálculo de predicciones
import { runSeed } from '../bot/seed';
import { calcularPredicciones } from '../imports/api/predictions/predictions.methods';

/**
 * Meteor.startup
 * Callback que se ejecuta una sola vez cuando el servidor termina de arrancar.
 * Realiza tres verificaciones secuenciales para garantizar un estado inicial correcto:
 *
 *  1. Usuario demo: si no hay usuarios en la BD, crea el barbero de demostración.
 *     Esto sirve para que el sistema sea usable desde el primer arranque.
 *
 *  2. Datos históricos: si hay menos de 50 appointments, ejecuta el bot de seed
 *     para generar 8 semanas de historial realista. El umbral de 50 evita que
 *     el seed se re-ejecute si ya hay datos reales en producción.
 *
 *  3. Predicciones: si la colección de predicciones está vacía, calcula las
 *     predicciones iniciales basadas en los datos históricos.
 */
Meteor.startup(async () => {
  // --- Verificación 1: Usuario de demostración ---
  // Contar usuarios existentes para saber si es la primera vez que arranca
  const count = await Meteor.users.find().countAsync();
  if (count === 0) {
    // Crear el barbero de demo solo si no hay ningún usuario todavía
    await Accounts.createUser({
      email: 'barbero@demo.com',
      password: '123456',
      profile: { name: 'Carlos el Barbero', role: 'barbero' }
    });
  }

  // --- Verificación 2: Datos históricos del bot ---
  // Si hay menos de 50 appointments, asumir que la BD está vacía o incompleta
  const totalAppointments = await Appointments.find().countAsync();
  if (totalAppointments < 50) {
    console.log('📊 Iniciando generación de datos históricos...');
    // Ejecutar el seed que genera 8 semanas de slots y reservas simuladas
    await runSeed();
  }

  // --- Verificación 3: Predicciones iniciales ---
  // Si la colección de predicciones está vacía, calcular predicciones
  // (esto ocurre siempre la primera vez, ya que el seed no las calcula)
  const totalPreds = await Predictions.find().countAsync();
  if (totalPreds === 0) {
    console.log('🔮 Calculando predicciones iniciales...');
    await calcularPredicciones();
  }
});
