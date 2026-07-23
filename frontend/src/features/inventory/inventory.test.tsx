import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '../auth/store/auth.store';
import { InventoryProductForm } from './components/inventory-product-form';
import { InventoryProductTable } from './components/inventory-product-table';
import { InventoryStatusBadge } from './components/inventory-status-badge';
import { StockMovementForm } from './components/stock-movement-form';
import type { InventoryCategory, InventoryProduct, Warehouse } from './types/inventory.types';

const category: InventoryCategory = {
  id: 'category-id',
  name: 'Filtros',
  description: null,
  isActive: true,
  activeProductsCount: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const warehouse: Warehouse = {
  id: 'warehouse-id',
  code: 'MAIN',
  name: 'Bodega principal',
  description: null,
  location: null,
  isMain: true,
  isActive: true,
  productsCount: 1,
  stockTotal: 5,
  inventoryValue: 50,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const product: InventoryProduct = {
  id: 'product-id',
  sku: 'FIL-001',
  barcode: '123',
  name: 'Filtro de aceite',
  description: null,
  categoryId: category.id,
  category: { id: category.id, name: category.name },
  unit: 'UNIT',
  costPrice: 10,
  salePrice: 15,
  minimumStock: 3,
  maximumStock: 20,
  isStockControlled: true,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  totalStock: 2,
  availableStock: 2,
  reservedStock: 0,
  stockByWarehouse: [
    {
      warehouse: { id: warehouse.id, code: warehouse.code, name: warehouse.name, isMain: true },
      quantity: 2,
      reservedQuantity: 0,
      availableQuantity: 2,
      averageCost: 10
    }
  ]
};

function setPermissions(permissions: string[]) {
  useAuthStore.setState({
    user: {
      id: 'user-id',
      firstName: 'Super',
      lastName: 'Usuario',
      email: 'super@milmecanic.local',
      isActive: true,
      roleId: 'role-id',
      role: { id: 'role-id', name: 'Administrador' },
      permissions
    },
    isAuthenticated: true
  });
}

describe('Inventory frontend', () => {
  it('renderiza listado de productos y estado bajo', () => {
    setPermissions(['inventory.read', 'inventory.products.update', 'inventory.movements.create', 'inventory.products.delete']);
    render(
      <MemoryRouter>
        <InventoryProductTable products={[product]} onDelete={vi.fn()} onMovement={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText('FIL-001')).toBeInTheDocument();
    expect(screen.getByText('Filtro de aceite')).toBeInTheDocument();
    expect(screen.getByText('Stock bajo')).toBeInTheDocument();
  });

  it('oculta acciones sin permisos', () => {
    setPermissions(['inventory.read']);
    render(
      <MemoryRouter>
        <InventoryProductTable products={[product]} onDelete={vi.fn()} onMovement={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.queryByTitle('Editar producto')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Registrar movimiento')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Eliminar producto')).not.toBeInTheDocument();
  });

  it('valida SKU obligatorio al crear producto', async () => {
    const { container } = render(<InventoryProductForm categories={[category]} onSubmit={vi.fn()} />);

    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(await screen.findByText('El SKU es obligatorio')).toBeInTheDocument();
  });

  it('crea producto con SKU en mayúsculas', async () => {
    const onSubmit = vi.fn();
    const { container } = render(<InventoryProductForm categories={[category]} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/SKU/i), 'abc-001');
    await userEvent.type(screen.getByLabelText(/Nombre/i), 'Filtro');
    await userEvent.selectOptions(screen.getByLabelText(/Categoría/i), category.id);
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ sku: 'ABC-001' })));
  });

  it('valida motivo obligatorio en ajuste de salida', async () => {
    const { container } = render(<StockMovementForm products={[product]} warehouses={[warehouse]} onSubmit={vi.fn()} />);

    await userEvent.selectOptions(screen.getByLabelText(/Producto/i), product.id);
    await userEvent.selectOptions(screen.getByLabelText(/Bodega/i), warehouse.id);
    await userEvent.selectOptions(screen.getByLabelText(/Tipo de movimiento/i), 'ADJUSTMENT_OUT');
    await userEvent.clear(screen.getByLabelText(/Cantidad/i));
    await userEvent.type(screen.getByLabelText(/Cantidad/i), '1');
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    expect(await screen.findByText('El motivo es obligatorio para este movimiento')).toBeInTheDocument();
  });

  it('muestra estado agotado', () => {
    render(<InventoryStatusBadge product={{ ...product, availableStock: 0 }} />);
    expect(screen.getByText('Agotado')).toBeInTheDocument();
  });
});
