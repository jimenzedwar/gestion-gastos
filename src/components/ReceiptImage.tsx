import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Receipt } from 'lucide-react';

export const ReceiptImage: React.FC<{ path: string }> = ({ path }) => {
  const { getReceiptUrl } = useApp();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleReveal = async () => {
    setLoading(true);
    const signedUrl = await getReceiptUrl(path);
    setLoading(false);
    if (signedUrl) setUrl(signedUrl);
  };

  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <img src={url} alt="Comprobante" className="w-full rounded-2xl border border-[#eaedff] object-cover max-h-64" />
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleReveal}
      disabled={loading}
      className="w-full py-3 px-4 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#0041c8] rounded-xl text-xs font-display font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
    >
      <Receipt className="w-4 h-4" />
      <span>{loading ? 'Cargando...' : 'Ver comprobante adjunto'}</span>
    </button>
  );
};
