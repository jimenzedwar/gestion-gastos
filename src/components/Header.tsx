import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, User, Smartphone, Monitor, Check } from 'lucide-react';

interface HeaderProps {
  isMobileLayout?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isMobileLayout = false }) => {
  const { bcvRate, setBcvRate, deviceMode, setDeviceMode, showToast } = useApp();
  const [editingRate, setEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(bcvRate.toString());

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(tempRate);
    if (!isNaN(parsed) && parsed > 0) {
      setBcvRate(parsed);
      setEditingRate(false);
      showToast(`Tasa BCV actualizada a Bs. ${parsed.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`);
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#faf8ff]/85 backdrop-blur-xl border-b border-[#eaedff] shadow-[0_1px_8px_rgba(19,27,46,0.03)] h-16 transition-all">
      <div className="h-full max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between gap-3">
        {/* Left: BCV Rate & Live indicator */}
        <div className="flex items-center gap-3">
          {editingRate ? (
            <form onSubmit={handleRateSubmit} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm border border-[#0055ff]">
              <span className="text-xs text-[#434656] font-medium">Bs.</span>
              <input
                type="number"
                step="any"
                value={tempRate}
                onChange={(e) => setTempRate(e.target.value)}
                className="w-20 text-xs font-bold text-[#0041c8] outline-none bg-transparent"
                autoFocus
              />
              <button type="submit" className="p-1 text-[#006c49] hover:bg-[#6cf8bb]/30 rounded-full">
                <Check className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setTempRate(bcvRate.toString());
                setEditingRate(true);
              }}
              title="Haz clic para ajustar la tasa oficial"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-[0_1px_6px_rgba(19,27,46,0.05)] border border-[#eaedff] hover:border-[#0055ff]/40 transition-all group active:scale-98"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006c49] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006c49]"></span>
              </span>
              <span className="text-xs text-[#434656] font-medium hidden sm:inline">Tasa Oficial BCV:</span>
              <span className="text-xs sm:text-sm font-bold text-[#0041c8]">
                Bs. {bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-[#434656] hidden md:inline">/ USD</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#eaedff] text-[#0041c8] font-semibold hidden lg:inline">
                En vivo
              </span>
            </button>
          )}
        </div>

        {/* Center: Device Mode Switcher (Allows testing desktop dashboard & authentic mobile phone frame) */}
        <div className="flex items-center bg-[#eaedff] p-1 rounded-full shadow-inner text-xs font-semibold">
          <button
            onClick={() => setDeviceMode('responsive')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              deviceMode === 'responsive'
                ? 'bg-white text-[#0041c8] shadow-xs'
                : 'text-[#434656] hover:text-[#131b2e]'
            }`}
            title="Vista de escritorio / responsiva amplia"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Escritorio</span>
          </button>
          <button
            onClick={() => setDeviceMode('mobile_frame')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              deviceMode === 'mobile_frame'
                ? 'bg-white text-[#0041c8] shadow-xs'
                : 'text-[#434656] hover:text-[#131b2e]'
            }`}
            title="Vista de pantalla móvil iPhone con todas las interacciones táctiles"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Móvil (App)</span>
          </button>
        </div>

        {/* Right: Notifications and User Account */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => showToast('Tienes 2 pagos conciliados')}
            aria-label="Notificaciones"
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#434656] hover:text-[#131b2e] hover:bg-[#f2f3ff] transition-all shadow-[0_1px_6px_rgba(19,27,46,0.04)] relative active:scale-95"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ca1c43] rounded-full ring-2 ring-white"></span>
          </button>

          <div className="flex items-center gap-2 pl-1 sm:pl-2">
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-xs font-bold text-[#131b2e] leading-tight">Alejandro M.</span>
              <span className="text-[11px] text-[#006c49] font-medium leading-none mt-0.5">Cuenta Personal</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0041c8] flex items-center justify-center text-white font-bold text-xs shadow-sm">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
