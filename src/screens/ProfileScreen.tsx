import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  User, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Wallet, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Lock, 
  QrCode, 
  Settings, 
  Download, 
  RefreshCw, 
  Bell, 
  ChevronRight,
  ExternalLink,
  Plus
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const {
    accounts,
    bcvRate,
    setBcvRate,
    showToast,
    formatUSD,
    formatVES
  } = useApp();

  const [showCardDetails, setShowCardDetails] = useState<boolean>(false);
  const [cardFrozen, setCardFrozen] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [autoSyncBcv, setAutoSyncBcv] = useState<boolean>(true);
  const [rateAlerts, setRateAlerts] = useState<boolean>(true);

  // Bill breakdown state
  const [bills, setBills] = useState({
    b100: 2, // 200
    b50: 3,  // 150
    b20: 1,  // 20
    b10: 1,  // 10
  });

  const handleCopy = (text: string, label: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    showToast(`${label} copiado: ${text}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyFichaPagoMovil = () => {
    navigator.clipboard?.writeText(
      `Banco: Banesco (0134)\nTeléfono: 0414-1234567\nCédula: V-24.819.301\nTitular: Alejandro Morales`
    );
    setCopiedKey('ficha-pm');
    showToast('Ficha de Pago Móvil copiada en 1 clic');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300 max-w-4xl mx-auto px-1 sm:px-0">
      {/* User Header & Verification Badge */}
      <div className="bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-7 shadow-[0_4px_20px_rgba(19,27,46,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#0041c8] to-[#0055ff] flex items-center justify-center text-white shadow-md text-xl sm:text-2xl font-display font-extrabold shrink-0">
            AM
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display font-bold text-lg sm:text-2xl text-[#131b2e] truncate">
                Alejandro Morales
              </h1>
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-[#6cf8bb] text-[#00714d] font-bold shrink-0">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                KYC Verificado
              </span>
            </div>
            <p className="text-xs text-[#737688] mt-0.5 font-mono truncate">
              C.I. V-24.819.301 · Cuenta Bimonetaria
            </p>
            <div className="text-[11px] text-[#006c49] font-semibold mt-0.5 truncate">
              Límite mensual: $5.000 / $10.000 (Nivel 2)
            </div>
          </div>
        </div>

        <button
          onClick={handleCopyFichaPagoMovil}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-display font-bold text-xs transition-all shadow-xs w-full sm:w-auto shrink-0 ${
            copiedKey === 'ficha-pm'
              ? 'bg-[#006c49] text-white'
              : 'bg-[#0041c8] hover:bg-[#0036a8] text-white'
          }`}
        >
          {copiedKey === 'ficha-pm' ? (
            <>
              <Check className="w-4 h-4 text-[#6cf8bb]" />
              <span>¡Ficha Copiada!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copiar Ficha Pago Móvil</span>
            </>
          )}
        </button>
      </div>

      {/* Resumen Tripartito de Fondos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#737688] font-semibold mb-1">
            <span>Billeteras USD</span>
            <span className="px-2 py-0.5 rounded-full bg-[#eaedff] text-[#0041c8] font-bold text-[10px]">
              2 cuentas
            </span>
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#0041c8]">$1.230,00</div>
          <div className="text-[11px] text-[#737688] font-medium mt-0.5 truncate">
            ≈ Bs. {(1230 * bcvRate).toLocaleString('es-VE')}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#737688] font-semibold mb-1">
            <span>Bancos Nacionales (VES)</span>
            <span className="px-2 py-0.5 rounded-full bg-[#6cf8bb]/40 text-[#00714d] font-bold text-[10px]">
              Pago Móvil
            </span>
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#006c49]">Bs. 41.000,00</div>
          <div className="text-[11px] text-[#006c49] font-medium mt-0.5 truncate">
            ≈ ${(41000 / bcvRate).toFixed(2)} USD
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)] sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-xs text-[#737688] font-semibold mb-1">
            <span>Efectivo en Mano</span>
            <span className="px-2 py-0.5 rounded-full bg-[#faf8ff] text-[#131b2e] font-bold text-[10px] border border-[#eaedff]">
              Físico
            </span>
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#131b2e]">$380,00</div>
          <div className="text-[11px] text-[#737688] font-medium mt-0.5 truncate">
            + Bs. 1.200 sencillo (≈ $388,00)
          </div>
        </div>
      </div>

      {/* Section 1: Billeteras Internacionales (USD) */}
      <div className="bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-bold text-base sm:text-lg text-[#131b2e] flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#0041c8]" />
              <span>Billeteras Internacionales (USD)</span>
            </h2>
            <p className="text-xs text-[#737688]">Tarjetas virtuales y cuentas en el exterior</p>
          </div>
          <button
            onClick={() => showToast('Conexión de nueva billetera en proceso')}
            className="text-xs font-bold text-[#0041c8] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar Billetera
          </button>
        </div>

        {/* Zinli Card item */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#faf8ff] to-[#f2f3ff] rounded-2xl border border-[#eaedff] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#0041c8] text-white flex items-center justify-center font-display font-bold text-xs sm:text-sm shadow-xs shrink-0">
                VISA
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-bold text-sm sm:text-base text-[#131b2e]">Zinli Visa Virtual</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    cardFrozen ? 'bg-[#ffdadb] text-[#a20030]' : 'bg-[#6cf8bb] text-[#00714d]'
                  }`}>
                    {cardFrozen ? 'Congelada' : 'Débito Activa'}
                  </span>
                </div>
                <div className="text-xs text-[#737688] font-mono mt-0.5 break-all">
                  {showCardDetails ? '4921 •••• •••• 8192 | CVV: 402' : '•••• •••• •••• 4921'}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="font-display text-xl font-extrabold text-[#131b2e]">$850,00</div>
              <div className="text-[11px] text-[#737688]">Saldo disponible</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#eaedff] text-xs">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowCardDetails(!showCardDetails)}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-white hover:bg-[#eaedff] rounded-xl border border-[#eaedff] font-semibold text-[#0041c8] flex items-center justify-center gap-1.5 transition-colors"
              >
                {showCardDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showCardDetails ? 'Ocultar' : 'Ver CVV'}</span>
              </button>
              <button
                onClick={() => handleCopy('4921819200428192', 'Número de tarjeta', 'card-zinli')}
                className="flex-1 sm:flex-initial px-3 py-1.5 bg-white hover:bg-[#eaedff] rounded-xl border border-[#eaedff] font-semibold text-[#434656] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </button>
            </div>

            <button
              onClick={() => {
                setCardFrozen(!cardFrozen);
                showToast(cardFrozen ? 'Tarjeta Zinli descongelada' : 'Tarjeta Zinli congelada temporalmente');
              }}
              className={`w-full sm:w-auto px-3 py-1.5 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                cardFrozen ? 'bg-[#0041c8] text-white' : 'bg-[#ffdadb] text-[#a20030] hover:bg-[#ffdadb]/80'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{cardFrozen ? 'Descongelar' : 'Congelar Tarjeta'}</span>
            </button>
          </div>
        </div>

        {/* Wells Fargo / Zelle Item */}
        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#6cf8bb]/30 text-[#006c49] flex items-center justify-center font-bold text-xs shrink-0">
              Zelle
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-sm text-[#131b2e] truncate">Wells Fargo / Zelle®</h3>
              <p className="text-xs text-[#737688] truncate font-mono">alejandro.fintech@gmail.com</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleCopy('alejandro.fintech@gmail.com', 'Correo Zelle', 'zelle-mail')}
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#0041c8] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Correo Zelle</span>
            </button>
            <button
              onClick={() => showToast('Código QR de recepción Zelle')}
              className="p-2 bg-[#f2f3ff] text-[#434656] rounded-xl hover:bg-[#eaedff] shrink-0"
              title="Ver QR Zelle"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Cuentas Nacionales & Pago Móvil (VES) */}
      <div className="bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)] space-y-4">
        <div>
          <h2 className="font-display font-bold text-base sm:text-lg text-[#131b2e] flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#006c49]" />
            <span>Cuentas Nacionales & Pago Móvil (VES)</span>
          </h2>
          <p className="text-xs text-[#737688]">Para recibir y enviar bolívares al instante</p>
        </div>

        {/* Banesco Card with prominent Pago Móvil copy badge */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#f2f3ff] to-[#faf8ff] rounded-2xl border border-[#eaedff] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#006c49] text-white">0134</span>
                <h3 className="font-display font-bold text-sm sm:text-base text-[#131b2e]">Banesco Banco Universal</h3>
              </div>
              <p className="text-xs text-[#434656] mt-1 font-mono break-all">Cuenta: 0134-0182-91-0001829102</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="font-display text-xl font-extrabold text-[#006c49]">Bs. 34.500,00</div>
              <div className="text-[11px] text-[#737688]">≈ ${(34500 / bcvRate).toFixed(2)} USD</div>
            </div>
          </div>

          {/* Pago Movil Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 bg-white rounded-xl border border-[#eaedff] text-xs">
            <div>
              <div className="text-[#737688] font-medium text-[11px]">Teléfono Pago Móvil:</div>
              <div className="font-bold text-[#131b2e] font-mono">0414-1234567</div>
            </div>
            <div>
              <div className="text-[#737688] font-medium text-[11px]">Cédula Identidad:</div>
              <div className="font-bold text-[#131b2e] font-mono">V-24.819.301</div>
            </div>
            <div>
              <div className="text-[#737688] font-medium text-[11px]">Banco Destino:</div>
              <div className="font-bold text-[#131b2e]">0134 - Banesco</div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              onClick={handleCopyFichaPagoMovil}
              className="text-xs font-bold text-[#0041c8] hover:underline flex items-center gap-1 w-full sm:w-auto justify-center sm:justify-end"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar todos los datos de Pago Móvil</span>
            </button>
          </div>
        </div>

        {/* Banco Mercantil Item */}
        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#eaedff] text-[#0041c8] flex items-center justify-center font-bold text-xs shrink-0">
              0105
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-sm text-[#131b2e]">Banco Mercantil</h3>
              <p className="text-xs text-[#737688] truncate">0105 •••• 9812 · Saldo: Bs. 6.500,00</p>
            </div>
          </div>

          <button
            onClick={() => handleCopy('01050029100019283718', 'Cuenta Mercantil', 'mercantil')}
            className="w-full sm:w-auto px-3 py-1.5 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#0041c8] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar Cuenta 20 Dígitos</span>
          </button>
        </div>
      </div>

      {/* Section 3: Efectivo Físico & Arqueos */}
      <div className="bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-bold text-base sm:text-lg text-[#131b2e] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#10b981]" />
              <span>Efectivo Físico & Arqueo en Cartera</span>
            </h2>
            <p className="text-xs text-[#737688]">Control de billetes de baja y alta denominación</p>
          </div>
          <span className="text-xs font-extrabold text-[#131b2e] bg-[#faf8ff] px-3 py-1 rounded-full border border-[#eaedff]">
            Total: $380,00
          </span>
        </div>

        {/* Visual Bill Breakdown Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="p-3 bg-[#faf8ff] rounded-xl border border-[#eaedff] text-center">
            <div className="text-xs text-[#737688] font-medium">Billetes de $100</div>
            <div className="font-display text-base sm:text-lg font-bold text-[#131b2e] mt-1">
              {bills.b100} billetes
            </div>
            <div className="text-[11px] text-[#006c49] font-semibold">$200,00</div>
          </div>

          <div className="p-3 bg-[#faf8ff] rounded-xl border border-[#eaedff] text-center">
            <div className="text-xs text-[#737688] font-medium">Billetes de $50</div>
            <div className="font-display text-base sm:text-lg font-bold text-[#131b2e] mt-1">
              {bills.b50} billetes
            </div>
            <div className="text-[11px] text-[#006c49] font-semibold">$150,00</div>
          </div>

          <div className="p-3 bg-[#faf8ff] rounded-xl border border-[#eaedff] text-center">
            <div className="text-xs text-[#737688] font-medium">Billetes de $20</div>
            <div className="font-display text-base sm:text-lg font-bold text-[#131b2e] mt-1">
              {bills.b20} billete
            </div>
            <div className="text-[11px] text-[#006c49] font-semibold">$20,00</div>
          </div>

          <div className="p-3 bg-[#faf8ff] rounded-xl border border-[#eaedff] text-center">
            <div className="text-xs text-[#737688] font-medium">Sencillo de $10</div>
            <div className="font-display text-base sm:text-lg font-bold text-[#131b2e] mt-1">
              {bills.b10} billete
            </div>
            <div className="text-[11px] text-[#006c49] font-semibold">$10,00</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs pt-1 text-[#737688] gap-2">
          <span>Menudeo en bolívares para vueltos: <strong>Bs. 1.200,00</strong></span>
          <button
            onClick={() => showToast('Arqueo de efectivo confirmado')}
            className="text-[#0041c8] font-bold hover:underline self-start sm:self-auto"
          >
            Actualizar Conteo
          </button>
        </div>
      </div>

      {/* Section 4: Configuración Cambiaria & Alertas */}
      <div className="bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)] space-y-4">
        <div>
          <h2 className="font-display font-bold text-base sm:text-lg text-[#131b2e] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#434656]" />
            <span>Configuración Cambiaria & Sistema</span>
          </h2>
          <p className="text-xs text-[#737688]">Ajustes del motor de cotización y notificaciones</p>
        </div>

        <div className="space-y-3 divide-y divide-[#f2f3ff] text-xs">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-semibold text-[#131b2e]">Sincronización Automática Tasa BCV</div>
              <div className="text-[#737688]">Actualiza cotizaciones diarias oficiales del Banco Central</div>
            </div>
            <button
              onClick={() => {
                setAutoSyncBcv(!autoSyncBcv);
                showToast(autoSyncBcv ? 'Sync manual activado' : 'Sync automático BCV activo');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                autoSyncBcv ? 'bg-[#0041c8]' : 'bg-[#c3c5d9]'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                autoSyncBcv ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-semibold text-[#131b2e]">Alertas de Variación Cambiaria</div>
              <div className="text-[#737688]">Notificar si la tasa oficial oscila más de 2% en un día</div>
            </div>
            <button
              onClick={() => {
                setRateAlerts(!rateAlerts);
                showToast(rateAlerts ? 'Alertas desactivadas' : 'Alertas activadas');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                rateAlerts ? 'bg-[#006c49]' : 'bg-[#c3c5d9]'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                rateAlerts ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-semibold text-[#131b2e]">Monedero Vault Shield</div>
              <div className="text-[#737688]">Cifrado local de transacciones y conciliación bancaria</div>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#6cf8bb] text-[#00714d] font-bold shrink-0">
              Protegido
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
