import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Copy, Repeat } from 'lucide-react';
import { ReceiptImage } from './ReceiptImage';

export const ReceiptTicketModal: React.FC = () => {
  const {
    receiptModalOpen,
    setReceiptModalOpen,
    selectedTx,
    showToast,
    bcvRate,
    setQuickExpenseModalOpen,
    setExchangeModalOpen
  } = useApp();

  if (!receiptModalOpen || !selectedTx) return null;

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(selectedTx.reference);
    showToast('Referencia copiada: ' + selectedTx.reference);
  };

  const isUSD = selectedTx.currency === 'USD';
  const displayAmount = Math.abs(selectedTx.amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displaySecondary = Math.abs(selectedTx.secondaryAmount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setReceiptModalOpen(false)}
    >
      <div
        id="transaction-receipt-modal"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#eaedff] flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="p-4 px-5 border-b border-[#eaedff] flex items-center justify-between">
          <span className="font-display font-bold text-sm text-[#131b2e]">Resumen del movimiento</span>
          <button
            onClick={() => setReceiptModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#f2f3ff] text-[#434656] hover:bg-[#eaedff] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#f2f3ff] mx-auto flex items-center justify-center text-2xl mb-3">
              {selectedTx.categoryEmoji || '💸'}
            </div>
            <h3 className="font-display font-bold text-xl text-[#131b2e]">{selectedTx.title}</h3>
            {selectedTx.note && <p className="text-xs text-[#737688] mt-1">{selectedTx.note}</p>}
          </div>

          {/* Amount */}
          <div className="p-4 bg-[#f2f3ff] rounded-2xl text-center border border-[#eaedff]">
            <div className="font-display text-3xl font-extrabold text-[#0041c8] tracking-tight">
              {isUSD ? `$ ${displayAmount}` : `Bs. ${displayAmount}`}
            </div>
            <div className="text-xs font-semibold text-[#434656] mt-1">
              ≈ {isUSD ? `Bs. ${displaySecondary}` : `$ ${displaySecondary}`} · Tasa: Bs. {(selectedTx.rate || bcvRate).toFixed(2)}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[#f2f3ff]">
              <span className="text-[#737688]">Fecha</span>
              <strong className="text-[#131b2e] font-semibold">{selectedTx.date}</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#f2f3ff]">
              <span className="text-[#737688]">Cuenta</span>
              <strong className="text-[#131b2e] font-semibold">{selectedTx.accountName}</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#f2f3ff]">
              <span className="text-[#737688]">Categoría</span>
              <strong className="text-[#131b2e] font-semibold">{selectedTx.category}</strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[#737688]">Referencia</span>
              <div className="flex items-center gap-1.5">
                <strong className="text-[#0041c8] font-bold font-mono">{selectedTx.reference}</strong>
                <button
                  onClick={handleCopyRef}
                  className="p-1 hover:bg-[#eaedff] text-[#0041c8] rounded transition-colors"
                  title="Copiar referencia"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {selectedTx.receiptPath && <ReceiptImage path={selectedTx.receiptPath} />}

          <button
            onClick={() => {
              setReceiptModalOpen(false);
              if (selectedTx.type === 'exchange') {
                setExchangeModalOpen(true);
              } else {
                setQuickExpenseModalOpen(true);
              }
            }}
            className="w-full py-2.5 px-3 bg-white hover:bg-[#f2f3ff] text-[#131b2e] border border-[#eaedff] rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Repetir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
