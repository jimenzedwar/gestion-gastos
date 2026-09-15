import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Account, Transaction, SavingsGoal, Currency, Employee, EmployeeLoan, PayrollPayment, RecurringExpense } from '../types';
import { 
  INITIAL_ACCOUNTS, 
  INITIAL_RATE_BCV, 
  INITIAL_SAVINGS_GOAL, 
  INITIAL_TRANSACTIONS,
  INITIAL_EMPLOYEES,
  INITIAL_PAYROLL_HISTORY,
  INITIAL_RECURRING_EXPENSES
} from '../data/mockData';

interface AppContextType {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  bcvRate: number;
  setBcvRate: (rate: number) => void;
  hideBalances: boolean;
  setHideBalances: React.Dispatch<React.SetStateAction<boolean>>;
  toggleHideBalances: () => void;
  accounts: Account[];
  transactions: Transaction[];
  savingsGoal: SavingsGoal;
  deviceMode: 'responsive' | 'mobile_frame';
  setDeviceMode: (mode: 'responsive' | 'mobile_frame') => void;
  
  // Payroll & Loans
  employees: Employee[];
  payrollHistory: PayrollPayment[];
  addEmployee: (emp: Omit<Employee, 'id' | 'loans'>) => Employee;
  requestLoan: (employeeId: string, loanData: { type: 'advance' | 'loan'; description: string; totalAmount: number; deductionPerPayment: number; payFromAccountId?: string }) => void;
  repayLoan: (employeeId: string, loanId: string, amount: number, accountId?: string) => void;
  processPayrollPayment: (employeeId: string, period: string, accountId: string, customRate?: number) => PayrollPayment | null;
  
  // Recurring Expenses / Budget
  recurringExpenses: RecurringExpense[];
  payRecurringExpense: (expenseId: string, accountId?: string) => void;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'isPaid'>) => RecurringExpense;

  // Modals
  quickExpenseModalOpen: boolean;
  setQuickExpenseModalOpen: (open: boolean) => void;
  exchangeModalOpen: boolean;
  setExchangeModalOpen: (open: boolean) => void;
  selectedTx: Transaction | null;
  setSelectedTx: (tx: Transaction | null) => void;
  receiptModalOpen: boolean;
  setReceiptModalOpen: (open: boolean) => void;
  
  // Quick Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'date' | 'groupDate' | 'reference' | 'status'>) => Transaction;
  performExchange: (
    primaryAmount: number, 
    secondaryAmount: number, 
    fromAccountId: string, 
    toAccountId: string,
    customRate?: number,
    isVesToUsd?: boolean
  ) => Transaction;
  
  // Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;
  
  // Formatting helpers
  formatUSD: (val: number, showSign?: boolean) => string;
  formatVES: (val: number, showSign?: boolean) => string;
  totalBalanceUSD: number;
  totalBalanceVES: number;
}


const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<string>('inicio');
  const [bcvRate, setBcvRate] = useState<number>(INITIAL_RATE_BCV);
  const [hideBalances, setHideBalances] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [savingsGoal, setSavingsGoal] = useState<SavingsGoal>(INITIAL_SAVINGS_GOAL);
  const [deviceMode, setDeviceMode] = useState<'responsive' | 'mobile_frame'>('responsive');

  // Payroll & Loans
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [payrollHistory, setPayrollHistory] = useState<PayrollPayment[]>(INITIAL_PAYROLL_HISTORY);

  // Recurring Expenses / Budget
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(INITIAL_RECURRING_EXPENSES);

  // Modals
  const [quickExpenseModalOpen, setQuickExpenseModalOpen] = useState<boolean>(false);
  const [exchangeModalOpen, setExchangeModalOpen] = useState<boolean>(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(INITIAL_TRANSACTIONS[0]);
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  };

  const toggleHideBalances = () => {
    setHideBalances((prev) => !prev);
  };

  // Calculations
  const totalBalanceUSD = useMemo(() => {
    return accounts.reduce((acc, a) => {
      if (a.currency === 'USD') return acc + a.balance;
      return acc + (a.balance / bcvRate);
    }, 0);
  }, [accounts, bcvRate]);

  const totalBalanceVES = useMemo(() => {
    return totalBalanceUSD * bcvRate;
  }, [totalBalanceUSD, bcvRate]);

  const formatUSD = (val: number, showSign = false): string => {
    if (hideBalances) return '••••••';
    const absVal = Math.abs(val);
    const formatted = absVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (showSign && val > 0) return `+$${formatted}`;
    if (val < 0) return `-$${formatted}`;
    return `$${formatted}`;
  };

  const formatVES = (val: number, showSign = false): string => {
    if (hideBalances) return '•••••••••';
    const absVal = Math.abs(val);
    const formatted = absVal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (showSign && val > 0) return `+Bs. ${formatted}`;
    if (val < 0) return `-Bs. ${formatted}`;
    return `Bs. ${formatted}`;
  };

  const addTransaction = (newTxData: Omit<Transaction, 'id' | 'date' | 'groupDate' | 'reference' | 'status'>) => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000);
    const newTx: Transaction = {
      ...newTxData,
      id: `tx-${Date.now()}`,
      date: 'Hoy, ' + new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true }),
      groupDate: 'HOY',
      reference: `#TRX-${randomNum}`,
      sudebanCode: `SUDEBAN-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Completado con éxito'
    };

    // Update account balances
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === newTx.accountId) {
          const delta = newTx.amount;
          return { ...acc, balance: Math.max(0, acc.balance + delta) };
        }
        return acc;
      })
    );

    setTransactions((prev) => [newTx, ...prev]);
    setSelectedTx(newTx);
    return newTx;
  };

  // Employee & Loan Actions
  const addEmployee = (empData: Omit<Employee, 'id' | 'loans'>): Employee => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      loans: []
    };
    setEmployees((prev) => [...prev, newEmp]);
    showToast(`Empleado ${newEmp.name} registrado con éxito`);
    return newEmp;
  };

  const requestLoan = (
    employeeId: string, 
    loanData: { type: 'advance' | 'loan'; description: string; totalAmount: number; deductionPerPayment: number; payFromAccountId?: string }
  ) => {
    const loanId = `loan-${Date.now()}`;
    const newLoan: EmployeeLoan = {
      id: loanId,
      employeeId,
      type: loanData.type,
      description: loanData.description,
      totalAmount: loanData.totalAmount,
      remainingAmount: loanData.totalAmount,
      deductionPerPayment: loanData.deductionPerPayment,
      date: new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'active'
    };

    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            loans: [...emp.loans, newLoan]
          };
        }
        return emp;
      })
    );

    // If a payout account is provided, record disbursement expense
    if (loanData.payFromAccountId) {
      const sourceAcc = accounts.find((a) => a.id === loanData.payFromAccountId) || accounts[0];
      const isUSD = sourceAcc.currency === 'USD';
      const amtUSD = loanData.totalAmount;
      const amtVES = amtUSD * bcvRate;
      
      addTransaction({
        title: `${loanData.type === 'advance' ? 'Adelanto de Sueldo' : 'Préstamo a Empleado'}`,
        category: 'Nómina',
        categoryEmoji: '👥',
        accountId: sourceAcc.id,
        accountName: sourceAcc.name,
        type: 'expense',
        currency: sourceAcc.currency,
        amount: isUSD ? -amtUSD : -amtVES,
        secondaryAmount: isUSD ? -amtVES : -amtUSD,
        rate: bcvRate,
        icon: 'credit_card',
        note: `${newLoan.description} (Se descontará de la nómina)`
      });
    }

    showToast(`${loanData.type === 'advance' ? 'Adelanto' : 'Préstamo'} de $${loanData.totalAmount} registrado`);
  };

  const repayLoan = (employeeId: string, loanId: string, amount: number, accountId?: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== employeeId) return emp;
        const updatedLoans = emp.loans.map((loan) => {
          if (loan.id !== loanId) return loan;
          const newRemaining = Math.max(0, loan.remainingAmount - amount);
          return {
            ...loan,
            remainingAmount: newRemaining,
            status: newRemaining <= 0 ? ('paid' as const) : ('active' as const)
          };
        });
        return { ...emp, loans: updatedLoans };
      })
    );

    if (accountId) {
      const destAcc = accounts.find((a) => a.id === accountId) || accounts[0];
      const isUSD = destAcc.currency === 'USD';
      addTransaction({
        title: 'Abono / Pago de Préstamo de Empleado',
        category: 'Cobros',
        categoryEmoji: '💰',
        accountId: destAcc.id,
        accountName: destAcc.name,
        type: 'income',
        currency: destAcc.currency,
        amount: isUSD ? amount : amount * bcvRate,
        secondaryAmount: isUSD ? amount * bcvRate : amount,
        rate: bcvRate,
        icon: 'savings',
        note: `Reintegro voluntario de préstamo por $${amount.toFixed(2)}`
      });
    }

    showToast(`Abono de $${amount.toFixed(2)} registrado correctamente`);
  };

  const processPayrollPayment = (
    employeeId: string, 
    period: string, 
    accountId: string, 
    customRate?: number
  ): PayrollPayment | null => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return null;

    const rate = customRate || bcvRate;
    const isQuincenal = emp.paymentFrequency === 'quincenal';
    const baseUSD = isQuincenal ? emp.monthlySalary / 2 : emp.monthlySalary;

    // Calculate loan deduction: "si no pagan se va descontando de su salario"
    let totalDeductionUSD = 0;
    const updatedLoans = emp.loans.map((loan) => {
      if (loan.status !== 'active' || loan.remainingAmount <= 0) return loan;
      // Deduct up to deductionPerPayment or remaining amount
      const toDeduct = Math.min(loan.deductionPerPayment, loan.remainingAmount);
      totalDeductionUSD += toDeduct;
      const newRemaining = loan.remainingAmount - toDeduct;
      return {
        ...loan,
        remainingAmount: newRemaining,
        status: newRemaining <= 0 ? ('paid' as const) : ('active' as const)
      };
    });

    // Net payable to employee
    const netUSD = Math.max(0, baseUSD - totalDeductionUSD);
    const netVES = netUSD * rate;

    // Update employee loans state
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, loans: updatedLoans } : e))
    );

    const sourceAcc = accounts.find((a) => a.id === accountId) || accounts[1];
    const isSourceUSD = sourceAcc.currency === 'USD';
    const chargeAmount = isSourceUSD ? netUSD : netVES;

    const paymentRecord: PayrollPayment = {
      id: `pay-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      period,
      date: new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }),
      baseAmount: baseUSD,
      deductedAmount: totalDeductionUSD,
      netAmountUSD: netUSD,
      netAmountVES: netVES,
      rate,
      paidFromAccountId: sourceAcc.id,
      reference: `#NOM-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'paid'
    };

    setPayrollHistory((prev) => [paymentRecord, ...prev]);

    // Record expense in transactions ledger
    addTransaction({
      title: `Pago de Nómina: ${emp.name}`,
      category: 'Nómina',
      categoryEmoji: '👥',
      accountId: sourceAcc.id,
      accountName: sourceAcc.name,
      type: 'expense',
      currency: sourceAcc.currency,
      amount: -chargeAmount,
      secondaryAmount: isSourceUSD ? -netVES : -netUSD,
      rate,
      icon: 'badge',
      note: `${period}. Base: $${baseUSD.toFixed(2)}${totalDeductionUSD > 0 ? ` (Descuento préstamo: -$${totalDeductionUSD.toFixed(2)})` : ''}. Neto: $${netUSD.toFixed(2)}`
    });

    showToast(`Nómina pagada a ${emp.name}: $${netUSD.toFixed(2)} (Desc: -$${totalDeductionUSD.toFixed(2)})`);
    return paymentRecord;
  };

  // Recurring Expenses Actions
  const payRecurringExpense = (expenseId: string, accountId?: string) => {
    const expense = recurringExpenses.find((e) => e.id === expenseId);
    if (!expense) return;

    const targetAccountId = accountId || expense.accountId || accounts[1].id;
    const sourceAcc = accounts.find((a) => a.id === targetAccountId) || accounts[0];
    const isUSD = sourceAcc.currency === 'USD';
    const expIsUSD = expense.currency === 'USD';

    let chargeAmount = expense.amount;
    let secondaryAmt = expense.amount;

    if (expIsUSD && !isUSD) {
      chargeAmount = expense.amount * bcvRate;
      secondaryAmt = expense.amount;
    } else if (!expIsUSD && isUSD) {
      chargeAmount = expense.amount / bcvRate;
      secondaryAmt = expense.amount;
    }

    addTransaction({
      title: `Gasto Recurrente: ${expense.name}`,
      category: expense.category,
      categoryEmoji: expense.categoryEmoji,
      accountId: sourceAcc.id,
      accountName: sourceAcc.name,
      type: 'expense',
      currency: sourceAcc.currency,
      amount: -chargeAmount,
      secondaryAmount: -secondaryAmt,
      rate: bcvRate,
      icon: 'event_repeat',
      note: `Pago de recurrente - ${new Date().toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}`
    });

    setRecurringExpenses((prev) =>
      prev.map((e) =>
        e.id === expenseId
          ? {
              ...e,
              isPaid: true,
              lastPaidDate: new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
            }
          : e
      )
    );

    showToast(`Gasto "${expense.name}" pagado con éxito`);
  };

  const addRecurringExpense = (newExpenseData: Omit<RecurringExpense, 'id' | 'isPaid'>): RecurringExpense => {
    const newExp: RecurringExpense = {
      ...newExpenseData,
      id: `rec-${Date.now()}`,
      isPaid: false
    };
    setRecurringExpenses((prev) => [...prev, newExp]);
    showToast(`Gasto recurrente "${newExp.name}" añadido al presupuesto`);
    return newExp;
  };

  const performExchange = (
    primaryAmount: number,
    secondaryAmount: number,
    fromAccountId: string,
    toAccountId: string,
    customRate?: number,
    isVesToUsd: boolean = false
  ) => {
    const rateUsed = customRate || bcvRate;
    const randomNum = Math.floor(1000000 + Math.random() * 9000000);
    const fromAcc = accounts.find((a) => a.id === fromAccountId) || accounts[0];
    const toAcc = accounts.find((a) => a.id === toAccountId) || accounts[1];

    const exchangeTx: Transaction = {
      id: `swap-${Date.now()}`,
      title: isVesToUsd ? 'Cambio VES ➔ USD' : 'Cambio USD ➔ VES',
      category: 'Cambio',
      categoryEmoji: '🔄',
      accountId: toAccountId,
      accountName: `${fromAcc.name} ➔ ${toAcc.name}`,
      type: 'exchange',
      currency: isVesToUsd ? 'USD' : 'VES',
      amount: secondaryAmount, // Amount received
      secondaryAmount: -primaryAmount, // Amount delivered
      rate: rateUsed,
      date: 'Hoy, ' + new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true }),
      groupDate: 'HOY',
      reference: `#EX-${randomNum}`,
      sudebanCode: `SUDEBAN-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Operación Exitosa',
      icon: 'currency_exchange',
      note: `Tasa aplicada: 1 USD = Bs. ${rateUsed.toFixed(2)} ${customRate && customRate !== bcvRate ? '(Tasa Libre/Pactada)' : '(Oficial BCV)'}`,
      beneficiary: {
        name: toAcc.holder || 'Alejandro Morales',
        branch: 'Mesa de Cambio',
        bank: toAcc.name,
        phone: toAcc.phone || '0414-1234567'
      }
    };

    // Update balances: deduct primaryAmount from fromAccountId, add secondaryAmount to toAccountId
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fromAccountId) {
          return { ...acc, balance: Math.max(0, acc.balance - primaryAmount) };
        }
        if (acc.id === toAccountId) {
          return { ...acc, balance: acc.balance + secondaryAmount };
        }
        return acc;
      })
    );

    setTransactions((prev) => [exchangeTx, ...prev]);
    setSelectedTx(exchangeTx);
    return exchangeTx;
  };


  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        bcvRate,
        setBcvRate,
        hideBalances,
        setHideBalances,
        toggleHideBalances,
        accounts,
        transactions,
        savingsGoal,
        deviceMode,
        setDeviceMode,
        employees,
        payrollHistory,
        addEmployee,
        requestLoan,
        repayLoan,
        processPayrollPayment,
        recurringExpenses,
        payRecurringExpense,
        addRecurringExpense,
        quickExpenseModalOpen,
        setQuickExpenseModalOpen,
        exchangeModalOpen,
        setExchangeModalOpen,
        selectedTx,
        setSelectedTx,
        receiptModalOpen,
        setReceiptModalOpen,
        addTransaction,
        performExchange,
        toastMessage,
        showToast,
        formatUSD,
        formatVES,
        totalBalanceUSD,
        totalBalanceVES
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
