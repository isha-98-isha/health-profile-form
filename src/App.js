import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './pages/Dashboard/dashboard';
import Client from './pages/Client/Client';
import Partner from './pages/Partner/Partner';
import PartnerDetails from './pages/Partner/PartnerDetails';
import Onboarding from './pages/Onboardings/Onboarding';
import Login from './pages/Login/login';
import Signup from './pages/Signup/signup';
import { SocketProvider } from './context/SocketContext';
import { getLocalToken, getLocalUser } from './services/auth';

export const isAuthenticated = () => Boolean(getLocalToken() && getLocalUser());

export const PublicRoute = ({ children }) => (isAuthenticated() ? <Navigate to="/dashboard" replace /> : children);
export const ProtectedRoute = ({ children }) => (isAuthenticated() ? children : <Navigate to="/login" replace />);

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <div className="App">
          <ToastContainer position="bottom-right" autoClose={5000} theme="dark" />
          <Routes>
            <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/client" element={<ProtectedRoute><Client /></ProtectedRoute>} />
            <Route path="/partner" element={<ProtectedRoute><Partner /></ProtectedRoute>} />
            <Route path="/partner/details/:id" element={<ProtectedRoute><PartnerDetails /></ProtectedRoute>} />
            <Route path="/partner/:id" element={<ProtectedRoute><PartnerDetails /></ProtectedRoute>} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <div className="onboarding-route">
                    <Dashboard />
                    <Onboarding />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
