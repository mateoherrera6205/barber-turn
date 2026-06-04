/**
 * client/main.jsx
 * Punto de entrada del cliente de BarberTurn.
 * Este archivo es ejecutado por Meteor en el navegador al cargar la aplicación.
 *
 * Responsabilidades:
 *  1. Exponer las colecciones MongoDB en window para debugging desde la consola del navegador
 *  2. Montar el componente raíz React (<App />) en el DOM cuando Meteor esté listo
 *
 * El uso de createRoot (React 18) en lugar del antiguo ReactDOM.render permite
 * usar las funcionalidades de concurrencia de React 18.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import { App } from '/imports/ui/App';
import { Slots } from '/imports/api/slots/slots';
import { Appointments } from '/imports/api/appointments/appointments';
import { Predictions } from '/imports/api/predictions/predictions';

// Exponer colecciones globalmente para debug y MiniMongo
// Permite inspeccionar los datos en la consola del navegador con:
//   window.Slots.find().fetch()
//   window.Appointments.find().fetch()
//   window.Predictions.find().fetch()
window.Slots = Slots;
window.Appointments = Appointments;
window.Predictions= Predictions;

/**
 * Meteor.startup
 * Callback que se ejecuta cuando el DDP (protocolo de Meteor) está conectado
 * y el DOM está listo para ser manipulado.
 *
 * Monta el componente App en el elemento con id="react-target" definido en
 * el HTML generado por Meteor, usando React 18's createRoot para renderizado concurrente.
 */
Meteor.startup(() => {
  // Obtener el elemento DOM donde se montará React (definido en el HTML base de Meteor)
  const container = document.getElementById('react-target');
  // Montar la aplicación React usando el modo concurrente de React 18
  createRoot(container).render(<App />);
});
