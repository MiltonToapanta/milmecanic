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
import { CreateDiagnosticPage, DiagnosticDetailPage, EditDiagnosticPage } from '../../features/service-diagnostics';
import { CreateServiceOrderPage, EditServiceOrderPage, ServiceOrderDetailPage, ServiceOrdersPage } from '../../features/service-orders';
import { CreateQuotationPage, EditQuotationPage, QuotationDetailPage, QuotationsPage } from '../../features/quotations';
import {
  CreateInventoryProductPage,
  EditInventoryProductPage,
  InventoryCategoriesPage,
  InventoryKardexPage,
  InventoryMovementsPage,
  InventoryProductDetailPage,
  InventoryProductsPage,
  InventoryStockPage,
  InventoryWarehousesPage
} from '../../features/inventory';
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
          <Route element={<ProtectedRoute permission="service-orders.read" />}>
            <Route path="/service-orders" element={<ServiceOrdersPage />} />
            <Route path="/service-orders/:id" element={<ServiceOrderDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="service-diagnostics.read" />}>
            <Route path="/service-orders/:serviceOrderId/diagnostic" element={<DiagnosticDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="service-diagnostics.create" />}>
            <Route path="/service-orders/:serviceOrderId/diagnostic/new" element={<CreateDiagnosticPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="service-diagnostics.update" />}>
            <Route path="/service-orders/:serviceOrderId/diagnostic/edit" element={<EditDiagnosticPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="service-orders.create" />}>
            <Route path="/service-orders/new" element={<CreateServiceOrderPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="service-orders.update" />}>
            <Route path="/service-orders/:id/edit" element={<EditServiceOrderPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="quotations.read" />}>
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/quotations/:id" element={<QuotationDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="quotations.create" />}>
            <Route path="/quotations/new" element={<CreateQuotationPage />} />
            <Route path="/service-orders/:serviceOrderId/quotations/new" element={<CreateQuotationPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="quotations.update" />}>
            <Route path="/quotations/:id/edit" element={<EditQuotationPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="inventory.read" />}>
            <Route path="/inventory/products" element={<InventoryProductsPage />} />
            <Route path="/inventory/products/:id" element={<InventoryProductDetailPage />} />
            <Route path="/inventory/stock" element={<InventoryStockPage />} />
            <Route path="/inventory/movements" element={<InventoryMovementsPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="inventory.products.create" />}>
            <Route path="/inventory/products/new" element={<CreateInventoryProductPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="inventory.products.update" />}>
            <Route path="/inventory/products/:id/edit" element={<EditInventoryProductPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="inventory.categories.manage" />}>
            <Route path="/inventory/categories" element={<InventoryCategoriesPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="inventory.warehouses.manage" />}>
            <Route path="/inventory/warehouses" element={<InventoryWarehousesPage />} />
          </Route>
          <Route element={<ProtectedRoute permission="inventory.kardex.read" />}>
            <Route path="/inventory/products/:productId/kardex" element={<InventoryKardexPage />} />
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
