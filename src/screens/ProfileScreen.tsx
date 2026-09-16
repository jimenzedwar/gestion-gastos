import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Account } from '../types';
import {
  CreditCard,
  Smartphone,
  Wallet,
  Copy,
  LogOut,
  Plus,
  X,
  Landmark
} from 'lucide-react';

type NewAccountKind = 'usd_wallet' | 'cash_usd' | 'ves_bank' | 'cash_ves';

const KIND_OPTIONS: { value: NewAccountKind; label: string; currency: 'USD' | 'VES'; type: Account['type']; icon: string; color: string }[] = [
  { value: 'usd_wallet', label: 'Billetera / Tarjeta en USD', currency: 'USD', type: 'usd_wallet', icon: 'credit_card', color: '#0041c8' },
  { value: 'cash_usd', label: 'Efectivo en USD', currency: 'USD', type: 'cash_usd', icon: 'wallet', color: '#10b981' },
  { value: 'ves_bank', label: 'Cuenta / Pago Móvil en VES', currency: 'VES', type: 'ves_bank', icon: 'smartphone', color: '#006c49' },
  { value: 'cash_ves', label: 'Efectivo en VES', currency: 'VES', type: 'cash_ves', icon: 'payments', color: '#737688' }
];

const iconForAccount = (acc: Account) => {
  if (acc.type === 'usd_wallet') return <CreditCard className="w-5 h-5" />;
  if (acc.type === 'ves_bank') return <Smartphone className="w-5 h-5" />;
  return <Wallet className="w-5 h-5" />;
};

export const ProfileScreen: React.FC = () => {
  const {
    accounts,
    bcvRate,
    addAccount,
    showToast,
    formatUSD,
    formatVES
  } = useApp();
  const { user, signOut } = useAuth();

  const [addAccountModal, setAddAccountModal] = useState(false);
  const [newKind, setNewKind] = useState<NewAccountKind>('usd_wallet');
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState<number>(0);

  const usdAccounts = accounts.filter((a) => a.currency === 'USD');
  const vesAccounts = accounts.filter((a) => a.currency === 'VES');
  const totalUsdWallets = usdAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalVesBanks = vesAccounts.reduce((sum, a) => sum + a.balance, 0);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    showToast(`${label} copiado`);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Ponle un nombre a la cuenta');
      return;
    }
    const kind = KIND_OPTIONS.find((k) => k.value === newKind)!;
    addAccount({
      name: newName.trim(),
      type: kind.type,
      currency: kind.currency,
      balance: newBalance || 0,
      icon: kind.icon,
      color: kind.color
    });
    setAddAccountModal(false);
    setNewName('');
    setNewBalance(0);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300 max-w-4xl mx-auto px-1 sm:px-0">
      {/* Top summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#737688] font-semibold mb-1">
            <span>Cuentas en USD</span>
            <span className="px-2 py-0.5 rounded-full bg-[#eaedff] text-[#0041c8] font-bold text-[10px]">
              {usdAccounts.length} {usdAccounts.length === 1 ? 'cuenta' : 'cuentas'}
            </span>
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#0041c8]">{formatUSD(totalUsdWallets)}</div>
          <div className="text-[11px] text-[#737688] font-medium mt-0.5 truncate">
            ≈ {formatVES(totalUsdWallets * bcvRate)}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_10px_rgba(19,27,46,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#737688] font-semibold mb-1">
            <span>Cuentas en VES</span>
            <span className="px-2 py-0.5 rounded-full bg-[#6cf8bb]/40 text-[#00714d] font-bold text-[10px]">
              {vesAccounts.length} {vesAccounts.length === 1 ? 'cuenta' : 'cuentas'}
            </span>
          </div>
          <div className="font-display text-xl sm:text-2xl font-bold text-[#006c49]">{formatVES(totalVesBanks)}</div>
          <div className="text-[11px] text-[#006c49] font-medium mt-0.5 truncate">
            ≈ {formatUSD(totalVesBanks / bcvRate)}
          </div>
        </div>
      </div>

      {/* Accounts */}
      <div className="bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-bold text-base sm:text-lg text-[#131b2e] flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#0041c8]" />
              <span>Tus Cuentas</span>
            </h2>
            <p className="text-xs text-[#737688]">Billeteras, bancos y efectivo</p>
          </div>
          <button
            onClick={() => setAddAccountModal(true)}
            className="text-xs font-bold text-[#0041c8] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar Cuenta
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="text-3xl">🏦</div>
            <h3 className="font-display font-bold text-sm text-[#131b2e]">No tienes cuentas agregadas</h3>
            <p className="text-xs text-[#737688]">Agrega tu primera cuenta para comenzar a controlar tu dinero.</p>
            <button
              onClick={() => setAddAccountModal(true)}
              className="mt-2 px-4 py-2 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl text-xs font-display font-bold shadow-md"
            >
              + Agregar cuenta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-4 bg-[#faf8ff] rounded-2xl border border-[#eaedff] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: acc.color || '#0041c8' }}
                  >
                    {iconForAccount(acc)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-sm text-[#131b2e] truncate">{acc.name}</h3>
                    <p className="text-[11px] text-[#737688] truncate">{acc.statusText || acc.currency}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-sm font-extrabold text-[#131b2e]">
                    {acc.currency === 'USD' ? formatUSD(acc.balance) : formatVES(acc.balance)}
                  </div>
                  {acc.accountNumber && (
                    <button
                      onClick={() => handleCopy(acc.accountNumber!, acc.name)}
                      className="text-[10px] text-[#0041c8] font-semibold flex items-center gap-1 justify-end mt-0.5"
                    >
                      <Copy className="w-3 h-3" /> Copiar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session */}
      <div className="bg-white rounded-3xl border border-[#eaedff] p-5 sm:p-6 shadow-[0_4px_20px_rgba(19,27,46,0.03)] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-[#737688]">Sesión iniciada como</div>
          <div className="text-sm font-bold text-[#131b2e] truncate">{user?.email}</div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#ffdadb] hover:bg-[#ffc2c4] text-[#a20030] rounded-xl text-xs font-bold shrink-0 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar sesión</span>
        </button>
      </div>

      {/* Modal: Add Account */}
      {addAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs" onClick={() => setAddAccountModal(false)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#eaedff] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <h3 className="font-display font-bold text-lg text-[#131b2e]">Agregar Cuenta</h3>
              <button onClick={() => setAddAccountModal(false)} className="p-1 rounded-full hover:bg-[#f2f3ff]">
                <X className="w-5 h-5 text-[#737688]" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1.5">Tipo de cuenta</label>
                <div className="grid grid-cols-1 gap-2">
                  {KIND_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewKind(opt.value)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        newKind === opt.value
                          ? 'border-[#0041c8] bg-[#eaedff]/50 text-[#0041c8]'
                          : 'border-[#eaedff] text-[#434656] hover:bg-[#faf8ff]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">Nombre de la cuenta</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Zinli, Banesco, Efectivo en casa..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-sm font-medium outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">
                  Saldo inicial ({KIND_OPTIONS.find((k) => k.value === newKind)?.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={newBalance || ''}
                  onChange={(e) => setNewBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-sm font-bold outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-[#eaedff] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddAccountModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#434656] hover:bg-[#f2f3ff] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl text-xs font-display font-bold shadow-md"
                >
                  Guardar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
