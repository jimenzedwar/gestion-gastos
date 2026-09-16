import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Home,
  ReceiptText,
  Repeat,
  UserCircle,
  BarChart3,
  Users,
  Wallet,
  CalendarClock,
  CheckSquare
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, setQuickExpenseModalOpen, transactions, employees, recurringExpenses, role, tasks, currentEmployee } = useApp();

  const pendingLoans = employees.flatMap((e) => e.loans.filter((l) => l.status === 'active')).length;
  const pendingExpenses = recurringExpenses.filter((e) => !e.isPaid).length;
  const myPendingTasks = tasks.filter((t) => t.status !== 'completada' && (role === 'owner' || t.assignedEmployeeId === currentEmployee?.id)).length;

  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'movimientos', label: 'Movimientos', icon: ReceiptText, badge: transactions.length > 0 ? `${transactions.length}` : undefined },
    { id: 'graficos', label: 'Gráficos', icon: BarChart3 },
    ...(role === 'owner'
      ? [
          { id: 'nomina', label: 'Nómina', icon: Users, badge: pendingLoans > 0 ? `${pendingLoans}` : undefined },
          { id: 'asignaciones', label: 'Asignaciones', icon: Wallet },
          { id: 'presupuesto', label: 'Gastos Recurrentes', icon: CalendarClock, badge: pendingExpenses > 0 ? `${pendingExpenses}` : undefined }
        ]
      : []),
    { id: 'cambio', label: 'Cambio de Divisas', icon: Repeat },
    { id: 'tareas', label: 'Tareas', icon: CheckSquare, badge: myPendingTasks > 0 ? `${myPendingTasks}` : undefined },
    ...(role === 'owner' ? [{ id: 'perfil', label: 'Cuentas', icon: UserCircle }] : []),
  ];

  return (
    <aside className="w-64 bg-[#f2f3ff] border-r border-[#eaedff] flex flex-col p-6 shrink-0 min-h-screen">
      {/* Quick action trigger */}
      <div className="mb-5">
        <button
          onClick={() => setQuickExpenseModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-[#0041c8] hover:bg-[#0036a8] text-white py-3 px-4 rounded-xl font-display font-semibold text-sm shadow-[0_4px_16px_rgba(0,65,200,0.25)] transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>Anotar Gasto Rápido</span>
        </button>
      </div>

      {/* Nav list */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-[#0041c8] shadow-[0_1px_8px_rgba(19,27,46,0.06)]'
                  : 'text-[#434656] hover:bg-white/60 hover:text-[#131b2e]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0041c8]' : 'text-[#737688]'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                  isActive ? 'bg-[#eaedff] text-[#0041c8]' : 'bg-[#eaedff]/60 text-[#737688]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
