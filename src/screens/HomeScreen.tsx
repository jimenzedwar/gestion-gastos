import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Eye, 
  EyeOff, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Repeat, 
  MoreHorizontal, 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Calculator, 
  Copy, 
  Check, 
  TrendingUp, 
  Zap, 
  Building2, 
  Calendar, 
  Target,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const {
    totalBalanceUSD,
    totalBalanceVES,
    hideBalances,
    toggleHideBalances,
    bcvRate,
    accounts,
    transactions,
    savingsGoal,
    setCurrentTab,
    setQuickExpenseModalOpen,
    setExchangeModalOpen,
    setSelectedTx,
    setReceiptModalOpen,
    showToast,
    formatUSD,
    formatVES
  } = useApp();

  // Pago Móvil Quick Calculator State
  const [calcUsd, setCalcUsd] = useState<string>('25');
  const [calcCopied, setCalcCopied] = useState<boolean>(false);

  const calcNum = parseFloat(calcUsd) || 0;
  const calcVes = calcNum * bcvRate;

  const handleCopyPagoMovil = () => {
    const formattedBs = calcVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    navigator.clipboard?.writeText(formattedBs);
    setCalcCopied(true);
    showToast(`Monto copiado: Bs. ${formattedBs}`);
    setTimeout(() => setCalcCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* Top Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-[#131b2e] tracking-tight">
            Hola, Alejandro 👋
          </h1>
          <p className="text-xs md:text-sm text-[#434656] mt-0.5">
            Así se mueve tu dinero hoy en Caracas · Tasa BCV: <strong className="text-[#0041c8]">Bs. {bcvRate.toFixed(2)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setQuickExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0041c8] text-white rounded-xl text-xs font-display font-bold shadow-md hover:bg-[#0036a8] transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 text-[#6cf8bb]" />
            <span>Anotar Gasto</span>
          </button>
          <button
            onClick={() => setExchangeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#0041c8] border border-[#eaedff] rounded-xl text-xs font-display font-bold shadow-xs hover:bg-[#f2f3ff] transition-all"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Cambiar USD</span>
          </button>
        </div>
      </div>

      {/* Main Balance Hero Card (Visual Wallet Pass style) */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0041c8] via-[#0036a8] to-[#002166] text-white p-6 sm:p-8 shadow-[0_16px_36px_rgba(0,65,200,0.28)]">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#0055ff]/40 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-[#6cf8bb]/20 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#e3e6ff] tracking-wide uppercase">
                Patrimonio Total Disponible
              </span>
              <button
                onClick={toggleHideBalances}
                className="p-1 text-[#e3e6ff]/80 hover:text-white rounded-full transition-colors"
                title={hideBalances ? 'Mostrar saldos' : 'Ocultar saldos'}
              >
                {hideBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-[#6cf8bb]">
              + $180,00 esta semana
            </span>
          </div>

          {/* Amount Display */}
          <div className="my-2">
            <div className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">
              {formatUSD(totalBalanceUSD)}
            </div>
            <div className="font-display text-sm sm:text-lg font-semibold text-[#6cf8bb] mt-1">
              ≈ {formatVES(totalBalanceVES)}
            </div>
          </div>

          {/* Savings goal progress bar strip */}
          <div className="mt-5 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#e3e6ff] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#6cf8bb]" />
                {savingsGoal.title}
              </span>
              <span className="font-bold text-white">
                {savingsGoal.percentage}% ({formatUSD(savingsGoal.currentAmount)} / {formatUSD(savingsGoal.targetAmount)})
              </span>
            </div>
            <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#6cf8bb] to-[#4edea3] h-full rounded-full transition-all duration-500"
                style={{ width: `${savingsGoal.percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Quick Action Button Grid */}
          <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-4 pt-2">
            <button
              onClick={() => {
                showToast('Selecciona la cuenta para recargar');
                setCurrentTab('perfil');
              }}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md transition-all active:scale-95 text-center group"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ArrowDownLeft className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-bold text-[#e3e6ff]">Ingresar</span>
            </button>

            <button
              onClick={() => setQuickExpenseModalOpen(true)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md transition-all active:scale-95 text-center group"
            >
              <div className="w-10 h-10 rounded-full bg-[#ca1c43] flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <ArrowUpRight className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-bold text-[#e3e6ff]">Gastar</span>
            </button>

            <button
              onClick={() => setExchangeModalOpen(true)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md transition-all active:scale-95 text-center group"
            >
              <div className="w-10 h-10 rounded-full bg-[#006c49] flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Repeat className="w-5 h-5 text-[#6cf8bb]" />
              </div>
              <span className="text-[11px] font-bold text-[#e3e6ff]">Cambiar</span>
            </button>

            <button
              onClick={() => setCurrentTab('movimientos')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md transition-all active:scale-95 text-center group"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MoreHorizontal className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-bold text-[#e3e6ff]">Más</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Accounts & Pago Movil Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Mis Cuentas / Bolsillos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-[#131b2e] flex items-center gap-2">
              <span>Mis Cuentas & Bolsillos</span>
              <span className="text-xs font-normal text-[#737688]">({accounts.length})</span>
            </h2>
            <button
              onClick={() => setCurrentTab('perfil')}
              className="text-xs font-bold text-[#0041c8] hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {accounts.slice(0, 4).map((acc) => {
              const isUSD = acc.currency === 'USD';
              const equivalent = isUSD ? acc.balance * bcvRate : acc.balance / bcvRate;

              return (
                <div
                  key={acc.id}
                  onClick={() => setCurrentTab('perfil')}
                  className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)] hover:shadow-md hover:border-[#0055ff]/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#f2f3ff] text-[#0041c8] flex items-center justify-center group-hover:scale-105 transition-transform">
                        {acc.type === 'usd_wallet' ? (
                          <CreditCard className="w-5 h-5" />
                        ) : acc.type === 'ves_bank' ? (
                          <Smartphone className="w-5 h-5 text-[#006c49]" />
                        ) : (
                          <Wallet className="w-5 h-5 text-[#10b981]" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm text-[#131b2e] leading-tight group-hover:text-[#0041c8] transition-colors">
                          {acc.name}
                        </h3>
                        <p className="text-[11px] text-[#737688]">{acc.accountNumber || acc.statusText}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isUSD ? 'bg-[#eaedff] text-[#0041c8]' : 'bg-[#6cf8bb]/40 text-[#00714d]'
                    }`}>
                      {acc.currency}
                    </span>
                  </div>

                  <div className="pt-1 border-t border-[#f2f3ff] flex items-baseline justify-between">
                    <div>
                      <div className="font-display text-lg font-extrabold text-[#131b2e]">
                        {isUSD ? formatUSD(acc.balance) : formatVES(acc.balance)}
                      </div>
                      <div className="text-[11px] font-medium text-[#737688]">
                        ≈ {isUSD ? formatVES(equivalent) : formatUSD(equivalent)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickExpenseModalOpen(true);
                      }}
                      className="text-xs text-[#0041c8] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
                    >
                      Usar <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Pago Móvil Instant Calculator */}
        <div className="bg-white p-5 rounded-2xl border border-[#eaedff] shadow-[0_2px_12px_rgba(19,27,46,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#6cf8bb]/30 text-[#006c49] flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-[#131b2e]">Calculadora Pago Móvil</h3>
                  <p className="text-[11px] text-[#737688]">A tasa BCV en tiempo real</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-[#eaedff] text-[#0041c8] rounded-full font-bold">
                1 Clic
              </span>
            </div>

            {/* Input USD */}
            <div className="space-y-3 my-3">
              <div>
                <label className="block text-xs font-semibold text-[#434656] mb-1">Monto a pagar en USD ($)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-bold text-[#0041c8]">$</span>
                  <input
                    type="number"
                    value={calcUsd}
                    onChange={(e) => setCalcUsd(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-[#f2f3ff] rounded-xl font-bold text-base text-[#131b2e] outline-none border border-transparent focus:border-[#0041c8]"
                    placeholder="25.00"
                  />
                </div>
              </div>

              {/* Calculated Result in VES */}
              <div className="p-3.5 bg-[#f2f3ff] rounded-xl border border-[#eaedff]">
                <div className="text-[11px] font-semibold text-[#737688] mb-1">Total a transferir en Bolívares:</div>
                <div className="font-display text-2xl font-extrabold text-[#006c49] tracking-tight">
                  Bs. {calcVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-[#434656] mt-0.5">
                  Tasa: Bs. {bcvRate.toFixed(2)} por dólar
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleCopyPagoMovil}
              className={`w-full py-2.5 px-3 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                calcCopied
                  ? 'bg-[#006c49] text-white'
                  : 'bg-[#0041c8] hover:bg-[#0036a8] text-white'
              }`}
            >
              {calcCopied ? (
                <>
                  <Check className="w-4 h-4 text-[#6cf8bb]" />
                  <span>¡Monto Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Monto en Bolívares</span>
                </>
              )}
            </button>

            <button
              onClick={() => setCalcUsd('0')}
              className="w-full py-1.5 text-center text-xs text-[#737688] hover:text-[#131b2e] font-semibold"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Budget & Spending Categories Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-[#eaedff] shadow-[0_2px_12px_rgba(19,27,46,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-bold text-lg text-[#131b2e]">
              ¿En qué he gastado este mes?
            </h2>
            <p className="text-xs text-[#434656]">Desglose de gastos en divisas y bolívares</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 bg-[#6cf8bb]/30 text-[#00714d] font-bold rounded-full">
              Vas $42 por debajo del límite previsto
            </span>
          </div>
        </div>

        {/* Categories Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Item 1 */}
          <div className="p-3 bg-[#faf8ff] rounded-xl border border-[#eaedff]">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="flex items-center gap-1.5 text-[#131b2e]">
                <span>🛒</span> Comida & Mercado
              </span>
              <span className="text-[#0041c8] font-bold">$210,00 (Bs. 31.500) · 41%</span>
            </div>
            <div className="w-full bg-[#eaedff] h-2.5 rounded-full overflow-hidden">
              <div className="bg-[#0041c8] h-full rounded-full" style={{ width: '41%' }}></div>
            </div>
          </div>

          {/* Item 2 */}
          <div className="p-3 bg-[#faf8ff] rounded-xl border border-[#eaedff]">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="flex items-center gap-1.5 text-[#131b2e]">
                <span>🏦</span> Ahorro Retenido
              </span>
              <span className="text-[#006c49] font-bold">$150,00 (Bs. 22.500) · 29%</span>
            </div>
            <div className="w-full bg-[#eaedff] h-2.5 rounded-full overflow-hidden">
              <div className="bg-[#006c49] h-full rounded-full" style={{ width: '29%' }}></div>
            </div>
          </div>

          {/* Item 3 */}
          <div className="p-3 bg-[#faf8ff] rounded-xl border border-[#eaedff]">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="flex items-center gap-1.5 text-[#131b2e]">
                <span>☕</span> Salidas & Cafecito
              </span>
              <span className="text-[#a20030] font-bold">$90,00 (Bs. 13.500) · 18%</span>
            </div>
            <div className="w-full bg-[#eaedff] h-2.5 rounded-full overflow-hidden">
              <div className="bg-[#ca1c43] h-full rounded-full" style={{ width: '18%' }}></div>
            </div>
          </div>

          {/* Item 4 */}
          <div className="p-3 bg-[#faf8ff] rounded-xl border border-[#eaedff]">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="flex items-center gap-1.5 text-[#131b2e]">
                <span>💡</span> Servicios & Fibra NetUno
              </span>
              <span className="text-[#737688] font-bold">$65,00 (Bs. 9.750) · 12%</span>
            </div>
            <div className="w-full bg-[#eaedff] h-2.5 rounded-full overflow-hidden">
              <div className="bg-[#737688] h-full rounded-full" style={{ width: '12%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity / Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-[#131b2e]">
            Últimos Movimientos
          </h2>
          <button
            onClick={() => setCurrentTab('movimientos')}
            className="text-xs font-bold text-[#0041c8] hover:underline flex items-center gap-1"
          >
            Ver todos los movimientos <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_12px_rgba(19,27,46,0.03)] divide-y divide-[#f2f3ff] overflow-hidden">
          {transactions.slice(0, 5).map((tx) => {
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
                className="p-4 hover:bg-[#faf8ff] transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base shrink-0 ${
                    isExpense ? 'bg-[#ffdadb] text-[#a20030]' : isIncome ? 'bg-[#6cf8bb]/40 text-[#006c49]' : 'bg-[#dce1ff] text-[#0041c8]'
                  }`}>
                    {tx.categoryEmoji || '💸'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-bold text-sm text-[#131b2e] truncate group-hover:text-[#0041c8] transition-colors">
                      {tx.title}
                    </div>
                    <div className="text-xs text-[#737688] flex items-center gap-2 mt-0.5">
                      <span>{tx.accountName}</span>
                      <span>·</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`font-display font-bold text-sm sm:text-base ${
                    isExpense ? 'text-[#131b2e]' : isIncome ? 'text-[#006c49]' : 'text-[#0041c8]'
                  }`}>
                    {isUSD ? formatUSD(tx.amount, true) : formatVES(tx.amount, true)}
                  </div>
                  <div className="text-[11px] text-[#737688] font-medium">
                    ≈ {isUSD ? formatVES(tx.secondaryAmount) : formatUSD(tx.secondaryAmount)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
