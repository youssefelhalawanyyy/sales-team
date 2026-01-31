import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Grid background */}
      <div className="grid-bg" />

      {/* Ambient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Floating particles */}
      {[...Array(14)].map((_, i) => (
        <div key={i} className="particle" style={{
          left: `${6 + (i * 6.8) % 92}%`,
          top: `${10 + (i * 7.3) % 80}%`,
          animationDelay: `${i * 0.45}s`,
          animationDuration: `${6 + (i % 4) * 3}s`,
          width: i % 3 === 0 ? '3px' : '2px',
          height: i % 3 === 0 ? '3px' : '2px',
        }} />
      ))}

      {/* Left brand panel */}
      <div className="brand-panel">
        <div className="brand-inner">
          <div className="brand-logo-wrap">
            <div className="brand-logo">
              <span className="brand-logo-letter">J</span>
            </div>
          </div>
          <h1 className="brand-title">JONIX</h1>
          <p className="brand-sub">Management System</p>
          <div className="brand-stats">
            <div className="brand-stat">
              <span className="brand-stat-val">99.9%</span>
              <span className="brand-stat-label">Uptime</span>
            </div>
            <div className="brand-divider" />
            <div className="brand-stat">
              <span className="brand-stat-val">256</span>
              <span className="brand-stat-label">Clients</span>
            </div>
            <div className="brand-divider" />
            <div className="brand-stat">
              <span className="brand-stat-val">24/7</span>
              <span className="brand-stat-label">Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="form-panel">
        <div className="card">
          {/* Gloss reflection */}
          <div className="card-gloss" />

          <div className="card-body">
            <div className="card-header">
              <p className="card-welcome">Welcome back</p>
              <h2 className="card-title">Sign in to your account</h2>
            </div>

            {/* Error */}
            {error && (
              <div className="error-box">
                <AlertCircle className="error-icon" size={18} />
                <p className="error-text">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="form">
              {/* Email */}
              <div className="field">
                <label className="field-label">Email address</label>
                <div className="input-wrap">
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="field">
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input input-pw"
                    required
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn-login">
                <span className="btn-login-bg" />
                <span className="btn-login-shine" />
                <span className="btn-login-content">
                  {loading ? (
                    <>
                      <span className="btn-spinner" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      <span>Sign In</span>
                    </>
                  )}
                </span>
              </button>
            </form>

            <p className="card-footer">
              Secured with Firebase Authentication
            </p>
          </div>
        </div>

        <p className="copyright">© {new Date().getFullYear()} JONIX System — All rights reserved</p>
      </div>

      <style>{`
        /* ─── Reset & Root ─── */
        .login-root {
          position: relative;
          width: 100%;
          min-height: 100vh;
          display: flex;
          background: #0a0e1a;
          color: #c8d0e0;
          font-family: 'Segoe UI', system-ui, sans-serif;
          overflow: hidden;
        }

        /* ─── Noise Texture ─── */
        .noise-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-size: 256px 256px;
        }

        /* ─── Grid Background ─── */
        .grid-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-image:
            linear-gradient(rgba(94,195,195,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(94,195,195,0.04) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 80%);
        }

        /* ─── Ambient Orbs ─── */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
        }
        .orb-1 {
          width: 520px; height: 520px;
          background: radial-gradient(circle, rgba(40,160,160,0.18) 0%, transparent 70%);
          top: -180px; left: -120px;
          animation: orbDrift 14s ease-in-out infinite alternate;
        }
        .orb-2 {
          width: 380px; height: 380px;
          background: radial-gradient(circle, rgba(60,100,220,0.15) 0%, transparent 70%);
          bottom: -100px; right: -80px;
          animation: orbDrift 18s ease-in-out infinite alternate-reverse;
        }
        .orb-3 {
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(94,195,195,0.12) 0%, transparent 70%);
          top: 55%; left: 35%;
          animation: orbDrift 22s ease-in-out infinite alternate;
        }
        @keyframes orbDrift {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, -30px) scale(1.08); }
        }

        /* ─── Particles ─── */
        .particle {
          position: absolute;
          background: rgba(94,195,195,0.5);
          border-radius: 50%;
          z-index: 1;
          animation: particleFloat linear infinite;
        }
        @keyframes particleFloat {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          8%   { opacity: 0.8; }
          92%  { opacity: 0.8; }
          100% { transform: translateY(-100vh) translateX(35px); opacity: 0; }
        }

        /* ─── Two-Column Layout ─── */
        .brand-panel {
          position: relative;
          z-index: 2;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 48px;
        }
        .form-panel {
          position: relative;
          z-index: 2;
          flex: 0 0 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 48px;
          background: linear-gradient(160deg, rgba(16,22,40,0.6) 0%, rgba(10,14,26,0.85) 100%);
          border-left: 1px solid rgba(94,195,195,0.08);
        }

        /* ─── Brand Panel ─── */
        .brand-inner {
          text-align: center;
          animation: fadeUp 0.9s cubic-bezier(.22,1,.36,1) both;
        }
        .brand-logo-wrap {
          margin-bottom: 32px;
        }
        .brand-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px; height: 80px;
          border-radius: 24px;
          background: linear-gradient(135deg, #1a2d4a 0%, #0f1e35 100%);
          border: 1px solid rgba(94,195,195,0.2);
          box-shadow: 0 0 40px rgba(94,195,195,0.08), inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .brand-logo-letter {
          font-size: 36px;
          font-weight: 700;
          background: linear-gradient(135deg, #5ec3c3, #3aa0a0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-family: 'Georgia', serif;
        }
        .brand-title {
          font-size: 48px;
          font-weight: 300;
          letter-spacing: 12px;
          color: #e8edf5;
          text-transform: uppercase;
          margin-bottom: 8px;
          font-family: 'Georgia', serif;
        }
        .brand-sub {
          font-size: 13px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(94,195,195,0.6);
          margin-bottom: 64px;
        }
        .brand-stats {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .brand-stat { text-align: center; }
        .brand-stat-val {
          display: block;
          font-size: 22px;
          font-weight: 600;
          color: #e8edf5;
          margin-bottom: 4px;
        }
        .brand-stat-label {
          font-size: 11px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(94,195,195,0.45);
        }
        .brand-divider {
          width: 1px; height: 36px;
          background: rgba(94,195,195,0.15);
        }

        /* ─── Card ─── */
        .card {
          position: relative;
          width: 100%;
          max-width: 380px;
          background: linear-gradient(145deg, rgba(22,32,56,0.9) 0%, rgba(14,20,38,0.95) 100%);
          border: 1px solid rgba(94,195,195,0.12);
          border-radius: 28px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.03) inset;
          overflow: hidden;
          animation: fadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.15s both;
        }
        .card-gloss {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 50%;
          background: linear-gradient(180deg, rgba(255,255,255,0.035) 0%, transparent 100%);
          pointer-events: none;
          border-radius: 28px 28px 0 0;
        }
        .card-body {
          position: relative;
          padding: 48px 36px 40px;
        }

        /* ─── Card Header ─── */
        .card-header {
          margin-bottom: 36px;
          text-align: center;
        }
        .card-welcome {
          display: inline-block;
          font-size: 11px;
          letter-spacing: 2.5px;
          text-transform: uppercase;
          color: rgba(94,195,195,0.7);
          margin-bottom: 10px;
          padding: 6px 14px;
          background: rgba(94,195,195,0.08);
          border: 1px solid rgba(94,195,195,0.15);
          border-radius: 20px;
        }
        .card-title {
          font-size: 22px;
          font-weight: 500;
          color: #dde3ef;
          line-height: 1.3;
        }

        /* ─── Error ─── */
        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px 16px;
          margin-bottom: 24px;
          background: rgba(220,50,50,0.08);
          border: 1px solid rgba(220,50,50,0.25);
          border-radius: 14px;
          animation: shake 0.4s ease;
        }
        .error-icon { color: #e05555; flex-shrink: 0; margin-top: 1px; }
        .error-text { font-size: 13px; color: #e08080; line-height: 1.45; }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        /* ─── Form ─── */
        .form { display: flex; flex-direction: column; gap: 20px; }

        /* ─── Field ─── */
        .field { display: flex; flex-direction: column; gap: 8px; }
        .field-label {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.8px;
          color: rgba(200,210,230,0.65);
        }
        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 16px;
          color: rgba(94,195,195,0.4);
          pointer-events: none;
          transition: color 0.25s;
          z-index: 1;
        }
        .input-wrap:focus-within .input-icon { color: rgba(94,195,195,0.85); }
        .input {
          width: 100%;
          padding: 14px 16px 14px 46px;
          font-size: 14px;
          color: #dde3ef;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(94,195,195,0.15);
          border-radius: 14px;
          outline: none;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
          caret-color: #5ec3c3;
        }
        .input::placeholder { color: rgba(180,195,220,0.3); }
        .input:focus {
          border-color: rgba(94,195,195,0.5);
          background: rgba(94,195,195,0.04);
          box-shadow: 0 0 0 3px rgba(94,195,195,0.1);
        }
        .input-pw { padding-right: 48px; }
        .pw-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: rgba(94,195,195,0.4);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
          z-index: 1;
        }
        .pw-toggle:hover { color: rgba(94,195,195,0.8); background: rgba(94,195,195,0.08); }

        /* ─── Login Button ─── */
        .btn-login {
          position: relative;
          width: 100%;
          height: 52px;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          overflow: hidden;
          margin-top: 8px;
          transition: transform 0.2s, box-shadow 0.3s;
        }
        .btn-login:hover { transform: translateY(-1px); box-shadow: 0 8px 30px rgba(94,195,195,0.25); }
        .btn-login:active { transform: translateY(0); }
        .btn-login:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }
        .btn-login-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #1b8a8a 0%, #2aadad 50%, #1b8a8a 100%);
          background-size: 200% 100%;
          animation: btnShimmer 3s ease infinite;
        }
        @keyframes btnShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .btn-login-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
          background-size: 200% 100%;
          background-position: -100% 0;
          transition: background-position 0.6s ease;
        }
        .btn-login:hover .btn-login-shine { background-position: 100% 0; }
        .btn-login-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          height: 100%;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .btn-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ─── Footer ─── */
        .card-footer {
          margin-top: 32px;
          text-align: center;
          font-size: 11px;
          color: rgba(140,160,195,0.4);
          letter-spacing: 0.5px;
        }
        .copyright {
          margin-top: 36px;
          font-size: 11px;
          color: rgba(140,160,195,0.3);
          text-align: center;
          letter-spacing: 0.3px;
        }

        /* ─── Entrance Animation ─── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ─── Responsive ─── */
        @media (max-width: 900px) {
          .login-root { flex-direction: column; }
          .brand-panel {
            flex: none;
            padding: 56px 24px 32px;
          }
          .form-panel {
            flex: 1;
            flex-basis: auto;
            border-left: none;
            border-top: 1px solid rgba(94,195,195,0.08);
            padding: 40px 24px 56px;
          }
          .brand-title { font-size: 36px; letter-spacing: 8px; }
          .brand-sub { margin-bottom: 36px; }
        }
        @media (max-width: 520px) {
          .brand-panel { padding: 40px 20px 24px; }
          .form-panel { padding: 32px 16px 48px; }
          .card { max-width: 100%; }
          .card-body { padding: 36px 24px 32px; }
          .brand-stats { gap: 20px; }
          .brand-stat-val { font-size: 18px; }
          .brand-logo { width: 64px; height: 64px; border-radius: 18px; }
          .brand-logo-letter { font-size: 28px; }
        }
      `}</style>
    </div>
  );
};