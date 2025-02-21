import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import DoctorDashboard from './dashboards/DoctorDashboard.jsx';
import PatientDashboard from './dashboards/PatientDashboard';  // Add this import
import LabDashboard from './dashboards/LabDashboard.jsx';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />  
        <Route path="/lab-dashboard" element={<LabDashboard/>} />
        <Route path="/nurses" element={<div>Nurses Dashboard</div>} />
        <Route path="/pharmacy" element={<div>Pharmacy Dashboard</div>} />
        <Route path="/lab" element={<div>Lab Dashboard</div>} />
        <Route path="/billing" element={<div>Billing Dashboard</div>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;