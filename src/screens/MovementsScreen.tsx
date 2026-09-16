import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Transaction, Currency, TransactionType } from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Repeat, 
  Copy, 
  Check, 
  Share2, 
  Building2,
  Calendar,
  CreditCard,
  Hash,
  Sparkles
} from 'lucide-react';

export const MovementsScreen: React.FC = () => {
  const {
    transactions,
    accounts,
    bcvRate,
    selectedTx,
    setSelectedTx,
    setReceiptModalOpen,
    setQuickExpenseModalOpen,
    showToast,
    formatUSD,
    formatVES
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<'ALL' | Currency>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | TransactionType>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = tx.title.toLowerCase().includes(q);
        const matchCat = tx.category.toLowerCase().includes(q);
        const matchRef = tx.reference.toLowerCase().includes(q);
        const matchAccount = tx.accountName.toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchRef && !matchAccount) return false;
      }

      // Currency
      if (selectedCurrency !== 'ALL' && tx.currency !== selectedCurrency) {
        return false;
      }

      // Type
      if (selectedType !== 'ALL' && tx.type !== selectedType) {
        return false;
      }

      // Account
      if (selectedAccount !== 'ALL' && tx.accountId !== selectedAccount) {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, selectedCurrency, selectedType, selectedAccount]);

  // Group by date
  const groupedTransactions = useMemo<Record<string, Transaction[]>>(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((tx) => {
      const groupKey = tx.groupDate || 'HOY';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  // Summary metrics computed from the real transaction history
  const metrics = useMemo(() => {
    let expenseUSD = 0;
    let expenseCount = 0;
    let incomeUSD = 0;
    let incomeCount = 0;
    let exchangedUSD = 0;
    let exchangeCount = 0;

    transactions.forEach((tx) => {
      const rate = tx.rate || bcvRate;
      if (tx.type === 'expense') {
        expenseUSD += tx.currency === 'USD' ? Math.abs(tx.amount) : Math.abs(tx.amount) / rate;
        expenseCount += 1;
      } else if (tx.type === 'income') {
        incomeUSD += tx.currency === 'USD' ? tx.amount : tx.amount / rate;
        incomeCount += 1;
      } else if (tx.type === 'exchange') {
        exchangedUSD += tx.currency === 'USD' ? tx.amount : Math.abs(tx.secondaryAmount);
        exchangeCount += 1;
      }
    });

    return {
      expenseUSD,
      expenseCount,
      incomeUSD,
      incomeCount,
      exchangedUSD,
      exchangeCount,
      netUSD: incomeUSD - expenseUSD
    };
  }, [transactions, bcvRate]);

  // Active inspected transaction
  const activeTx = selectedTx || transactions[0] || null;

  const handleCopyRef = (ref: string) => {
    navigator.clipboard?.writeText(ref);
    showToast(`Referencia ${ref} copiada`);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-[#131b2e] tracking-tight">
            Movimientos
          </h1>
          <p className="text-xs md:text-sm text-[#434656] mt-0.5">
            Registro unificado de transferencias, gastos en dólares, bolívares y pago móvil
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setQuickExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0041c8] text-white rounded-xl text-xs font-display font-bold shadow-md hover:bg-[#0036a8] transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Anotar Movimiento</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (4 summary cards matching Image 3 with responsive layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-3.5">
        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="text-xs font-semibold text-[#737688]">Total Gastado</div>
          <div className="font-display text-lg sm:text-xl font-bold text-[#131b2e] mt-1 truncate">
            {formatUSD(metrics.expenseUSD)}
          </div>
          <div className="text-[11px] text-[#737688] font-medium mt-0.5 truncate">
            ≈ {formatVES(metrics.expenseUSD * bcvRate)} · {metrics.expenseCount} salidas
          </div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="text-xs font-semibold text-[#737688]">Total Ingresado</div>
          <div className="font-display text-lg sm:text-xl font-bold text-[#006c49] mt-1 truncate">
            {formatUSD(metrics.incomeUSD, true)}
          </div>
          <div className="text-[11px] text-[#006c49] font-medium mt-0.5 truncate">
            ≈ {formatVES(metrics.incomeUSD * bcvRate)} · {metrics.incomeCount} abonos
          </div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="text-xs font-semibold text-[#737688]">Cambiado USD ↔ VES</div>
          <div className="font-display text-lg sm:text-xl font-bold text-[#0041c8] mt-1 truncate">
            {formatUSD(metrics.exchangedUSD)}
          </div>
          <div className="text-[11px] text-[#0041c8] font-medium mt-0.5 truncate">
            a {formatVES(metrics.exchangedUSD * bcvRate)} · {metrics.exchangeCount} {metrics.exchangeCount === 1 ? 'cambio' : 'cambios'}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="text-xs font-semibold text-[#737688]">Balance Neto</div>
          <div className={`font-display text-lg sm:text-xl font-bold mt-1 truncate ${metrics.netUSD >= 0 ? 'text-[#006c49]' : 'text-[#a20030]'}`}>
            {formatUSD(metrics.netUSD, true)}
          </div>
          <div className={`text-[11px] font-medium mt-0.5 truncate ${metrics.netUSD >= 0 ? 'text-[#006c49]' : 'text-[#a20030]'}`}>
            {metrics.netUSD >= 0 ? 'Ahorro activo positivo' : 'Gastaste más de lo que ingresó'}
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)] space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-[#737688] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por comercio, concepto o referencia..."
              className="w-full pl-9 pr-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-medium text-[#131b2e] outline-none border border-transparent focus:border-[#0041c8] focus:bg-white transition-all"
            />
          </div>

          {/* Account Select */}
          <div className="w-full sm:w-56">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full py-2 px-3 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-medium text-[#131b2e] outline-none border border-transparent focus:border-[#0041c8] cursor-pointer"
            >
              <option value="ALL">Todas las cuentas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#f2f3ff]">
          {/* Currency filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            <span className="text-[11px] text-[#737688] font-semibold mr-1 shrink-0">Moneda:</span>
            {(['ALL', 'USD', 'VES'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors shrink-0 ${
                  selectedCurrency === curr
                    ? 'bg-[#0041c8] text-white'
                    : 'bg-[#eaedff] text-[#434656] hover:bg-[#dce1ff]'
                }`}
              >
                {curr === 'ALL' ? 'Todas' : curr === 'USD' ? 'Solo USD ($)' : 'Solo VES (Bs.)'}
              </button>
            ))}
          </div>

          {/* Type filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            <span className="text-[11px] text-[#737688] font-semibold mr-1 shrink-0">Tipo:</span>
            {(['ALL', 'expense', 'income', 'exchange'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors shrink-0 ${
                  selectedType === type
                    ? 'bg-[#0041c8] text-white'
                    : 'bg-[#eaedff] text-[#434656] hover:bg-[#dce1ff]'
                }`}
              >
                {type === 'ALL'
                  ? 'Todos'
                  : type === 'expense'
                  ? 'Egresos'
                  : type === 'income'
                  ? 'Ingresos'
                  : 'Cambios'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Layout: List on Left, Sticky Inspector on Right (matching Image 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Transaction Groups List */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          {Object.keys(groupedTransactions).length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#eaedff] p-8 text-center space-y-2">
              <div className="text-3xl">🔍</div>
              <h3 className="font-display font-bold text-base text-[#131b2e]">No se encontraron movimientos</h3>
              <p className="text-xs text-[#737688]">Prueba ajustando los filtros de búsqueda o moneda.</p>
            </div>
          ) : (
            (Object.entries(groupedTransactions) as [string, Transaction[]][]).map(([dateGroup, items]) => {
              // Group total calculations
              const groupUSDTotal = items.reduce((acc, curr) => {
                const val = curr.currency === 'USD' ? Math.abs(curr.amount) : Math.abs(curr.amount) / (curr.rate || bcvRate);
                return acc + (curr.type === 'expense' ? val : 0);
              }, 0);

              return (
                <div key={dateGroup} className="space-y-2">
                  {/* Sticky Group Header */}
                  <div className="flex items-center justify-between px-1 text-xs font-semibold text-[#737688]">
                    <div className="flex items-center gap-2">
                      <span className="font-display uppercase tracking-wider font-bold text-[#131b2e]">
                        {dateGroup}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#eaedff] text-[#0041c8] text-[10px] font-bold">
                        {items.length} movimientos
                      </span>
                    </div>
                    {groupUSDTotal > 0 && (
                      <span className="text-[11px] text-[#737688]">
                        Salidas del día: <strong className="text-[#131b2e]">${groupUSDTotal.toFixed(2)}</strong>
                      </span>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_12px_rgba(19,27,46,0.03)] divide-y divide-[#f2f3ff] overflow-hidden">
                    {items.map((tx) => {
                      const isSelected = activeTx?.id === tx.id;
                      const isExpense = tx.type === 'expense';
                      const isIncome = tx.type === 'income';
                      const isUSD = tx.currency === 'USD';

                      return (
                        <div
                          key={tx.id}
                          onClick={() => {
                            setSelectedTx(tx);
                            setReceiptModalOpen(true);
                          }}
                          className={`p-3.5 sm:p-4 transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                            isSelected ? 'bg-[#eaedff]/50 border-l-4 border-[#0041c8]' : 'hover:bg-[#faf8ff]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 transition-transform group-hover:scale-105 ${
                              isExpense ? 'bg-[#ffdadb] text-[#a20030]' : isIncome ? 'bg-[#6cf8bb]/40 text-[#00714d]' : 'bg-[#dce1ff] text-[#0041c8]'
                            }`}>
                              {tx.categoryEmoji || '💸'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-display font-bold text-xs sm:text-sm text-[#131b2e] truncate group-hover:text-[#0041c8] transition-colors">
                                {tx.title}
                              </div>
                              <div className="text-[11px] sm:text-xs text-[#737688] flex items-center gap-1.5 mt-0.5 truncate">
                                <span className="font-medium text-[#434656] truncate">{tx.accountName}</span>
                                <span>·</span>
                                <span className="shrink-0">{tx.date}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className={`font-display font-bold text-xs sm:text-sm md:text-base ${
                              isExpense ? 'text-[#131b2e]' : isIncome ? 'text-[#006c49]' : 'text-[#0041c8]'
                            }`}>
                              {isUSD ? formatUSD(tx.amount, true) : formatVES(tx.amount, true)}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-[#737688] font-medium">
                              ≈ {isUSD ? formatVES(tx.secondaryAmount) : formatUSD(tx.secondaryAmount)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Inspection Side Panel (Sticky on Desktop) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
          {activeTx ? (
            <div className="sticky top-20 bg-white rounded-3xl border border-[#eaedff] shadow-[0_4px_20px_rgba(19,27,46,0.04)] p-6 space-y-5">
              {/* Header of inspector */}
              <div className="flex items-center justify-between pb-3 border-b border-[#f2f3ff]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#006c49]"></div>
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-[#434656]">
                    Detalle de Transacción
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedTx(activeTx);
                    setReceiptModalOpen(true);
                  }}
                  className="text-xs font-bold text-[#0041c8] hover:underline flex items-center gap-1"
                >
                  Ver Ticket <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Merchant and amount */}
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#f2f3ff] text-[#0041c8] mx-auto flex items-center justify-center text-2xl shadow-xs mb-3">
                  {activeTx.categoryEmoji || '🛍️'}
                </div>
                <h3 className="font-display font-bold text-xl text-[#131b2e] leading-tight truncate">
                  {activeTx.title}
                </h3>
                <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[#0041c8] mt-1.5">
                  {activeTx.category}
                </span>

                <div className="mt-4 p-4 bg-[#f2f3ff] rounded-2xl border border-[#eaedff]">
                  <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
                    {activeTx.currency === 'USD' ? formatUSD(activeTx.amount, true) : formatVES(activeTx.amount, true)}
                  </div>
                  <div className="text-xs font-semibold text-[#737688] mt-0.5">
                    ≈ {activeTx.currency === 'USD' ? formatVES(activeTx.secondaryAmount) : formatUSD(activeTx.secondaryAmount)}
                    <span className="ml-1 text-[#0041c8]">· Tasa: Bs. {activeTx.rate || bcvRate}</span>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-[#f2f3ff]">
                  <span className="text-[#737688] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0041c8]" />
                    Fecha y Hora
                  </span>
                  <span className="font-semibold text-[#131b2e]">{activeTx.date}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[#f2f3ff]">
                  <span className="text-[#737688] flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#006c49]" />
                    Cuenta debitada
                  </span>
                  <span className="font-semibold text-[#131b2e]">{activeTx.accountName}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[#f2f3ff]">
                  <span className="text-[#737688] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0041c8]" />
                    Comercio / Destino
                  </span>
                  <span className="font-semibold text-[#131b2e] truncate max-w-[160px]">
                    {activeTx.beneficiary?.name || activeTx.title}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[#f2f3ff]">
                  <span className="text-[#737688] flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#0041c8]" />
                    Referencia
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-[#0041c8]">{activeTx.reference}</span>
                    <button
                      onClick={() => handleCopyRef(activeTx.reference)}
                      className="p-1 text-[#737688] hover:text-[#0041c8] rounded"
                      title="Copiar referencia"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#737688]">Estado de la operación</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#6cf8bb] text-[#00714d]">
                    {activeTx.status}
                  </span>
                </div>
              </div>

              {/* Quick Actions in Side Panel */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSelectedTx(activeTx);
                    setReceiptModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Ver Comprobante Oficial</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#eaedff] text-[#737688] text-xs">
              Selecciona un movimiento para inspeccionar sus datos oficiales.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
