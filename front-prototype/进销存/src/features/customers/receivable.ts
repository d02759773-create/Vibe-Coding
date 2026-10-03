import type { Customer } from './types'
import { getCustomerById } from './storage'

/** 实时应收余额（Demo 口径，与字段清单 §5.2 一致） */
export function computeRealtimeReceivable(customer: Customer): number {
  const base = customer.openingArrears - customer.openingBalance + customer.mockReceivableAdjust
  return Math.round(base * 100) / 100
}

export function getRealtimeReceivable(customerId: string): number {
  const customer = getCustomerById(customerId)
  if (!customer) return 0
  return computeRealtimeReceivable(customer)
}

/** 销售订单等模块：信用额度硬控（R11） */
export function checkCreditLimit(
  customerId: string,
  orderReceivableAmount: number,
): { ok: true } | { ok: false; message: string } {
  const customer = getCustomerById(customerId)
  if (!customer) return { ok: false, message: '客户不存在' }
  if (customer.creditLimit <= 0) return { ok: true }
  const after = computeRealtimeReceivable(customer) + orderReceivableAmount
  if (after > customer.creditLimit) {
    return { ok: false, message: '超出客户信用额度，无法保存订单' }
  }
  return { ok: true }
}
