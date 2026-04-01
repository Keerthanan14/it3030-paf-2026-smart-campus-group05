import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SplitAuthLayout } from './shared/layouts/SplitAuthLayout';
import { MainLayout } from './shared/layouts/MainLayout';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import OAuthCallbackPage from './features/auth/pages/OAuthCallbackPage';
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage.tsx';
import StudentDashboardPage from './features/booking/pages/StudentDashboardPage.tsx';
import TechnicianDashboardPage from './features/ticket/pages/TechnicianDashboardPage.tsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Auth Routes */}
        <Route element={<SplitAuthLayout />}>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/oauth2/callback" element={<OAuthCallbackPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<MainLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<div>User Management</div>} />
          <Route path="/admin/notifications" element={<div>System Notifications</div>} />
          <Route path="/admin/settings" element={<div>Admin Settings</div>} />
          
          <Route path="/admin/resources" element={<div>Resource Management</div>} />
          <Route path="/admin/tickets" element={<div>Ticket Management</div>} />
          
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/booking" element={<div>My Bookings</div>} />

          <Route path="/technician/dashboard" element={<TechnicianDashboardPage />} />
          <Route path="/technician/tickets" element={<div>Assigned Tickets</div>} />
          <Route path="/ticket" element={<div>My Tickets</div>} />
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
