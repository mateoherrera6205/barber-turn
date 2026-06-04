/**
 * LoginPage.jsx
 * Página de inicio de sesión del sistema BarberTurn.
 * Permite a barberos y clientes autenticarse con email y contraseña.
 * Después del login, redirige al usuario según su rol:
 *  - barbero → /dashboard
 *  - cliente → /booking
 *
 * Hooks utilizados:
 *  - useState (React)     → para manejar los campos del formulario y el error
 *  - useNavigate (Router) → para redirigir después del login exitoso
 *
 * Métodos Meteor que invoca:
 *  - Meteor.loginWithPassword → método built-in de Meteor para autenticación con email/contraseña
 *
 * Estado interno:
 *  - email    {String} Valor del campo de email
 *  - password {String} Valor del campo de contraseña
 *  - error    {String} Mensaje de error si el login falla (vacío si no hay error)
 */
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate, Link } from 'react-router-dom';

export function LoginPage() {
  // Estado del formulario: email y contraseña
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Mensaje de error para mostrar si el login falla
  const [error, setError] = useState('');
  // Hook de React Router para redirigir programáticamente
  const navigate = useNavigate();

  /**
   * handleLogin
   * Intenta autenticar al usuario con las credenciales ingresadas.
   *
   * Lógica:
   *  1. Limpia cualquier error previo
   *  2. Llama a Meteor.loginWithPassword con email y contraseña
   *  3. Si falla: muestra el mensaje de error de Meteor (ej: "Usuario no encontrado")
   *  4. Si tiene éxito: lee el rol del perfil del usuario y redirige a la página correcta
   */
  const handleLogin = () => {
    // Limpiar errores previos antes de intentar el login
    setError('');
    Meteor.loginWithPassword(email, password, (err) => {
      if (err) {
        // Mostrar el mensaje de error de Meteor o uno genérico si no hay razón específica
        setError(err.reason || 'Error al iniciar sesión');
        return;
      }
      // Login exitoso: leer el rol del usuario recién autenticado
      const role = Meteor.user()?.profile?.role;
      // Redirigir según rol: barbero va al dashboard, todos los demás (clientes) al booking
      navigate(role === 'barbero' ? '/dashboard' : '/booking');
    });
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20 }}>
      <h2>Iniciar Sesión</h2>

      {/* Mostrar el error solo si existe (renderizado condicional) */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Campo de email: controlado por estado 'email' */}
      <input type="email" placeholder="Email" value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }} />

      {/* Campo de contraseña: controlado por estado 'password' */}
      <input type="password" placeholder="Contraseña" value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }} />

      {/* Botón que dispara el proceso de login */}
      <button onClick={handleLogin} style={{ width: '100%', padding: 10 }}>Entrar</button>

      {/* Enlace de registro para usuarios sin cuenta */}
      <p>¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
    </div>
  );
}
