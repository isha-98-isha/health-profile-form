import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './pages/Dashboard/dashboard';
import Onboarding from './pages/Onboardings/Onboarding';
import Login from './pages/Login/login';
import Signup from './pages/Signup/signup';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <ToastContainer position="bottom-right" autoClose={5000} theme="dark" />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/onboarding"
            element={
              <div className="onboarding-route">
                <Dashboard />
                <Onboarding />
              </div>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
