import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Currency } from '../types';
import { QUICK_CATEGORIES } from '../data/mockData';
import { X, Delete, Check, ArrowRight, Zap, CreditCard, Smartphone, Banknote } from 'lucide-react';

export const QuickExpenseModal: React.FC = () => {
  const {
    quickExpenseModalOpen,
    setQuickExpenseModalOpen,
    bcvRate,
    accounts,
    addTransaction,
    showToast,
    setSelectedTx,
    setReceiptModalOpen
  } = useApp();

  const [currency, setCurrency] = useState<Currency>('USD');
  const [amountStr, setAmountStr] = useState<string>('42.30');
  const [concept, setConcept] = useState<string>('Supermercado Gama');
  const [selectedCategory, setSelectedCategory] = useState<string>('Mercado');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || 'zinli-1');

  if (!quickExpenseModalOpen) return null;

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

  const handleSave = () => {
    if (currentAmount <= 0) {
      showToast('Ingresa un monto válido');
      return;
    }

    const account = accounts.find((a) => a.id === selectedAccountId) || accounts[0];
    const catObj = QUICK_CATEGORIES.find((c) => c.label === selectedCategory) || QUICK_CATEGORIES[0];

    const usdVal = currency === 'USD' ? currentAmount : currentAmount / bcvRate;
    const vesVal = currency === 'VES' ? currentAmount : currentAmount * bcvRate;

    const newTx = addTransaction({
      title: concept.trim() || `${catObj.label}`,
      category: catObj.label,
      categoryEmoji: catObj.emoji,
      accountId: account.id,
      accountName: account.name,
      type: 'expense',
      currency: currency,
      amount: currency === 'USD' ? -usdVal : -vesVal,
      secondaryAmount: currency === 'USD' ? -vesVal : -usdVal,
      rate: bcvRate,
      icon: 'receipt',
      note: `Gasto rápido registrado con ${account.name}`,
      beneficiary: {
        name: concept || 'Comercio Local',
        branch: 'Caracas, VE',
        bank: account.name,
      }
    });

    setQuickExpenseModalOpen(false);
    showToast(`Gasto registrado: ${currency === 'USD' ? '$' : 'Bs. '} ${currentAmount.toLocaleString('es-VE')}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#131b2e]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="quick-expense-modal"
        className="w-full max-w-lg bg-[#faf8ff] rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-[#eaedff] flex flex-col max-h-[92vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-6 duration-300"
      >
        {/* Modal Header */}
        <div className="p-5 pb-3 border-b border-[#eaedff] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0041c8] text-white flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#6cf8bb]" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-[#131b2e]">Anotar Gasto Rápido</h2>
              <p className="text-xs text-[#737688]">Registro en 3 segundos</p>
            </div>
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
              {QUICK_CATEGORIES.map((cat) => {
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
            <label className="block text-xs font-bold text-[#434656] mb-1.5">Pagar desde cuenta</label>
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
            className="w-full py-3.5 px-4 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl font-display font-bold text-sm shadow-[0_4px_16px_rgba(0,65,200,0.25)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <span>Guardar Gasto ({currency === 'USD' ? '$' : 'Bs.'} {currentAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
