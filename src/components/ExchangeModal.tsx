import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  ArrowDownUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sliders,
  RotateCcw,
  Lock,
  Camera,
  Trash2
} from 'lucide-react';

export const ExchangeModal: React.FC = () => {
  const {
    exchangeModalOpen,
    setExchangeModalOpen,
    bcvRate,
    accounts,
    businessAccounts,
    employeeAccountIds,
    accountScope,
    performExchange,
    attachReceipt,
    showToast,
    setSelectedTx,
    formatUSD,
    formatVES
  } = useApp();

  const availableAccounts = accountScope
    ? accounts.filter((a) => accountScope.includes(a.id))
    : businessAccounts;

  const [direction, setDirection] = useState<'usd_to_ves' | 'ves_to_usd'>('usd_to_ves');
  const [inputAmount, setInputAmount] = useState<number>(50);
  const [customRate, setCustomRate] = useState<number>(bcvRate);
  const [isCustomRateActive, setIsCustomRateActive] = useState<boolean>(false);

  const [fromAccountId, setFromAccountId] = useState<string>('zinli-1');
  const [toAccountId, setToAccountId] = useState<string>('banesco-pm');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (direction === 'usd_to_ves') {
      const usdAcc = availableAccounts.find((a) => a.currency === 'USD');
      const vesAcc = availableAccounts.find((a) => a.currency === 'VES');
      if (usdAcc) setFromAccountId(usdAcc.id);
      if (vesAcc) setToAccountId(vesAcc.id);
      setInputAmount(50);
    } else {
      const vesAcc = availableAccounts.find((a) => a.currency === 'VES');
      const usdAcc = availableAccounts.find((a) => a.currency === 'USD');
      if (vesAcc) setFromAccountId(vesAcc.id);
      if (usdAcc) setToAccountId(usdAcc.id);
      setInputAmount(7500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, accountScope, exchangeModalOpen]);

  if (!exchangeModalOpen) return null;

  const hasUsdAccount = availableAccounts.some((a) => a.currency === 'USD');
  const hasVesAccount = availableAccounts.some((a) => a.currency === 'VES');

  if (!hasUsdAccount || !hasVesAccount) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-sm"
        onClick={() => setExchangeModalOpen(false)}
      >
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="text-3xl">🏦</div>
          <h3 className="font-display font-bold text-base text-[#131b2e]">Agrega tus cuentas primero</h3>
          <p className="text-xs text-[#737688]">
            Necesitas al menos una cuenta en USD y otra en VES para poder cambiar divisas.
          </p>
          <button
            onClick={() => setExchangeModalOpen(false)}
            className="w-full py-2.5 px-4 bg-[#0041c8] text-white rounded-xl text-xs font-display font-bold"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  const effectiveRate = isCustomRateActive ? customRate : bcvRate;
  const isVesToUsd = direction === 'ves_to_usd';

  const fromAccount = availableAccounts.find((a) => a.id === fromAccountId) || availableAccounts[0];
  const toAccount = availableAccounts.find((a) => a.id === toAccountId) || availableAccounts[1];

  const calculatedOutput = isVesToUsd
    ? (inputAmount > 0 && effectiveRate > 0 ? inputAmount / effectiveRate : 0)
    : inputAmount * effectiveRate;

  const insufficientBalance = inputAmount > fromAccount.balance;
  const isEmployeeExchange = employeeAccountIds.has(fromAccount.id) || employeeAccountIds.has(toAccount.id);
  const receiptMissing = isEmployeeExchange && !receiptFile;

  const handleQuickAdd = (add: number) => {
    setInputAmount((prev) => prev + add);
  };

  const handleSetMax = () => {
    setInputAmount(fromAccount.balance);
  };

  const handleSwap = () => {
    setDirection((prev) => (prev === 'usd_to_ves' ? 'ves_to_usd' : 'usd_to_ves'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const handleRemoveReceipt = () => {
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const handleConfirm = async () => {
    if (inputAmount <= 0) {
      showToast('Ingresa un monto mayor a 0');
      return;
    }

    if (inputAmount > fromAccount.balance) {
      showToast('Saldo insuficiente en la cuenta de origen');
      return;
    }

    if (effectiveRate <= 0) {
      showToast('La tasa debe ser mayor a 0');
      return;
    }

    if (receiptMissing) {
      showToast('Adjunta un comprobante para justificar este cambio');
      return;
    }

    setSaving(true);
    const tx = performExchange(
      inputAmount,
      calculatedOutput,
      fromAccount.id,
      toAccount.id,
      effectiveRate,
      isVesToUsd
    );
    if (receiptFile) {
      await attachReceipt(tx.id, receiptFile);
    }
    setSaving(false);
    handleRemoveReceipt();
    setExchangeModalOpen(false);
    setSelectedTx(tx);
    showToast(
      isVesToUsd
        ? `Cambio exitoso: Bs. ${inputAmount.toLocaleString('es-VE')} ➔ $${calculatedOutput.toFixed(2)} USD`
        : `Cambio exitoso: $${inputAmount.toFixed(2)} ➔ Bs. ${calculatedOutput.toLocaleString('es-VE')}`
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#131b2e]/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setExchangeModalOpen(false)}
    >
      <div
        id="exchange-modal-card"
        className="w-full max-w-lg bg-[#faf8ff] rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-[#eaedff] flex flex-col max-h-[94vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-[#eaedff] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0041c8] text-white flex items-center justify-center shrink-0">
              <ArrowDownUp className="w-4 h-4 text-[#6cf8bb]" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg text-[#131b2e]">Cambiar Divisas</h2>
            </div>
          </div>
          <button
            onClick={() => setExchangeModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#f2f3ff] text-[#434656] hover:bg-[#eaedff] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Direction Switch Pills */}
        <div className="px-4 sm:px-5 pt-3">
          <div className="flex items-center p-1 bg-white border border-[#eaedff] rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={() => setDirection('usd_to_ves')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                direction === 'usd_to_ves' ? 'bg-[#0041c8] text-white shadow-xs' : 'text-[#434656]'
              }`}
            >
              USD ➔ VES
            </button>
            <button
              type="button"
              onClick={() => setDirection('ves_to_usd')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                direction === 'ves_to_usd' ? 'bg-[#0041c8] text-white shadow-xs' : 'text-[#434656]'
              }`}
            >
              VES ➔ USD
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Rate config row */}
          <div className="p-3 bg-[#f2f3ff] rounded-xl border border-[#eaedff] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isCustomRateActive) {
                    setIsCustomRateActive(false);
                    setCustomRate(bcvRate);
                  } else {
                    setIsCustomRateActive(true);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors ${
                  isCustomRateActive
                    ? 'bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a] border border-[#fde68a]'
                    : 'bg-white text-[#0041c8] border border-[#dce1ff] hover:bg-[#eaedff]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isCustomRateActive ? 'Usar Tasa BCV' : 'Modificar Tasa'}</span>
              </button>
              {isCustomRateActive && (
                <input
                  type="number"
                  step="0.01"
                  value={customRate}
                  onChange={(e) => setCustomRate(parseFloat(e.target.value) || bcvRate)}
                  className="w-20 px-2 py-0.5 bg-white rounded border border-[#0041c8] text-xs font-bold font-mono"
                />
              )}
            </div>

            <div className="text-right sm:text-left">
              <span className="text-[#737688] font-semibold block">Tasa aplicada:</span>
              <strong className="text-[#0041c8] font-bold">
                1 USD = Bs. {effectiveRate.toFixed(2)} {isCustomRateActive ? '(Personalizada)' : '(BCV)'}
              </strong>
            </div>
          </div>

          {/* Box 1: You deliver */}
          <div className={`bg-white p-4 rounded-2xl border shadow-xs ${insufficientBalance ? 'border-[#ca1c43]' : 'border-[#eaedff]'}`}>
            <div className="flex items-center justify-between text-xs text-[#434656] font-semibold mb-2">
              <span>Tú entregas</span>
              <span className="truncate max-w-[180px]">
                Disponible:{' '}
                <strong className="text-[#0041c8]">
                  {isVesToUsd ? formatVES(fromAccount.balance) : formatUSD(fromAccount.balance)}
                </strong>
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 font-display text-2xl sm:text-3xl font-extrabold text-[#131b2e] min-w-0 flex-1">
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
            <div className="mt-2 pt-2 border-t border-[#f2f3ff] text-xs text-[#737688]">
              Desde: <strong className="text-[#131b2e]">{fromAccount.name}</strong>
            </div>
            {insufficientBalance && (
              <div className="mt-2 text-xs font-semibold text-[#a20030]">
                Saldo insuficiente: solo tienes {isVesToUsd ? formatVES(fromAccount.balance) : formatUSD(fromAccount.balance)} disponible.
              </div>
            )}
          </div>

          {/* Quick chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {(isVesToUsd ? [500, 1000, 5000, 15000] : [10, 20, 50, 100]).map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd(amt)}
                className="px-2.5 py-1 bg-white hover:bg-[#eaedff] border border-[#eaedff] rounded-full text-xs font-bold text-[#0041c8] shrink-0 transition-colors"
              >
                +{isVesToUsd ? `Bs. ${amt}` : `$${amt}`}
              </button>
            ))}
            <button
              type="button"
              onClick={handleSetMax}
              className="px-3 py-1 bg-[#dce1ff] hover:bg-[#b6c4ff] rounded-full text-xs font-bold text-[#001551] shrink-0 transition-colors ml-auto"
            >
              Máximo
            </button>
          </div>

          {/* Central Swap Divider */}
          <div className="relative flex items-center justify-center my-0.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#eaedff]"></div>
            </div>
            <button
              type="button"
              onClick={handleSwap}
              className="relative z-10 w-8 h-8 rounded-full bg-[#0041c8] text-white flex items-center justify-center shadow-md hover:bg-[#0036a8]"
            >
              <ArrowDownUp className="w-3.5 h-3.5 text-[#6cf8bb]" />
            </button>
          </div>

          {/* Box 2: You receive */}
          <div className="bg-[#f2f3ff] p-4 rounded-2xl border border-[#eaedff] shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#434656] font-semibold mb-2">
              <span>Tú recibes (Inmediato)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6cf8bb] text-[#00714d] font-bold">
                Acreditación Inmediata
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 font-display text-2xl sm:text-3xl font-extrabold text-[#006c49] min-w-0 flex-1">
                <span className="text-lg font-bold">{isVesToUsd ? '$' : 'Bs.'}</span>
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
            <div className="mt-2 pt-2 border-t border-[#eaedff] text-xs text-[#737688]">
              Hacia: <strong className="text-[#131b2e]">{toAccount.name}</strong>
            </div>
          </div>

          {isEmployeeExchange && (
            <div>
              <label className="block text-xs font-bold text-[#434656] mb-1.5">
                Comprobante del cambio (obligatorio)
              </label>
              {receiptPreview ? (
                <div className="relative">
                  <img src={receiptPreview} alt="Comprobante" className="w-full max-h-40 object-cover rounded-xl border border-[#eaedff]" />
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#131b2e]/70 text-white flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white border border-dashed border-[#c3c5d9] rounded-xl text-xs font-semibold text-[#434656] cursor-pointer hover:border-[#0041c8] hover:text-[#0041c8] transition-colors">
                  <Camera className="w-4 h-4" />
                  <span>Tomar foto o elegir archivo</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>
          )}
        </div>

        {/* Confirm Footer */}
        <div className="p-4 sm:p-5 pt-2 border-t border-[#eaedff] bg-white">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={insufficientBalance || inputAmount <= 0 || receiptMissing || saving}
            className="w-full py-3.5 px-4 bg-[#0041c8] hover:bg-[#0036a8] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-display font-bold text-sm shadow-[0_4px_16px_rgba(0,65,200,0.25)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <span>
              {saving
                ? 'Guardando...'
                : insufficientBalance
                ? 'Saldo insuficiente'
                : receiptMissing
                ? 'Adjunta un comprobante'
                : 'Confirmar Operación'}
            </span>
            {!saving && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
