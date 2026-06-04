/**
 * RegisterPage.jsx
 * Página de registro de nuevos usuarios en BarberTurn.
 * Permite crear cuentas con rol 'barbero' o 'cliente' mediante un formulario.
 * Después del registro exitoso, inicia sesión automáticamente y redirige según el rol.
 *
 * Flujo completo:
 *  1. El usuario llena el formulario (nombre, email, contraseña, rol)
 *  2. Se llama al método 'users.register' en el servidor que crea el usuario con su perfil
 *  3. Si el registro es exitoso, se hace login automático con las mismas credenciales
 *  4. Se redirige según el rol: barbero→/dashboard, cliente→/booking
 *
 * Hooks utilizados:
 *  - useState (React)     → para manejar el formulario y errores
 *  - useNavigate (Router) → para redirigir después del registro
 *
 * Métodos Meteor que invoca:
 *  - users.register           → método del servidor que crea el usuario
 *  - Meteor.loginWithPassword → login automático post-registro
 *
 * Estado interno:
 *  - form  {Object} Valores del formulario: { name, email, password, role }
 *  - error {String} Mensaje de error si el registro falla
 */
import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate, Link } from 'react-router-dom';

export function RegisterPage() {
  // Estado del formulario con valores iniciales (rol 'cliente' por defecto)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cliente' });
  // Mensaje de error para mostrar si el registro o login falla
  const [error, setError] = useState('');
  const navigate = useNavigate();

  /**
   * handleChange
   * Actualiza el campo del formulario correspondiente al input que cambió.
   * Usa el atributo 'name' del input como clave para actualizar el campo correcto.
   *
   * @param {Event} e - Evento de cambio del input
   */
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  /**
   * handleRegister
   * Ejecuta el proceso de registro en dos pasos:
   *  1. Llama al método 'users.register' en el servidor con los datos del formulario
   *  2. Si tiene éxito, hace login automático y redirige según el rol seleccionado
   *
   * Lógica de errores:
   *  - Si el registro falla (email duplicado, rol inválido): muestra el error
   *  - Si el login automático falla: redirige a /login para que intente manualmente
   */
  const handleRegister = () => {
    // Limpiar errores previos antes de intentar el registro
    setError('');
    // Invocar el método del servidor para crear el usuario con su perfil completo
    Meteor.call('users.register', form, (err) => {
      if (err) {
        // Mostrar el error del servidor (ej: "Email ya registrado", "Rol inválido")
        setError(err.reason || 'Error al registrarse');
        return;
      }
      // Registro exitoso: intentar login automático con las mismas credenciales
      Meteor.loginWithPassword(form.email, form.password, (loginErr) => {
        if (loginErr) {
          // Si el login automático falla por alguna razón, redirigir al login manual
          navigate('/login');
          return;
        }
        // Login exitoso: redirigir según el rol elegido en el formulario
        navigate(form.role === 'barbero' ? '/dashboard' : '/booking');
      });
    });
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20 }}>
      <h2>Crear Cuenta</h2>

      {/* Mostrar error si existe */}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Campo nombre: usa handleChange genérico con atributo name="name" */}
      <input name="name" placeholder="Nombre" onChange={handleChange}
        style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }} />

      {/* Campo email */}
      <input name="email" type="email" placeholder="Email" onChange={handleChange}
        style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }} />

      {/* Campo contraseña */}
      <input name="password" type="password" placeholder="Contraseña" onChange={handleChange}
        style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }} />

      {/* Selector de rol: determina la experiencia del usuario en la app */}
      <select name="role" onChange={handleChange} value={form.role}
        style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}>
        <option value="cliente">Cliente</option>
        <option value="barbero">Barbero</option>
      </select>

      {/* Botón de registro */}
      <button onClick={handleRegister} style={{ width: '100%', padding: 10 }}>Registrarse</button>

      {/* Enlace al login para usuarios con cuenta existente */}
      <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </div>
  );
}
