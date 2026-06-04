/**
 * App.jsx
 * Componente raíz de la aplicación React de BarberTurn.
 * Define el enrutamiento completo de la SPA (Single Page Application) usando
 * React Router v6. Es el componente montado directamente desde client/main.jsx.
 *
 * Rutas disponibles:
 *  - /login       → LoginPage  (pública: cualquier usuario puede acceder)
 *  - /register    → RegisterPage (pública: para crear una cuenta nueva)
 *  - /dashboard   → DashboardPage (protegida: solo role='barbero')
 *  - /booking     → BookingPage   (protegida: solo role='cliente')
 *  - /analytics   → AnalyticsPage (protegida: solo role='barbero')
 *  - /predictions → PredictionPage (protegida: solo role='barbero')
 *  - /            → Redirige automáticamente a /login
 *
 * Las rutas protegidas usan el componente PrivateRoute que verifica:
 *  1. Si el usuario está autenticado (si no → /login)
 *  2. Si el usuario tiene el rol requerido (si no → su ruta correspondiente)
 *
 * No usa ningún hook de Meteor directamente; la reactividad se maneja
 * dentro de cada página y sus hooks correspondientes.
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { BookingPage } from './pages/BookingPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PredictionPage } from './pages/PredictionPage';
import { PrivateRoute } from './components/PrivateRoute';

export function App() {
  return (
    // BrowserRouter provee el contexto de routing a todos los componentes hijos
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas: accesibles sin autenticación */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rutas protegidas para barberos: redirigen a /booking si el usuario es cliente */}
        <Route path="/dashboard" element={
          <PrivateRoute requiredRole="barbero"><DashboardPage /></PrivateRoute>
        } />
        <Route path="/analytics" element={
          <PrivateRoute requiredRole="barbero"><AnalyticsPage /></PrivateRoute>
        } />
        <Route path="/predictions" element={
          <PrivateRoute requiredRole="barbero"><PredictionPage /></PrivateRoute>
        } />

        {/* Ruta protegida para clientes: redirige a /dashboard si el usuario es barbero */}
        <Route path="/booking" element={
          <PrivateRoute requiredRole="cliente"><BookingPage /></PrivateRoute>
        } />

        {/* Ruta raíz: redirigir siempre a /login como punto de entrada por defecto */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
