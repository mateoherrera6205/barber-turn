import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate, Link } from 'react-router-dom';

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cliente' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = () => {
    setError('');
    Meteor.call('users.register', form, (err) => {
      if (err) { setError(err.reason || 'Error al registrarse'); return; }
      Meteor.loginWithPassword(form.email, form.password, (loginErr) => {
        if (loginErr) { navigate('/login'); return; }
        navigate(form.role === 'barbero' ? '/dashboard' : '/booking');
      });
    });
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20 }}>
      <h2>Crear Cuenta</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input name="name" placeholder="Nombre" onChange={handleChange}
        style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }} />
      <input name="email" type="email" placeholder="Email" onChange={handleChange}
        style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }} />
      <input name="password" type="password" placeholder="Contraseña" onChange={handleChange}
        style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }} />
      <select name="role" onChange={handleChange} value={form.role}
        style={{ display: 'block', width: '100%', marginBottom: 10, padding: 8 }}>
        <option value="cliente">Cliente</option>
        <option value="barbero">Barbero</option>
      </select>
      <button onClick={handleRegister} style={{ width: '100%', padding: 10 }}>Registrarse</button>
      <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </div>
  );
}
