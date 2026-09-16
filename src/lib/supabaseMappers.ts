import { Account, Transaction, Employee, EmployeeLoan, PayrollPayment, RecurringExpense, Task } from '../types';

export function accountToDb(a: Account, userId: string) {
  return {
    id: a.id,
    user_id: userId,
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: a.balance,
    account_number: a.accountNumber ?? null,
    holder: a.holder ?? null,
    phone: a.phone ?? null,
    ci: a.ci ?? null,
    bank_code: a.bankCode ?? null,
    is_default: a.isDefault ?? false,
    status_text: a.statusText ?? null,
    icon: a.icon,
    color: a.color ?? null
  };
}

export function accountFromDb(row: any): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    balance: Number(row.balance),
    accountNumber: row.account_number ?? undefined,
    holder: row.holder ?? undefined,
    phone: row.phone ?? undefined,
    ci: row.ci ?? undefined,
    bankCode: row.bank_code ?? undefined,
    isDefault: row.is_default ?? undefined,
    statusText: row.status_text ?? undefined,
    icon: row.icon,
    color: row.color ?? undefined
  };
}

export function transactionToDb(t: Transaction, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    title: t.title,
    category: t.category,
    category_emoji: t.categoryEmoji ?? null,
    account_id: t.accountId,
    account_name: t.accountName,
    type: t.type,
    currency: t.currency,
    amount: t.amount,
    secondary_amount: t.secondaryAmount,
    rate: t.rate,
    date_label: t.date,
    created_at: t.createdAt,
    group_date: t.groupDate,
    reference: t.reference,
    sudeban_code: t.sudebanCode ?? null,
    status: t.status,
    icon: t.icon,
    note: t.note ?? null,
    beneficiary: t.beneficiary ?? null,
    receipt_path: t.receiptPath ?? null
  };
}

export function transactionFromDb(row: any): Transaction {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    categoryEmoji: row.category_emoji ?? undefined,
    accountId: row.account_id,
    accountName: row.account_name,
    type: row.type,
    currency: row.currency,
    amount: Number(row.amount),
    secondaryAmount: Number(row.secondary_amount),
    rate: Number(row.rate),
    date: row.date_label,
    createdAt: row.created_at,
    groupDate: row.group_date,
    reference: row.reference,
    sudebanCode: row.sudeban_code ?? undefined,
    status: row.status,
    icon: row.icon,
    note: row.note ?? undefined,
    beneficiary: row.beneficiary ?? undefined,
    receiptPath: row.receipt_path ?? undefined
  };
}

export function employeeToDb(e: Omit<Employee, 'loans'>, userId: string) {
  return {
    id: e.id,
    user_id: userId,
    name: e.name,
    position: e.position,
    ci: e.ci ?? null,
    phone: e.phone ?? null,
    monthly_salary: e.monthlySalary,
    payment_frequency: e.paymentFrequency,
    payment_method: e.paymentMethod,
    pago_movil_bank: e.pagoMovilBank ?? null,
    status: e.status,
    assigned_account_id: e.assignedAccountId ?? null,
    exchange_counterpart_account_id: e.exchangeCounterpartAccountId ?? null
  };
}

export function employeeFromDb(row: any, loans: EmployeeLoan[]): Employee {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    ci: row.ci ?? undefined,
    phone: row.phone ?? undefined,
    monthlySalary: Number(row.monthly_salary),
    paymentFrequency: row.payment_frequency,
    paymentMethod: row.payment_method,
    pagoMovilBank: row.pago_movil_bank ?? undefined,
    status: row.status,
    authUserId: row.auth_user_id ?? undefined,
    assignedAccountId: row.assigned_account_id ?? undefined,
    exchangeCounterpartAccountId: row.exchange_counterpart_account_id ?? undefined,
    loans
  };
}

export function loanToDb(l: EmployeeLoan, userId: string) {
  return {
    id: l.id,
    user_id: userId,
    employee_id: l.employeeId,
    type: l.type,
    description: l.description,
    total_amount: l.totalAmount,
    remaining_amount: l.remainingAmount,
    deduction_per_payment: l.deductionPerPayment,
    date_label: l.date,
    status: l.status
  };
}

export function loanFromDb(row: any): EmployeeLoan {
  return {
    id: row.id,
    employeeId: row.employee_id,
    type: row.type,
    description: row.description,
    totalAmount: Number(row.total_amount),
    remainingAmount: Number(row.remaining_amount),
    deductionPerPayment: Number(row.deduction_per_payment),
    date: row.date_label,
    status: row.status
  };
}

export function payrollToDb(p: PayrollPayment, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    employee_id: p.employeeId,
    employee_name: p.employeeName,
    period: p.period,
    date_label: p.date,
    base_amount: p.baseAmount,
    deducted_amount: p.deductedAmount,
    net_amount_usd: p.netAmountUSD,
    net_amount_ves: p.netAmountVES,
    rate: p.rate,
    paid_from_account_id: p.paidFromAccountId,
    reference: p.reference,
    status: p.status,
    secondary_account_id: p.secondaryAccountId ?? null,
    secondary_amount_usd: p.secondaryAmountUSD ?? null
  };
}

export function payrollFromDb(row: any): PayrollPayment {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    period: row.period,
    date: row.date_label,
    baseAmount: Number(row.base_amount),
    deductedAmount: Number(row.deducted_amount),
    netAmountUSD: Number(row.net_amount_usd),
    netAmountVES: Number(row.net_amount_ves),
    rate: Number(row.rate),
    paidFromAccountId: row.paid_from_account_id,
    reference: row.reference,
    status: row.status,
    secondaryAccountId: row.secondary_account_id ?? undefined,
    secondaryAmountUSD: row.secondary_amount_usd != null ? Number(row.secondary_amount_usd) : undefined
  };
}

export function recurringToDb(r: RecurringExpense, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    name: r.name,
    category: r.category,
    category_emoji: r.categoryEmoji ?? null,
    amount: r.amount,
    currency: r.currency,
    frequency: r.frequency,
    due_day: r.dueDay,
    is_paid: r.isPaid,
    last_paid_date: r.lastPaidDate ?? null,
    account_id: r.accountId ?? null
  };
}

export function recurringFromDb(row: any): RecurringExpense {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    categoryEmoji: row.category_emoji,
    amount: Number(row.amount),
    currency: row.currency,
    frequency: row.frequency,
    dueDay: row.due_day,
    isPaid: row.is_paid,
    lastPaidDate: row.last_paid_date ?? undefined,
    accountId: row.account_id ?? undefined
  };
}

export function taskToDb(t: Task, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    assigned_employee_id: t.assignedEmployeeId ?? null,
    title: t.title,
    description: t.description ?? null,
    priority: t.priority,
    status: t.status,
    due_date: t.dueDate ?? null
  };
}

export function taskFromDb(row: any): Task {
  return {
    id: row.id,
    assignedEmployeeId: row.assigned_employee_id ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date ?? undefined
  };
}
