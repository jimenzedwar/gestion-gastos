import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Currency } from '../types';
import { QUICK_CATEGORIES, INCOME_CATEGORIES } from '../data/mockData';
import { X, Delete, ArrowRight, CreditCard, Smartphone, Banknote, Camera, Trash2 } from 'lucide-react';

export const QuickExpenseModal: React.FC = () => {
  const {
    quickExpenseModalOpen,
    setQuickExpenseModalOpen,
    quickTransactionType,
    bcvRate,
    accounts,
    addTransaction,
    attachReceipt,
    showToast
  } = useApp();

  const isIncome = quickTransactionType === 'income';
  const categories = isIncome ? INCOME_CATEGORIES : QUICK_CATEGORIES;

  const [currency, setCurrency] = useState<Currency>('USD');
  const [amountStr, setAmountStr] = useState<string>('0');
  const [concept, setConcept] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0].label);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (quickExpenseModalOpen) {
      setSelectedCategory((isIncome ? INCOME_CATEGORIES : QUICK_CATEGORIES)[0].label);
    }
    // Reset the category whenever the modal opens or switches between income/expense
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickExpenseModalOpen, isIncome]);

  if (!quickExpenseModalOpen) return null;

  if (accounts.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-sm"
        onClick={() => setQuickExpenseModalOpen(false)}
      >
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="text-3xl">🏦</div>
          <h3 className="font-display font-bold text-base text-[#131b2e]">Agrega una cuenta primero</h3>
          <p className="text-xs text-[#737688]">
            Necesitas al menos una cuenta para poder registrar {isIncome ? 'un ingreso' : 'un gasto'}.
          </p>
          <button
            onClick={() => setQuickExpenseModalOpen(false)}
            className="w-full py-2.5 px-4 bg-[#0041c8] text-white rounded-xl text-xs font-display font-bold"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  const currentAmount = parseFloat(amountStr) || 0;
  const convertedAmount = currency === 'USD' ? currentAmount * bcvRate : currentAmount / bcvRate;

  const handleKeypadPress = (val: string) => {
    if (val === 'backspace') {
      setAmountStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else if (val === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr((prev) => prev + '.');
      }
    } else {
      if (amountStr === '0' || amountStr === '') {
        setAmountStr(val);
      } else {
        // limit to 2 decimal places if decimal present
        const parts = amountStr.split('.');
        if (parts.length > 1 && parts[1].length >= 2) return;
        setAmountStr((prev) => prev + val);
      }
    }
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

  const handleSave = async () => {
    if (currentAmount <= 0) {
      showToast('Ingresa un monto válido');
      return;
    }

    const account = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
    const catObj = categories.find((c) => c.label === selectedCategory) || categories[0];

    const usdVal = currency === 'USD' ? currentAmount : currentAmount / bcvRate;
    const vesVal = currency === 'VES' ? currentAmount : currentAmount * bcvRate;
    const sign = isIncome ? 1 : -1;

    setSaving(true);
    const newTx = addTransaction({
      title: concept.trim() || `${catObj.label}`,
      category: catObj.label,
      categoryEmoji: catObj.emoji,
      accountId: account.id,
      accountName: account.name,
      type: isIncome ? 'income' : 'expense',
      currency: currency,
      amount: sign * (currency === 'USD' ? usdVal : vesVal),
      secondaryAmount: sign * (currency === 'USD' ? vesVal : usdVal),
      rate: bcvRate,
      icon: 'receipt',
      note: isIncome ? `Ingreso rápido registrado en ${account.name}` : `Gasto rápido registrado con ${account.name}`,
      beneficiary: {
        name: concept || (isIncome ? 'Fuente de ingreso' : 'Comercio Local'),
        branch: 'Caracas, VE',
        bank: account.name,
      }
    });

    if (receiptFile) {
      await attachReceipt(newTx.id, receiptFile);
    }

    setSaving(false);
    setQuickExpenseModalOpen(false);
    handleRemoveReceipt();
    showToast(`${isIncome ? 'Ingreso registrado' : 'Gasto registrado'}: ${currency === 'USD' ? '$' : 'Bs. '} ${currentAmount.toLocaleString('es-VE')}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#131b2e]/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setQuickExpenseModalOpen(false)}
    >
      <div
        id="quick-expense-modal"
        className="w-full max-w-lg bg-[#faf8ff] rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-[#eaedff] flex flex-col max-h-[92vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 pb-3 border-b border-[#eaedff] flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-[#131b2e]">
              {isIncome ? 'Anotar Ingreso' : 'Anotar Gasto Rápido'}
            </h2>
            <p className="text-xs text-[#737688]">Registro en 3 segundos</p>
          </div>
          <button
            onClick={() => setQuickExpenseModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#f2f3ff] text-[#434656] hover:bg-[#eaedff] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Currency Toggle */}
          <div className="flex justify-center">
            <div className="bg-[#eaedff] p-1 rounded-full flex gap-1 w-48 shadow-inner">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                  currency === 'USD'
                    ? 'bg-[#0041c8] text-white shadow-xs'
                    : 'text-[#434656] hover:text-[#131b2e]'
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('VES')}
                className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                  currency === 'VES'
                    ? 'bg-[#0041c8] text-white shadow-xs'
                    : 'text-[#434656] hover:text-[#131b2e]'
                }`}
              >
                VES (Bs.)
              </button>
            </div>
          </div>

          {/* Amount Display */}
          <div className="text-center py-2">
            <div className="flex items-baseline justify-center gap-2 font-display text-4xl sm:text-5xl font-extrabold text-[#131b2e] tracking-tight">
              <span className="text-[#0041c8]">{currency === 'USD' ? '$' : 'Bs.'}</span>
              <span>{currentAmount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="mt-1 text-xs text-[#434656] font-medium">
              ≈ {currency === 'USD' ? 'Bs.' : '$'}{' '}
              {convertedAmount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="ml-2 px-2 py-0.5 rounded-full bg-[#eaedff] text-[#0041c8] font-bold text-[10px]">
                Tasa: Bs. {bcvRate.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Concept input */}
          <div>
            <label className="block text-xs font-bold text-[#434656] mb-1.5">Concepto / Comercio</label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej: Supermercado Gama, Cafecito, Taxi..."
              className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-[#eaedff] focus:border-[#0055ff] focus:ring-2 focus:ring-[#0055ff]/15 outline-none text-sm font-medium text-[#131b2e]"
            />
          </div>

          {/* Quick Categories */}
          <div>
            <label className="block text-xs font-bold text-[#434656] mb-1.5">Categoría Rápida</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.label;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.label)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-[#0041c8] text-white border-[#0041c8] shadow-sm'
                        : 'bg-white text-[#434656] border-[#eaedff] hover:border-[#0055ff]/40'
                    }`}
                  >
                    <span className="text-lg mb-0.5">{cat.emoji}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Selection */}
          <div>
            <label className="block text-xs font-bold text-[#434656] mb-1.5">
              {isIncome ? 'Recibir en cuenta' : 'Pagar desde cuenta'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {accounts.slice(0, 3).map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-[#eaedff] border-[#0041c8] text-[#0041c8] font-bold ring-1 ring-[#0041c8]'
                        : 'bg-white border-[#eaedff] text-[#434656] hover:bg-[#f2f3ff]'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#faf8ff] border border-[#eaedff] flex items-center justify-center shrink-0">
                      {acc.type === 'usd_wallet' ? (
                        <CreditCard className="w-3.5 h-3.5 text-[#0041c8]" />
                      ) : acc.type === 'ves_bank' ? (
                        <Smartphone className="w-3.5 h-3.5 text-[#006c49]" />
                      ) : (
                        <Banknote className="w-3.5 h-3.5 text-[#10b981]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs truncate">{acc.name}</div>
                      <div className="text-[10px] text-[#737688]">
                        {acc.currency === 'USD' ? '$' : 'Bs.'} {acc.balance.toLocaleString('es-VE')}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-xs font-bold text-[#434656] mb-1.5">Comprobante / Factura (opcional)</label>
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

          {/* Tactile Keypad */}
          <div className="pt-2">
            <div className="grid grid-cols-3 gap-2 bg-[#f2f3ff] p-3 rounded-2xl border border-[#eaedff]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeypadPress(k)}
                  className="h-11 rounded-xl bg-white text-[#131b2e] hover:bg-[#eaedff] font-display font-semibold text-lg flex items-center justify-center shadow-xs transition-transform active:scale-95"
                >
                  {k === 'backspace' ? <Delete className="w-5 h-5 text-[#737688]" /> : k}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer / Save Action */}
        <div className="p-5 pt-2 border-t border-[#eaedff] bg-white">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 px-4 bg-[#0041c8] hover:bg-[#0036a8] disabled:opacity-60 text-white rounded-xl font-display font-bold text-sm shadow-[0_4px_16px_rgba(0,65,200,0.25)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <span>
              {saving
                ? 'Guardando...'
                : `${isIncome ? 'Guardar Ingreso' : 'Guardar Gasto'} (${currency === 'USD' ? '$' : 'Bs.'} ${currentAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })})`}
            </span>
            {!saving && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
