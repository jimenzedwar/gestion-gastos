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
  Cell, 
  LineChart, 
  Line,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  Wallet,
  DollarSign
} from 'lucide-react';

const COLORS = ['#0041c8', '#006c49', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const ChartsScreen: React.FC = () => {
  const { transactions: allTransactions, businessAccounts: accounts, employeeAccountIds, bcvRate, formatUSD, formatVES } = useApp();
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

  // Gráficos globales del negocio — excluyen las cuentas/transacciones de
  // empleados, que tienen su propia vista separada en Asignaciones.
  const transactions = useMemo(
    () => allTransactions.filter((tx) => !employeeAccountIds.has(tx.accountId)),
    [allTransactions, employeeAccountIds]
  );

  // Transactions within the selected time range
  const periodTransactions = useMemo(() => {
    const days = timeRange === 'month' ? 30 : timeRange === 'quarter' ? 90 : 365;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return transactions.filter((tx) => {
      const t = new Date(tx.createdAt).getTime();
      return !Number.isNaN(t) && t >= cutoff;
    });
  }, [transactions, timeRange]);

  // Expenses by Category calculation (within the selected period)
  const categoryData = useMemo(() => {
    const map: Record<string, { name: string; value: number; emoji: string }> = {};
    periodTransactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const cat = tx.category || 'Otros';
        const usdVal = tx.currency === 'USD' ? Math.abs(tx.amount) : Math.abs(tx.amount) / (tx.rate || bcvRate);
        if (!map[cat]) {
          map[cat] = {
            name: cat,
            value: 0,
            emoji: tx.categoryEmoji || '💸'
          };
        }
        map[cat].value += usdVal;
      }
    });

    const list = Object.values(map).map((item) => ({
      ...item,
      value: Math.round(item.value * 100) / 100
    }));
    return list.sort((a, b) => b.value - a.value);
  }, [periodTransactions, bcvRate]);

  const totalIncome = useMemo(() => {
    return periodTransactions.reduce((sum, tx) => {
      if (tx.type !== 'income') return sum;
      const usdVal = tx.currency === 'USD' ? tx.amount : tx.amount / (tx.rate || bcvRate);
      return sum + usdVal;
    }, 0);
  }, [periodTransactions, bcvRate]);

  // Monthly Income vs Expense comparison — last 6 months, from real transactions
  const monthlyFlowData = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleDateString('es-VE', { month: 'short' });
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        mes: label.charAt(0).toUpperCase() + label.slice(1),
        ingresos: 0,
        gastos: 0
      };
    });
    const byKey = new Map(months.map((m) => [m.key, m]));

    transactions.forEach((tx) => {
      if (tx.type !== 'income' && tx.type !== 'expense') return;
      const d = new Date(tx.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const bucket = byKey.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (!bucket) return;
      const usdVal = tx.currency === 'USD' ? tx.amount : tx.amount / (tx.rate || bcvRate);
      if (tx.type === 'income') bucket.ingresos += usdVal;
      else bucket.gastos += Math.abs(usdVal);
    });

    return months.map((m) => ({
      mes: m.mes,
      ingresos: Math.round(m.ingresos * 100) / 100,
      gastos: Math.round(m.gastos * 100) / 100
    }));
  }, [transactions, bcvRate]);

  // Your real currency-exchange history (rate used in each exchange you registered)
  const exchangeHistory = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'exchange')
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((tx) => ({
        fecha: new Date(tx.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }),
        tasa: tx.rate
      }));
  }, [transactions]);

  // Asset distribution by currency type
  const assetDistribution = useMemo(() => {
    let usdTotal = 0;
    let vesInUsd = 0;
    let cashTotal = 0;

    accounts.forEach((acc) => {
      if (acc.type === 'cash_usd' || acc.type === 'cash_ves') {
        cashTotal += acc.currency === 'USD' ? acc.balance : acc.balance / bcvRate;
      } else if (acc.currency === 'USD') {
        usdTotal += acc.balance;
      } else {
        vesInUsd += acc.balance / bcvRate;
      }
    });

    return [
      { name: 'Billeteras USD (Zinli / Zelle)', value: Math.round(usdTotal), color: '#0041c8' },
      { name: 'Bancos VES (Pago Móvil)', value: Math.round(vesInUsd), color: '#006c49' },
      { name: 'Efectivo en Mano', value: Math.round(cashTotal), color: '#10b981' },
    ];
  }, [accounts, bcvRate]);

  const totalSpent = useMemo(() => {
    return categoryData.reduce((acc, curr) => acc + curr.value, 0);
  }, [categoryData]);

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-[#131b2e] tracking-tight">
            Gráficos & Análisis Financiero
          </h1>
          <p className="text-xs md:text-sm text-[#434656] mt-0.5">
            Métricas de ingresos, gastos bimonetarios, categorías y comportamiento de la tasa cambiaria
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1 p-1 bg-white border border-[#eaedff] rounded-xl shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              timeRange === 'month' ? 'bg-[#0041c8] text-white' : 'text-[#434656] hover:bg-[#f2f3ff]'
            }`}
          >
            Este Mes
          </button>
          <button
            onClick={() => setTimeRange('quarter')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              timeRange === 'quarter' ? 'bg-[#0041c8] text-white' : 'text-[#434656] hover:bg-[#f2f3ff]'
            }`}
          >
            3 Meses
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              timeRange === 'year' ? 'bg-[#0041c8] text-white' : 'text-[#434656] hover:bg-[#f2f3ff]'
            }`}
          >
            Último Año
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#737688] font-semibold mb-1">
            <span>Total Gastos</span>
            <span className="p-1 rounded-md bg-[#ffdadb] text-[#a20030]">
              <TrendingDown className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="font-display text-2xl font-bold text-[#131b2e]">${totalSpent.toFixed(2)}</div>
          <div className="text-[11px] text-[#737688] font-medium mt-0.5">
            ≈ Bs. {(totalSpent * bcvRate).toLocaleString('es-VE')}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#737688] font-semibold mb-1">
            <span>Ingresos del Periodo</span>
            <span className="p-1 rounded-md bg-[#6cf8bb]/40 text-[#006c49]">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="font-display text-2xl font-bold text-[#006c49]">{formatUSD(totalIncome, true)}</div>
          <div className={`text-[11px] font-medium mt-0.5 ${totalIncome - totalSpent >= 0 ? 'text-[#006c49]' : 'text-[#a20030]'}`}>
            {totalIncome - totalSpent >= 0 ? 'Superávit de ' : 'Déficit de '}
            {formatUSD(totalIncome - totalSpent, true)}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#737688] font-semibold mb-1">
            <span>Mayor Categoría</span>
            {categoryData[0] && <span className="text-base">{categoryData[0].emoji}</span>}
          </div>
          <div className="font-display text-2xl font-bold text-[#131b2e]">
            {categoryData[0]?.name || 'Sin gastos aún'}
          </div>
          <div className="text-[11px] text-[#737688] font-medium mt-0.5">
            {categoryData[0] ? `$${categoryData[0].value.toFixed(2)} del total` : 'Anota un gasto para ver esto'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#737688] font-semibold mb-1">
            <span>Tasa BCV Oficial</span>
            <span className="p-1 rounded-md bg-[#eaedff] text-[#0041c8]">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="font-display text-2xl font-bold text-[#0041c8]">
            Bs. {bcvRate.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#006c49] font-medium mt-0.5">
            Tasa de referencia nacional
          </div>
        </div>
      </div>

      {/* Row 1: Monthly Incomes vs Expenses (BarChart) & Category Breakdown (PieChart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Monthly Flow */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-[#131b2e] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#0041c8]" />
                  <span>Flujo Mensual (Ingresos vs Gastos en USD)</span>
                </h3>
                <p className="text-xs text-[#737688]">Comparativa mensual de entradas y salidas de capital</p>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f2f3ff" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#737688' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#737688' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value}`, '']}
                    contentStyle={{ backgroundColor: '#131b2e', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="ingresos" name="Ingresos ($)" fill="#006c49" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos ($)" fill="#0041c8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: Category Distribution */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-base text-[#131b2e] flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-[#006c49]" />
                <span>Distribución por Categorías</span>
              </h3>
            </div>
            <p className="text-xs text-[#737688] mb-4">Porcentaje de egresos acumulados en el período seleccionado</p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
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

            <div className="space-y-2 mt-2 max-h-36 overflow-y-auto no-scrollbar">
              {categoryData.map((item, idx) => {
                const percent = totalSpent > 0 ? Math.round((item.value / totalSpent) * 100) : 0;
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
          </div>
        </div>
      </div>

      {/* Row 2: Exchange Rate Evolution (LineChart) & Asset Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Exchange rate curve */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-base text-[#131b2e] flex items-center gap-2">
                <LineIcon className="w-5 h-5 text-[#f59e0b]" />
                <span>Tus Cambios de Divisas</span>
              </h3>
              <p className="text-xs text-[#737688]">Tasa que usaste en cada cambio USD ↔ VES que has registrado</p>
            </div>
          </div>

          {exchangeHistory.length === 0 ? (
            <div className="h-60 sm:h-64 w-full flex items-center justify-center text-center px-6">
              <p className="text-xs text-[#737688]">
                Aún no has registrado ningún cambio de divisas. Cuando hagas uno, su tasa aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="h-60 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={exchangeHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f2f3ff" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: '#737688' }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#737688' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [`Bs. ${value.toFixed(2)}`, 'Tasa']}
                    contentStyle={{ backgroundColor: '#131b2e', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="tasa" name="Tasa usada" stroke="#0041c8" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right: Patrimonio Bimonetario */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)] flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-[#131b2e] flex items-center gap-2 mb-1">
              <Wallet className="w-5 h-5 text-[#0041c8]" />
              <span>Composición de Fondos</span>
            </h3>
            <p className="text-xs text-[#737688] mb-4">Balance distribuido por instrumento financiero</p>

            <div className="space-y-3">
              {assetDistribution.map((item) => (
                <div key={item.name} className="p-3.5 rounded-2xl border border-[#eaedff] bg-[#faf8ff] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#131b2e]">{item.name}</span>
                    <span className="font-bold text-[#0041c8]">${item.value.toLocaleString('es-VE')}</span>
                  </div>
                  <div className="w-full bg-[#eaedff] h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${Math.min(100, Math.max(10, (item.value / 2500) * 100))}%`,
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-[#737688]">
                    ≈ Bs. {(item.value * bcvRate).toLocaleString('es-VE')} al tipo de cambio
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
