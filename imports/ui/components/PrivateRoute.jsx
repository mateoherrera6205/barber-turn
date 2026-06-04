/**
 * PrivateRoute.jsx
 * Componente de ruta protegida que controla el acceso a páginas según autenticación y rol.
 * Actúa como un wrapper de React Router que redirige a los usuarios no autorizados.
 *
 * Comportamiento según el estado del usuario:
 *  1. Cargando (isLoading): muestra un mensaje de espera mientras Meteor verifica la sesión
 *  2. No autenticado: redirige a /login
 *  3. Autenticado pero con rol incorrecto: redirige según su rol real
 *     - Si es barbero → va a /dashboard
 *     - Si es cliente → va a /booking
 *  4. Autenticado con el rol correcto: renderiza los children (la página protegida)
 *
 * Hooks utilizados:
 *  - useAuth() → para obtener el estado de autenticación y el rol del usuario
 *
 * @param {ReactNode} children      - El componente de página a renderizar si el acceso es válido
 * @param {String}    requiredRole  - El rol requerido para acceder ('barbero' | 'cliente')
 *                                   Si es undefined, solo verifica autenticación
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function PrivateRoute({ children, requiredRole }) {
  // Obtener el estado de autenticación reactivo del hook useAuth
  const { isLoggedIn, role, isLoading } = useAuth();

  // Mientras Meteor verifica el estado de sesión, mostrar un mensaje provisional
  // para evitar un flash de redirección antes de confirmar si el usuario está logueado
  if (isLoading) return <p>Cargando...</p>;

  // Si no hay sesión activa, redirigir al login sin renderizar el contenido protegido
  if (!isLoggedIn) return <Navigate to="/login" />;

  // Si la ruta requiere un rol específico y el usuario tiene otro rol,
  // redirigir a la página correspondiente a su rol real
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'barbero' ? '/dashboard' : '/booking'} />;
  }

  // El usuario está autenticado y tiene el rol correcto: renderizar el contenido
  return children;
}
