import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import LiveDraw from './pages/LiveDraw';
import GuestLive from './pages/GuestLive';
import GuestAdmin from './pages/GuestAdmin';


function PrivateRoute({ children }) {
  const token = localStorage.getItem('pg_admin_token');
  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/live" replace />} />
      <Route path="/live" element={<LiveDraw />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
      <Route path="/guest-live" element={<GuestLive />} />
      <Route path="/admin/guests" element={<GuestAdmin />} /> 
    </Routes>
  );
}
