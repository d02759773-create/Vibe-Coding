import type { Customer } from './types'

const STORAGE_KEY = 'inventory-demo-customers-v1'

const seedCustomers: Customer[] = [
  {
    id: '1',
    customerCode: 'CUST-0001',
    customerName: '北京吉浓文化传媒有限公司',
    customerType: 'ENTERPRISE',
    customerGrade: 'A',
    contactName: '赵倩',
    contactPhone: '13800138011',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    detailAddress: '建国路 88 号',
    salesperson: '王晨',
    openingArrears: 200000,
    openingBalance: 50000,
    settlementMethod: 'ACCOUNT',
    paymentTermDays: 30,
    creditLimit: 500000,
    remark: null,
    status: 'ENABLED',
    disableReason: null,
    isReferenced: true,
    mockReceivableAdjust: 80000,
    createdBy: '销售-李菲',
    createdAt: '2026-01-10 09:00:00',
    updatedBy: '管理员',
    updatedAt: '2026-04-01 11:00:00',
  },
  {
    id: '2',
    customerCode: 'CUST-0002',
    customerName: '张伟（个体）',
    customerType: 'INDIVIDUAL',
    customerGrade: 'C',
    contactName: '张伟',
    contactPhone: '13900139022',
    province: '广东省',
    city: '深圳市',
    district: '南山区',
    detailAddress: '科技园南路 1 号',
    salesperson: null,
    openingArrears: 0,
    openingBalance: 0,
    settlementMethod: 'CASH',
    paymentTermDays: 0,
    creditLimit: 0,
    remark: '现结客户',
    status: 'ENABLED',
    disableReason: null,
    isReferenced: false,
    mockReceivableAdjust: 0,
    createdBy: '销售-王晨',
    createdAt: '2026-02-20 14:30:00',
    updatedBy: '销售-王晨',
    updatedAt: '2026-02-20 14:30:00',
  },
  {
    id: '3',
    customerCode: 'CUST-0003',
    customerName: '成都蜀味商贸有限公司',
    customerType: 'ENTERPRISE',
    customerGrade: 'B',
    contactName: '陈扬',
    contactPhone: '028-81234567',
    province: '四川省',
    city: '成都市',
    district: '武侯区',
    detailAddress: null,
    salesperson: '周曼',
    openingArrears: 50000,
    openingBalance: 0,
    settlementMethod: 'ACCOUNT',
    paymentTermDays: 45,
    creditLimit: 200000,
    remark: null,
    status: 'ENABLED',
    disableReason: null,
    isReferenced: false,
    mockReceivableAdjust: 0,
    createdBy: '管理员',
    createdAt: '2026-03-05 10:00:00',
    updatedBy: '管理员',
    updatedAt: '2026-03-05 10:00:00',
  },
  {
    id: '4',
    customerCode: 'CUST-0004',
    customerName: '广州恒达批发部',
    customerType: 'ENTERPRISE',
    customerGrade: 'D',
    contactName: '刘敏',
    contactPhone: '13700137044',
    province: '广东省',
    city: '广州市',
    district: '天河区',
    detailAddress: '体育西路 100 号',
    salesperson: '李菲',
    openingArrears: 0,
    openingBalance: 10000,
    settlementMethod: 'CASH',
    paymentTermDays: 0,
    creditLimit: 0,
    status: 'DISABLED',
    disableReason: '长期未合作，档案禁用',
    isReferenced: false,
    mockReceivableAdjust: 0,
    remark: null,
    createdBy: '管理员',
    createdAt: '2025-06-01 08:00:00',
    updatedBy: '管理员',
    updatedAt: '2026-01-15 16:00:00',
  },
  {
    id: '5',
    customerCode: 'CUST-0005',
    customerName: '东莞智造电子',
    customerType: 'ENTERPRISE',
    customerGrade: 'E',
    contactName: '何工',
    contactPhone: '13600136055',
    province: '广东省',
    city: '东莞市',
    district: '南城街道',
    detailAddress: '宏图路 66 号',
    salesperson: '王晨',
    openingArrears: 12000,
    openingBalance: 0,
    settlementMethod: 'ACCOUNT',
    paymentTermDays: 15,
    creditLimit: 80000,
    remark: '信用额度联调样例',
    status: 'ENABLED',
    disableReason: null,
    isReferenced: false,
    mockReceivableAdjust: 5000,
    createdBy: '销售-王晨',
    createdAt: '2026-04-10 09:30:00',
    updatedBy: '销售-王晨',
    updatedAt: '2026-04-10 09:30:00',
  },
]

function load(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...seedCustomers]
    return JSON.parse(raw) as Customer[]
  } catch {
    return [...seedCustomers]
  }
}

let cache: Customer[] | null = null

export function listCustomers(): Customer[] {
  if (!cache) cache = load()
  return cache
}

export function persistCustomers(customers: Customer[]): void {
  cache = customers
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
}

export function getCustomerById(id: string): Customer | undefined {
  return listCustomers().find((c) => c.id === id)
}

export function getCustomerByCode(code: string, excludeId?: string): Customer | undefined {
  return listCustomers().find(
    (c) => c.customerCode === code && (!excludeId || c.id !== excludeId),
  )
}

export function listEnabledCustomers(): Customer[] {
  return listCustomers().filter((c) => c.status === 'ENABLED')
}

export function upsertCustomer(customer: Customer): void {
  const all = listCustomers()
  const idx = all.findIndex((c) => c.id === customer.id)
  if (idx >= 0) all[idx] = customer
  else all.unshift(customer)
  persistCustomers(all)
}

export function nextCustomerId(): string {
  const ids = listCustomers().map((c) => Number(c.id)).filter((n) => !Number.isNaN(n))
  const max = ids.length ? Math.max(...ids) : 0
  return String(max + 1)
}
