import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PENDING_INVITE_STORAGE_KEY } from '../lib/supabaseClient';
import { Mail, Lock, User, KeyRound, ArrowRight } from 'lucide-react';

type Mode = 'login' | 'signup' | 'join';

export const LoginScreen: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim() || !password.trim()) {
      setError('Ingresa tu correo y contraseña');
      return;
    }
    if ((mode === 'signup' || mode === 'join') && !fullName.trim()) {
      setError('Ingresa tu nombre');
      return;
    }
    if (mode === 'join' && !inviteCode.trim()) {
      setError('Ingresa el código de invitación que te dieron');
      return;
    }

    setSubmitting(true);

    if (mode === 'join') {
      // Stash the code before signing up: the session flips as soon as signUp
      // succeeds and this screen unmounts, so AppContext redeems it right
      // after mount instead of here.
      sessionStorage.setItem(PENDING_INVITE_STORAGE_KEY, inviteCode.trim().toUpperCase());
    }

    const { error: authError } =
      mode === 'login'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, fullName.trim());

    setSubmitting(false);

    if (authError) {
      if (mode === 'join') sessionStorage.removeItem(PENDING_INVITE_STORAGE_KEY);
      setError(authError);
      return;
    }

    if (mode === 'signup') {
      setInfo('Cuenta creada. Revisa tu correo para confirmar el acceso.');
    }
    // For 'join', the app now takes over and shows a welcome/error screen
    // once the code is redeemed (see AppContext + App.tsx).
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#eaedff] shadow-[0_8px_30px_rgba(19,27,46,0.06)] p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-display font-bold text-2xl text-[#131b2e]">
            {mode === 'login' ? 'Inicia sesión' : mode === 'signup' ? 'Crea tu cuenta' : 'Únete con tu código'}
          </h1>
          <p className="text-xs text-[#737688]">
            {mode === 'login'
              ? 'Entra para ver tus finanzas'
              : mode === 'signup'
              ? 'Regístrate para empezar a llevar tus cuentas'
              : 'Tu empleador te dio un código de invitación — úsalo aquí para crear tu acceso'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'join' && (
            <div>
              <label className="block text-xs font-bold text-[#434656] mb-1.5">Código de invitación</label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-[#737688] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Ej: A3F7K2M9"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f2f3ff] rounded-xl border border-transparent focus:border-[#0041c8] focus:bg-white outline-none text-sm font-bold font-mono tracking-wider text-[#131b2e]"
                />
              </div>
            </div>
          )}

          {(mode === 'signup' || mode === 'join') && (
            <div>
              <label className="block text-xs font-bold text-[#434656] mb-1.5">Nombre completo</label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-[#737688] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f2f3ff] rounded-xl border border-transparent focus:border-[#0041c8] focus:bg-white outline-none text-sm font-medium text-[#131b2e]"
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#434656] mb-1.5">Correo electrónico</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-[#737688] absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#f2f3ff] rounded-xl border border-transparent focus:border-[#0041c8] focus:bg-white outline-none text-sm font-medium text-[#131b2e]"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#434656] mb-1.5">Contraseña</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-[#737688] absolute left-3.5 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#f2f3ff] rounded-xl border border-transparent focus:border-[#0041c8] focus:bg-white outline-none text-sm font-medium text-[#131b2e]"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          </div>

          {error && (
            <div className="text-xs font-medium text-[#a20030] bg-[#ffdadb]/60 border border-[#ffdadb] rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          {info && (
            <div className="text-xs font-medium text-[#006c49] bg-[#6cf8bb]/30 border border-[#6cf8bb]/50 rounded-xl px-3 py-2">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 bg-[#0041c8] hover:bg-[#0036a8] disabled:opacity-60 text-white rounded-xl font-display font-bold text-sm shadow-[0_4px_16px_rgba(0,65,200,0.25)] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <span>
              {submitting ? 'Un momento...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Crear cuenta' : 'Unirme'}
            </span>
            {!submitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
              resetMessages();
            }}
            className="w-full text-center text-xs font-semibold text-[#0041c8] hover:underline"
          >
            {mode === 'login' ? '¿No tienes cuenta? Créala aquí' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>

          {mode !== 'join' && (
            <button
              type="button"
              onClick={() => {
                setMode('join');
                resetMessages();
              }}
              className="w-full text-center text-xs font-semibold text-[#737688] hover:underline"
            >
              ¿Tienes un código de invitación de tu empleador?
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
