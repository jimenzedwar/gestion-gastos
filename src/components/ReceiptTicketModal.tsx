import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  CheckCircle2, 
  Copy, 
  Share2, 
  Download, 
  Repeat, 
  ShieldCheck, 
  Building2, 
  Smartphone,
  Calendar,
  Hash,
  QrCode
} from 'lucide-react';

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

  const handleShareWhatsApp = () => {
    const text = `*Comprobante Monedero*%0A` +
      `Operación: ${selectedTx.title}%0A` +
      `Monto: ${selectedTx.currency === 'USD' ? '$' : 'Bs. '} ${Math.abs(selectedTx.amount).toLocaleString('es-VE')}%0A` +
      `Referencia: ${selectedTx.reference}%0A` +
      `Fecha: ${selectedTx.date}%0A` +
      `Tasa: Bs. ${selectedTx.rate || bcvRate}`;
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    showToast('Generando enlace de WhatsApp...');
  };

  const handleDownloadReceipt = () => {
    showToast('Comprobante digital descargado con éxito');
  };

  const isUSD = selectedTx.currency === 'USD';
  const displayAmount = Math.abs(selectedTx.amount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displaySecondary = Math.abs(selectedTx.secondaryAmount).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="transaction-receipt-modal"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#eaedff] flex flex-col max-h-[95vh] overflow-y-auto no-scrollbar relative animate-in zoom-in-95 duration-200"
      >
        {/* Top bar */}
        <div className="p-4 px-5 border-b border-[#eaedff] flex items-center justify-between bg-[#faf8ff] rounded-t-3xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#006c49]"></span>
            <span className="font-display font-bold text-sm text-[#131b2e]">Comprobante Oficial</span>
          </div>
          <button
            onClick={() => setReceiptModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white text-[#434656] hover:bg-[#eaedff] flex items-center justify-center transition-colors border border-[#eaedff]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ticket Content */}
        <div className="p-6 relative bg-white">
          {/* Green verification badge */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-16 h-16 rounded-full bg-[#6cf8bb]/30 flex items-center justify-center mb-3 ring-8 ring-[#6cf8bb]/15">
              <CheckCircle2 className="w-10 h-10 text-[#006c49]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#006c49] bg-[#6cf8bb]/40 px-3 py-1 rounded-full mb-1.5">
              {selectedTx.status || 'Operación Exitosa'}
            </span>
            <h3 className="font-display font-bold text-2xl text-[#131b2e]">
              {selectedTx.title}
            </h3>
            <p className="text-xs text-[#737688] mt-0.5">{selectedTx.note || 'Movimiento validado por Monedero'}</p>
          </div>

          {/* Amount Box */}
          <div className="p-4 bg-[#f2f3ff] rounded-2xl text-center border border-[#eaedff] mb-6">
            <div className="font-display text-3xl font-extrabold text-[#0041c8] tracking-tight">
              {isUSD ? `$ ${displayAmount}` : `Bs. ${displayAmount}`}
            </div>
            <div className="text-xs font-semibold text-[#434656] mt-1">
              ≈ {isUSD ? `Bs. ${displaySecondary}` : `$ ${displaySecondary} USD`} · Tasa: Bs. {(selectedTx.rate || bcvRate).toFixed(2)}
            </div>
          </div>

          {/* Perforated ticket cutouts divider */}
          <div className="relative my-6 -mx-6 flex items-center justify-between">
            <div className="w-5 h-5 rounded-full bg-[#131b2e]/60 -ml-2.5 shadow-inner"></div>
            <div className="flex-1 border-t-2 border-dashed border-[#c3c5d9] mx-2"></div>
            <div className="w-5 h-5 rounded-full bg-[#131b2e]/60 -mr-2.5 shadow-inner"></div>
          </div>

          {/* Detailed Specifications */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[#f2f3ff]">
              <span className="text-[#737688] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0041c8]" />
                Fecha y Hora
              </span>
              <strong className="text-[#131b2e] font-semibold">{selectedTx.date}</strong>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#f2f3ff]">
              <span className="text-[#737688] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#0041c8]" />
                Destinatario / Comercio
              </span>
              <strong className="text-[#131b2e] font-semibold text-right">
                {selectedTx.beneficiary?.name || selectedTx.title}
              </strong>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#f2f3ff]">
              <span className="text-[#737688] flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#006c49]" />
                Cuenta / Canal
              </span>
              <strong className="text-[#131b2e] font-semibold">{selectedTx.accountName}</strong>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#f2f3ff]">
              <span className="text-[#737688] flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#0041c8]" />
                Referencia
              </span>
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

            <div className="flex items-center justify-between py-1">
              <span className="text-[#737688] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#006c49]" />
                Aprobación SUDEBAN
              </span>
              <strong className="text-[#006c49] font-mono font-bold">
                {selectedTx.sudebanCode || 'SUDEBAN-772910'}
              </strong>
            </div>
          </div>

          {/* QR Code Visual Element */}
          <div className="mt-5 p-3 bg-[#faf8ff] rounded-2xl border border-[#eaedff] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white p-1 rounded-xl border border-[#eaedff] flex items-center justify-center shadow-xs">
                <QrCode className="w-10 h-10 text-[#0041c8]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#131b2e]">Validación Bancaria QR</div>
                <div className="text-[11px] text-[#737688]">Escanea para verificar autenticidad</div>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#6cf8bb] text-[#00714d] font-bold">
              Certificado
            </span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-[#faf8ff] border-t border-[#eaedff] rounded-b-3xl space-y-2">
          <button
            onClick={handleShareWhatsApp}
            className="w-full py-3 px-4 bg-[#006c49] hover:bg-[#005539] text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir Comprobante por WhatsApp</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadReceipt}
              className="py-2.5 px-3 bg-white hover:bg-[#f2f3ff] text-[#131b2e] border border-[#eaedff] rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#0041c8]" />
              <span>Guardar en Fotos</span>
            </button>

            <button
              onClick={() => {
                setReceiptModalOpen(false);
                if (selectedTx.type === 'exchange') {
                  setExchangeModalOpen(true);
                } else {
                  setQuickExpenseModalOpen(true);
                }
              }}
              className="py-2.5 px-3 bg-white hover:bg-[#f2f3ff] text-[#131b2e] border border-[#eaedff] rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Repeat className="w-3.5 h-3.5 text-[#0041c8]" />
              <span>Repetir Pago</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
