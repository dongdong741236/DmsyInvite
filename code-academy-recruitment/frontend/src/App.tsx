import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ApplicationList from './pages/ApplicationList';
import ApplicationForm from './pages/ApplicationForm';
import AdminDashboard from './pages/admin/Dashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            
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
                  <ApplicationForm />
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
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;