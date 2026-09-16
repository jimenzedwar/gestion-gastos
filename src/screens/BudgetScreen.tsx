import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RecurringExpense, Currency } from '../types';
import { 
  CalendarClock, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Building2, 
  Calendar,
  DollarSign,
  Filter,
  Check,
  X
} from 'lucide-react';

export const BudgetScreen: React.FC = () => {
  const {
    recurringExpenses,
    businessAccounts: accounts,
    bcvRate,
    payRecurringExpense, 
    addRecurringExpense, 
    showToast,
    formatUSD,
    formatVES 
  } = useApp();

  const [filterState, setFilterState] = useState<'all' | 'pending' | 'paid'>('all');
  const [newExpenseModal, setNewExpenseModal] = useState(false);
  const [payModal, setPayModal] = useState<RecurringExpense | null>(null);
  const [selectedPayAccount, setSelectedPayAccount] = useState<string>(accounts[0]?.id || '');

  // New recurring expense form
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Servicios');
  const [emoji, setEmoji] = useState('💡');
  const [amount, setAmount] = useState<number>(50);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [frequency, setFrequency] = useState<'mensual' | 'quincenal' | 'semanal'>('mensual');
  const [dueDay, setDueDay] = useState<number>(15);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.id || '');

  // Calculate budget statistics in USD
  const totalBudgetUSD = useMemo(() => {
    return recurringExpenses.reduce((acc, exp) => {
      const val = exp.currency === 'USD' ? exp.amount : exp.amount / bcvRate;
      return acc + val;
    }, 0);
  }, [recurringExpenses, bcvRate]);

  const totalPaidUSD = useMemo(() => {
    return recurringExpenses.reduce((acc, exp) => {
      if (!exp.isPaid) return acc;
      const val = exp.currency === 'USD' ? exp.amount : exp.amount / bcvRate;
      return acc + val;
    }, 0);
  }, [recurringExpenses, bcvRate]);

  const totalPendingUSD = totalBudgetUSD - totalPaidUSD;
  const percentagePaid = totalBudgetUSD > 0 ? Math.round((totalPaidUSD / totalBudgetUSD) * 100) : 0;

  // Filter list
  const filteredList = useMemo(() => {
    return recurringExpenses.filter((exp) => {
      if (filterState === 'pending') return !exp.isPaid;
      if (filterState === 'paid') return exp.isPaid;
      return true;
    });
  }, [recurringExpenses, filterState]);

  const handleCreateRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Ingresa un nombre para el gasto');
      return;
    }
    addRecurringExpense({
      name: name.trim(),
      category,
      categoryEmoji: emoji,
      amount: amount || 10,
      currency,
      frequency,
      dueDay: dueDay || 15,
      accountId
    });
    setNewExpenseModal(false);
    setName('');
  };

  const handleConfirmPayment = () => {
    if (!payModal) return;
    payRecurringExpense(payModal.id, selectedPayAccount);
    setPayModal(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-[#131b2e] tracking-tight">
            Gastos Recurrentes
          </h1>
          <p className="text-xs md:text-sm text-[#434656] mt-0.5">
            Planifica y programa tus compromisos fijos: alquileres, servicios, nóminas, licencias y condominios
          </p>
        </div>

        <button
          onClick={() => setNewExpenseModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0041c8] text-white rounded-xl text-xs font-display font-bold shadow-md hover:bg-[#0036a8] transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Gasto Recurrente</span>
        </button>
      </div>

      {/* Progress & Summary Card */}
      <div className="bg-white rounded-3xl border border-[#eaedff] p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[#737688]">Presupuesto Mensual Comprometido</div>
            <div className="font-display text-3xl font-extrabold text-[#131b2e] mt-1">
              ${totalBudgetUSD.toFixed(2)} USD
            </div>
            <div className="text-xs text-[#006c49] font-semibold mt-0.5">
              ≈ Bs. {(totalBudgetUSD * bcvRate).toLocaleString('es-VE', { maximumFractionDigits: 0 })} al cambio BCV
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-[11px] font-semibold text-[#006c49] block">Pagado este mes</span>
              <span className="font-display text-lg font-bold text-[#006c49]">${totalPaidUSD.toFixed(2)}</span>
            </div>
            <div className="h-8 w-[1px] bg-[#eaedff]"></div>
            <div>
              <span className="text-[11px] font-semibold text-[#b45309] block">Por pagar</span>
              <span className="font-display text-lg font-bold text-[#b45309]">${totalPendingUSD.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-[#434656]">Progreso de Liquidación del Mes</span>
            <span className="text-[#0041c8] font-bold">{percentagePaid}% completado</span>
          </div>
          <div className="w-full bg-[#eaedff] h-3 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#0041c8] to-[#006c49] h-full rounded-full transition-all duration-700" 
              style={{ width: `${percentagePaid}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterState('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterState === 'all'
                ? 'bg-[#0041c8] text-white shadow-xs'
                : 'bg-white text-[#434656] hover:bg-[#f2f3ff] border border-[#eaedff]'
            }`}
          >
            Todos ({recurringExpenses.length})
          </button>
          <button
            onClick={() => setFilterState('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterState === 'pending'
                ? 'bg-[#0041c8] text-white shadow-xs'
                : 'bg-white text-[#434656] hover:bg-[#f2f3ff] border border-[#eaedff]'
            }`}
          >
            Pendientes por Pagar ({recurringExpenses.filter(e => !e.isPaid).length})
          </button>
          <button
            onClick={() => setFilterState('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterState === 'paid'
                ? 'bg-[#0041c8] text-white shadow-xs'
                : 'bg-white text-[#434656] hover:bg-[#f2f3ff] border border-[#eaedff]'
            }`}
          >
            Ya Pagados ({recurringExpenses.filter(e => e.isPaid).length})
          </button>
        </div>
      </div>

      {/* Expenses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredList.map((exp) => {
          const isUSD = exp.currency === 'USD';
          const secondaryVal = isUSD ? exp.amount * bcvRate : exp.amount / bcvRate;
          const assignedAccount = accounts.find((a) => a.id === exp.accountId) || accounts[0];

          return (
            <div
              key={exp.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                exp.isPaid
                  ? 'bg-white border-[#eaedff] opacity-90'
                  : 'bg-white border-[#dce1ff] shadow-[0_4px_16px_rgba(0,65,200,0.04)]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#f2f3ff] flex items-center justify-center text-xl shrink-0">
                      {exp.categoryEmoji || '🏢'}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-[#131b2e] leading-snug">
                        {exp.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[#737688]">
                        <span className="font-semibold text-[#0041c8]">{exp.category}</span>
                        <span>·</span>
                        <span>Día {exp.dueDay} de cada mes</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    exp.isPaid 
                      ? 'bg-[#6cf8bb]/40 text-[#00714d]' 
                      : 'bg-[#fffbeb] text-[#b45309] border border-[#fef3c7]'
                  }`}>
                    {exp.isPaid ? 'Pagado este mes' : `Vence el ${exp.dueDay}`}
                  </span>
                </div>

                <div className="mt-4 p-3 bg-[#faf8ff] rounded-xl border border-[#eaedff] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#737688] uppercase tracking-wider font-semibold block">
                      Monto Fijo
                    </span>
                    <div className="font-display text-lg font-extrabold text-[#131b2e]">
                      {isUSD ? `$${exp.amount.toFixed(2)} USD` : `Bs. ${exp.amount.toLocaleString('es-VE')} VES`}
                    </div>
                    <span className="text-[11px] text-[#737688]">
                      ≈ {isUSD ? `Bs. ${secondaryVal.toLocaleString('es-VE', { maximumFractionDigits: 0 })}` : `$${secondaryVal.toFixed(2)} USD`}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#737688] block">Cuenta asignada</span>
                    <span className="text-xs font-semibold text-[#131b2e]">{assignedAccount.name}</span>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="pt-2 border-t border-[#eaedff] flex items-center justify-between">
                {exp.isPaid ? (
                  <div className="flex items-center gap-1.5 text-xs text-[#006c49] font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Liquidado ({exp.lastPaidDate || 'Este mes'})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-[#b45309] font-medium">
                    <Clock className="w-4 h-4" />
                    <span>Pendiente por cancelar</span>
                  </div>
                )}

                {!exp.isPaid && (
                  <button
                    onClick={() => {
                      setPayModal(exp);
                      setSelectedPayAccount(exp.accountId || accounts[0]?.id || '');
                    }}
                    className="px-4 py-2 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl text-xs font-display font-bold shadow-xs transition-colors"
                  >
                    Pagar Ahora
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Recurring Expense */}
      {newExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs" onClick={() => setNewExpenseModal(false)}>
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-[#eaedff] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <h3 className="font-display font-bold text-lg text-[#131b2e]">Nuevo Gasto Recurrente</h3>
              <button onClick={() => setNewExpenseModal(false)} className="p-1 rounded-full hover:bg-[#f2f3ff]">
                <X className="w-5 h-5 text-[#737688]" />
              </button>
            </div>

            <form onSubmit={handleCreateRecurring} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">Nombre del Compromiso</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Alquiler Local, Internet Fibra, Condominio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-medium outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-semibold outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                  >
                    <option value="Alquiler">Alquiler 🏢</option>
                    <option value="Servicios">Servicios 💡</option>
                    <option value="Mantenimiento">Mantenimiento 🛠️</option>
                    <option value="Plataformas">Plataformas / POS 💳</option>
                    <option value="Seguros">Seguros 🛡️</option>
                    <option value="Nómina">Nómina 👥</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Icono / Emoji</label>
                  <input
                    type="text"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-medium outline-none border border-transparent focus:border-[#0041c8] focus:bg-white text-center text-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Monto Fijo</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-bold outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Moneda</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-bold outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                  >
                    <option value="USD">Dólares ($ USD)</option>
                    <option value="VES">Bolívares (Bs. VES)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Día de Cobro (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDay || ''}
                    onChange={(e) => setDueDay(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-semibold outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Frecuencia</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-semibold outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                  >
                    <option value="mensual">Mensual</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="semanal">Semanal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">Cuenta de Débito Habitual</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-semibold outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#eaedff] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewExpenseModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#434656] hover:bg-[#f2f3ff] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl text-xs font-display font-bold shadow-md"
                >
                  Guardar en Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Recurring Expense */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs" onClick={() => setPayModal(null)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#eaedff] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-[#131b2e]">Pagar Gasto Recurrente</h3>
                <p className="text-xs text-[#0041c8] font-semibold">{payModal.name}</p>
              </div>
              <button onClick={() => setPayModal(null)} className="p-1 rounded-full hover:bg-[#f2f3ff]">
                <X className="w-5 h-5 text-[#737688]" />
              </button>
            </div>

            <div className="p-4 bg-[#faf8ff] rounded-2xl border border-[#eaedff] space-y-2 text-xs">
              <div className="flex justify-between text-[#434656]">
                <span>Monto a cancelar:</span>
                <strong className="text-base text-[#131b2e] font-display">
                  {payModal.currency === 'USD' ? `$${payModal.amount.toFixed(2)} USD` : `Bs. ${payModal.amount.toLocaleString('es-VE')} VES`}
                </strong>
              </div>
              <div className="flex justify-between text-[#737688]">
                <span>Equivalente:</span>
                <span>
                  {payModal.currency === 'USD'
                    ? `Bs. ${(payModal.amount * bcvRate).toLocaleString('es-VE')} (Tasa BCV)`
                    : `$${(payModal.amount / bcvRate).toFixed(2)} USD`}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#434656] block mb-1">Debitar desde:</label>
              <select
                value={selectedPayAccount}
                onChange={(e) => setSelectedPayAccount(e.target.value)}
                className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-semibold outline-none border border-transparent focus:border-[#0041c8]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency === 'USD' ? formatUSD(a.balance) : formatVES(a.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-[#eaedff] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayModal(null)}
                className="px-4 py-2 text-xs font-bold text-[#434656] hover:bg-[#f2f3ff] rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-5 py-2.5 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl text-xs font-display font-bold shadow-md"
              >
                Confirmar y Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
