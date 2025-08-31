import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import RegisterWithCode from './pages/RegisterWithCode';
import ApplicationList from './pages/ApplicationList';
import ApplicationFormNew from './pages/ApplicationFormNew';
import AdminDashboard from './pages/admin/Dashboard';
import ConfigManagement from './pages/admin/ConfigManagement';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<RegisterWithCode />} />
            
            <Route
              path="applications"
              element={
                <PrivateRoute>
                  <ApplicationList />
                </PrivateRoute>
              }
            />
            
            <Route
              path="applications/new"
              element={
                <PrivateRoute>
                  <ApplicationFormNew />
                </PrivateRoute>
              }
            />
            
            <Route
              path="applications/:id"
              element={
                <PrivateRoute>
                  <div>Application Detail Page (To be implemented)</div>
                </PrivateRoute>
              }
            />
            
            <Route
              path="admin"
              element={
                <PrivateRoute adminOnly>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            
            <Route
              path="admin/config"
              element={
                <PrivateRoute adminOnly>
                  <ConfigManagement />
                </PrivateRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;