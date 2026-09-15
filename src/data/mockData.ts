import { Account, Transaction, SavingsGoal, Employee, PayrollPayment, RecurringExpense } from '../types';

export const INITIAL_RATE_BCV = 150.00;


export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'zinli-1',
    name: 'Zinli Card (Tarjeta Virtual)',
    type: 'usd_wallet',
    currency: 'USD',
    balance: 850.00,
    accountNumber: 'Visa •••• 4921',
    holder: 'Alejandro Morales',
    isDefault: true,
    statusText: 'Débito activa',
    icon: 'credit_card',
    color: '#0041c8',
  },
  {
    id: 'banesco-pm',
    name: 'Banesco (Pago Móvil)',
    type: 'ves_bank',
    currency: 'VES',
    balance: 34500.00,
    accountNumber: '0134 •••• 5612',
    bankCode: '0134',
    holder: 'Alejandro Morales',
    phone: '0414-1234567',
    ci: 'V-24.819.301',
    isDefault: true,
    statusText: 'VES corriente',
    icon: 'smartphone',
    color: '#006c49',
  },
  {
    id: 'cash-usd',
    name: 'Efectivo en Mano (USD)',
    type: 'cash_usd',
    currency: 'USD',
    balance: 380.00,
    statusText: 'Billetes limpios en cartera',
    icon: 'wallet',
    color: '#10b981',
  },
  {
    id: 'mercantil-1',
    name: 'Banco Mercantil',
    type: 'ves_bank',
    currency: 'VES',
    balance: 6500.00,
    accountNumber: '0105 •••• 9812',
    bankCode: '0105',
    holder: 'Alejandro Morales',
    phone: '0414-1234567',
    ci: 'V-24.819.301',
    statusText: 'Respaldo y Servicios',
    icon: 'account_balance',
    color: '#0055ff',
  },
  {
    id: 'wells-fargo',
    name: 'Wells Fargo / Zelle®',
    type: 'usd_wallet',
    currency: 'USD',
    balance: 380.00,
    holder: 'Alejandro Morales',
    phone: 'alejandro.fintech@gmail.com',
    statusText: 'Recepción Directa',
    icon: 'electric_bolt',
    color: '#0055ff',
  },
  {
    id: 'cash-ves',
    name: 'Menudeo Físico VES',
    type: 'cash_ves',
    currency: 'VES',
    balance: 1200.00,
    statusText: 'Transporte & menudeo',
    icon: 'payments',
    color: '#737688',
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    title: 'Supermercado Gama',
    category: 'Mercado',
    categoryEmoji: '🛒',
    accountId: 'zinli-1',
    accountName: 'Zinli Card',
    type: 'expense',
    currency: 'USD',
    amount: -42.30,
    secondaryAmount: -6345.00,
    rate: 150.00,
    date: 'Hoy, 11:20 am',
    groupDate: 'HOY',
    reference: '#TRX-9824102',
    sudebanCode: 'SUDEBAN-772910',
    status: 'Completado con éxito',
    icon: 'shopping_cart',
    note: 'Alimentos & Despensa semanal',
    beneficiary: {
      name: 'Supermercado Gama La Castellana',
      branch: 'Sucursal Gama',
      rif: 'J-31089241-0',
      bank: 'Banesco (0134)',
      phone: '0414-1234567'
    }
  },
  {
    id: 'tx-2',
    title: 'Cobro Freelance UI',
    category: 'Ingreso',
    categoryEmoji: '💼',
    accountId: 'zinli-1',
    accountName: 'Zinli Card',
    type: 'income',
    currency: 'USD',
    amount: 250.00,
    secondaryAmount: 37500.00,
    rate: 150.00,
    date: 'Hoy, 09:15 am',
    groupDate: 'HOY',
    reference: '#TRX-9823811',
    sudebanCode: 'SUDEBAN-992140',
    status: 'Acreditado',
    icon: 'payments',
    note: 'Honorarios proyecto FinTech internacional'
  },
  {
    id: 'tx-3',
    title: 'Cafecito & Ponqué',
    category: 'Café',
    categoryEmoji: '☕',
    accountId: 'cash-usd',
    accountName: 'Efectivo $',
    type: 'expense',
    currency: 'USD',
    amount: -4.00,
    secondaryAmount: -600.00,
    rate: 150.00,
    date: 'Hoy, 08:30 am',
    groupDate: 'HOY',
    reference: '#CASH-44102',
    status: 'Completado con éxito',
    icon: 'coffee',
    note: 'Salidas & Ocio en Las Mercedes'
  },
  {
    id: 'tx-4',
    title: 'Cambio de Divisas',
    category: 'Cambio',
    categoryEmoji: '🔄',
    accountId: 'banesco-pm',
    accountName: 'USD ➔ Pago Móvil Banesco',
    type: 'exchange',
    currency: 'VES',
    amount: 7500.00,
    secondaryAmount: -50.00,
    rate: 150.00,
    date: 'Ayer, 06:40 pm',
    groupDate: 'AYER',
    reference: '#PM-98421029',
    sudebanCode: 'SUDEBAN-772910',
    status: 'Operación Exitosa',
    icon: 'currency_exchange',
    note: 'Cambio de Divisas & Pago Móvil Inmediato',
    beneficiary: {
      name: 'Inversiones Ávila C.A.',
      branch: 'Sucursal Gama',
      rif: 'J-31089241-0',
      bank: 'Banesco (0134)',
      phone: '0414-1234567'
    }
  },
  {
    id: 'tx-5',
    title: 'Almuerzo Bistro La Castellana',
    category: 'Comida',
    categoryEmoji: '🍔',
    accountId: 'banesco-pm',
    accountName: 'Pago Móvil Banesco',
    type: 'expense',
    currency: 'VES',
    amount: -1875.00,
    secondaryAmount: -12.50,
    rate: 150.00,
    date: 'Ayer, 01:30 pm',
    groupDate: 'AYER',
    reference: '#PM-7729104',
    status: 'Completado con éxito',
    icon: 'restaurant',
    note: 'Hamburguesa & Bebida con clientes'
  },
  {
    id: 'tx-6',
    title: 'Pago Servicio Fibra NetUno',
    category: 'Servicios',
    categoryEmoji: '💡',
    accountId: 'banesco-pm',
    accountName: 'Pago Móvil',
    type: 'expense',
    currency: 'VES',
    amount: -4800.00,
    secondaryAmount: -32.00,
    rate: 150.00,
    date: 'Ayer, 10:00 am',
    groupDate: 'AYER',
    reference: '#NET-6619283',
    status: 'Factura cancelada',
    icon: 'wifi',
    note: 'Internet fibra óptica mensual'
  },
  {
    id: 'tx-7',
    title: 'Suscripción Netflix & Spotify',
    category: 'Recurrente',
    categoryEmoji: '🎬',
    accountId: 'zinli-1',
    accountName: 'Tarjeta Zinli',
    type: 'expense',
    currency: 'USD',
    amount: -17.99,
    secondaryAmount: -2698.50,
    rate: 150.00,
    date: '15 Nov, 06:00 am',
    groupDate: '15 NOV',
    reference: '#REC-118273',
    status: 'Débito automático',
    icon: 'subscriptions',
    note: 'Entretenimiento digital mensual'
  }
];

export const INITIAL_SAVINGS_GOAL: SavingsGoal = {
  id: 'goal-roques',
  title: 'Meta: Viaje a Los Roques',
  targetAmount: 800.00,
  currentAmount: 520.00,
  targetDate: 'Febrero 2025',
  percentage: 65,
  icon: 'flight_takeoff'
};

export const QUICK_CATEGORIES = [
  { id: 'comida', label: 'Comida', emoji: '🍔' },
  { id: 'mercado', label: 'Mercado', emoji: '🛒' },
  { id: 'transporte', label: 'Transporte', emoji: '🚗' },
  { id: 'farmacia', label: 'Farmacia', emoji: '💊' },
  { id: 'servicios', label: 'Servicios', emoji: '💡' },
  { id: 'cafecito', label: 'Cafecito', emoji: '☕' },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Carlos Mendoza',
    position: 'Cajero / Atención al Cliente',
    ci: 'V-26.192.481',
    phone: '0412-9812456',
    monthlySalary: 240.00,
    paymentFrequency: 'quincenal',
    paymentMethod: 'pago_movil',
    pagoMovilBank: '0102 - Banco de Venezuela',
    status: 'active',
    loans: [
      {
        id: 'loan-101',
        employeeId: 'emp-1',
        type: 'loan',
        description: 'Préstamo personal médico',
        totalAmount: 100.00,
        remainingAmount: 50.00,
        deductionPerPayment: 25.00,
        date: '01 Sep 2026',
        status: 'active'
      }
    ]
  },
  {
    id: 'emp-2',
    name: 'Mariana Silva',
    position: 'Encargada de Inventario & Ventas',
    ci: 'V-23.418.992',
    phone: '0414-3321908',
    monthlySalary: 300.00,
    paymentFrequency: 'quincenal',
    paymentMethod: 'pago_movil',
    pagoMovilBank: '0134 - Banesco',
    status: 'active',
    loans: [
      {
        id: 'loan-102',
        employeeId: 'emp-2',
        type: 'advance',
        description: 'Adelanto de quincena emergente',
        totalAmount: 40.00,
        remainingAmount: 40.00,
        deductionPerPayment: 40.00,
        date: '08 Sep 2026',
        status: 'active'
      }
    ]
  },
  {
    id: 'emp-3',
    name: 'Gabriel Rondón',
    position: 'Repartidor / Motorizado',
    ci: 'V-28.001.233',
    phone: '0424-5519821',
    monthlySalary: 200.00,
    paymentFrequency: 'quincenal',
    paymentMethod: 'cash_usd',
    status: 'active',
    loans: []
  },
  {
    id: 'emp-4',
    name: 'Yusleidy Pérez',
    position: 'Asistente Contable & Facturación',
    ci: 'V-21.890.114',
    phone: '0416-7789012',
    monthlySalary: 280.00,
    paymentFrequency: 'quincenal',
    paymentMethod: 'zinli',
    status: 'active',
    loans: [
      {
        id: 'loan-103',
        employeeId: 'emp-4',
        type: 'loan',
        description: 'Reparación de equipo portátil',
        totalAmount: 80.00,
        remainingAmount: 60.00,
        deductionPerPayment: 20.00,
        date: '28 Ago 2026',
        status: 'active'
      }
    ]
  }
];

export const INITIAL_PAYROLL_HISTORY: PayrollPayment[] = [
  {
    id: 'pay-2026-08-30-1',
    employeeId: 'emp-1',
    employeeName: 'Carlos Mendoza',
    period: '2da Quincena Agosto 2026',
    date: '30 Ago 2026',
    baseAmount: 120.00,
    deductedAmount: 25.00,
    netAmountUSD: 95.00,
    netAmountVES: 14250.00,
    rate: 150.00,
    paidFromAccountId: 'banesco-pm',
    reference: '#NOM-88190',
    status: 'paid'
  },
  {
    id: 'pay-2026-08-30-2',
    employeeId: 'emp-3',
    employeeName: 'Gabriel Rondón',
    period: '2da Quincena Agosto 2026',
    date: '30 Ago 2026',
    baseAmount: 100.00,
    deductedAmount: 0.00,
    netAmountUSD: 100.00,
    netAmountVES: 15000.00,
    rate: 150.00,
    paidFromAccountId: 'cash-usd',
    reference: '#NOM-88191',
    status: 'paid'
  }
];

export const INITIAL_RECURRING_EXPENSES: RecurringExpense[] = [
  {
    id: 'rec-1',
    name: 'Alquiler de Local Comercial',
    category: 'Alquiler',
    categoryEmoji: '🏢',
    amount: 350.00,
    currency: 'USD',
    frequency: 'mensual',
    dueDay: 5,
    isPaid: false,
    accountId: 'zinli-1'
  },
  {
    id: 'rec-2',
    name: 'Internet Fibra Óptica NetUno',
    category: 'Servicios',
    categoryEmoji: '🌐',
    amount: 5250.00,
    currency: 'VES',
    frequency: 'mensual',
    dueDay: 12,
    isPaid: true,
    lastPaidDate: '12 Sep 2026',
    accountId: 'banesco-pm'
  },
  {
    id: 'rec-3',
    name: 'Condominio Edificio Comercial',
    category: 'Mantenimiento',
    categoryEmoji: '🏬',
    amount: 45.00,
    currency: 'USD',
    frequency: 'mensual',
    dueDay: 15,
    isPaid: false,
    accountId: 'cash-usd'
  },
  {
    id: 'rec-4',
    name: 'Punto de Venta Bancamiga & Biopago',
    category: 'Plataformas',
    categoryEmoji: '💳',
    amount: 1800.00,
    currency: 'VES',
    frequency: 'mensual',
    dueDay: 20,
    isPaid: false,
    accountId: 'banesco-pm'
  },
  {
    id: 'rec-5',
    name: 'Electricidad Corpoelec & Agua',
    category: 'Servicios',
    categoryEmoji: '⚡',
    amount: 2400.00,
    currency: 'VES',
    frequency: 'mensual',
    dueDay: 25,
    isPaid: true,
    lastPaidDate: '10 Sep 2026',
    accountId: 'mercantil-1'
  },
  {
    id: 'rec-6',
    name: 'Seguro Médico & Póliza Personal',
    category: 'Seguros',
    categoryEmoji: '🛡️',
    amount: 65.00,
    currency: 'USD',
    frequency: 'mensual',
    dueDay: 28,
    isPaid: false,
    accountId: 'zinli-1'
  }
];

