import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { QuickExpenseModal } from './components/QuickExpenseModal';
import { ExchangeModal } from './components/ExchangeModal';
import { ReceiptTicketModal } from './components/ReceiptTicketModal';
import { DeviceFrame } from './components/DeviceFrame';

import { HomeScreen } from './screens/HomeScreen';
import { MovementsScreen } from './screens/MovementsScreen';
import { ChartsScreen } from './screens/ChartsScreen';
import { PayrollScreen } from './screens/PayrollScreen';
import { BudgetScreen } from './screens/BudgetScreen';
import { ExchangeScreen } from './screens/ExchangeScreen';
import { ProfileScreen } from './screens/ProfileScreen';

const MainLayout: React.FC = () => {
  const { currentTab, deviceMode } = useApp();

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
      case 'presupuesto':
        return <BudgetScreen />;
      case 'cambio':
        return <ExchangeScreen />;
      case 'perfil':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  if (deviceMode === 'mobile_frame') {
    return (
      <div className="min-h-screen bg-[#131b2e] flex flex-col">
        <Header isMobileLayout={true} />
        <div className="pt-16 flex-1 flex items-center justify-center p-2 sm:p-4">
          <DeviceFrame>
            {renderScreen()}
          </DeviceFrame>
        </div>
        <Toast />
        <QuickExpenseModal />
        <ExchangeModal />
        <ReceiptTicketModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] flex flex-col">
      <Header />

      <div className="pt-16 flex-1 flex">
        {/* Desktop Sidebar (hidden on small viewports) */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderScreen()}
        </main>
      </div>

      {/* Mobile Bottom Navigation (visible on mobile viewports only) */}
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

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
