import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import { App } from '/imports/ui/App';
import { Slots } from '/imports/api/slots/slots';
import { Appointments } from '/imports/api/appointments/appointments';

// Exponer colecciones globalmente para debug y MiniMongo
window.Slots = Slots;
window.Appointments = Appointments;

Meteor.startup(() => {
  const container = document.getElementById('react-target');
  createRoot(container).render(<App />);
});
