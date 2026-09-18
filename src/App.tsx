import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './screens/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { QuickExpenseModal } from './components/QuickExpenseModal';
import { ExchangeModal } from './components/ExchangeModal';
import { ReceiptTicketModal } from './components/ReceiptTicketModal';

import { HomeScreen } from './screens/HomeScreen';
import { MovementsScreen } from './screens/MovementsScreen';

// Loaded on demand — keeps the initial bundle small on slow phones/networks.
// Charts/Assignments in particular pull in recharts, the heaviest dependency.
const ChartsScreen = lazy(() => import('./screens/ChartsScreen').then((m) => ({ default: m.ChartsScreen })));
const PayrollScreen = lazy(() => import('./screens/PayrollScreen').then((m) => ({ default: m.PayrollScreen })));
const BudgetScreen = lazy(() => import('./screens/BudgetScreen').then((m) => ({ default: m.BudgetScreen })));
const ExchangeScreen = lazy(() => import('./screens/ExchangeScreen').then((m) => ({ default: m.ExchangeScreen })));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })));
const TasksScreen = lazy(() => import('./screens/TasksScreen').then((m) => ({ default: m.TasksScreen })));
const AssignmentsScreen = lazy(() => import('./screens/AssignmentsScreen').then((m) => ({ default: m.AssignmentsScreen })));

const ScreenFallback: React.FC = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-6 h-6 border-2 border-[#eaedff] border-t-[#0041c8] rounded-full animate-spin" />
  </div>
);

const MainLayout: React.FC = () => {
  const { currentTab, dataLoading, joinError } = useApp();
  const { signOut } = useAuth();

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#eaedff] border-t-[#0041c8] rounded-full animate-spin" />
      </div>
    );
  }

  if (joinError) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-[#eaedff] shadow-2xl p-6 text-center space-y-3">
          <div className="text-3xl">⚠️</div>
          <h3 className="font-display font-bold text-base text-[#131b2e]">No se pudo vincular tu cuenta</h3>
          <p className="text-xs text-[#737688]">{joinError}</p>
          <p className="text-xs text-[#737688]">Contacta a quien te invitó para pedir un código nuevo.</p>
          <button
            onClick={signOut}
            className="w-full py-2.5 px-4 bg-[#0041c8] text-white rounded-xl text-xs font-display font-bold"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentTab) {
      case 'inicio':
        return <HomeScreen />;
      case 'movimientos':
        return <MovementsScreen />;
      case 'graficos':
        return <ChartsScreen />;
      case 'nomina':
        return <PayrollScreen />;
      case 'asignaciones':
        return <AssignmentsScreen />;
      case 'presupuesto':
        return <BudgetScreen />;
      case 'cambio':
        return <ExchangeScreen />;
      case 'tareas':
        return <TasksScreen />;
      case 'perfil':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="h-screen bg-[#faf8ff] flex flex-col overflow-hidden">
      <div className="flex-1 flex min-h-0">
        {/* Desktop Sidebar (hidden on small viewports) — stays fixed in place while content scrolls */}
        <div className="hidden md:block shrink-0 h-full overflow-y-auto">
          <Sidebar />
        </div>

        {/* Main Content Area (this is the only part that scrolls) */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
            <Suspense fallback={<ScreenFallback />}>{renderScreen()}</Suspense>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation (visible on mobile viewports only, fixed to the bottom) */}
      <div className="md:hidden">
        <BottomNav />
      </div>

      {/* Modals & Toasts */}
      <Toast />
      <QuickExpenseModal />
      <ExchangeModal />
      <ReceiptTicketModal />
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#eaedff] border-t-[#0041c8] rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
