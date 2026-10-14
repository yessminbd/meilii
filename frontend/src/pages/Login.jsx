import React, { useContext, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import { useLang } from '../context/LangContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import sneaker1 from '../assets/login-square.svg';

const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5173';

const inputClass =
  'w-full border border-gray-20 rounded-xl px-4 py-3 text-sm text-primary placeholder:text-gray-30 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white';

export default function Login() {
  const [currentState, setCurrentState] = useState('Login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setToken, backendUrl } = useContext(ShopContext);
  const { t } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') ? `/${searchParams.get('redirect')}` : '/';

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const switchState = (state) => {
    resetForm();
    setCurrentState(state);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (currentState === 'Sign Up') {
        const response = await fetch(`${backendUrl}/api/user/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await response.json();

        if (data.success) {
          toast.success(t.accountCreatedSuccess);
          if (data.token) {
            setToken(data.token);
            localStorage.setItem('token', data.token);
            navigate(redirectTarget);
          } else {
            switchState('Login');
          }
        } else {
          toast.error(data.message);
        }
      } else {
        const response = await fetch(`${backendUrl}/api/user/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (data.success) {
          setToken(data.token);
          localStorage.setItem('token', data.token);

          if (data.role === 'admin') {
            toast.success(t.welcomeAdmin);
            setTimeout(() => {
              window.location.href = ADMIN_URL;
            }, 1000);
          } else {
            toast.success(t.welcomeBack);
            navigate(redirectTarget);
          }
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(t.serverError);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-primaryLight flex">
      {/* ── LEFT: Sneaker Showcase ── */}
      <div className="hidden lg:flex flex-1 relative bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[#1a1a2e]" />

        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-tertiary/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-tertiary/15 blur-3xl" />

        <img
          src={sneaker1}
          alt="Měilì"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />

        <div className="absolute bottom-10 left-10 right-10 z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs font-semibold tracking-widest uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            {t.heroBadge}
          </div>
          <h2 className="text-3xl font-black text-white leading-tight">
            {t.heroTitle1}<br />
            <span className="text-tertiary">{t.heroTitle2}</span>
          </h2>
          <p className="text-white/50 text-sm mt-2">
            {t.deliveryAcrossTunisia}
          </p>
        </div>
      </div>

      {/* ── RIGHT: Form ── */}
      <div className="flex-1 lg:max-w-[480px] flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-primary tracking-tight">
              {currentState === 'Login' ? t.loginTitle : t.signupTitle}
            </h1>
            <p className="text-gray-50 text-sm mt-2">
              {currentState === 'Login'
                ? t.loginSubtitle
                : t.signupSubtitle}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
            {currentState === 'Sign Up' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-50">{t.fullName}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className={inputClass}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-50">{t.email}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-50">{t.passwordLabel}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={currentState === 'Sign Up' ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={currentState === 'Sign Up' ? t.passwordMinLength : t.passwordPlaceholder}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-30 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {currentState === 'Login' && (
              <div className="text-right -mt-1">
                <button type="button" className="text-xs text-tertiary font-semibold hover:underline">
                  {t.forgotPassword}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-tertiary transition-all duration-300 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.processing}
                </>
              ) : currentState === 'Login' ? (
                t.signIn
              ) : (
                t.signUp
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-10" />
            <span className="text-xs text-gray-30 font-medium">{t.orContinue}</span>
            <div className="flex-1 h-px bg-gray-10" />
          </div>

          {/* Toggle Login / Sign Up */}
          <p className="text-center text-sm text-gray-50">
            {currentState === 'Login' ? (
              <>
                {t.noAccount}{' '}
                <button
                  type="button"
                  onClick={() => switchState('Sign Up')}
                  className="text-primary font-bold hover:text-tertiary transition-colors"
                >
                  {t.signUp}
                </button>
              </>
            ) : (
              <>
                {t.hasAccount}{' '}
                <button
                  type="button"
                  onClick={() => switchState('Login')}
                  className="text-primary font-bold hover:text-tertiary transition-colors"
                >
                  {t.signIn}
                </button>
              </>
            )}
          </p>

          {/* Mobile image */}
          <div className="lg:hidden mt-10 rounded-2xl overflow-hidden h-44 w-full">
            <img src={sneaker1} alt="Měilì" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
}