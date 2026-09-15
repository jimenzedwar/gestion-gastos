export type Currency = 'USD' | 'VES';

export type TransactionType = 'expense' | 'income' | 'exchange';

export interface Account {
  id: string;
  name: string;
  type: 'usd_wallet' | 'ves_bank' | 'cash_usd' | 'cash_ves' | 'vault';
  currency: Currency;
  balance: number; // In its native currency
  accountNumber?: string;
  holder?: string;
  phone?: string;
  ci?: string;
  bankCode?: string;
  isDefault?: boolean;
  statusText?: string;
  icon: string;
  color?: string;
}

export interface Transaction {
  id: string;
  title: string;
  category: string;
  categoryEmoji?: string;
  accountId: string;
  accountName: string;
  type: TransactionType;
  currency: Currency;
  amount: number; // Negative for expense, positive for income/exchange
  secondaryAmount: number; // In the other currency
  rate: number;
  date: string; // ISO or human-readable "Hoy, 11:20 am"
  groupDate: 'HOY' | 'AYER' | '15 NOV';
  reference: string;
  sudebanCode?: string;
  status: string;
  icon: string;
  note?: string;
  beneficiary?: {
    name: string;
    branch?: string;
    rif?: string;
    bank?: string;
    phone?: string;
  };
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  percentage: number;
  icon: string;
}

export interface CashBreakdown {
  bill100: number;
  bill50: number;
  bill20: number;
  bill10: number;
  bill5: number;
  bill1: number;
}

export interface EmployeeLoan {
  id: string;
  employeeId: string;
  type: 'advance' | 'loan'; // Adelanto de quincena o Préstamo
  description: string;
  totalAmount: number; // USD
  remainingAmount: number; // USD
  deductionPerPayment: number; // Monto a descontar por nómina en USD
  date: string;
  status: 'active' | 'paid';
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  ci: string;
  phone: string;
  monthlySalary: number; // USD
  paymentFrequency: 'quincenal' | 'mensual';
  paymentMethod: 'pago_movil' | 'cash_usd' | 'zinli';
  pagoMovilBank?: string;
  loans: EmployeeLoan[];
  status: 'active' | 'inactive';
}

export interface PayrollPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  date: string;
  baseAmount: number; // USD
  deductedAmount: number; // USD deducted for loans
  netAmountUSD: number; // USD
  netAmountVES: number; // VES
  rate: number;
  paidFromAccountId: string;
  reference: string;
  status: 'paid' | 'pending';
}

export interface RecurringExpense {
  id: string;
  name: string;
  category: string;
  categoryEmoji: string;
  amount: number;
  currency: Currency;
  frequency: 'mensual' | 'quincenal' | 'semanal';
  dueDay: number; // Día del mes
  isPaid: boolean;
  lastPaidDate?: string;
  accountId?: string;
}

