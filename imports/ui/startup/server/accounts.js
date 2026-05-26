// imports/startup/server/accounts.js
import { Accounts } from 'meteor/accounts-base';

// Validar campos al crear usuario
Accounts.validateNewUser((user) => {
  const role = user.profile?.role;
  
  if (!role || !['barbero', 'cliente'].includes(role)) {
    throw new Meteor.Error('invalid-role', 'Rol inválido');
  }
  
  return true;
});

// Hook que corre después de crear el usuario
Accounts.onCreateUser((options, user) => {
  // Meteor te pasa options (lo que mandaste desde el cliente)
  // y user (el documento que va a insertar en la DB)
  
  user.profile = {
    name: options.profile?.name || '',
    role: options.profile?.role || 'cliente',
    createdAt: new Date(),
  };
  
  return user; // obligatorio retornar el user modificado
});