import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Home,
  ReceiptText,
  Repeat,
  UserCircle,
  Plus,
  BarChart3,
  Users,
  CalendarClock,
  CheckSquare,
  MoreHorizontal,
  X
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, setQuickExpenseModalOpen, employees, recurringExpenses, role, tasks, currentEmployee } = useApp();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const pendingLoans = employees.flatMap((e) => e.loans.filter((l) => l.status === 'active')).length;
  const pendingExpenses = recurringExpenses.filter((e) => !e.isPaid).length;
  const myPendingTasks = tasks.filter((t) => t.status !== 'completada' && (role === 'owner' || t.assignedEmployeeId === currentEmployee?.id)).length;

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    setMoreMenuOpen(false);
  };

  const moreItems = [
    ...(role === 'owner'
      ? [
          { id: 'nomina', label: 'Nómina', sublabel: 'Sueldos y deducciones', icon: Users, color: 'bg-[#0041c8]', badge: pendingLoans > 0 ? pendingLoans : undefined },
          { id: 'presupuesto', label: 'Gastos Recurrentes', sublabel: 'Pagos fijos mensuales', icon: CalendarClock, color: 'bg-[#006c49]', badge: pendingExpenses > 0 ? pendingExpenses : undefined }
        ]
      : []),
    { id: 'cambio', label: 'Cambio de Divisas', sublabel: 'Tasa BCV o libre', icon: Repeat, color: 'bg-[#0041c8]' },
    { id: 'tareas', label: 'Tareas', sublabel: role === 'owner' ? 'Asignar y revisar' : 'Tus tareas asignadas', icon: CheckSquare, color: 'bg-[#8b5cf6]', badge: myPendingTasks > 0 ? myPendingTasks : undefined },
    ...(role === 'owner' ? [{ id: 'perfil', label: 'Cuentas', sublabel: 'Datos de Pago Móvil', icon: UserCircle, color: 'bg-[#434656]' }] : [])
  ];

  const isMoreActive = moreItems.some((item) => item.id === currentTab);

  return (
    <>
      {/* "Más Opciones" Bottom Sheet Modal */}
      {moreMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-[#131b2e]/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-200"
          onClick={() => setMoreMenuOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-white rounded-t-3xl border-t border-[#eaedff] p-5 pb-8 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#f2f3ff] pb-3">
              <span className="font-display font-bold text-sm text-[#131b2e]">Menú de Operaciones</span>
              <button 
                onClick={() => setMoreMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#737688]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isActive
                        ? 'border-[#0041c8] bg-[#eaedff]/60 text-[#0041c8]'
                        : 'border-[#eaedff] bg-[#faf8ff] text-[#131b2e] hover:bg-[#f2f3ff]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-9 h-9 rounded-xl ${item.color} text-white flex items-center justify-center`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {!!item.badge && (
                        <span className="px-1.5 py-0.5 rounded-full bg-[#f59e0b] text-white text-[10px] font-bold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-display font-bold text-xs">{item.label}</div>
                      <div className="text-[10px] text-[#737688]">{item.sublabel}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl border-t border-[#eaedff] z-40 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(19,27,46,0.06)] max-w-lg mx-auto sm:rounded-t-2xl">
        <button
          onClick={() => handleSelectTab('inicio')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            currentTab === 'inicio' ? 'text-[#0041c8]' : 'text-[#737688] hover:text-[#131b2e]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">Inicio</span>
        </button>

        <button
          onClick={() => handleSelectTab('movimientos')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors relative ${
            currentTab === 'movimientos' ? 'text-[#0041c8]' : 'text-[#737688] hover:text-[#131b2e]'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">Movimientos</span>
        </button>

        {/* Center prominent Quick Expense trigger button */}
        <div className="-mt-5 flex flex-col items-center">
          <button
            onClick={() => setQuickExpenseModalOpen(true)}
            className="w-12 h-12 rounded-full bg-[#0041c8] text-white flex items-center justify-center shadow-[0_6px_16px_rgba(0,65,200,0.35)] active:scale-90 transition-transform ring-4 ring-[#faf8ff]"
            aria-label="Anotar Gasto Rápido"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-bold text-[#0041c8] mt-0.5">Anotar</span>
        </div>

        <button
          onClick={() => handleSelectTab('graficos')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors ${
            currentTab === 'graficos' ? 'text-[#0041c8]' : 'text-[#737688] hover:text-[#131b2e]'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">Gráficos</span>
        </button>

        <button
          onClick={() => setMoreMenuOpen(true)}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors relative ${
            isMoreActive ? 'text-[#0041c8]' : 'text-[#737688] hover:text-[#131b2e]'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-semibold tracking-tight">
            {isMoreActive ? moreItems.find((item) => item.id === currentTab)?.label ?? 'Más' : 'Más'}
          </span>
          {moreItems.some((item) => !!item.badge) && (
            <span className="w-2 h-2 rounded-full bg-[#f59e0b] absolute top-1 right-3"></span>
          )}
        </button>
      </nav>
    </>
  );
};
