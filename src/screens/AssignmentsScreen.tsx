import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Wallet,
  ArrowLeft,
  Plus,
  Receipt,
  Repeat,
  User,
  X,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';

const COLORS = ['#0041c8', '#006c49', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const AssignmentsScreen: React.FC = () => {
  const {
    employees,
    accounts,
    businessAccounts,
    transactions,
    bcvRate,
    formatUSD,
    formatVES,
    openQuickExpenseForAccount,
    openExchangeForAccounts,
    assignFundsToEmployee,
    showToast
  } = useApp();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<{ employeeId: string; employeeName: string } | null>(null);
  const [assignSourceId, setAssignSourceId] = useState<string>('');
  const [assignAmount, setAssignAmount] = useState<number>(0);
  const [assignCurrency, setAssignCurrency] = useState<'USD' | 'VES'>('USD');

  const employeesWithAccounts = useMemo(
    () => employees.filter((e) => e.assignedAccountId && e.exchangeCounterpartAccountId),
    [employees]
  );

  const employeeStats = useMemo(() => {
    return employeesWithAccounts.map((emp) => {
      // Match by currency, not by field name — an employee's two accounts can
      // be linked in either order depending on how they were assigned.
      const linkedAccounts = [emp.assignedAccountId, emp.exchangeCounterpartAccountId]
        .map((id) => accounts.find((a) => a.id === id))
        .filter((a): a is typeof accounts[number] => !!a);
      const usdAcc = linkedAccounts.find((a) => a.currency === 'USD');
      const vesAcc = linkedAccounts.find((a) => a.currency === 'VES');
      const accIds = [emp.assignedAccountId, emp.exchangeCounterpartAccountId];
      const txs = transactions
        .filter((tx) => accIds.includes(tx.accountId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const spentUSD = txs.reduce((sum, tx) => {
        if (tx.type !== 'expense') return sum;
        const usdVal = tx.currency === 'USD' ? Math.abs(tx.amount) : Math.abs(tx.amount) / (tx.rate || bcvRate);
        return sum + usdVal;
      }, 0);
      const categoryMap: Record<string, { emoji: string; usd: number }> = {};
      txs.forEach((tx) => {
        if (tx.type !== 'expense') return;
        const usdVal = tx.currency === 'USD' ? Math.abs(tx.amount) : Math.abs(tx.amount) / (tx.rate || bcvRate);
        const key = tx.category || 'Otros';
        if (!categoryMap[key]) categoryMap[key] = { emoji: tx.categoryEmoji || '💸', usd: 0 };
        categoryMap[key].usd += usdVal;
      });
      const categoryBreakdown = Object.entries(categoryMap)
        .map(([name, v]) => ({ name, emoji: v.emoji, value: Math.round(v.usd * 100) / 100 }))
        .sort((a, b) => b.value - a.value);

      return {
        employee: emp,
        usdAcc,
        vesAcc,
        transactions: txs,
        spentUSD,
        categoryBreakdown,
        totalUSD: (usdAcc?.balance || 0) + (vesAcc ? vesAcc.balance / bcvRate : 0)
      };
    });
  }, [employeesWithAccounts, accounts, transactions, bcvRate]);

  const spendByEmployee = useMemo(
    () => employeeStats.map((s) => ({ name: s.employee.name, gasto: Math.round(s.spentUSD * 100) / 100 })),
    [employeeStats]
  );

  const globalCategoryBreakdown = useMemo(() => {
    const map: Record<string, { emoji: string; usd: number }> = {};
    employeeStats.forEach((s) => {
      s.categoryBreakdown.forEach((c) => {
        if (!map[c.name]) map[c.name] = { emoji: c.emoji, usd: 0 };
        map[c.name].usd += c.value;
      });
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, emoji: v.emoji, value: Math.round(v.usd * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [employeeStats]);

  const globalTotalSpent = globalCategoryBreakdown.reduce((sum, c) => sum + c.value, 0);

  const selected = employeeStats.find((s) => s.employee.id === selectedEmployeeId) || null;

  const handleOpenAssign = (employeeId: string, employeeName: string) => {
    setAssignModal({ employeeId, employeeName });
    setAssignSourceId(businessAccounts[0]?.id || '');
    setAssignAmount(0);
    setAssignCurrency('USD');
  };

  const handleConfirmAssign = () => {
    if (!assignModal) return;
    if (!assignSourceId) {
      showToast('Selecciona una cuenta de origen');
      return;
    }
    if (assignAmount <= 0) {
      showToast('Ingresa un monto válido');
      return;
    }
    assignFundsToEmployee(assignModal.employeeId, assignSourceId, assignAmount, assignCurrency);
    setAssignModal(null);
  };

  if (employeesWithAccounts.length === 0) {
    return (
      <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-[#131b2e] tracking-tight">Asignaciones</h1>
          <p className="text-xs md:text-sm text-[#434656] mt-0.5">
            Cuánto tiene y en qué gasta cada empleado con cuenta propia
          </p>
        </div>
        <div className="bg-white rounded-3xl border border-[#eaedff] p-10 text-center space-y-3">
          <div className="text-3xl">👤</div>
          <h3 className="font-display font-bold text-base text-[#131b2e]">Ningún empleado tiene cuenta todavía</h3>
          <p className="text-xs text-[#737688] max-w-sm mx-auto">
            Ve a Nómina → Registrar Empleado y marca "¿Este empleado necesita una cuenta para gastos?" para que aparezca aquí.
          </p>
        </div>
      </div>
    );
  }

  // Detail view for a single employee
  if (selected) {
    const s = selected;
    return (
      <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedEmployeeId(null)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0041c8] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a Asignaciones
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0041c8] text-white flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl md:text-2xl text-[#131b2e]">{s.employee.name}</h1>
              <p className="text-xs text-[#737688]">{s.employee.position}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenAssign(s.employee.id, s.employee.name)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0041c8] text-white rounded-xl text-xs font-display font-bold shadow-md hover:bg-[#0036a8] transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Asignar dinero
            </button>
            <button
              onClick={() => openQuickExpenseForAccount([s.employee.assignedAccountId!, s.employee.exchangeCounterpartAccountId!])}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#eaedff] text-[#434656] rounded-xl text-xs font-bold hover:bg-[#f2f3ff] transition-all"
            >
              <Receipt className="w-3.5 h-3.5" /> Registrar gasto
            </button>
            <button
              onClick={() => openExchangeForAccounts(s.employee.assignedAccountId!, s.employee.exchangeCounterpartAccountId!)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#eaedff] text-[#434656] rounded-xl text-xs font-bold hover:bg-[#f2f3ff] transition-all"
            >
              <Repeat className="w-3.5 h-3.5" /> Cambiar divisa
            </button>
          </div>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
            <div className="text-xs font-semibold text-[#737688]">Saldo en USD</div>
            <div className="font-display text-xl sm:text-2xl font-bold text-[#0041c8] mt-1">{formatUSD(s.usdAcc?.balance || 0)}</div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
            <div className="text-xs font-semibold text-[#737688]">Saldo en VES</div>
            <div className="font-display text-xl sm:text-2xl font-bold text-[#006c49] mt-1">{formatVES(s.vesAcc?.balance || 0)}</div>
          </div>
        </div>

        {/* Category breakdown for this employee */}
        <div className="bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)]">
          <h3 className="font-display font-bold text-base text-[#131b2e] flex items-center gap-2 mb-1">
            <PieIcon className="w-5 h-5 text-[#006c49]" />
            <span>Gastos por categoría</span>
          </h3>
          <p className="text-xs text-[#737688] mb-4">Distribución de todo lo que {s.employee.name} ha gastado</p>

          {s.categoryBreakdown.length === 0 ? (
            <p className="text-xs text-[#737688] py-8 text-center">Aún no registra gastos.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={s.categoryBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {s.categoryBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Gasto']}
                      contentStyle={{ backgroundColor: '#131b2e', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {s.categoryBreakdown.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-[#faf8ff]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="font-semibold text-[#131b2e]">{item.emoji} {item.name}</span>
                    </div>
                    <span className="font-bold text-[#131b2e]">${item.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Full transaction history */}
        <div className="bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)]">
          <h3 className="font-display font-bold text-base text-[#131b2e] mb-4">Historial de movimientos</h3>
          {s.transactions.length === 0 ? (
            <p className="text-xs text-[#737688] py-8 text-center">Sin movimientos todavía.</p>
          ) : (
            <div className="space-y-2">
              {s.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[#eaedff] bg-[#faf8ff]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">{tx.categoryEmoji || '💸'}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#131b2e] truncate">{tx.title}</div>
                      <div className="text-[11px] text-[#737688]">{tx.date} · {tx.category}</div>
                    </div>
                  </div>
                  <div className={`text-xs font-bold shrink-0 ${tx.amount < 0 ? 'text-[#a20030]' : 'text-[#006c49]'}`}>
                    {tx.currency === 'USD' ? formatUSD(tx.amount, true) : formatVES(tx.amount, true)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Summary view
  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      <div>
        <h1 className="font-display font-bold text-2xl md:text-3xl text-[#131b2e] tracking-tight">Asignaciones</h1>
        <p className="text-xs md:text-sm text-[#434656] mt-0.5">
          Cuánto tiene y en qué gasta cada empleado con cuenta propia — separado de tus cuentas y gráficos globales
        </p>
      </div>

      {/* Per-employee cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {employeeStats.map((s) => (
          <div
            key={s.employee.id}
            className="bg-white rounded-2xl border border-[#eaedff] p-4 shadow-[0_2px_10px_rgba(19,27,46,0.03)] space-y-3 cursor-pointer hover:border-[#0041c8]/40 transition-colors"
            onClick={() => setSelectedEmployeeId(s.employee.id)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#eaedff] text-[#0041c8] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#131b2e] truncate">{s.employee.name}</div>
                  <div className="text-[11px] text-[#737688] truncate">{s.employee.position}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-sm font-extrabold text-[#131b2e]">{formatUSD(s.totalUSD)}</div>
                <div className="text-[10px] text-[#737688]">Equivalente total</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-[#f2f3ff]">
                <div className="text-[10px] text-[#737688] font-semibold">USD</div>
                <div className="font-bold text-[#0041c8]">{formatUSD(s.usdAcc?.balance || 0)}</div>
              </div>
              <div className="p-2 rounded-xl bg-[#f2f3ff]">
                <div className="text-[10px] text-[#737688] font-semibold">VES</div>
                <div className="font-bold text-[#006c49]">{formatVES(s.vesAcc?.balance || 0)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleOpenAssign(s.employee.id, s.employee.name)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-[#0041c8] text-white rounded-lg text-[11px] font-bold hover:bg-[#0036a8]"
              >
                <Plus className="w-3 h-3" /> Asignar
              </button>
              <button
                onClick={() => openQuickExpenseForAccount([s.employee.assignedAccountId!, s.employee.exchangeCounterpartAccountId!])}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-white border border-[#eaedff] text-[#434656] rounded-lg text-[11px] font-bold hover:bg-[#f2f3ff]"
              >
                <Receipt className="w-3 h-3" /> Gasto
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)]">
          <h3 className="font-display font-bold text-base text-[#131b2e] flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-[#0041c8]" />
            <span>Gasto total por empleado</span>
          </h3>
          <p className="text-xs text-[#737688] mb-4">Cuánto ha gastado cada uno desde su cuenta asignada</p>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendByEmployee} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f2f3ff" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#737688' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#737688' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number) => [`$${value}`, 'Gasto']}
                  contentStyle={{ backgroundColor: '#131b2e', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="gasto" name="Gasto ($)" fill="#0041c8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)]">
          <h3 className="font-display font-bold text-base text-[#131b2e] flex items-center gap-2 mb-1">
            <PieIcon className="w-5 h-5 text-[#006c49]" />
            <span>En qué gastan (todos)</span>
          </h3>
          <p className="text-xs text-[#737688] mb-4">Categorías combinadas de todos los empleados con cuenta</p>

          {globalCategoryBreakdown.length === 0 ? (
            <p className="text-xs text-[#737688] py-12 text-center">Aún no hay gastos registrados.</p>
          ) : (
            <>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={globalCategoryBreakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                      {globalCategoryBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Gasto']}
                      contentStyle={{ backgroundColor: '#131b2e', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto no-scrollbar">
                {globalCategoryBreakdown.map((item, idx) => {
                  const percent = globalTotalSpent > 0 ? Math.round((item.value / globalTotalSpent) * 100) : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-[#faf8ff]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        <span className="font-semibold text-[#131b2e]">{item.emoji} {item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#737688]">{percent}%</span>
                        <span className="font-bold text-[#131b2e]">${item.value.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Assign Funds Modal */}
      {assignModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-sm"
          onClick={() => setAssignModal(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 border border-[#eaedff] shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <h3 className="font-display font-bold text-base text-[#131b2e]">Asignar dinero a {assignModal.employeeName}</h3>
              <button onClick={() => setAssignModal(null)} className="p-1 rounded-full hover:bg-[#f2f3ff]">
                <X className="w-5 h-5 text-[#737688]" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#434656] block mb-1">Desde cuenta del negocio</label>
              <select
                value={assignSourceId}
                onChange={(e) => setAssignSourceId(e.target.value)}
                className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs font-semibold outline-none border border-transparent focus:border-[#0041c8]"
              >
                {businessAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency === 'USD' ? formatUSD(a.balance) : formatVES(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#434656] block mb-1">Recibir en (moneda del empleado)</label>
              <div className="flex gap-1 bg-[#eaedff] p-1 rounded-full">
                <button
                  type="button"
                  onClick={() => setAssignCurrency('USD')}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${assignCurrency === 'USD' ? 'bg-[#0041c8] text-white' : 'text-[#434656]'}`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setAssignCurrency('VES')}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${assignCurrency === 'VES' ? 'bg-[#0041c8] text-white' : 'text-[#434656]'}`}
                >
                  VES (Bs.)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#434656] block mb-1">Monto a asignar (USD)</label>
              <input
                type="number"
                min="1"
                step="any"
                value={assignAmount || ''}
                onChange={(e) => setAssignAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-sm font-bold outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
              />
            </div>

            <button
              onClick={handleConfirmAssign}
              className="w-full py-3 px-4 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl font-display font-bold text-sm shadow-md flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Confirmar Asignación</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
