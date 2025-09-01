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
import ApplicationDetail from './pages/ApplicationDetail';
import AdminDashboard from './pages/admin/Dashboard';
import ConfigManagement from './pages/admin/ConfigManagement';
import UserManagement from './pages/admin/UserManagement';
import ApplicationManagement from './pages/admin/ApplicationManagement';
import RoomManagement from './pages/admin/RoomManagement';
import InterviewManagement from './pages/admin/InterviewManagement';
import EmailTemplateManagement from './pages/admin/EmailTemplateManagement';
import QuestionManagement from './pages/admin/QuestionManagement';
import YearManagement from './pages/admin/YearManagement';
import InterviewPanel from './pages/InterviewPanel';

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
                  <ApplicationDetail />
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
            
            <Route
              path="admin/users"
              element={
                <PrivateRoute adminOnly>
                  <UserManagement />
                </PrivateRoute>
              }
            />
            
            <Route
              path="admin/applications"
              element={
                <PrivateRoute adminOnly>
                  <ApplicationManagement />
                </PrivateRoute>
              }
            />
            
            <Route
              path="admin/rooms"
              element={
                <PrivateRoute adminOnly>
                  <RoomManagement />
                </PrivateRoute>
              }
            />
            
            <Route
              path="admin/interviews"
              element={
                <PrivateRoute adminOnly>
                  <InterviewManagement />
                </PrivateRoute>
              }
            />
            
            <Route
              path="admin/email-templates"
              element={
                <PrivateRoute adminOnly>
                  <EmailTemplateManagement />
                </PrivateRoute>
              }
            />
            
            <Route
              path="admin/questions"
              element={
                <PrivateRoute adminOnly>
                  <QuestionManagement />
                </PrivateRoute>
              }
            />
            
            <Route
              path="admin/years"
              element={
                <PrivateRoute adminOnly>
                  <YearManagement />
                </PrivateRoute>
              }
            />
            
            <Route
              path="admin/interviews/:id/panel"
              element={
                <PrivateRoute adminOnly>
                  <InterviewPanel />
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