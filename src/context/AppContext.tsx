import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Account, Transaction, Currency, Employee, EmployeeLoan, PayrollPayment, RecurringExpense, Task, TaskPriority } from '../types';
import { supabase, PENDING_INVITE_STORAGE_KEY } from '../lib/supabaseClient';
import { compressImage } from '../lib/imageCompression';
import { useAuth } from './AuthContext';
import {
  accountToDb,
  accountFromDb,
  transactionToDb,
  transactionFromDb,
  employeeToDb,
  employeeFromDb,
  loanToDb,
  loanFromDb,
  payrollToDb,
  payrollFromDb,
  recurringToDb,
  recurringFromDb,
  taskToDb,
  taskFromDb
} from '../lib/supabaseMappers';

// Public, no-key exchange rate API for Venezuela's official (BCV) rates
const BCV_USD_ENDPOINT = 'https://ve.dolarapi.com/v1/dolares/oficial';
const BCV_EUR_ENDPOINT = 'https://ve.dolarapi.com/v1/euros/oficial';
const RATE_REFRESH_MS = 30 * 60 * 1000; // 30 minutes
const RECEIPTS_BUCKET = 'receipts';

interface AppContextType {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  bcvRate: number;
  eurRate: number;
  rateUpdatedAt: string | null;
  hideBalances: boolean;
  setHideBalances: React.Dispatch<React.SetStateAction<boolean>>;
  toggleHideBalances: () => void;
  dataLoading: boolean;
  accounts: Account[];
  transactions: Transaction[];
  addAccount: (account: Omit<Account, 'id'>) => Account;

  // Role: business owner (full access) or an employee with an assigned account
  role: 'owner' | 'employee';
  currentEmployee: Employee | null;
  joinError: string | null;

  // Payroll & Loans
  employees: Employee[];
  payrollHistory: PayrollPayment[];
  addEmployee: (emp: Omit<Employee, 'id' | 'loans'>) => Employee;
  requestLoan: (employeeId: string, loanData: { type: 'advance' | 'loan'; description: string; totalAmount: number; deductionPerPayment: number; payFromAccountId?: string }) => void;
  repayLoan: (employeeId: string, loanId: string, amount: number, accountId?: string) => void;
  processPayrollPayment: (
    employeeId: string,
    period: string,
    accountId: string,
    customRate?: number,
    split?: { secondaryAccountId: string; secondaryAmountUSD: number }
  ) => PayrollPayment | null;
  grantEmployeeAccess: (employeeId: string, assignedAccountId: string, exchangeCounterpartAccountId?: string) => Promise<string | null>;

  // Tasks
  tasks: Task[];
  addTask: (task: { title: string; description?: string; priority: TaskPriority; assignedEmployeeId?: string; dueDate?: string }) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;

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
  addTransaction: (tx: Omit<Transaction, 'id' | 'date' | 'createdAt' | 'groupDate' | 'reference' | 'status'>) => Transaction;
  attachReceipt: (transactionId: string, file: File) => Promise<void>;
  getReceiptUrl: (path: string) => Promise<string | null>;
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
  const { user } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('inicio');
  const [bcvRate, setBcvRate] = useState<number>(150);
  const [eurRate, setEurRate] = useState<number>(150);
  const [rateUpdatedAt, setRateUpdatedAt] = useState<string | null>(null);
  const [hideBalances, setHideBalances] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Role: is this session the business owner, or an employee with limited access?
  const [role, setRole] = useState<'owner' | 'employee'>('owner');
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Payroll & Loans
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<PayrollPayment[]>([]);

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);

  // Recurring Expenses / Budget
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

  // Modals
  const [quickExpenseModalOpen, setQuickExpenseModalOpen] = useState<boolean>(false);
  const [exchangeModalOpen, setExchangeModalOpen] = useState<boolean>(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2800);
  };

  const syncError = (action: string) => {
    showToast(`No se pudo guardar "${action}" en la nube. Se intentará más tarde.`);
  };

  const toggleHideBalances = () => {
    setHideBalances((prev) => !prev);
  };

  // Load this user's data from Supabase once they're signed in
  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    let cancelled = false;
    setDataLoading(true);

    (async () => {
      const pendingCode = sessionStorage.getItem(PENDING_INVITE_STORAGE_KEY);
      if (pendingCode) {
        const { error } = await supabase.rpc('redeem_employee_invite', { p_code: pendingCode });
        sessionStorage.removeItem(PENDING_INVITE_STORAGE_KEY);
        if (cancelled) return;
        if (error) {
          const messages: Record<string, string> = {
            invalid_code: 'El código de invitación no es válido.',
            code_already_used: 'Ese código de invitación ya fue usado.',
            code_expired: 'Ese código de invitación ya venció.'
          };
          setJoinError(messages[error.message] ?? 'No se pudo vincular tu cuenta con el código de invitación.');
        } else {
          showToast('¡Bienvenido! Tu cuenta quedó vinculada.');
        }
      }

      const [accRes, txRes, empRes, loanRes, payRes, recRes, taskRes] = await Promise.all([
        supabase.from('accounts').select('*').order('created_at', { ascending: true }),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('employees').select('*').order('created_at', { ascending: true }),
        supabase.from('employee_loans').select('*'),
        supabase.from('payroll_history').select('*').order('created_at', { ascending: false }),
        supabase.from('recurring_expenses').select('*').order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false })
      ]);

      if (cancelled) return;

      if (accRes.data) setAccounts(accRes.data.map(accountFromDb));
      if (txRes.data) setTransactions(txRes.data.map(transactionFromDb));

      if (empRes.data) {
        const loansByEmployee: Record<string, EmployeeLoan[]> = {};
        (loanRes.data ?? []).forEach((row) => {
          const loan = loanFromDb(row);
          if (!loansByEmployee[loan.employeeId]) loansByEmployee[loan.employeeId] = [];
          loansByEmployee[loan.employeeId].push(loan);
        });
        setEmployees(empRes.data.map((row) => employeeFromDb(row, loansByEmployee[row.id] ?? [])));

        // Under RLS, an employee session only ever sees their own row here (via
        // "employee reads own employee row"); the owner sees every row instead.
        // Whichever row (if any) is linked to this auth user tells us the role.
        const myRow = empRes.data.find((row: any) => row.auth_user_id === user.id);
        if (myRow) {
          setRole('employee');
          setOwnerId(myRow.user_id);
          setCurrentEmployee(employeeFromDb(myRow, loansByEmployee[myRow.id] ?? []));
        } else {
          setRole('owner');
          setOwnerId(user.id);
          setCurrentEmployee(null);
        }
      } else {
        setRole('owner');
        setOwnerId(user.id);
        setCurrentEmployee(null);
      }

      if (payRes.data) setPayrollHistory(payRes.data.map(payrollFromDb));
      if (recRes.data) setRecurringExpenses(recRes.data.map(recurringFromDb));
      if (taskRes.data) setTasks(taskRes.data.map(taskFromDb));

      setDataLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // Depend on the user id (a stable primitive), not the whole user/session object —
    // Supabase emits a new session object on token refreshes even for the same signed-in
    // user, which would otherwise retrigger this fetch and flash the loading screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch the official BCV rate (USD and EUR) from a public rate API and keep it fresh
  useEffect(() => {
    let cancelled = false;

    const fetchRates = async () => {
      try {
        const [usdRes, eurRes] = await Promise.all([
          fetch(BCV_USD_ENDPOINT),
          fetch(BCV_EUR_ENDPOINT)
        ]);
        if (!usdRes.ok || !eurRes.ok) return;
        const usdData = await usdRes.json();
        const eurData = await eurRes.json();
        if (cancelled) return;
        if (typeof usdData.promedio === 'number') setBcvRate(usdData.promedio);
        if (typeof eurData.promedio === 'number') setEurRate(eurData.promedio);
        setRateUpdatedAt(usdData.fechaActualizacion ?? new Date().toISOString());
      } catch {
        // Offline or API unreachable — keep the last known rate
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, RATE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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

  const addAccount = (accountData: Omit<Account, 'id'>): Account => {
    const newAccount: Account = {
      ...accountData,
      id: `acc-${Date.now()}`
    };
    setAccounts((prev) => [...prev, newAccount]);

    if (user) {
      supabase.from('accounts').insert(accountToDb(newAccount, ownerId || user.id)).then(({ error }) => {
        if (error) syncError('cuenta nueva');
      });
    }

    showToast(`Cuenta "${newAccount.name}" agregada con éxito`);
    return newAccount;
  };

  const addTransaction = (newTxData: Omit<Transaction, 'id' | 'date' | 'createdAt' | 'groupDate' | 'reference' | 'status'>) => {
    const randomNum = Math.floor(1000000 + Math.random() * 9000000);
    const newTx: Transaction = {
      ...newTxData,
      id: `tx-${Date.now()}`,
      date: 'Hoy, ' + new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true }),
      createdAt: new Date().toISOString(),
      groupDate: 'HOY',
      reference: `#TRX-${randomNum}`,
      sudebanCode: `SUDEBAN-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Completado con éxito'
    };

    // Update account balances
    let updatedAccount: Account | null = null;
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === newTx.accountId) {
          const delta = newTx.amount;
          updatedAccount = { ...acc, balance: Math.max(0, acc.balance + delta) };
          return updatedAccount;
        }
        return acc;
      })
    );

    setTransactions((prev) => [newTx, ...prev]);
    setSelectedTx(newTx);

    if (user) {
      supabase.from('transactions').insert(transactionToDb(newTx, ownerId || user.id)).then(({ error }) => {
        if (error) syncError('movimiento');
      });
      if (updatedAccount) {
        supabase.from('accounts').update({ balance: updatedAccount.balance }).eq('id', updatedAccount.id).then(({ error }) => {
          if (error) syncError('saldo de cuenta');
        });
      }
    }

    return newTx;
  };

  const attachReceipt = async (transactionId: string, file: File) => {
    if (!user) return;
    try {
      const compressed = await compressImage(file);
      const path = `${ownerId || user.id}/${transactionId}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(RECEIPTS_BUCKET)
        .upload(path, compressed, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) {
        showToast('No se pudo subir el comprobante');
        return;
      }

      setTransactions((prev) =>
        prev.map((tx) => (tx.id === transactionId ? { ...tx, receiptPath: path } : tx))
      );
      setSelectedTx((prev) => (prev && prev.id === transactionId ? { ...prev, receiptPath: path } : prev));

      const { error: dbError } = await supabase
        .from('transactions')
        .update({ receipt_path: path })
        .eq('id', transactionId);

      if (dbError) syncError('comprobante');
    } catch {
      showToast('No se pudo procesar la imagen del comprobante');
    }
  };

  const getReceiptUrl = async (path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from(RECEIPTS_BUCKET)
      .createSignedUrl(path, 3600);
    if (error || !data) return null;
    return data.signedUrl;
  };

  // Employee & Loan Actions
  const addEmployee = (empData: Omit<Employee, 'id' | 'loans'>): Employee => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      loans: []
    };
    setEmployees((prev) => [...prev, newEmp]);

    if (user) {
      supabase.from('employees').insert(employeeToDb(newEmp, ownerId || user.id)).then(({ error }) => {
        if (error) syncError('empleado');
      });
    }

    showToast(`Empleado ${newEmp.name} registrado con éxito`);
    return newEmp;
  };

  const generateInviteCode = (): string => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres ambiguos (0/O, 1/I)
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  };

  // Owner-only: assigns an employee a working account and generates a one-time
  // invite code so they can create their own limited-access login.
  const grantEmployeeAccess = async (
    employeeId: string,
    assignedAccountId: string,
    exchangeCounterpartAccountId?: string
  ): Promise<string | null> => {
    if (!user) return null;

    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employeeId
          ? { ...e, assignedAccountId, exchangeCounterpartAccountId: exchangeCounterpartAccountId || undefined }
          : e
      )
    );

    const { error: updateError } = await supabase
      .from('employees')
      .update({
        assigned_account_id: assignedAccountId,
        exchange_counterpart_account_id: exchangeCounterpartAccountId || null
      })
      .eq('id', employeeId);

    if (updateError) {
      showToast('No se pudo asignar la cuenta al empleado');
      return null;
    }

    const code = generateInviteCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: inviteError } = await supabase.from('employee_invites').insert({
      code,
      owner_id: user.id,
      employee_id: employeeId,
      expires_at: expiresAt
    });

    if (inviteError) {
      showToast('No se pudo generar el código de invitación');
      return null;
    }

    showToast('Código de invitación generado');
    return code;
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

    if (user) {
      supabase.from('employee_loans').insert(loanToDb(newLoan, ownerId || user.id)).then(({ error }) => {
        if (error) syncError('préstamo/adelanto');
      });
    }

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
    let updatedLoan: EmployeeLoan | null = null;
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== employeeId) return emp;
        const updatedLoans = emp.loans.map((loan) => {
          if (loan.id !== loanId) return loan;
          const newRemaining = Math.max(0, loan.remainingAmount - amount);
          updatedLoan = {
            ...loan,
            remainingAmount: newRemaining,
            status: newRemaining <= 0 ? ('paid' as const) : ('active' as const)
          };
          return updatedLoan;
        });
        return { ...emp, loans: updatedLoans };
      })
    );

    if (user && updatedLoan) {
      supabase.from('employee_loans')
        .update({ remaining_amount: updatedLoan.remainingAmount, status: updatedLoan.status })
        .eq('id', loanId)
        .then(({ error }) => {
          if (error) syncError('abono de préstamo');
        });
    }

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
    customRate?: number,
    split?: { secondaryAccountId: string; secondaryAmountUSD: number }
  ): PayrollPayment | null => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return null;
    if (accounts.length === 0) {
      showToast('Agrega una cuenta antes de pagar la nómina');
      return null;
    }

    const rate = customRate || bcvRate;
    const isQuincenal = emp.paymentFrequency === 'quincenal';
    const baseUSD = isQuincenal ? emp.monthlySalary / 2 : emp.monthlySalary;

    // Calculate loan deduction: "si no pagan se va descontando de su salario"
    let totalDeductionUSD = 0;
    const changedLoans: EmployeeLoan[] = [];
    const updatedLoans = emp.loans.map((loan) => {
      if (loan.status !== 'active' || loan.remainingAmount <= 0) return loan;
      // Deduct up to deductionPerPayment or remaining amount
      const toDeduct = Math.min(loan.deductionPerPayment, loan.remainingAmount);
      if (toDeduct <= 0) return loan;
      totalDeductionUSD += toDeduct;
      const newRemaining = loan.remainingAmount - toDeduct;
      const updated: EmployeeLoan = {
        ...loan,
        remainingAmount: newRemaining,
        status: newRemaining <= 0 ? ('paid' as const) : ('active' as const)
      };
      changedLoans.push(updated);
      return updated;
    });

    // Net payable to employee
    const netUSD = Math.max(0, baseUSD - totalDeductionUSD);
    const netVES = netUSD * rate;

    // Update employee loans state
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, loans: updatedLoans } : e))
    );

    if (user) {
      changedLoans.forEach((loan) => {
        supabase.from('employee_loans')
          .update({ remaining_amount: loan.remainingAmount, status: loan.status })
          .eq('id', loan.id)
          .then(({ error }) => {
            if (error) syncError('descuento de préstamo');
          });
      });
    }

    const sourceAcc = accounts.find((a) => a.id === accountId) || accounts[0];
    const isSourceUSD = sourceAcc.currency === 'USD';

    // Mixed payment: part of the net paid from a second account (e.g. cash USD + Bs.)
    const secondaryAmountUSD = split ? Math.min(Math.max(split.secondaryAmountUSD, 0), netUSD) : 0;
    const primaryAmountUSD = netUSD - secondaryAmountUSD;
    const primaryChargeAmount = isSourceUSD ? primaryAmountUSD : primaryAmountUSD * rate;

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
      status: 'paid',
      secondaryAccountId: split ? split.secondaryAccountId : undefined,
      secondaryAmountUSD: split ? secondaryAmountUSD : undefined
    };

    setPayrollHistory((prev) => [paymentRecord, ...prev]);

    if (user) {
      supabase.from('payroll_history').insert(payrollToDb(paymentRecord, ownerId || user.id)).then(({ error }) => {
        if (error) syncError('historial de nómina');
      });
    }

    const mixedNote = split ? ' (pago mixto entre 2 cuentas)' : '';

    // Record the primary disbursement in the transactions ledger
    if (primaryAmountUSD > 0) {
      addTransaction({
        title: `Pago de Nómina: ${emp.name}`,
        category: 'Nómina',
        categoryEmoji: '👥',
        accountId: sourceAcc.id,
        accountName: sourceAcc.name,
        type: 'expense',
        currency: sourceAcc.currency,
        amount: -primaryChargeAmount,
        secondaryAmount: isSourceUSD ? -(primaryAmountUSD * rate) : -primaryAmountUSD,
        rate,
        icon: 'badge',
        note: `${period}. Base: $${baseUSD.toFixed(2)}${totalDeductionUSD > 0 ? ` (Descuento préstamo: -$${totalDeductionUSD.toFixed(2)})` : ''}. Neto: $${netUSD.toFixed(2)}${mixedNote}`
      });
    }

    // Record the second disbursement, if this was a mixed payment
    if (split && secondaryAmountUSD > 0) {
      const secondaryAcc = accounts.find((a) => a.id === split.secondaryAccountId);
      if (secondaryAcc) {
        const isSecondaryUSD = secondaryAcc.currency === 'USD';
        const secondaryChargeAmount = isSecondaryUSD ? secondaryAmountUSD : secondaryAmountUSD * rate;
        addTransaction({
          title: `Pago de Nómina: ${emp.name} (parte 2)`,
          category: 'Nómina',
          categoryEmoji: '👥',
          accountId: secondaryAcc.id,
          accountName: secondaryAcc.name,
          type: 'expense',
          currency: secondaryAcc.currency,
          amount: -secondaryChargeAmount,
          secondaryAmount: isSecondaryUSD ? -(secondaryAmountUSD * rate) : -secondaryAmountUSD,
          rate,
          icon: 'badge',
          note: `${period}. Segunda parte del pago mixto de nómina. Neto total: $${netUSD.toFixed(2)}`
        });
      }
    }

    showToast(`Nómina pagada a ${emp.name}: $${netUSD.toFixed(2)} (Desc: -$${totalDeductionUSD.toFixed(2)})`);
    return paymentRecord;
  };

  // Recurring Expenses Actions
  const payRecurringExpense = (expenseId: string, accountId?: string) => {
    const expense = recurringExpenses.find((e) => e.id === expenseId);
    if (!expense) return;
    if (accounts.length === 0) {
      showToast('Agrega una cuenta antes de pagar este gasto');
      return;
    }

    const targetAccountId = accountId || expense.accountId || accounts[0].id;
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

    const lastPaidDate = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });

    setRecurringExpenses((prev) =>
      prev.map((e) =>
        e.id === expenseId
          ? { ...e, isPaid: true, lastPaidDate }
          : e
      )
    );

    if (user) {
      supabase.from('recurring_expenses')
        .update({ is_paid: true, last_paid_date: lastPaidDate })
        .eq('id', expenseId)
        .then(({ error }) => {
          if (error) syncError('gasto recurrente');
        });
    }

    showToast(`Gasto "${expense.name}" pagado con éxito`);
  };

  const addRecurringExpense = (newExpenseData: Omit<RecurringExpense, 'id' | 'isPaid'>): RecurringExpense => {
    const newExp: RecurringExpense = {
      ...newExpenseData,
      id: `rec-${Date.now()}`,
      isPaid: false
    };
    setRecurringExpenses((prev) => [...prev, newExp]);

    if (user) {
      supabase.from('recurring_expenses').insert(recurringToDb(newExp, ownerId || user.id)).then(({ error }) => {
        if (error) syncError('gasto recurrente nuevo');
      });
    }

    showToast(`Gasto recurrente "${newExp.name}" añadido al presupuesto`);
    return newExp;
  };

  // Tasks
  const addTask = (taskData: { title: string; description?: string; priority: TaskPriority; assignedEmployeeId?: string; dueDate?: string }) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      status: 'pendiente',
      assignedEmployeeId: taskData.assignedEmployeeId,
      dueDate: taskData.dueDate
    };
    setTasks((prev) => [newTask, ...prev]);

    if (user) {
      supabase.from('tasks').insert(taskToDb(newTask, ownerId || user.id)).then(({ error }) => {
        if (error) syncError('tarea');
      });
    }

    showToast(`Tarea "${newTask.title}" creada`);
  };

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));

    supabase.from('tasks').update({ status }).eq('id', taskId).then(({ error }) => {
      if (error) syncError('estado de la tarea');
    });

    showToast(
      status === 'completada' ? 'Tarea marcada como completada' : status === 'en_progreso' ? 'Tarea en progreso' : 'Tarea pendiente'
    );
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
      createdAt: new Date().toISOString(),
      groupDate: 'HOY',
      reference: `#EX-${randomNum}`,
      sudebanCode: `SUDEBAN-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Operación Exitosa',
      icon: 'currency_exchange',
      note: `Tasa aplicada: 1 USD = Bs. ${rateUsed.toFixed(2)} ${customRate && customRate !== bcvRate ? '(Tasa Libre/Pactada)' : '(Oficial BCV)'}`,
      beneficiary: {
        name: toAcc.holder || 'Titular de la cuenta',
        branch: 'Mesa de Cambio',
        bank: toAcc.name,
        phone: toAcc.phone || ''
      }
    };

    // Update balances: deduct primaryAmount from fromAccountId, add secondaryAmount to toAccountId
    let fromUpdated: Account | null = null;
    let toUpdated: Account | null = null;
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fromAccountId) {
          fromUpdated = { ...acc, balance: Math.max(0, acc.balance - primaryAmount) };
          return fromUpdated;
        }
        if (acc.id === toAccountId) {
          toUpdated = { ...acc, balance: acc.balance + secondaryAmount };
          return toUpdated;
        }
        return acc;
      })
    );

    setTransactions((prev) => [exchangeTx, ...prev]);
    setSelectedTx(exchangeTx);

    if (user) {
      supabase.from('transactions').insert(transactionToDb(exchangeTx, ownerId || user.id)).then(({ error }) => {
        if (error) syncError('cambio de divisas');
      });
      if (fromUpdated) {
        supabase.from('accounts').update({ balance: fromUpdated.balance }).eq('id', fromAccountId).then(({ error }) => {
          if (error) syncError('saldo de cuenta origen');
        });
      }
      if (toUpdated) {
        supabase.from('accounts').update({ balance: toUpdated.balance }).eq('id', toAccountId).then(({ error }) => {
          if (error) syncError('saldo de cuenta destino');
        });
      }
    }

    return exchangeTx;
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        bcvRate,
        eurRate,
        rateUpdatedAt,
        hideBalances,
        setHideBalances,
        toggleHideBalances,
        dataLoading,
        accounts,
        transactions,
        addAccount,
        role,
        currentEmployee,
        joinError,
        employees,
        payrollHistory,
        addEmployee,
        requestLoan,
        repayLoan,
        processPayrollPayment,
        grantEmployeeAccess,
        tasks,
        addTask,
        updateTaskStatus,
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
        attachReceipt,
        getReceiptUrl,
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
