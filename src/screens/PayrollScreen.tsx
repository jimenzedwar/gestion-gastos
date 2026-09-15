import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Employee, EmployeeLoan } from '../types';
import { 
  Users, 
  Plus, 
  HandCoins, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownRight, 
  DollarSign, 
  Receipt, 
  Clock, 
  Search, 
  X,
  Building2,
  Percent,
  FileText,
  BadgeAlert
} from 'lucide-react';

export const PayrollScreen: React.FC = () => {
  const { 
    employees, 
    payrollHistory, 
    accounts, 
    bcvRate, 
    addEmployee, 
    requestLoan, 
    repayLoan, 
    processPayrollPayment,
    showToast,
    formatUSD,
    formatVES
  } = useApp();

  const [activeTab, setActiveTab] = useState<'employees' | 'loans' | 'history'>('employees');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [newEmployeeModal, setNewEmployeeModal] = useState(false);
  const [newLoanModal, setNewLoanModal] = useState(false);
  const [repayModal, setRepayModal] = useState<{ employeeId: string; loanId: string; maxAmount: number; employeeName: string } | null>(null);
  const [processPayModal, setProcessPayModal] = useState<Employee | null>(null);

  // Form states: New Employee
  const [empName, setEmpName] = useState('');
  const [empPosition, setEmpPosition] = useState('');
  const [empCI, setEmpCI] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empSalary, setEmpSalary] = useState<number>(250);
  const [empFreq, setEmpFreq] = useState<'quincenal' | 'mensual'>('quincenal');
  const [empMethod, setEmpMethod] = useState<'pago_movil' | 'cash_usd' | 'zinli'>('pago_movil');
  const [empBank, setEmpBank] = useState('0134 - Banesco');

  // Form states: New Loan/Advance
  const [loanEmpId, setLoanEmpId] = useState<string>(employees[0]?.id || '');
  const [loanType, setLoanType] = useState<'advance' | 'loan'>('advance');
  const [loanAmount, setLoanAmount] = useState<number>(50);
  const [loanDeduction, setLoanDeduction] = useState<number>(25);
  const [loanDesc, setLoanDesc] = useState('');
  const [loanSourceAccount, setLoanSourceAccount] = useState<string>(accounts[0]?.id || '');

  // Form states: Repay Loan
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayDestAccount, setRepayDestAccount] = useState<string>(accounts[0]?.id || '');

  // Form states: Process Payroll
  const [payrollPeriod, setPayrollPeriod] = useState<string>('1ra Quincena Septiembre 2026');
  const [payrollAccountId, setPayrollAccountId] = useState<string>(accounts[1]?.id || accounts[0]?.id || '');
  const [payrollRate, setPayrollRate] = useState<number>(bcvRate);
  const [isCustomRate, setIsCustomRate] = useState<boolean>(false);

  // Summary KPIs
  const totalEmployees = employees.length;
  const totalMonthlyPayroll = employees.reduce((acc, e) => acc + e.monthlySalary, 0);
  const activeLoans = employees.flatMap((e) => e.loans.filter((l) => l.status === 'active'));
  const totalOutstandingLoans = activeLoans.reduce((acc, l) => acc + l.remainingAmount, 0);

  // Filtered employees
  const filteredEmployees = employees.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.position.toLowerCase().includes(q) || e.ci.includes(q);
  });

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empCI.trim()) {
      showToast('Por favor completa el nombre y cédula del empleado');
      return;
    }
    addEmployee({
      name: empName.trim(),
      position: empPosition.trim() || 'Colaborador General',
      ci: empCI.trim(),
      phone: empPhone.trim() || '0414-0000000',
      monthlySalary: empSalary || 200,
      paymentFrequency: empFreq,
      paymentMethod: empMethod,
      pagoMovilBank: empMethod === 'pago_movil' ? empBank : undefined,
      status: 'active'
    });
    setNewEmployeeModal(false);
    setEmpName('');
    setEmpPosition('');
    setEmpCI('');
    setEmpPhone('');
  };

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanEmpId) {
      showToast('Selecciona un empleado');
      return;
    }
    if (loanAmount <= 0) {
      showToast('El monto debe ser mayor a 0');
      return;
    }
    requestLoan(loanEmpId, {
      type: loanType,
      description: loanDesc || (loanType === 'advance' ? 'Adelanto de sueldo quincenal' : 'Préstamo personal'),
      totalAmount: loanAmount,
      deductionPerPayment: loanDeduction || loanAmount,
      payFromAccountId: loanSourceAccount
    });
    setNewLoanModal(false);
    setLoanDesc('');
  };

  const handleConfirmRepay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayModal) return;
    if (repayAmount <= 0 || repayAmount > repayModal.maxAmount) {
      showToast(`Monto inválido. Máximo a abonar: $${repayModal.maxAmount}`);
      return;
    }
    repayLoan(repayModal.employeeId, repayModal.loanId, repayAmount, repayDestAccount);
    setRepayModal(null);
  };

  const handleExecutePayroll = () => {
    if (!processPayModal) return;
    processPayrollPayment(
      processPayModal.id,
      payrollPeriod,
      payrollAccountId,
      isCustomRate ? payrollRate : bcvRate
    );
    setProcessPayModal(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-2xl md:text-3xl text-[#131b2e] tracking-tight">
              Nómina & Adelantos
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#6cf8bb]/40 text-[#00714d] font-bold">
              Descuento Automático
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#434656] mt-0.5">
            Gestión de salarios, préstamos personales y adelantos con deducción quincenal directa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setNewLoanModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-[#0041c8] border border-[#eaedff] rounded-xl text-xs font-bold shadow-xs hover:bg-[#eaedff] transition-all"
          >
            <HandCoins className="w-4 h-4 text-[#0041c8]" />
            <span>Nuevo Préstamo / Adelanto</span>
          </button>

          <button
            onClick={() => setNewEmployeeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0041c8] text-white rounded-xl text-xs font-display font-bold shadow-md hover:bg-[#0036a8] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Empleado</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#737688] font-semibold mb-1">
            <span>Plantilla Activa</span>
            <Users className="w-4 h-4 text-[#0041c8]" />
          </div>
          <div className="font-display text-2xl font-bold text-[#131b2e]">{totalEmployees} colaboradores</div>
          <div className="text-[11px] text-[#737688] font-medium mt-0.5">
            Nómina total: ${totalMonthlyPayroll.toFixed(2)}/mes
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#737688] font-semibold mb-1">
            <span>Préstamos & Adelantos por Cobrar</span>
            <HandCoins className="w-4 h-4 text-[#f59e0b]" />
          </div>
          <div className="font-display text-2xl font-bold text-[#b45309]">
            ${totalOutstandingLoans.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#737688] font-medium mt-0.5">
            {activeLoans.length} préstamos activos · Se descuentan en nómina
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#737688] font-semibold mb-1">
            <span>Tasa BCV de Conversión</span>
            <DollarSign className="w-4 h-4 text-[#006c49]" />
          </div>
          <div className="font-display text-2xl font-bold text-[#006c49]">
            Bs. {bcvRate.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#006c49] font-medium mt-0.5">
            Permite pago mixto o en Pago Móvil
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#eaedff] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'employees'
              ? 'bg-[#0041c8] text-white shadow-xs'
              : 'bg-white text-[#434656] hover:bg-[#f2f3ff] border border-[#eaedff]'
          }`}
        >
          Empleados ({employees.length})
        </button>

        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'loans'
              ? 'bg-[#0041c8] text-white shadow-xs'
              : 'bg-white text-[#434656] hover:bg-[#f2f3ff] border border-[#eaedff]'
          }`}
        >
          <span>Préstamos & Adelantos</span>
          {activeLoans.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#f59e0b] text-white text-[10px] font-extrabold">
              {activeLoans.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'history'
              ? 'bg-[#0041c8] text-white shadow-xs'
              : 'bg-white text-[#434656] hover:bg-[#f2f3ff] border border-[#eaedff]'
          }`}
        >
          Historial de Nóminas ({payrollHistory.length})
        </button>
      </div>

      {/* Tab Content: Employees */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Search box */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#737688] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, cargo o cédula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-xs sm:text-sm font-medium border border-[#eaedff] outline-none focus:border-[#0041c8]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEmployees.map((emp) => {
              const activeEmpLoans = emp.loans.filter((l) => l.status === 'active');
              const totalDebt = activeEmpLoans.reduce((sum, l) => sum + l.remainingAmount, 0);
              const isQuincenal = emp.paymentFrequency === 'quincenal';
              const basePeriod = isQuincenal ? emp.monthlySalary / 2 : emp.monthlySalary;
              const periodDeduction = activeEmpLoans.reduce((sum, l) => sum + Math.min(l.deductionPerPayment, l.remainingAmount), 0);
              const netToReceive = Math.max(0, basePeriod - periodDeduction);

              return (
                <div 
                  key={emp.id} 
                  className="bg-white rounded-2xl border border-[#eaedff] p-5 shadow-[0_2px_12px_rgba(19,27,46,0.03)] flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display font-bold text-base text-[#131b2e]">
                          {emp.name}
                        </h3>
                        <p className="text-xs text-[#0041c8] font-semibold">{emp.position}</p>
                        <p className="text-[11px] text-[#737688] font-mono mt-0.5">
                          C.I. {emp.ci} · {emp.phone}
                        </p>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full bg-[#f2f3ff] text-[#131b2e] text-[11px] font-bold border border-[#eaedff]">
                        {emp.paymentFrequency === 'quincenal' ? 'Quincenal' : 'Mensual'}
                      </span>
                    </div>

                    {/* Salary & Debt Row */}
                    <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-[#faf8ff] rounded-xl border border-[#eaedff] text-xs">
                      <div>
                        <span className="text-[#737688] block text-[11px]">Sueldo Base:</span>
                        <strong className="font-display text-sm text-[#131b2e]">
                          ${emp.monthlySalary.toFixed(2)}/mes
                        </strong>
                        <span className="text-[10px] text-[#737688] block">(${basePeriod.toFixed(2)} por pago)</span>
                      </div>

                      <div>
                        <span className="text-[#737688] block text-[11px]">Deuda / Adelantos:</span>
                        {totalDebt > 0 ? (
                          <>
                            <strong className="font-display text-sm text-[#b45309]">
                              ${totalDebt.toFixed(2)} por cobrar
                            </strong>
                            <span className="text-[10px] text-[#dc2626] block font-semibold">
                              Desc. próximo: -${periodDeduction.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-[#006c49] font-bold text-xs">Sin deudas al día</span>
                        )}
                      </div>
                    </div>

                    {/* Net preview notice */}
                    {totalDebt > 0 && (
                      <div className="mt-2.5 p-2 bg-[#fffbeb] rounded-lg border border-[#fef3c7] flex items-center gap-2 text-[11px] text-[#92400e]">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#f59e0b]" />
                        <span>
                          Si no abona antes del corte, cobrará neto: <strong>${netToReceive.toFixed(2)}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-[#eaedff] flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setLoanEmpId(emp.id);
                        setNewLoanModal(true);
                      }}
                      className="px-3 py-1.5 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#0041c8] rounded-xl text-xs font-bold transition-colors"
                    >
                      + Adelanto/Préstamo
                    </button>

                    <button
                      onClick={() => setProcessPayModal(emp)}
                      className="px-4 py-2 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl text-xs font-display font-bold shadow-xs transition-colors"
                    >
                      Pagar Nómina
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Content: Loans and Advances */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_12px_rgba(19,27,46,0.03)] overflow-hidden">
            <div className="p-4 border-b border-[#eaedff] bg-[#faf8ff] flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-[#131b2e]">
                  Libro de Préstamos y Adelantos Concedidos
                </h3>
                <p className="text-xs text-[#737688]">
                  Los saldos pendientes se deducen automáticamente en cada proceso de pago de nómina
                </p>
              </div>
            </div>

            {activeLoans.length === 0 ? (
              <div className="p-10 text-center text-[#737688] text-xs">
                No hay préstamos ni adelantos activos en este momento.
              </div>
            ) : (
              <div className="divide-y divide-[#eaedff]">
                {employees.flatMap((emp) =>
                  emp.loans.map((loan) => {
                    const isAdvance = loan.type === 'advance';
                    return (
                      <div 
                        key={loan.id} 
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#faf8ff] transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isAdvance ? 'bg-[#dce1ff] text-[#0041c8]' : 'bg-[#fef3c7] text-[#b45309]'
                          }`}>
                            {isAdvance ? '⚡' : '🤝'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold text-sm text-[#131b2e]">
                                {emp.name}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isAdvance ? 'bg-[#eaedff] text-[#0041c8]' : 'bg-[#fffbeb] text-[#b45309]'
                              }`}>
                                {isAdvance ? 'Adelanto Quincenal' : 'Préstamo Personal'}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                loan.status === 'active' ? 'bg-[#6cf8bb]/40 text-[#00714d]' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {loan.status === 'active' ? 'Activo' : 'Liquidado'}
                              </span>
                            </div>
                            <p className="text-xs text-[#434656] mt-0.5 font-medium">{loan.description}</p>
                            <p className="text-[11px] text-[#737688] mt-0.5">
                              Otorgado: {loan.date} · Cuota por nómina: <strong>${loan.deductionPerPayment.toFixed(2)}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-left sm:text-right">
                            <div className="text-xs text-[#737688]">Resta por pagar</div>
                            <div className="font-display text-base font-extrabold text-[#b45309]">
                              ${loan.remainingAmount.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-[#737688]">de ${loan.totalAmount.toFixed(2)}</div>
                          </div>

                          {loan.status === 'active' && (
                            <button
                              onClick={() => {
                                setRepayModal({
                                  employeeId: emp.id,
                                  loanId: loan.id,
                                  maxAmount: loan.remainingAmount,
                                  employeeName: emp.name
                                });
                                setRepayAmount(loan.remainingAmount);
                              }}
                              className="px-3 py-1.5 bg-[#006c49] hover:bg-[#005237] text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
                            >
                              Abonar / Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_12px_rgba(19,27,46,0.03)] overflow-hidden">
          <div className="p-4 border-b border-[#eaedff] bg-[#faf8ff]">
            <h3 className="font-display font-bold text-sm text-[#131b2e]">
              Recibos de Nómina Emitidos
            </h3>
            <p className="text-xs text-[#737688]">
              Comprobantes de pago con desglose de sueldo base, retención de préstamos y neto liquidado
            </p>
          </div>

          <div className="divide-y divide-[#eaedff]">
            {payrollHistory.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#faf8ff]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm text-[#131b2e]">
                      {item.employeeName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6cf8bb]/40 text-[#00714d] font-bold">
                      Pagado
                    </span>
                  </div>
                  <div className="text-xs text-[#737688] mt-0.5">
                    <span>{item.period}</span> · <span>{item.date}</span> · <span className="font-mono">{item.reference}</span>
                  </div>
                  {item.deductedAmount > 0 && (
                    <div className="text-xs text-[#dc2626] font-semibold mt-1">
                      Descuento por préstamo: -${item.deductedAmount.toFixed(2)}
                    </div>
                  )}
                </div>

                <div className="text-left sm:text-right">
                  <div className="font-display text-base font-bold text-[#131b2e]">
                    ${item.netAmountUSD.toFixed(2)} USD
                  </div>
                  <div className="text-xs text-[#006c49] font-semibold">
                    ≈ Bs. {item.netAmountVES.toLocaleString('es-VE')} (Tasa: {item.rate})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Employee */}
      {newEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-[#eaedff] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <h3 className="font-display font-bold text-lg text-[#131b2e]">Registrar Nuevo Empleado</h3>
              <button onClick={() => setNewEmployeeModal(false)} className="p-1 rounded-full hover:bg-[#f2f3ff]">
                <X className="w-5 h-5 text-[#737688]" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Andrés Eloy Blanco"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-medium outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Cargo / Función</label>
                  <input
                    type="text"
                    placeholder="Ej. Cajero, Encargado, Chofer"
                    value={empPosition}
                    onChange={(e) => setEmpPosition(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-medium outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Cédula de Identidad</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. V-25.123.456"
                    value={empCI}
                    onChange={(e) => setEmpCI(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-medium outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Teléfono Pago Móvil</label>
                  <input
                    type="text"
                    placeholder="Ej. 0414-9876543"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-medium outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Sueldo Base Mensual (USD)</label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={empSalary}
                    onChange={(e) => setEmpSalary(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-bold outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Frecuencia de Pago</label>
                  <select
                    value={empFreq}
                    onChange={(e) => setEmpFreq(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-semibold outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                  >
                    <option value="quincenal">Quincenal (cada 15 días)</option>
                    <option value="mensual">Mensual (fin de mes)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Medio de Pago Habitual</label>
                  <select
                    value={empMethod}
                    onChange={(e) => setEmpMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-semibold outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                  >
                    <option value="pago_movil">Pago Móvil (VES)</option>
                    <option value="cash_usd">Efectivo (USD en mano)</option>
                    <option value="zinli">Zinli Card (USD)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#eaedff] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewEmployeeModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#434656] hover:bg-[#f2f3ff] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl text-xs font-display font-bold shadow-md"
                >
                  Guardar Empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request Loan or Advance */}
      {newLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-[#eaedff] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <h3 className="font-display font-bold text-lg text-[#131b2e]">Nuevo Adelanto o Préstamo</h3>
              <button onClick={() => setNewLoanModal(false)} className="p-1 rounded-full hover:bg-[#f2f3ff]">
                <X className="w-5 h-5 text-[#737688]" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">Empleado Solicitante</label>
                <select
                  value={loanEmpId}
                  onChange={(e) => setLoanEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-semibold outline-none border border-transparent focus:border-[#0041c8]"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} — Sueldo: ${e.monthlySalary}/mes ({e.paymentFrequency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setLoanType('advance');
                    setLoanDeduction(loanAmount);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    loanType === 'advance'
                      ? 'border-[#0041c8] bg-[#eaedff]/50 text-[#0041c8]'
                      : 'border-[#eaedff] text-[#434656] hover:bg-[#faf8ff]'
                  }`}
                >
                  <span className="block font-bold text-xs">⚡ Adelanto de Sueldo</span>
                  <span className="text-[11px] text-[#737688]">Se descuenta de la próxima quincena</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoanType('loan');
                    setLoanDeduction(25);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    loanType === 'loan'
                      ? 'border-[#0041c8] bg-[#eaedff]/50 text-[#0041c8]'
                      : 'border-[#eaedff] text-[#434656] hover:bg-[#faf8ff]'
                  }`}
                >
                  <span className="block font-bold text-xs">🤝 Préstamo Personal</span>
                  <span className="text-[11px] text-[#737688]">Se descuenta en cuotas quincenales</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Monto a Entregar (USD)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={loanAmount}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setLoanAmount(val);
                      if (loanType === 'advance') setLoanDeduction(val);
                    }}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-bold outline-none border border-transparent focus:border-[#0041c8]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">
                    Cuota a Descontar por Nómina (USD)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    max={loanAmount}
                    value={loanDeduction}
                    onChange={(e) => setLoanDeduction(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-bold outline-none border border-transparent focus:border-[#0041c8]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">Motivo / Descripción</label>
                <input
                  type="text"
                  placeholder="Ej. Emergencia médica, reparación de vehículo, gastos escolares"
                  value={loanDesc}
                  onChange={(e) => setLoanDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-medium outline-none border border-transparent focus:border-[#0041c8]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">Desembolsar desde cuenta:</label>
                <select
                  value={loanSourceAccount}
                  onChange={(e) => setLoanSourceAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-semibold outline-none border border-transparent focus:border-[#0041c8]"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency === 'USD' ? formatUSD(a.balance) : formatVES(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-[#f2f3ff] rounded-xl text-[11px] text-[#434656] space-y-1">
                <div className="flex justify-between">
                  <span>Equivalente en Bolívares:</span>
                  <strong className="text-[#006c49]">Bs. {(loanAmount * bcvRate).toLocaleString('es-VE')}</strong>
                </div>
                <div className="text-[#737688]">
                  * Si el colaborador no realiza un abono manual antes de la fecha de corte, el sistema descontará automáticamente ${loanDeduction.toFixed(2)} de su pago.
                </div>
              </div>

              <div className="pt-3 border-t border-[#eaedff] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewLoanModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#434656] hover:bg-[#f2f3ff] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl text-xs font-display font-bold shadow-md"
                >
                  Aprobar y Desembolsar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Early Loan Repayment */}
      {repayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#eaedff] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-[#131b2e]">Abono / Pago de Deuda</h3>
                <p className="text-xs text-[#737688]">{repayModal.employeeName}</p>
              </div>
              <button onClick={() => setRepayModal(null)} className="p-1 rounded-full hover:bg-[#f2f3ff]">
                <X className="w-5 h-5 text-[#737688]" />
              </button>
            </div>

            <form onSubmit={handleConfirmRepay} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">
                  Monto a Abonar (Máximo: ${repayModal.maxAmount.toFixed(2)})
                </label>
                <input
                  type="number"
                  min="1"
                  max={repayModal.maxAmount}
                  step="any"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-bold outline-none border border-transparent focus:border-[#0041c8]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">Recibir fondos en cuenta:</label>
                <select
                  value={repayDestAccount}
                  onChange={(e) => setRepayDestAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-semibold outline-none border border-transparent focus:border-[#0041c8]"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#eaedff] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRepayModal(null)}
                  className="px-4 py-2 text-xs font-bold text-[#434656] hover:bg-[#f2f3ff] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#006c49] hover:bg-[#005237] text-white rounded-xl text-xs font-display font-bold shadow-md"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Process Payroll Payment */}
      {processPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-[#eaedff] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-[#131b2e]">Liquidación de Nómina</h3>
                <p className="text-xs text-[#0041c8] font-semibold">{processPayModal.name} · {processPayModal.position}</p>
              </div>
              <button onClick={() => setProcessPayModal(null)} className="p-1 rounded-full hover:bg-[#f2f3ff]">
                <X className="w-5 h-5 text-[#737688]" />
              </button>
            </div>

            {/* Calculations Breakdown */}
            {(() => {
              const isQuincenal = processPayModal.paymentFrequency === 'quincenal';
              const baseSalary = isQuincenal ? processPayModal.monthlySalary / 2 : processPayModal.monthlySalary;
              const activeLoans = processPayModal.loans.filter((l) => l.status === 'active');
              const totalDeduction = activeLoans.reduce((sum, l) => sum + Math.min(l.deductionPerPayment, l.remainingAmount), 0);
              const netUSD = Math.max(0, baseSalary - totalDeduction);
              const rateToUse = isCustomRate ? payrollRate : bcvRate;
              const netVES = netUSD * rateToUse;

              return (
                <div className="space-y-4">
                  {/* Calculation Card */}
                  <div className="p-4 bg-[#faf8ff] rounded-2xl border border-[#eaedff] space-y-2.5 text-xs">
                    <div className="flex justify-between text-[#434656]">
                      <span>Salario Base ({isQuincenal ? 'Quincenal' : 'Mensual'}):</span>
                      <strong className="text-[#131b2e] font-display text-sm">${baseSalary.toFixed(2)} USD</strong>
                    </div>

                    {totalDeduction > 0 ? (
                      <div className="flex justify-between text-[#dc2626] font-semibold">
                        <span>Deducción por Préstamos/Adelantos:</span>
                        <span>-${totalDeduction.toFixed(2)} USD</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-[#006c49]">
                        <span>Deducción por Préstamos:</span>
                        <span>$0.00 (Sin deudas activas)</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-[#eaedff] flex items-baseline justify-between">
                      <span className="font-bold text-sm text-[#131b2e]">Neto a Pagar:</span>
                      <div className="text-right">
                        <span className="font-display text-xl font-extrabold text-[#0041c8] block">
                          ${netUSD.toFixed(2)} USD
                        </span>
                        <span className="text-xs font-bold text-[#006c49]">
                          ≈ Bs. {netVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Flexible Rate Configuration (Requested: no tiene que estar anclada a la del bcv) */}
                  <div className="p-3 bg-[#f2f3ff] rounded-xl border border-[#eaedff] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#131b2e]">Tasa de Conversión para Nómina:</span>
                      <button
                        type="button"
                        onClick={() => setIsCustomRate(!isCustomRate)}
                        className="text-[11px] text-[#0041c8] font-bold hover:underline"
                      >
                        {isCustomRate ? 'Volver a Tasa BCV' : 'Modificar Tasa'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          step="any"
                          disabled={!isCustomRate}
                          value={isCustomRate ? payrollRate : bcvRate}
                          onChange={(e) => setPayrollRate(parseFloat(e.target.value) || bcvRate)}
                          className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold ${
                            isCustomRate ? 'bg-white border border-[#0041c8] text-[#131b2e]' : 'bg-[#eaedff] text-[#737688]'
                          }`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#434656]">Bs./USD</span>
                    </div>
                  </div>

                  {/* Period and Account */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-[#434656] block mb-1">Concepto / Periodo</label>
                      <input
                        type="text"
                        value={payrollPeriod}
                        onChange={(e) => setPayrollPeriod(e.target.value)}
                        className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs font-semibold outline-none border border-transparent focus:border-[#0041c8]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#434656] block mb-1">Pagar desde Cuenta de la Empresa</label>
                      <select
                        value={payrollAccountId}
                        onChange={(e) => setPayrollAccountId(e.target.value)}
                        className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs font-semibold outline-none border border-transparent focus:border-[#0041c8]"
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name} ({a.currency === 'USD' ? formatUSD(a.balance) : formatVES(a.balance)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#eaedff] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setProcessPayModal(null)}
                      className="px-4 py-2 text-xs font-bold text-[#434656] hover:bg-[#f2f3ff] rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleExecutePayroll}
                      className="px-5 py-2.5 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl text-xs font-display font-bold shadow-md"
                    >
                      Confirmar y Liquidar Pago
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
