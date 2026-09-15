import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowDownUp, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  RefreshCw,
  Info,
  Building2,
  Lock,
  Sliders,
  RotateCcw
} from 'lucide-react';

export const ExchangeScreen: React.FC = () => {
  const {
    bcvRate,
    accounts,
    performExchange,
    showToast,
    setSelectedTx,
    setReceiptModalOpen,
    formatUSD,
    formatVES
  } = useApp();

  const [direction, setDirection] = useState<'usd_to_ves' | 'ves_to_usd'>('usd_to_ves');
  const [inputAmount, setInputAmount] = useState<number>(50);
  const [customRate, setCustomRate] = useState<number>(bcvRate);
  const [isCustomRateActive, setIsCustomRateActive] = useState<boolean>(false);

  const [fromAccountId, setFromAccountId] = useState<string>('zinli-1');
  const [toAccountId, setToAccountId] = useState<string>('banesco-pm');
  const [timeLeft, setTimeLeft] = useState<number>(899); // 14:59 timer

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 899));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update default accounts when direction toggles
  useEffect(() => {
    if (direction === 'usd_to_ves') {
      const usdAcc = accounts.find((a) => a.currency === 'USD');
      const vesAcc = accounts.find((a) => a.currency === 'VES');
      if (usdAcc) setFromAccountId(usdAcc.id);
      if (vesAcc) setToAccountId(vesAcc.id);
      setInputAmount(50);
    } else {
      const vesAcc = accounts.find((a) => a.currency === 'VES');
      const usdAcc = accounts.find((a) => a.currency === 'USD');
      if (vesAcc) setFromAccountId(vesAcc.id);
      if (usdAcc) setToAccountId(usdAcc.id);
      setInputAmount(7500);
    }
  }, [direction, accounts]);

  const effectiveRate = isCustomRateActive ? customRate : bcvRate;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const fromAccount = accounts.find((a) => a.id === fromAccountId) || accounts[0];
  const toAccount = accounts.find((a) => a.id === toAccountId) || accounts[1];

  // Calculations
  const isVesToUsd = direction === 'ves_to_usd';
  const calculatedOutput = isVesToUsd 
    ? (inputAmount > 0 && effectiveRate > 0 ? inputAmount / effectiveRate : 0)
    : inputAmount * effectiveRate;

  const handleSwapDirection = () => {
    setDirection((prev) => (prev === 'usd_to_ves' ? 'ves_to_usd' : 'usd_to_ves'));
  };

  const handleQuickAdd = (add: number) => {
    setInputAmount((prev) => prev + add);
  };

  const handleSetMax = () => {
    setInputAmount(fromAccount.balance);
  };

  const handleConfirm = () => {
    if (inputAmount <= 0) {
      showToast('Ingresa un monto válido');
      return;
    }
    if (inputAmount > fromAccount.balance) {
      showToast('Saldo insuficiente en la cuenta de origen');
      return;
    }
    if (effectiveRate <= 0) {
      showToast('Ingresa una tasa de cambio válida mayor a 0');
      return;
    }

    const tx = performExchange(
      inputAmount, 
      calculatedOutput, 
      fromAccount.id, 
      toAccount.id, 
      effectiveRate, 
      isVesToUsd
    );

    setSelectedTx(tx);
    setReceiptModalOpen(true);
    showToast(
      isVesToUsd
        ? `Cambio completado: Bs. ${inputAmount.toLocaleString('es-VE')} ➔ $${calculatedOutput.toFixed(2)} USD`
        : `Cambio completado: $${inputAmount.toFixed(2)} USD ➔ Bs. ${calculatedOutput.toLocaleString('es-VE')}`
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-[#131b2e] tracking-tight">
            Cambio de Divisas
          </h1>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[#0041c8] font-bold">
            {direction === 'usd_to_ves' ? 'Dólares a Bolívares' : 'Bolívares a Dólares'}
          </span>
          {isCustomRateActive && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] font-bold">
              Tasa Personalizada
            </span>
          )}
        </div>
        <p className="text-xs md:text-sm text-[#434656] mt-0.5">
          Convierte divisas en segundos con acreditación inmediata en cuentas bancarias y billeteras
        </p>
      </div>

      {/* Direction Pill Selector */}
      <div className="flex items-center p-1 bg-white border border-[#eaedff] rounded-2xl shadow-xs">
        <button
          type="button"
          onClick={() => setDirection('usd_to_ves')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-display font-bold transition-all text-center ${
            direction === 'usd_to_ves'
              ? 'bg-[#0041c8] text-white shadow-xs'
              : 'text-[#434656] hover:bg-[#f2f3ff]'
          }`}
        >
          USD ➔ VES (Dólar a Bolívar)
        </button>
        <button
          type="button"
          onClick={() => setDirection('ves_to_usd')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-display font-bold transition-all text-center ${
            direction === 'ves_to_usd'
              ? 'bg-[#0041c8] text-white shadow-xs'
              : 'text-[#434656] hover:bg-[#f2f3ff]'
          }`}
        >
          VES ➔ USD (Bolívar a Dólar)
        </button>
      </div>

      {/* Main Card container */}
      <div className="bg-white rounded-3xl border border-[#eaedff] shadow-[0_8px_30px_rgba(19,27,46,0.04)] p-4 sm:p-6 md:p-8 space-y-5">
        {/* Rate Settings Card (Rate is by default BCV, but can vary) */}
        <div className="p-4 bg-[#f2f3ff] rounded-2xl border border-[#eaedff] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0041c8] text-white flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-[#6cf8bb]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#131b2e]">
                  {isCustomRateActive ? 'Tasa Libre / Personalizada Aplicada' : 'Tasa Oficial BCV por Defecto'}
                </div>
                <div className="text-[11px] text-[#006c49] font-semibold">
                  1 USD = Bs. {effectiveRate.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  if (isCustomRateActive) {
                    setIsCustomRateActive(false);
                    setCustomRate(bcvRate);
                    showToast('Restablecido a Tasa Oficial BCV');
                  } else {
                    setIsCustomRateActive(true);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  isCustomRateActive
                    ? 'bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a]'
                    : 'bg-white text-[#0041c8] hover:bg-[#eaedff] border border-[#eaedff]'
                }`}
              >
                {isCustomRateActive ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Usar Tasa BCV</span>
                  </>
                ) : (
                  <>
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Modificar Tasa</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full text-xs font-mono font-bold text-[#0041c8] shadow-xs shrink-0">
                <Clock className="w-3 h-3 text-[#0041c8]" />
                <span>{timerDisplay}</span>
              </div>
            </div>
          </div>

          {/* If Custom Rate is active, show editable input */}
          {isCustomRateActive && (
            <div className="pt-2 border-t border-[#eaedff]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-200">
              <div className="text-xs text-[#434656] font-medium">
                Ingresa la tasa negociada o del mercado libre:
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#131b2e]">Bs./USD</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={customRate}
                  onChange={(e) => setCustomRate(parseFloat(e.target.value) || bcvRate)}
                  className="w-28 px-2.5 py-1 bg-white rounded-lg border border-[#0041c8] font-mono font-bold text-sm text-[#131b2e] outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Box 1: You deliver */}
        <div className="p-4 sm:p-5 bg-[#faf8ff] rounded-2xl border border-[#eaedff] space-y-3">
          <div className="flex items-center justify-between text-xs text-[#434656] font-semibold">
            <span>Tú entregas</span>
            <span className="truncate max-w-[200px] text-right">
              Disponible:{' '}
              <strong className="text-[#0041c8]">
                {isVesToUsd ? formatVES(fromAccount.balance) : formatUSD(fromAccount.balance)}
              </strong>
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-1.5 font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#131b2e] min-w-0 flex-1">
              <span className="text-[#0041c8]">{isVesToUsd ? 'Bs.' : '$'}</span>
              <input
                type="number"
                min="1"
                step="any"
                value={inputAmount || ''}
                onChange={(e) => setInputAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-transparent outline-none font-bold min-w-0"
              />
            </div>
            <div className="px-3 py-1.5 bg-[#eaedff] rounded-full text-xs font-bold text-[#0041c8] shrink-0">
              {isVesToUsd ? 'VES (Bs.)' : 'USD ($)'}
            </div>
          </div>

          <div className="pt-3 border-t border-[#eaedff] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-[#737688]">Cuenta de débito:</span>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="bg-white px-2.5 py-1.5 rounded-lg border border-[#eaedff] font-semibold text-[#131b2e] outline-none text-xs w-full sm:w-auto"
            >
              {accounts
                .filter((a) => (isVesToUsd ? a.currency === 'VES' : a.currency === 'USD'))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({isVesToUsd ? formatVES(a.balance) : formatUSD(a.balance)})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Quick Amount Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {(isVesToUsd ? [500, 1000, 5000, 15000] : [10, 20, 50, 100]).map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleQuickAdd(amt)}
              className="px-3 py-1 bg-white hover:bg-[#eaedff] border border-[#eaedff] rounded-full text-xs font-bold text-[#0041c8] shrink-0 transition-colors"
            >
              +{isVesToUsd ? `Bs. ${amt.toLocaleString('es-VE')}` : `$${amt}`}
            </button>
          ))}
          <button
            type="button"
            onClick={handleSetMax}
            className="px-3.5 py-1 bg-[#dce1ff] hover:bg-[#b6c4ff] rounded-full text-xs font-bold text-[#001551] shrink-0 transition-colors ml-auto"
          >
            Máximo
          </button>
        </div>

        {/* Central Swap Button */}
        <div className="relative flex items-center justify-center my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#eaedff]"></div>
          </div>
          <button
            type="button"
            onClick={handleSwapDirection}
            title="Invertir dirección del cambio"
            className="relative z-10 w-11 h-11 rounded-full bg-[#0041c8] hover:bg-[#0036a8] text-white flex items-center justify-center shadow-md active:scale-95 transition-all group"
          >
            <ArrowDownUp className="w-5 h-5 text-[#6cf8bb] group-hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>

        {/* Box 2: You receive */}
        <div className="p-4 sm:p-5 bg-[#f2f3ff] rounded-2xl border border-[#eaedff] space-y-3">
          <div className="flex items-center justify-between text-xs text-[#434656] font-semibold">
            <span>Tú recibes (Inmediato)</span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#6cf8bb] text-[#00714d] font-bold">
              Acreditación Inmediata
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-1.5 font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#006c49] min-w-0 flex-1">
              <span className="text-xl font-bold">{isVesToUsd ? '$' : 'Bs.'}</span>
              <span className="truncate">
                {isVesToUsd
                  ? calculatedOutput.toFixed(2)
                  : calculatedOutput.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="px-3 py-1.5 bg-[#6cf8bb]/50 rounded-full text-xs font-bold text-[#00714d] shrink-0">
              {isVesToUsd ? 'USD ($)' : 'VES (Bs.)'}
            </div>
          </div>

          <div className="pt-3 border-t border-[#eaedff] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-[#737688]">Cuenta acreditada:</span>
            <select
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              className="bg-white px-2.5 py-1.5 rounded-lg border border-[#eaedff] font-semibold text-[#131b2e] outline-none text-xs w-full sm:w-auto"
            >
              {accounts
                .filter((a) => (isVesToUsd ? a.currency === 'USD' : a.currency === 'VES'))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({isVesToUsd ? formatUSD(a.balance) : formatVES(a.balance)})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Transaction Summary Table */}
        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] space-y-2.5 text-xs">
          <div className="flex justify-between text-[#434656]">
            <span>Tasa de cambio aplicada:</span>
            <strong className="text-[#131b2e]">
              1 USD = Bs. {effectiveRate.toFixed(2)}{' '}
              {isCustomRateActive ? '(Tasa Libre)' : '(Oficial BCV)'}
            </strong>
          </div>
          <div className="flex justify-between text-[#434656]">
            <span>Comisión de servicio:</span>
            <strong className="text-[#006c49]">Bs. 0,00 (Sin comisiones)</strong>
          </div>
          <div className="flex justify-between text-[#434656]">
            <span>Canal de liquidación:</span>
            <strong className="text-[#131b2e]">
              {toAccount.name} ({toAccount.phone || 'Inmediato'})
            </strong>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-4 px-6 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-2xl font-display font-bold text-sm sm:text-base shadow-[0_8px_24px_rgba(0,65,200,0.28)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <span>
            {isVesToUsd
              ? `Confirmar Cambio (Bs. ${inputAmount.toLocaleString('es-VE')} ➔ $${calculatedOutput.toFixed(2)} USD)`
              : `Confirmar Cambio ($${inputAmount.toFixed(2)} ➔ Bs. ${calculatedOutput.toLocaleString('es-VE', { maximumFractionDigits: 0 })})`}
          </span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
