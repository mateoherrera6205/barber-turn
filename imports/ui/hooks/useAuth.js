/**
 * useAuth.js
 * Hook personalizado de React para acceder al estado de autenticación del usuario actual.
 * Utiliza useTracker de Meteor para hacer el hook reactivo: cualquier cambio en el
 * estado de sesión (login, logout) actualiza automáticamente los componentes que lo usen.
 *
 * No requiere suscripción a ninguna publicación porque Meteor publica automáticamente
 * el documento del usuario actual (Meteor.user()) para cualquier cliente autenticado.
 *
 * @returns {Object} Objeto con los datos y flags de autenticación:
 *   - user       {Object|null}  Documento completo del usuario actual o null si no está logueado
 *   - userId     {String|null}  ID del usuario actual o null
 *   - isLoggedIn {Boolean}      true si hay una sesión activa
 *   - isLoading  {Boolean}      true mientras Meteor está procesando el login
 *   - role       {String|null}  Rol del usuario ('barbero' | 'cliente') o null
 *   - isBarbero  {Boolean}      true si el usuario tiene rol 'barbero'
 *   - isCliente  {Boolean}      true si el usuario tiene rol 'cliente'
 *   - name       {String}       Nombre del usuario del perfil, o string vacío si no existe
 */
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';

export function useAuth() {
  // useTracker hace reactivo el hook: se re-ejecuta cuando Meteor.user() cambia
  return useTracker(() => {
    // Meteor.user() retorna el documento completo del usuario autenticado
    const user = Meteor.user();
    // Meteor.userId() retorna solo el _id (más eficiente si solo se necesita el ID)
    const userId = Meteor.userId();

    return {
      user,
      userId,
      isLoggedIn: !!userId,                            // Convertir a boolean: null → false
      isLoading: Meteor.loggingIn(),                   // true durante el proceso de login
      role: user?.profile?.role || null,               // Rol del perfil del usuario
      isBarbero: user?.profile?.role === 'barbero',    // Shortcut para verificar rol barbero
      isCliente: user?.profile?.role === 'cliente',    // Shortcut para verificar rol cliente
      name: user?.profile?.name || '',                 // Nombre del usuario para mostrar en UI
    };
  });
}
