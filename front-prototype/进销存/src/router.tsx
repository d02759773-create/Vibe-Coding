import { createHashRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { CustomerDetail } from '@/pages/customers/CustomerDetail'
import { CustomerEdit, CustomerNew } from '@/pages/customers/CustomerNew'
import { CustomerList } from '@/pages/customers/CustomerList'
import { ProductDetail } from '@/pages/products/ProductDetail'
import { ProductEdit, ProductNew } from '@/pages/products/ProductNew'
import { ProductList } from '@/pages/products/ProductList'
import { SupplierDetail } from '@/pages/suppliers/SupplierDetail'
import { SupplierEdit, SupplierNew } from '@/pages/suppliers/SupplierNew'
import { SupplierList } from '@/pages/suppliers/SupplierList'
import { WarehouseList } from '@/pages/warehouses/WarehouseList'
import { WarehouseDetail } from '@/pages/warehouses/WarehouseDetail'
import { WarehouseEdit, WarehouseNew } from '@/pages/warehouses/WarehouseNew'
import { LogisticsDetail } from '@/pages/logistics/LogisticsDetail'
import { LogisticsEdit, LogisticsNew } from '@/pages/logistics/LogisticsNew'
import { LogisticsList } from '@/pages/logistics/LogisticsList'
import { PurchaseOrderDetail } from '@/pages/purchaseOrders/PurchaseOrderDetail'
import { PurchaseOrderEdit, PurchaseOrderNew } from '@/pages/purchaseOrders/PurchaseOrderNew'
import { PurchaseOrderList } from '@/pages/purchaseOrders/PurchaseOrderList'
import { PurchaseInboundDetail } from '@/pages/purchaseInbound/PurchaseInboundDetail'
import { PurchaseInboundEdit, PurchaseInboundNew } from '@/pages/purchaseInbound/PurchaseInboundForm'
import { PurchaseInboundList } from '@/pages/purchaseInbound/PurchaseInboundList'
import { PurchaseReturnDetail } from '@/pages/purchaseReturns/PurchaseReturnDetail'
import { PurchaseReturnEdit, PurchaseReturnNew } from '@/pages/purchaseReturns/PurchaseReturnForm'
import { PurchaseReturnList } from '@/pages/purchaseReturns/PurchaseReturnList'
import { PurchaseReturnOutboundDetail } from '@/pages/purchaseReturnOutbound/PurchaseReturnOutboundDetail'
import { PurchaseReturnOutboundEdit, PurchaseReturnOutboundNew } from '@/pages/purchaseReturnOutbound/PurchaseReturnOutboundForm'
import { PurchaseReturnOutboundList } from '@/pages/purchaseReturnOutbound/PurchaseReturnOutboundList'
import { SalesOrderDetail } from '@/pages/salesOrders/SalesOrderDetail'
import { SalesOrderEdit, SalesOrderNew } from '@/pages/salesOrders/SalesOrderNew'
import { SalesOrderList } from '@/pages/salesOrders/SalesOrderList'
import { SalesOutboundDetail } from '@/pages/salesOutbound/SalesOutboundDetail'
import { SalesOutboundEdit, SalesOutboundNew } from '@/pages/salesOutbound/SalesOutboundForm'
import { SalesOutboundList } from '@/pages/salesOutbound/SalesOutboundList'
import { SalesReturnDetail } from '@/pages/salesReturns/SalesReturnDetail'
import { SalesReturnEdit, SalesReturnNew } from '@/pages/salesReturns/SalesReturnForm'
import { SalesReturnList } from '@/pages/salesReturns/SalesReturnList'
import { SalesReturnInboundDetail } from '@/pages/salesReturnInbound/SalesReturnInboundDetail'
import { SalesReturnInboundEdit, SalesReturnInboundNew } from '@/pages/salesReturnInbound/SalesReturnInboundForm'
import { SalesReturnInboundList } from '@/pages/salesReturnInbound/SalesReturnInboundList'
import { LedgerList } from '@/pages/inventory/LedgerList'
import { OnHandList } from '@/pages/inventory/OnHandList'
import { OtherInboundDetail } from '@/pages/otherInbound/OtherInboundDetail'
import { OtherInboundEdit, OtherInboundNew } from '@/pages/otherInbound/OtherInboundForm'
import { OtherInboundList } from '@/pages/otherInbound/OtherInboundList'
import { OtherOutboundDetail } from '@/pages/otherOutbound/OtherOutboundDetail'
import { OtherOutboundEdit, OtherOutboundNew } from '@/pages/otherOutbound/OtherOutboundForm'
import { OtherOutboundList } from '@/pages/otherOutbound/OtherOutboundList'
import { DictionariesPage } from '@/pages/dictionaries/DictionariesPage'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'agent', element: <Navigate to="/" replace /> },
      { path: 'sales/orders', element: <SalesOrderList /> },
      { path: 'sales/orders/new', element: <SalesOrderNew /> },
      { path: 'sales/orders/:id/edit', element: <SalesOrderEdit /> },
      { path: 'sales/orders/:id', element: <SalesOrderDetail /> },
      { path: 'sales/outbound', element: <SalesOutboundList /> },
      { path: 'sales/outbound/new', element: <SalesOutboundNew /> },
      { path: 'sales/outbound/:id/edit', element: <SalesOutboundEdit /> },
      { path: 'sales/outbound/:id', element: <SalesOutboundDetail /> },
      { path: 'sales/returns', element: <SalesReturnList /> },
      { path: 'sales/returns/new', element: <SalesReturnNew /> },
      { path: 'sales/returns/:id/edit', element: <SalesReturnEdit /> },
      { path: 'sales/returns/:id', element: <SalesReturnDetail /> },
      { path: 'sales/return-inbound', element: <SalesReturnInboundList /> },
      { path: 'sales/return-inbound/new', element: <SalesReturnInboundNew /> },
      { path: 'sales/return-inbound/:id/edit', element: <SalesReturnInboundEdit /> },
      { path: 'sales/return-inbound/:id', element: <SalesReturnInboundDetail /> },
      { path: 'purchase/orders', element: <PurchaseOrderList /> },
      { path: 'purchase/orders/new', element: <PurchaseOrderNew /> },
      { path: 'purchase/orders/:id/edit', element: <PurchaseOrderEdit /> },
      { path: 'purchase/orders/:id', element: <PurchaseOrderDetail /> },
      { path: 'purchase/inbound', element: <PurchaseInboundList /> },
      { path: 'purchase/inbound/new', element: <PurchaseInboundNew /> },
      { path: 'purchase/inbound/:id/edit', element: <PurchaseInboundEdit /> },
      { path: 'purchase/inbound/:id', element: <PurchaseInboundDetail /> },
      { path: 'purchase/returns', element: <PurchaseReturnList /> },
      { path: 'purchase/returns/new', element: <PurchaseReturnNew /> },
      { path: 'purchase/returns/:id/edit', element: <PurchaseReturnEdit /> },
      { path: 'purchase/returns/:id', element: <PurchaseReturnDetail /> },
      { path: 'purchase/return-outbound', element: <PurchaseReturnOutboundList /> },
      { path: 'purchase/return-outbound/new', element: <PurchaseReturnOutboundNew /> },
      { path: 'purchase/return-outbound/:id/edit', element: <PurchaseReturnOutboundEdit /> },
      { path: 'purchase/return-outbound/:id', element: <PurchaseReturnOutboundDetail /> },
      { path: 'inventory/other-inbound', element: <OtherInboundList /> },
      { path: 'inventory/other-inbound/new', element: <OtherInboundNew /> },
      { path: 'inventory/other-inbound/:id/edit', element: <OtherInboundEdit /> },
      { path: 'inventory/other-inbound/:id', element: <OtherInboundDetail /> },
      { path: 'inventory/other-outbound', element: <OtherOutboundList /> },
      { path: 'inventory/other-outbound/new', element: <OtherOutboundNew /> },
      { path: 'inventory/other-outbound/:id/edit', element: <OtherOutboundEdit /> },
      { path: 'inventory/other-outbound/:id', element: <OtherOutboundDetail /> },
      { path: 'inventory/on-hand', element: <OnHandList /> },
      { path: 'inventory/ledger', element: <LedgerList /> },
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
      { path: 'master/logistics', element: <LogisticsList /> },
      { path: 'master/logistics/new', element: <LogisticsNew /> },
      { path: 'master/logistics/:id/edit', element: <LogisticsEdit /> },
      { path: 'master/logistics/:id', element: <LogisticsDetail /> },
      { path: 'master/dictionaries', element: <DictionariesPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
