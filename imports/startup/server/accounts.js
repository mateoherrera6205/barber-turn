/**
 * accounts.js (startup/server)
 * Configura el sistema de cuentas de Meteor en el servidor.
 * Define dos hooks del ciclo de vida de usuarios:
 *  1. validateNewUser → Valida el rol antes de crear el usuario
 *  2. onCreateUser    → Construye el perfil completo del usuario al crearlo
 *
 * Este archivo se importa en server/main.js para garantizar que los hooks
 * estén registrados antes de cualquier creación de usuario.
 */
import { Accounts } from 'meteor/accounts-base';

/**
 * Accounts.validateNewUser
 * Hook que se ejecuta ANTES de que un usuario sea creado.
 * Valida que el rol proporcionado en el perfil sea uno de los valores permitidos.
 *
 * Si el rol no es válido, se lanza un error que cancela la creación del usuario.
 * Esto es la única línea de defensa server-side para el campo 'role'.
 *
 * @param {Object} user - El documento de usuario que se intenta crear
 * @returns {Boolean} true si la validación pasa (permite crear el usuario)
 * @throws {Meteor.Error} Si el rol es inválido o no está presente
 */
Accounts.validateNewUser((user) => {
  // Extraer el rol del perfil del usuario que se intenta crear
  const role = user.profile?.role;

  // El rol debe existir y ser exactamente 'barbero' o 'cliente'
  if (!role || !['barbero', 'cliente'].includes(role)) {
    throw new Meteor.Error('invalid-role', 'Rol inválido');
  }

  // Validación exitosa: permitir la creación del usuario
  return true;
});

/**
 * Accounts.onCreateUser
 * Hook que se ejecuta DURANTE la creación del usuario, después de validarlo.
 * Construye el objeto de perfil final que se almacenará en la base de datos,
 * normalizando los campos y añadiendo el timestamp de creación.
 *
 * @param {Object} options - Las opciones pasadas a Accounts.createUser() (incluye profile)
 * @param {Object} user    - El documento de usuario que se está construyendo
 * @returns {Object} El documento de usuario final con el perfil completo
 */
Accounts.onCreateUser((options, user) => {
  // Sobrescribir el profile con los campos normalizados
  // Se usa el operador ?. para manejar casos donde options.profile no existe
  user.profile = {
    name:      options.profile?.name || '',         // Nombre del usuario (obligatorio en registro)
    role:      options.profile?.role || 'cliente',  // Rol por defecto si no se especifica
    createdAt: new Date(),                          // Timestamp de creación del perfil
  };

  // Devolver el usuario modificado para que Meteor lo almacene en la BD
  return user;
});
