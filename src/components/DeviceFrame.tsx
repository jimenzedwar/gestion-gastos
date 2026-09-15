import React from 'react';
import { useApp } from '../context/AppContext';
import { Wifi, Battery, Signal } from 'lucide-react';
import { BottomNav } from './BottomNav';

interface DeviceFrameProps {
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children }) => {
  const { deviceMode } = useApp();

  if (deviceMode !== 'mobile_frame') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen py-6 flex items-center justify-center bg-[#131b2e]/90 p-2 sm:p-4">
      {/* iPhone Device Shell */}
      <div className="w-full max-w-[420px] h-[880px] max-h-[92vh] bg-[#faf8ff] rounded-[52px] shadow-[0_25px_70px_rgba(0,0,0,0.5)] border-[10px] border-[#283044] relative flex flex-col overflow-hidden ring-1 ring-white/20">
        
        {/* iOS Status Bar */}
        <div className="h-11 bg-transparent px-7 flex items-center justify-between z-30 shrink-0 select-none">
          <span className="font-semibold text-xs tracking-tight text-[#131b2e]">9:41</span>
          
          {/* Dynamic Island */}
          <div className="w-24 h-5 bg-black rounded-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-[#131b2e] mr-3"></div>
            <div className="w-2 h-2 rounded-full bg-[#0041c8]/60"></div>
          </div>

          <div className="flex items-center gap-1.5 text-[#131b2e]">
            <Signal className="w-3.5 h-3.5 fill-current stroke-none" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 fill-current" />
          </div>
        </div>

        {/* Mobile Viewport Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-2 pb-20">
          {children}
        </div>

        {/* Mobile App Bottom Nav */}
        <BottomNav />

        {/* Home Indicator bar */}
        <div className="absolute bottom-1.5 inset-x-0 flex justify-center z-50 pointer-events-none">
          <div className="w-32 h-1 bg-[#131b2e]/40 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
