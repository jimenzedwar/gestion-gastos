import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  ReceiptText, 
  Repeat, 
  UserCircle, 
  Plus, 
  Zap, 
  ShieldCheck,
  ArrowUpRight,
  BarChart3,
  Users,
  CalendarClock
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, setQuickExpenseModalOpen, setExchangeModalOpen, bcvRate, employees, recurringExpenses } = useApp();

  const pendingLoans = employees.flatMap((e) => e.loans.filter((l) => l.status === 'active')).length;
  const pendingExpenses = recurringExpenses.filter((e) => !e.isPaid).length;

  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'movimientos', label: 'Movimientos', icon: ReceiptText, badge: '24' },
    { id: 'graficos', label: 'Gráficos & Métricas', icon: BarChart3 },
    { id: 'nomina', label: 'Nómina & Adelantos', icon: Users, badge: pendingLoans > 0 ? `${pendingLoans}` : undefined },
    { id: 'presupuesto', label: 'Presupuesto Recurrente', icon: CalendarClock, badge: pendingExpenses > 0 ? `${pendingExpenses}` : undefined },
    { id: 'cambio', label: 'Cambio USD/VES', icon: Repeat },
    { id: 'perfil', label: 'Perfil & Cuentas', icon: UserCircle },
  ];

  return (
    <aside className="w-64 bg-[#f2f3ff] border-r border-[#eaedff] flex flex-col justify-between p-6 shrink-0 min-h-[calc(100vh-4rem)]">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#0041c8] flex items-center justify-center text-white shadow-md shadow-[#0041c8]/20">
            <span className="font-display font-extrabold text-xl tracking-tight">M</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-[#131b2e] leading-tight tracking-tight">Monedero</h1>
            <p className="text-xs text-[#006c49] font-semibold tracking-wide">Tu plata clara</p>
          </div>
        </div>

        {/* Quick action trigger */}
        <div className="mb-5">
          <button
            onClick={() => setQuickExpenseModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#0041c8] hover:bg-[#0036a8] text-white py-3 px-4 rounded-xl font-display font-semibold text-sm shadow-[0_4px_16px_rgba(0,65,200,0.25)] transition-all active:scale-[0.98] group cursor-pointer"
          >
            <Zap className="w-4 h-4 text-[#6cf8bb] group-hover:scale-110 transition-transform" />
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
      </div>

      {/* Footer info box */}
      <div className="space-y-3 pt-4">
        {/* Quick exchange prompt */}
        <div className="p-3 bg-white rounded-2xl border border-[#eaedff] shadow-[0_2px_8px_rgba(19,27,46,0.04)]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-[#131b2e]">Calculadora Rápida</span>
            <button
              onClick={() => setExchangeModalOpen(true)}
              className="text-xs text-[#0041c8] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Cambiar <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="text-[11px] text-[#434656] font-medium leading-snug">
            $20,00 equivalen a <strong className="text-[#006c49]">Bs. {(20 * bcvRate).toLocaleString('es-VE')}</strong> al cambio oficial.
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 px-2 text-xs text-[#434656]">
          <ShieldCheck className="w-4 h-4 text-[#006c49] shrink-0" />
          <span className="text-[11px] text-[#737688]">Protegido con Monedero Vault</span>
        </div>
      </div>
    </aside>
  );
};
