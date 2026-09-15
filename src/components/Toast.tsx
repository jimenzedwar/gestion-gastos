import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  return (
    <div
      id="toast-notification"
      className="fixed bottom-20 md:bottom-8 right-1/2 translate-x-1/2 md:translate-x-0 md:right-8 z-50 flex items-center gap-2.5 bg-[#131b2e] text-white px-5 py-3 rounded-full shadow-[0_12px_32px_rgba(19,27,46,0.25)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-3"
    >
      <CheckCircle className="w-5 h-5 text-[#6ffbbe] shrink-0" />
      <span className="font-label-md text-sm text-[#eef0ff] font-medium whitespace-nowrap">
        {toastMessage}
      </span>
    </div>
  );
};
