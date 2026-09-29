import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Employee } from '../types';
import {
  UserPlus,
  Search,
  X,
  Pencil,
  Trash2,
  ShieldCheck,
  Copy,
  Wallet
} from 'lucide-react';

export const TeamScreen: React.FC = () => {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    provisionEmployeeAccounts,
    grantEmployeeAccess,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [memberModal, setMemberModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [needsAccount, setNeedsAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null);

  const [accessModal, setAccessModal] = useState<Employee | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [grantingAccess, setGrantingAccess] = useState(false);

  // Equipo only manages team members who are NOT on payroll — those live in Nómina instead.
  const teamMembers = employees.filter((e) => e.receivesPayroll === false);
  const filteredMembers = teamMembers.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.position.toLowerCase().includes(q);
  });

  const resetForm = () => {
    setName('');
    setPosition('');
    setNeedsAccount(false);
    setEditingId(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setMemberModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setName(emp.name);
    setPosition(emp.position);
    setNeedsAccount(false);
    setMemberModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Ponle un nombre a esta persona');
      return;
    }

    if (editingId) {
      updateEmployee(editingId, { name: name.trim(), position: position.trim() || 'Miembro del equipo' });
    } else {
      const newMember = await addEmployee({
        name: name.trim(),
        position: position.trim() || 'Miembro del equipo',
        monthlySalary: 0,
        paymentFrequency: 'mensual',
        paymentMethod: 'cash_usd',
        status: 'active',
        receivesPayroll: false
      });
      if (needsAccount) {
        await provisionEmployeeAccounts(newMember.id, newMember.name);
      }
    }

    setMemberModal(false);
    resetForm();
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    deleteEmployee(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessModal) return;
    setGrantingAccess(true);
    let usdId = accessModal.assignedAccountId;
    let vesId = accessModal.exchangeCounterpartAccountId;
    if (!usdId || !vesId) {
      const provisioned = await provisionEmployeeAccounts(accessModal.id, accessModal.name);
      usdId = provisioned.usdAccountId;
      vesId = provisioned.vesAccountId;
    }
    const code = await grantEmployeeAccess(accessModal.id, usdId, vesId);
    setGrantingAccess(false);
    if (code) setGeneratedCode(code);
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard?.writeText(generatedCode);
    showToast('Código copiado');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-[#131b2e] tracking-tight">Equipo</h1>
          <p className="text-xs md:text-sm text-[#434656] mt-0.5">
            Personas que colaboran contigo pero no reciben nómina — igual pueden tener cuenta y recibir asignaciones
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0041c8] text-white rounded-xl text-xs font-display font-bold shadow-md hover:bg-[#0036a8] transition-all active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Miembro</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-[#eaedff] shadow-[0_4px_20px_rgba(19,27,46,0.03)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#eaedff]">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#737688] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nombre o rol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-medium border border-transparent outline-none focus:border-[#0041c8] focus:bg-white"
            />
          </div>
        </div>

        {teamMembers.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="text-3xl">🤝</div>
            <h3 className="font-display font-bold text-sm text-[#131b2e]">Aún no tienes miembros de equipo</h3>
            <p className="text-xs text-[#737688] max-w-sm mx-auto">
              Regístralos aquí — a diferencia de Nómina, no requieren sueldo ni frecuencia de pago,
              pero puedes darles una cuenta propia para asignarles dinero.
            </p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <p className="text-xs text-[#737688] py-10 text-center">Ningún miembro coincide con tu búsqueda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-[#737688] border-b border-[#eaedff]">
                  <th className="px-4 sm:px-5 py-2.5 font-semibold">Miembro</th>
                  <th className="px-3 py-2.5 font-semibold">Cuenta</th>
                  <th className="px-3 py-2.5 font-semibold">Acceso</th>
                  <th className="px-3 sm:px-5 py-2.5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((emp) => (
                  <tr key={emp.id} className="border-b border-[#f2f3ff] last:border-0 hover:bg-[#faf8ff] transition-colors">
                    <td className="px-4 sm:px-5 py-3">
                      <div className="font-bold text-[#131b2e]">{emp.name}</div>
                      <div className="text-[10px] text-[#737688]">{emp.position}</div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {emp.assignedAccountId && emp.exchangeCounterpartAccountId ? (
                        <span className="inline-flex items-center gap-1 text-[#006c49] font-semibold">
                          <Wallet className="w-3.5 h-3.5" /> Con cuenta
                        </span>
                      ) : (
                        <span className="text-[#737688]">Sin cuenta</span>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {emp.authUserId ? (
                        <span className="text-[#006c49] font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Activo
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setAccessModal(emp);
                            setGeneratedCode(null);
                          }}
                          className="text-[#0041c8] font-bold hover:underline"
                        >
                          Dar acceso
                        </button>
                      )}
                    </td>
                    <td className="px-3 sm:px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          title="Editar"
                          className="p-1.5 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#434656] rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(emp)}
                          title="Eliminar"
                          className="p-1.5 bg-[#ffdadb] hover:bg-[#ffc2c4] text-[#a20030] rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add/Edit Team Member */}
      {memberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs" onClick={() => setMemberModal(false)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#eaedff] shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <h3 className="font-display font-bold text-lg text-[#131b2e]">
                {editingId ? 'Editar Miembro' : 'Registrar Miembro del Equipo'}
              </h3>
              <button onClick={() => setMemberModal(false)} className="p-1 rounded-full hover:bg-[#f2f3ff]">
                <X className="w-5 h-5 text-[#737688]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María Fernanda Rojas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-medium outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">Rol / Relación (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Socio, Voluntario, Proveedor de confianza"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-xs sm:text-sm font-medium outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                />
              </div>

              {!editingId && (
                <label className="flex items-start gap-2.5 p-3 bg-[#f2f3ff] rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needsAccount}
                    onChange={(e) => setNeedsAccount(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#0041c8]"
                  />
                  <span className="text-xs text-[#434656]">
                    <span className="font-bold text-[#131b2e] block">¿Necesita una cuenta para gastos?</span>
                    Se le crearán automáticamente una cuenta en USD y otra en VES, visibles en Asignaciones.
                  </span>
                </label>
              )}

              <div className="pt-3 border-t border-[#eaedff] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMemberModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#434656] hover:bg-[#f2f3ff] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl text-xs font-display font-bold shadow-md"
                >
                  {editingId ? 'Guardar Cambios' : 'Guardar Miembro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-[#eaedff] shadow-2xl space-y-4 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-[#ffdadb] text-[#a20030] flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#131b2e]">¿Eliminar a {deleteConfirm.name}?</h3>
              <p className="text-xs text-[#737688] mt-1">
                Su acceso a la app dejará de funcionar. Si tenía cuentas propias, se conservan pero quedan sin dueño asignado.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-[#434656] hover:bg-[#f2f3ff] rounded-xl border border-[#eaedff]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-[#a20030] hover:bg-[#82002a] text-white rounded-xl text-xs font-display font-bold shadow-md"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Grant App Access */}
      {accessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs" onClick={() => setAccessModal(null)}>
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#eaedff] shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <div>
                <h3 className="font-display font-bold text-lg text-[#131b2e]">Dar Acceso a la App</h3>
                <p className="text-xs text-[#737688]">{accessModal.name}</p>
              </div>
              <button onClick={() => setAccessModal(null)} className="p-1 rounded-full hover:bg-[#f2f3ff]">
                <X className="w-5 h-5 text-[#737688]" />
              </button>
            </div>

            {generatedCode ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#6cf8bb]/20 border border-[#6cf8bb]/50 rounded-2xl text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-[#006c49] mx-auto" />
                  <p className="text-xs text-[#434656] font-medium">
                    Comparte este código con {accessModal.name} para que cree su acceso (dura 7 días):
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono font-bold text-2xl tracking-wider text-[#131b2e]">{generatedCode}</span>
                    <button onClick={handleCopyCode} className="p-2 bg-white rounded-xl border border-[#eaedff] hover:bg-[#f2f3ff]">
                      <Copy className="w-4 h-4 text-[#0041c8]" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAccessModal(null)}
                  className="w-full py-2.5 px-4 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl text-xs font-display font-bold shadow-md"
                >
                  Listo
                </button>
              </div>
            ) : (
              <form onSubmit={handleGrantAccess} className="space-y-3.5">
                <div className="p-3 bg-[#f2f3ff] rounded-xl text-xs text-[#434656] space-y-1">
                  {accessModal.assignedAccountId && accessModal.exchangeCounterpartAccountId ? (
                    <>
                      <p className="font-bold text-[#131b2e]">Ya tiene sus propias cuentas (USD y VES)</p>
                      <p>{accessModal.name} entrará viendo únicamente sus dos cuentas de Asignaciones.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-[#131b2e]">Aún no tiene cuentas propias</p>
                      <p>Al generar el código se le crearán automáticamente una cuenta en USD y otra en VES.</p>
                    </>
                  )}
                </div>
                <div className="pt-3 border-t border-[#eaedff] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAccessModal(null)}
                    className="px-4 py-2 text-xs font-bold text-[#434656] hover:bg-[#f2f3ff] rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={grantingAccess}
                    className="px-5 py-2.5 bg-[#0041c8] hover:bg-[#0036a8] disabled:opacity-60 text-white rounded-xl text-xs font-display font-bold shadow-md"
                  >
                    {grantingAccess ? 'Generando...' : 'Generar Código'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
