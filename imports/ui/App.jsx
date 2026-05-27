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
    <BrowserRouter>
      <Routes>
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/register"    element={<RegisterPage />} />
        <Route path="/dashboard"   element={
          <PrivateRoute requiredRole="barbero"><DashboardPage /></PrivateRoute>
        } />
        <Route path="/booking"     element={
          <PrivateRoute requiredRole="cliente"><BookingPage /></PrivateRoute>
        } />
        <Route path="/analytics"   element={
          <PrivateRoute requiredRole="barbero"><AnalyticsPage /></PrivateRoute>
        } />
        <Route path="/predictions" element={
          <PrivateRoute requiredRole="barbero"><PredictionPage /></PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}