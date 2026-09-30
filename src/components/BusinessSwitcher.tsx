import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Building2, Check, ChevronDown, Plus, X } from 'lucide-react';

// Owner-only — employees never see or use this (enforced by the caller,
// which only renders this for role === 'owner'). Lets the owner switch
// between their personal accounts and any additional "negocios" they've
// created, without signing out.
export const BusinessSwitcher: React.FC = () => {
  const { businesses, activeBusinessId, activeBusinessName, switchBusiness, createBusiness } = useApp();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSwitch = (id: string) => {
    switchBusiness(id);
    setOpen(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    await createBusiness(newName.trim());
    setCreating(false);
    setNewName('');
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-[#eaedff] rounded-xl text-xs font-bold text-[#131b2e] hover:bg-[#f2f3ff] transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 text-[#0041c8] shrink-0" />
          <span className="truncate">{activeBusinessName}</span>
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#737688] shrink-0" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 border border-[#eaedff] shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <h3 className="font-display font-bold text-lg text-[#131b2e]">Cambiar de Negocio</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-full hover:bg-[#f2f3ff]">
                <X className="w-5 h-5 text-[#737688]" />
              </button>
            </div>

            <div className="space-y-1.5">
              <button
                onClick={() => handleSwitch(user?.id || '')}
                className={`w-full flex items-center justify-between gap-2 p-3 rounded-xl text-left text-sm font-semibold transition-colors ${
                  !activeBusinessId || activeBusinessId === user?.id
                    ? 'bg-[#eaedff] text-[#0041c8]'
                    : 'bg-[#faf8ff] text-[#434656] hover:bg-[#f2f3ff]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Personal
                </span>
                {(!activeBusinessId || activeBusinessId === user?.id) && <Check className="w-4 h-4" />}
              </button>

              {businesses.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSwitch(b.id)}
                  className={`w-full flex items-center justify-between gap-2 p-3 rounded-xl text-left text-sm font-semibold transition-colors ${
                    activeBusinessId === b.id ? 'bg-[#eaedff] text-[#0041c8]' : 'bg-[#faf8ff] text-[#434656] hover:bg-[#f2f3ff]'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">{b.name}</span>
                  </span>
                  {activeBusinessId === b.id && <Check className="w-4 h-4 shrink-0" />}
                </button>
              ))}
            </div>

            <form onSubmit={handleCreate} className="pt-3 border-t border-[#eaedff] flex items-center gap-2">
              <input
                type="text"
                placeholder="Nombre del nuevo negocio"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs font-medium outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
              />
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="shrink-0 p-2.5 bg-[#0041c8] hover:bg-[#0036a8] disabled:opacity-50 text-white rounded-xl transition-colors"
                title="Crear negocio"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[11px] text-[#737688]">
              Cada negocio tiene sus propias cuentas y empleados, totalmente separados. Puedes cambiar entre ellos cuando quieras.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
