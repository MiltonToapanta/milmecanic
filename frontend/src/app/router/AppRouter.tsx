import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { AuditPage } from '../../features/audit/pages/AuditPage';
import { AppointmentsPage, CreateAppointmentPage, EditAppointmentPage } from '../../features/appointments';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { CreateCustomerPage, CustomersPage, EditCustomerPage } from '../../features/customers';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { AccessDeniedPage } from '../../features/errors/pages/AccessDeniedPage';
import { NotFoundPage } from '../../features/errors/pages/NotFoundPage';
import { ProfilePage } from '../../features/profile/pages/ProfilePage';
import { RolesPage } from '../../features/roles/pages/RolesPage';
import { SettingsPage } from '../../features/settings/pages/SettingsPage';
import { UsersPage } from '../../features/users/pages/UsersPage';
import { CreateVehiclePage, EditVehiclePage, VehiclesPage } from '../../features/vehicles';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />
          <Route element={<ProtectedRoute permission="users.read" />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="customers.read" />}>
            <Route path="/customers" element={<CustomersPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="customers.create" />}>
            <Route path="/customers/new" element={<CreateCustomerPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="customers.update" />}>
            <Route path="/customers/:id/edit" element={<EditCustomerPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="vehicles.read" />}>
            <Route path="/vehicles" element={<VehiclesPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="vehicles.create" />}>
            <Route path="/vehicles/new" element={<CreateVehiclePage />} />
          </Route>
          <Route element={<ProtectedRoute permission="vehicles.update" />}>
            <Route path="/vehicles/:id/edit" element={<EditVehiclePage />} />
          </Route>
          <Route element={<ProtectedRoute permission="appointments.read" />}>
            <Route path="/appointments" element={<AppointmentsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="appointments.create" />}>
            <Route path="/appointments/new" element={<CreateAppointmentPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="appointments.update" />}>
            <Route path="/appointments/:id/edit" element={<EditAppointmentPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="roles.read" />}>
            <Route path="/roles" element={<RolesPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="settings.read" />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="audit.read" />}>
            <Route path="/audit" element={<AuditPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
