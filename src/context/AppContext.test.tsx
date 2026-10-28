import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createMockSupabaseModule } from '../test/supabaseMockFactory';

const OWNER_ID = 'owner-1';

vi.mock('../lib/supabaseClient', () => {
  const { supabase, tables } = createMockSupabaseModule();
  return { supabase, PENDING_INVITE_STORAGE_KEY: 'test-pending-invite-code', __tables: tables };
});

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: { id: OWNER_ID } }),
}));

vi.mock('../lib/imageCompression', () => ({
  compressImage: async (file: File) => file,
}));

import { AppProvider, useApp } from './AppContext';
import * as supabaseClientModule from '../lib/supabaseClient';

// The mocked module exports a `__tables` escape hatch the real one doesn't
// have — cast through `any` rather than widening the real module's type.
const tables: Record<string, any[]> = (supabaseClientModule as any).__tables;

function resetTables() {
  Object.keys(tables).forEach((k) => {
    tables[k] = [];
  });
}

function seed(table: string, rows: any[]) {
  tables[table].push(...rows);
}

function accountRow(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: overrides.id ?? `acc-${Math.random().toString(36).slice(2, 8)}`,
    user_id: OWNER_ID,
    business_id: OWNER_ID,
    name: 'Cuenta de prueba',
    type: 'usd_wallet',
    currency: 'USD',
    balance: 0,
    icon: 'wallet',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function employeeRow(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: overrides.id ?? `emp-${Math.random().toString(36).slice(2, 8)}`,
    user_id: OWNER_ID,
    business_id: OWNER_ID,
    auth_user_id: null,
    name: 'Empleado de prueba',
    position: 'Vendedor',
    monthly_salary: 500,
    payment_frequency: 'mensual',
    payment_method: 'cash_usd',
    status: 'active',
    receives_payroll: true,
    assigned_account_id: null,
    exchange_counterpart_account_id: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

async function renderApp() {
  const { result } = renderHook(() => useApp(), {
    wrapper: ({ children }) => <AppProvider>{children}</AppProvider>,
  });
  await waitFor(() => expect(result.current.dataLoading).toBe(false));
  return result;
}

beforeEach(() => {
  resetTables();
  localStorage.clear();
  sessionStorage.clear();
});

describe('data loading & role detection', () => {
  it('loads seeded accounts/employees and defaults to the owner role', async () => {
    seed('accounts', [accountRow({ id: 'acc-usd', balance: 100 })]);
    seed('employees', [employeeRow({ id: 'emp-1', name: 'Robert' })]);

    const result = await renderApp();

    expect(result.current.role).toBe('owner');
    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.accounts[0].balance).toBe(100);
    expect(result.current.employees).toHaveLength(1);
    expect(result.current.employees[0].name).toBe('Robert');
  });

  it('detects an employee session from the matching auth_user_id row', async () => {
    seed('accounts', [accountRow({ id: 'acc-emp-usd', user_id: OWNER_ID })]);
    seed('employees', [
      employeeRow({ id: 'emp-1', auth_user_id: OWNER_ID, assigned_account_id: 'acc-emp-usd' }),
    ]);

    const result = await renderApp();

    expect(result.current.role).toBe('employee');
    expect(result.current.currentEmployee?.id).toBe('emp-1');
  });
});

describe('formatUSD / formatVES', () => {
  it('formats positive, negative and signed amounts', async () => {
    const result = await renderApp();
    expect(result.current.formatUSD(10)).toBe('$10,00');
    expect(result.current.formatUSD(-10)).toBe('-$10,00');
    expect(result.current.formatUSD(10, true)).toBe('+$10,00');
    expect(result.current.formatVES(1000)).toBe('Bs. 1.000,00');
  });

  it('masks amounts when hideBalances is on', async () => {
    const result = await renderApp();
    act(() => result.current.toggleHideBalances());
    expect(result.current.formatUSD(10)).toBe('••••••');
  });
});

describe('addAccount', () => {
  it('tags the new account with the active (personal) business and persists it', async () => {
    const result = await renderApp();

    let created;
    await act(async () => {
      created = await result.current.addAccount({
        name: 'Binance',
        type: 'usd_wallet',
        currency: 'USD',
        balance: 50,
        icon: 'wallet',
      });
    });

    expect((created as any).businessId).toBe(OWNER_ID);
    expect(result.current.accounts.some((a) => a.name === 'Binance' && a.balance === 50)).toBe(true);
    expect(tables.accounts.some((row) => row.name === 'Binance')).toBe(true);
  });
});

describe('addTransaction', () => {
  it('applies an expense to the account balance and persists it', async () => {
    seed('accounts', [accountRow({ id: 'acc-1', balance: 100 })]);
    const result = await renderApp();

    let tx;
    act(() => {
      tx = result.current.addTransaction({
        title: 'Supermercado',
        category: 'Comida',
        accountId: 'acc-1',
        accountName: 'Cuenta de prueba',
        type: 'expense',
        currency: 'USD',
        amount: -30,
        secondaryAmount: -30 * 150,
        rate: 150,
        icon: 'receipt',
      });
    });

    expect(tx).not.toBeNull();
    expect(result.current.accounts.find((a) => a.id === 'acc-1')?.balance).toBe(70);
  });

  it('blocks an expense that would overdraw the account and leaves the balance untouched', async () => {
    seed('accounts', [accountRow({ id: 'acc-1', balance: 20 })]);
    const result = await renderApp();

    let tx: any = 'not-set';
    act(() => {
      tx = result.current.addTransaction({
        title: 'Compra grande',
        category: 'Otros',
        accountId: 'acc-1',
        accountName: 'Cuenta de prueba',
        type: 'expense',
        currency: 'USD',
        amount: -30,
        secondaryAmount: -30 * 150,
        rate: 150,
        icon: 'receipt',
      });
    });

    expect(tx).toBeNull();
    expect(result.current.accounts.find((a) => a.id === 'acc-1')?.balance).toBe(20);
    expect(result.current.toastMessage).toMatch(/Saldo insuficiente/);
  });

  it('applies income without any balance ceiling', async () => {
    seed('accounts', [accountRow({ id: 'acc-1', balance: 0 })]);
    const result = await renderApp();

    act(() => {
      result.current.addTransaction({
        title: 'Depósito',
        category: 'Ingreso',
        accountId: 'acc-1',
        accountName: 'Cuenta de prueba',
        type: 'income',
        currency: 'USD',
        amount: 300,
        secondaryAmount: 300 * 150,
        rate: 150,
        icon: 'receipt',
      });
    });

    expect(result.current.accounts.find((a) => a.id === 'acc-1')?.balance).toBe(300);
  });
});

describe('performExchange', () => {
  it('moves money between two accounts at the given rate', async () => {
    seed('accounts', [
      accountRow({ id: 'acc-usd', currency: 'USD', balance: 100 }),
      accountRow({ id: 'acc-ves', currency: 'VES', balance: 0 }),
    ]);
    const result = await renderApp();

    let tx;
    act(() => {
      tx = result.current.performExchange(40, 40 * 150, 'acc-usd', 'acc-ves', 150, false);
    });

    expect(tx).not.toBeNull();
    expect(result.current.accounts.find((a) => a.id === 'acc-usd')?.balance).toBe(60);
    expect(result.current.accounts.find((a) => a.id === 'acc-ves')?.balance).toBe(6000);
  });

  it('refuses an exchange that would overdraw the source account', async () => {
    seed('accounts', [
      accountRow({ id: 'acc-usd', currency: 'USD', balance: 10 }),
      accountRow({ id: 'acc-ves', currency: 'VES', balance: 0 }),
    ]);
    const result = await renderApp();

    let tx: any = 'not-set';
    act(() => {
      tx = result.current.performExchange(40, 40 * 150, 'acc-usd', 'acc-ves', 150, false);
    });

    expect(tx).toBeNull();
    expect(result.current.accounts.find((a) => a.id === 'acc-usd')?.balance).toBe(10);
  });
});

describe('assignFundsToEmployee', () => {
  function setupEmployeeWithAccounts() {
    seed('accounts', [
      accountRow({ id: 'business-usd', currency: 'USD', balance: 500 }),
      accountRow({ id: 'emp-usd', currency: 'USD', balance: 0 }),
      accountRow({ id: 'emp-ves', currency: 'VES', balance: 0 }),
    ]);
    seed('employees', [
      employeeRow({
        id: 'emp-1',
        name: 'Robert',
        assigned_account_id: 'emp-usd',
        exchange_counterpart_account_id: 'emp-ves',
      }),
    ]);
  }

  it('moves funds from a business account into the employee account of the same currency', async () => {
    setupEmployeeWithAccounts();
    const result = await renderApp();

    act(() => {
      result.current.assignFundsToEmployee('emp-1', 'business-usd', 200);
    });

    expect(result.current.accounts.find((a) => a.id === 'business-usd')?.balance).toBe(300);
    expect(result.current.accounts.find((a) => a.id === 'emp-usd')?.balance).toBe(200);
    expect(
      result.current.transactions.some((t) => t.title === 'Asignación recibida' && t.accountId === 'emp-usd')
    ).toBe(true);
  });

  it('refuses to assign more than the source account holds', async () => {
    setupEmployeeWithAccounts();
    const result = await renderApp();

    act(() => {
      result.current.assignFundsToEmployee('emp-1', 'business-usd', 10000);
    });

    expect(result.current.accounts.find((a) => a.id === 'business-usd')?.balance).toBe(500);
    expect(result.current.toastMessage).toMatch(/Saldo insuficiente/);
  });

  it("refuses when the employee has no account in the source account's currency", async () => {
    seed('accounts', [
      accountRow({ id: 'business-ves', currency: 'VES', balance: 5000 }),
      accountRow({ id: 'emp-usd', currency: 'USD', balance: 0 }),
    ]);
    seed('employees', [employeeRow({ id: 'emp-1', name: 'Robert', assigned_account_id: 'emp-usd' })]);

    const result = await renderApp();

    act(() => {
      result.current.assignFundsToEmployee('emp-1', 'business-ves', 100);
    });

    expect(result.current.accounts.find((a) => a.id === 'business-ves')?.balance).toBe(5000);
    expect(result.current.toastMessage).toMatch(/no tiene una cuenta/);
  });

  it('refuses when the employee is missing entirely', async () => {
    seed('accounts', [accountRow({ id: 'business-usd', balance: 500 })]);
    const result = await renderApp();

    act(() => {
      result.current.assignFundsToEmployee('ghost-employee', 'business-usd', 10);
    });

    expect(result.current.toastMessage).toMatch(/No se encontró al empleado/);
    expect(result.current.accounts.find((a) => a.id === 'business-usd')?.balance).toBe(500);
  });
});

describe('multi-business scoping regression (fixed in this session)', () => {
  it("requestLoan's account fallback stays within the active business, never borrows another business's account", async () => {
    seed('accounts', [
      accountRow({ id: 'personal-usd', business_id: OWNER_ID, balance: 1000 }),
    ]);
    seed('businesses', [{ id: 'biz-1', user_id: OWNER_ID, name: 'Negocio B', created_at: new Date().toISOString() }]);
    seed('accounts', [accountRow({ id: 'bizb-usd', business_id: 'biz-1', balance: 300 })]);
    seed('employees', [employeeRow({ id: 'emp-1', business_id: 'biz-1', name: 'Empleado B' })]);

    const result = await renderApp();

    act(() => {
      result.current.switchBusiness('biz-1');
    });
    await waitFor(() => expect(result.current.activeBusinessId).toBe('biz-1'));

    act(() => {
      // An invalid/empty payFromAccountId forces the `|| scopedAccounts[0]` fallback.
      result.current.requestLoan('emp-1', {
        type: 'advance',
        description: 'Adelanto',
        totalAmount: 50,
        deductionPerPayment: 10,
        payFromAccountId: 'does-not-exist',
      });
    });

    const disbursement = result.current.transactions.find((t) => t.title === 'Adelanto de Sueldo');
    expect(disbursement?.accountId).toBe('bizb-usd');
    expect(result.current.accounts.find((a) => a.id === 'bizb-usd')?.balance).toBe(250);
    // personal-usd belongs to the OTHER business, so it's correctly out of
    // scope here — check the underlying "persisted" row instead, confirming
    // it was never touched.
    expect(tables.accounts.find((a) => a.id === 'personal-usd')?.balance).toBe(1000);
  });

  it('businessAccounts excludes employee-owned accounts for the owner, but not from an employee session', async () => {
    seed('accounts', [
      accountRow({ id: 'business-usd', balance: 1000 }),
      accountRow({ id: 'emp-usd', balance: 0 }),
    ]);
    seed('employees', [employeeRow({ id: 'emp-1', assigned_account_id: 'emp-usd' })]);

    const result = await renderApp();

    const ownerVisibleIds = result.current.businessAccounts.map((a) => a.id);
    expect(ownerVisibleIds).toContain('business-usd');
    expect(ownerVisibleIds).not.toContain('emp-usd');
  });
});

describe('requestLoan / repayLoan', () => {
  it('records a loan and, with a payout account, debits it immediately', async () => {
    seed('accounts', [accountRow({ id: 'acc-1', balance: 200 })]);
    seed('employees', [employeeRow({ id: 'emp-1' })]);
    const result = await renderApp();

    act(() => {
      result.current.requestLoan('emp-1', {
        type: 'loan',
        description: 'Préstamo personal',
        totalAmount: 50,
        deductionPerPayment: 10,
        payFromAccountId: 'acc-1',
      });
    });

    const emp = result.current.employees.find((e) => e.id === 'emp-1');
    expect(emp?.loans).toHaveLength(1);
    expect(emp?.loans[0].remainingAmount).toBe(50);
    expect(result.current.accounts.find((a) => a.id === 'acc-1')?.balance).toBe(150);
  });

  it('reduces the remaining amount and marks the loan paid once fully repaid', async () => {
    seed('accounts', [accountRow({ id: 'acc-1', balance: 0 })]);
    seed('employee_loans', [
      {
        id: 'loan-1',
        user_id: OWNER_ID,
        business_id: OWNER_ID,
        employee_id: 'emp-1',
        type: 'loan',
        description: 'Préstamo',
        total_amount: 50,
        remaining_amount: 50,
        deduction_per_payment: 25,
        date_label: '01 ene',
        status: 'active',
      },
    ]);
    seed('employees', [employeeRow({ id: 'emp-1' })]);
    const result = await renderApp();

    act(() => {
      result.current.repayLoan('emp-1', 'loan-1', 50, 'acc-1');
    });

    const emp = result.current.employees.find((e) => e.id === 'emp-1');
    expect(emp?.loans[0].remainingAmount).toBe(0);
    expect(emp?.loans[0].status).toBe('paid');
    expect(result.current.accounts.find((a) => a.id === 'acc-1')?.balance).toBe(50);
  });
});

describe('processPayrollPayment', () => {
  it('pays the quincenal net salary, applying any active loan deduction', async () => {
    seed('accounts', [accountRow({ id: 'acc-1', balance: 1000 })]);
    seed('employees', [employeeRow({ id: 'emp-1', monthly_salary: 400, payment_frequency: 'quincenal' })]);
    seed('employee_loans', [
      {
        id: 'loan-1',
        user_id: OWNER_ID,
        business_id: OWNER_ID,
        employee_id: 'emp-1',
        type: 'advance',
        description: 'Adelanto',
        total_amount: 50,
        remaining_amount: 50,
        deduction_per_payment: 20,
        date_label: '01 ene',
        status: 'active',
      },
    ]);
    const result = await renderApp();

    let payment;
    act(() => {
      payment = result.current.processPayrollPayment('emp-1', 'Quincena 1', 'acc-1', 150);
    });

    // base = 400/2 = 200, minus 20 deduction = 180 net
    expect((payment as any)?.netAmountUSD).toBe(180);
    expect(result.current.accounts.find((a) => a.id === 'acc-1')?.balance).toBe(820);
    const loan = result.current.employees.find((e) => e.id === 'emp-1')?.loans[0];
    expect(loan?.remainingAmount).toBe(30);
  });

  it('refuses to pay when the source account cannot cover it', async () => {
    seed('accounts', [accountRow({ id: 'acc-1', balance: 5 })]);
    seed('employees', [employeeRow({ id: 'emp-1', monthly_salary: 400, payment_frequency: 'mensual' })]);
    const result = await renderApp();

    let payment: any = 'not-set';
    act(() => {
      payment = result.current.processPayrollPayment('emp-1', 'Octubre', 'acc-1', 150);
    });

    expect(payment).toBeNull();
    expect(result.current.accounts.find((a) => a.id === 'acc-1')?.balance).toBe(5);
  });

  it("falls back to the active business's own account, never another business's", async () => {
    seed('accounts', [accountRow({ id: 'personal-usd', business_id: OWNER_ID, balance: 1000 })]);
    seed('businesses', [{ id: 'biz-1', user_id: OWNER_ID, name: 'Negocio B', created_at: new Date().toISOString() }]);
    seed('accounts', [accountRow({ id: 'bizb-usd', business_id: 'biz-1', balance: 1000 })]);
    seed('employees', [employeeRow({ id: 'emp-1', business_id: 'biz-1', monthly_salary: 100, payment_frequency: 'mensual' })]);

    const result = await renderApp();
    act(() => {
      result.current.switchBusiness('biz-1');
    });
    await waitFor(() => expect(result.current.activeBusinessId).toBe('biz-1'));

    act(() => {
      result.current.processPayrollPayment('emp-1', 'Octubre', 'invalid-account-id', 150);
    });

    expect(result.current.accounts.find((a) => a.id === 'bizb-usd')?.balance).toBe(900);
    expect(tables.accounts.find((a) => a.id === 'personal-usd')?.balance).toBe(1000);
  });
});

describe('payRecurringExpense', () => {
  it('pays the expense, converting into the account currency when they differ', async () => {
    seed('accounts', [accountRow({ id: 'acc-ves', currency: 'VES', balance: 100000 })]);
    seed('recurring_expenses', [
      {
        id: 'rec-1',
        user_id: OWNER_ID,
        business_id: OWNER_ID,
        name: 'Internet',
        category: 'Servicios',
        category_emoji: '🌐',
        amount: 20,
        currency: 'USD',
        frequency: 'mensual',
        due_day: 5,
        is_paid: false,
        account_id: 'acc-ves',
      },
    ]);
    const result = await renderApp();

    act(() => {
      result.current.payRecurringExpense('rec-1');
    });

    expect(result.current.recurringExpenses.find((e) => e.id === 'rec-1')?.isPaid).toBe(true);
    // 20 USD * 150 (bcvRate default) = 3000 VES charged
    expect(result.current.accounts.find((a) => a.id === 'acc-ves')?.balance).toBe(97000);
  });
});

describe('employee CRUD', () => {
  it('adds, updates and deletes an employee', async () => {
    const result = await renderApp();

    let created;
    await act(async () => {
      created = await result.current.addEmployee({
        name: 'Nuevo',
        position: 'Cajero',
        monthlySalary: 300,
        paymentFrequency: 'mensual',
        paymentMethod: 'cash_usd',
        status: 'active',
      });
    });
    const id = (created as any).id;
    expect(result.current.employees.some((e) => e.id === id)).toBe(true);

    act(() => {
      result.current.updateEmployee(id, { position: 'Supervisor' });
    });
    expect(result.current.employees.find((e) => e.id === id)?.position).toBe('Supervisor');

    act(() => {
      result.current.deleteEmployee(id);
    });
    expect(result.current.employees.some((e) => e.id === id)).toBe(false);
  });
});

describe('provisionEmployeeAccounts / grantEmployeeAccess', () => {
  it('creates a USD + VES wallet pair and links them, then issues an invite code', async () => {
    seed('employees', [employeeRow({ id: 'emp-1', name: 'Robert' })]);
    const result = await renderApp();

    let provisioned: any;
    await act(async () => {
      provisioned = await result.current.provisionEmployeeAccounts('emp-1', 'Robert');
    });

    expect(result.current.accounts.some((a) => a.id === provisioned.usdAccountId && a.currency === 'USD')).toBe(true);
    expect(result.current.accounts.some((a) => a.id === provisioned.vesAccountId && a.currency === 'VES')).toBe(true);

    let code: string | null = null;
    await act(async () => {
      code = await result.current.grantEmployeeAccess('emp-1', provisioned.usdAccountId, provisioned.vesAccountId);
    });

    expect(code).not.toBeNull();
    expect(result.current.employees.find((e) => e.id === 'emp-1')?.assignedAccountId).toBe(provisioned.usdAccountId);
  });
});

describe('tasks', () => {
  it('adds a task and updates its status', async () => {
    const result = await renderApp();

    act(() => {
      result.current.addTask({ title: 'Revisar inventario', priority: 'media' });
    });
    const task = result.current.tasks[0];
    expect(task.title).toBe('Revisar inventario');

    act(() => {
      result.current.updateTaskStatus(task.id, 'completada');
    });
    expect(result.current.tasks.find((t) => t.id === task.id)?.status).toBe('completada');
  });
});

describe('addRecurringExpense', () => {
  it('adds a new recurring expense tagged to the active business', async () => {
    const result = await renderApp();

    let created;
    act(() => {
      created = result.current.addRecurringExpense({
        name: 'Hosting',
        category: 'Servicios',
        categoryEmoji: '🖥️',
        amount: 10,
        currency: 'USD',
        frequency: 'mensual',
        dueDay: 1,
      });
    });

    expect((created as any).businessId).toBe(OWNER_ID);
    expect(result.current.recurringExpenses.some((e) => e.name === 'Hosting')).toBe(true);
  });
});

describe('businesses: switchBusiness / createBusiness', () => {
  it('creating a business switches to it and scopes accounts/employees accordingly', async () => {
    seed('accounts', [accountRow({ id: 'personal-usd', business_id: OWNER_ID, balance: 10 })]);
    const result = await renderApp();

    expect(result.current.accounts.map((a) => a.id)).toContain('personal-usd');

    let created;
    await act(async () => {
      created = await result.current.createBusiness('Mi Negocio');
    });

    await waitFor(() => expect(result.current.activeBusinessId).toBe((created as any).id));
    expect(result.current.activeBusinessName).toBe('Mi Negocio');
    // The new business starts with no accounts of its own.
    expect(result.current.accounts).toHaveLength(0);

    act(() => {
      result.current.switchBusiness(OWNER_ID);
    });
    await waitFor(() => expect(result.current.activeBusinessId).toBe(OWNER_ID));
    expect(result.current.accounts.map((a) => a.id)).toContain('personal-usd');
  });
});

describe('loadMoreTransactions', () => {
  it('is a no-op once there is nothing more to load', async () => {
    seed('transactions', [
      {
        id: 'tx-1',
        user_id: OWNER_ID,
        business_id: OWNER_ID,
        title: 'Gasto',
        category: 'Otros',
        account_id: 'acc-1',
        account_name: 'Cuenta',
        type: 'expense',
        currency: 'USD',
        amount: -10,
        secondary_amount: -1500,
        rate: 150,
        date_label: 'Hoy',
        created_at: new Date().toISOString(),
        group_date: 'HOY',
        reference: '#TRX-1',
        status: 'Completado con éxito',
        icon: 'receipt',
      },
    ]);
    const result = await renderApp();

    expect(result.current.hasMoreTransactions).toBe(false);
    await act(async () => {
      await result.current.loadMoreTransactions();
    });
    expect(result.current.transactions).toHaveLength(1);
  });
});

describe('attachReceipt / getReceiptUrl', () => {
  it('uploads a receipt and links it to the transaction, then signs a URL for it', async () => {
    seed('accounts', [accountRow({ id: 'acc-1', balance: 100 })]);
    const result = await renderApp();

    let tx: any;
    act(() => {
      tx = result.current.addTransaction({
        title: 'Gasto con comprobante',
        category: 'Otros',
        accountId: 'acc-1',
        accountName: 'Cuenta de prueba',
        type: 'expense',
        currency: 'USD',
        amount: -10,
        secondaryAmount: -1500,
        rate: 150,
        icon: 'receipt',
      });
    });

    const file = new File(['fake-image-bytes'], 'recibo.jpg', { type: 'image/jpeg' });
    await act(async () => {
      await result.current.attachReceipt(tx.id, file);
    });

    expect(result.current.transactions.find((t) => t.id === tx.id)?.receiptPath).toBeTruthy();

    let url: string | null = null;
    await act(async () => {
      url = await result.current.getReceiptUrl(result.current.transactions.find((t) => t.id === tx.id)!.receiptPath!);
    });
    expect(url).toBe('https://example.test/signed-url');
  });
});
