import { createHashRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { CustomerDetail } from '@/pages/customers/CustomerDetail'
import { CustomerEdit, CustomerNew } from '@/pages/customers/CustomerNew'
import { CustomerList } from '@/pages/customers/CustomerList'
import { ProductDetail } from '@/pages/products/ProductDetail'
import { ProductEdit, ProductNew } from '@/pages/products/ProductNew'
import { ProductList } from '@/pages/products/ProductList'
import { SupplierDetail } from '@/pages/suppliers/SupplierDetail'
import { SupplierEdit, SupplierNew } from '@/pages/suppliers/SupplierNew'
import { SupplierList } from '@/pages/suppliers/SupplierList'
import { WarehouseDetail } from '@/pages/warehouses/WarehouseDetail'
import { WarehouseEdit, WarehouseNew } from '@/pages/warehouses/WarehouseNew'
import { WarehouseList } from '@/pages/warehouses/WarehouseList'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'sales/orders', element: <PlaceholderPage /> },
      { path: 'sales/orders/new', element: <PlaceholderPage /> },
      { path: 'sales/orders/:id', element: <PlaceholderPage /> },
      { path: 'sales/orders/:id/edit', element: <PlaceholderPage /> },
      { path: 'sales/outbound', element: <PlaceholderPage /> },
      { path: 'sales/returns', element: <PlaceholderPage /> },
      { path: 'sales/return-inbound', element: <PlaceholderPage /> },
      { path: 'purchase/orders', element: <PlaceholderPage /> },
      { path: 'purchase/inbound', element: <PlaceholderPage /> },
      { path: 'purchase/returns', element: <PlaceholderPage /> },
      { path: 'purchase/return-outbound', element: <PlaceholderPage /> },
      { path: 'inventory/other-inbound', element: <PlaceholderPage /> },
      { path: 'inventory/other-outbound', element: <PlaceholderPage /> },
      { path: 'inventory/on-hand', element: <PlaceholderPage /> },
      { path: 'inventory/ledger', element: <PlaceholderPage /> },
      { path: 'master/products', element: <ProductList /> },
      { path: 'master/products/new', element: <ProductNew /> },
      { path: 'master/products/:id/edit', element: <ProductEdit /> },
      { path: 'master/products/:id', element: <ProductDetail /> },
      { path: 'master/customers', element: <CustomerList /> },
      { path: 'master/customers/new', element: <CustomerNew /> },
      { path: 'master/customers/:id/edit', element: <CustomerEdit /> },
      { path: 'master/customers/:id', element: <CustomerDetail /> },
      { path: 'master/suppliers', element: <SupplierList /> },
      { path: 'master/suppliers/new', element: <SupplierNew /> },
      { path: 'master/suppliers/:id/edit', element: <SupplierEdit /> },
      { path: 'master/suppliers/:id', element: <SupplierDetail /> },
      { path: 'master/warehouses', element: <WarehouseList /> },
      { path: 'master/warehouses/new', element: <WarehouseNew /> },
      { path: 'master/warehouses/:id/edit', element: <WarehouseEdit /> },
      { path: 'master/warehouses/:id', element: <WarehouseDetail /> },
      { path: 'master/logistics', element: <PlaceholderPage /> },
      { path: 'master/dictionaries', element: <PlaceholderPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
