/**
 * users.methods.js
 * Define los métodos Meteor del servidor relacionados con la gestión de usuarios.
 * El registro se realiza como método del servidor en lugar de en el cliente
 * para poder asignar el perfil (nombre y rol) de forma segura y validada.
 *
 * Métodos disponibles:
 *  - users.register → Crea un nuevo usuario con nombre, email, contraseña y rol
 */
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';

Meteor.methods({
  /**
   * users.register
   * Crea un nuevo usuario en el sistema con su perfil completo.
   * Se ejecuta en el servidor para garantizar que el rol asignado sea válido
   * (la validación del rol se aplica en accounts.js mediante Accounts.validateNewUser).
   *
   * @param {String} name     - Nombre completo del usuario
   * @param {String} email    - Correo electrónico (usado como credencial de login)
   * @param {String} password - Contraseña en texto plano (Meteor la hashea internamente)
   * @param {String} role     - Rol del usuario: 'barbero' o 'cliente'
   *
   * Lógica interna:
   *  1. Valida los tipos de todos los campos de entrada
   *  2. Llama a Accounts.createUser() que crea el documento en la colección users
   *     y aplica el hook onCreateUser definido en accounts.js
   *  3. La contraseña es hasheada por Meteor antes de almacenarse (nunca en texto plano)
   *
   * @returns {String} El _id del usuario recién creado
   */
  'users.register'({ name, email, password, role }) {
    // Validar que todos los campos sean strings para prevenir inyección de datos
    check(name, String);
    check(email, String);
    check(password, String);
    check(role, String);

    // Crear el usuario usando el sistema de cuentas de Meteor
    // El perfil se pasa como options y es procesado por el hook onCreateUser en accounts.js
    const userId = Accounts.createUser({
      email,
      password,
      profile: { name, role },  // El hook onCreateUser enriquece este objeto con createdAt
    });

    // Retornar el ID del usuario creado para que el cliente pueda iniciar sesión inmediatamente
    return userId;
  }
});
