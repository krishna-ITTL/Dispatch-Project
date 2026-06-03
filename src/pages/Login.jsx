import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShieldCheck, UserCog, HardHat, BarChart3, Lock, Mail, Key, ArrowRight, Eye, EyeOff, Loader2, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react';

// ─── Steps: 'role_selection' | 'login' | 'forgot' | 'reset_sent'
const Login = () => {
  const [step, setStep] = useState('role_selection');
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [animatingRole, setAnimatingRole] = useState(false);
  const navigate = useNavigate();

  // Check if user arrived from password recovery link
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setStep('login');
      setInfo('Password reset confirmed. Please log in with your new credentials.');
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const reset = () => { setError(null); setInfo(null); };

  // ── Post-Login Redirect Logic
  const redirectByRole = (role) => {
    if (role === 'Security') {
      navigate('/vehicles');
      return;
    }
    navigate('/');
  };

  // ── Role Map: button label → expected DB role
  const roleMap = {
    'Admin': 'Admin',
    'Supervisor': 'Supervisor',
    'User': 'User',
    'Dashboard User': 'Dashboard User',
    'Security': 'Security'
  };

  // ── Login with role enforcement
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); reset();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) {
      setError(authError.message || 'Invalid login credentials. Please try again.');
      setLoading(false);
      return;
    }
    
    if (data?.user) {
      // Fetch fresh profile from DB — never trust client state
      const { data: prof } = await supabase.from('profiles').select('id, role').eq('id', data.user.id).single();
      
      if (!prof) {
        // Profile should be auto-created by DB trigger. Retry once.
        await new Promise(r => setTimeout(r, 500));
        const { data: retryProf } = await supabase.from('profiles').select('id, role').eq('id', data.user.id).single();
        if (!retryProf) {
          await supabase.auth.signOut();
          setError('Profile not found. Please contact your administrator.');
          setLoading(false);
          return;
        }
        // Validate role match
        const dbRole = retryProf.role;
        const expectedDbRole = roleMap[selectedRole];
        if (dbRole !== expectedDbRole) {
          await supabase.auth.signOut();
          setError(`This account is registered as "${dbRole}". Please use the correct login button.`);
          setLoading(false);
          return;
        }
        redirectByRole(dbRole);
        setLoading(false);
        return;
      }

      // Validate: clicked button must match DB role
      const dbRole = prof.role;
      const expectedDbRole = roleMap[selectedRole];
      if (dbRole !== expectedDbRole) {
        await supabase.auth.signOut();
        setError(`This account is registered as "${dbRole}". Please use the correct login button.`);
        setLoading(false);
        return;
      }

      redirectByRole(dbRole);
    }
    setLoading(false);
  };

  // ── Forgot password
  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true); reset();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setLoading(false);
    setStep('reset_sent');
  };

  // ─── Shared styles (unified with main app: #1a2332, #e53e3e, DM Sans)
  const bgStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'radial-gradient(circle at top right, #1a2332, #0f172a 40%, #020617 100%)',
    padding: '20px',
    color: '#f8fafc',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif"
  };

  // Decorative ambient glows
  const glow1 = {
    position: 'absolute', top: '-15%', right: '-10%', width: '600px', height: '600px',
    background: 'radial-gradient(circle, rgba(229,62,62,0.12) 0%, rgba(0,0,0,0) 70%)',
    borderRadius: '50%', pointerEvents: 'none', zIndex: 0
  };
  const glow2 = {
    position: 'absolute', bottom: '-20%', left: '-10%', width: '500px', height: '500px',
    background: 'radial-gradient(circle, rgba(49,130,206,0.08) 0%, rgba(0,0,0,0) 70%)',
    borderRadius: '50%', pointerEvents: 'none', zIndex: 0
  };

  const glassCard = {
    background: 'rgba(26, 35, 50, 0.6)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '48px 40px',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    width: '100%',
    maxWidth: '440px',
    zIndex: 1,
    position: 'relative'
  };

  const inputWrap = { position: 'relative', marginBottom: '20px' };
  const inputLabel = { display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.3px' };
  const inputField = {
    width: '100%', padding: '12px 16px 12px 42px',
    background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px', fontSize: '15px', color: '#f8fafc', outline: 'none',
    transition: 'all 0.3s ease', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif"
  };
  const inputIcon = { position: 'absolute', left: '14px', bottom: '12px', color: '#64748b' };
  const btnPrimary = {
    width: '100%', padding: '14px', background: '#e53e3e',
    color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600',
    cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(229, 62, 62, 0.4)',
    fontFamily: "'DM Sans', sans-serif"
  };
  const linkStyle = {
    color: '#fc8181', cursor: 'pointer', fontWeight: '500', fontSize: '14px',
    textDecoration: 'none', border: 'none', background: 'none', fontFamily: "'DM Sans', sans-serif",
    transition: 'color 0.2s'
  };

  // Role definitions — Admin separated for distinct styling
  const primaryRoles = [
    { name: 'Supervisor', icon: UserCog, color: '#3182ce', shadow: 'rgba(49, 130, 206, 0.3)', desc: 'Operations Manager' },
    { name: 'User', icon: HardHat, color: '#38a169', shadow: 'rgba(56, 161, 105, 0.3)', desc: 'Yard & Logistics' },
    { name: 'Dashboard User', icon: BarChart3, color: '#805ad5', shadow: 'rgba(128, 90, 213, 0.3)', desc: 'Analytics & Reports' },
    { name: 'Security', icon: Lock, color: '#dd6b20', shadow: 'rgba(221, 107, 32, 0.3)', desc: 'Gate Management' }
  ];

  const handleRoleSelect = (roleName) => {
    setAnimatingRole(true);
    setTimeout(() => {
      setSelectedRole(roleName);
      setStep('login');
      setAnimatingRole(false);
    }, 300);
  };

  // ─── Render: Role Selection ───
  if (step === 'role_selection') {
    return (
      <div style={bgStyle}>
        <div style={glow1}></div><div style={glow2}></div>
        
        {/* Admin button — top-right, smaller, outlined, secondary feel */}
        <div style={{
          position: 'absolute', top: '28px', right: '28px', zIndex: 2,
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: animatingRole ? 0 : 1
        }}>
          <button
            onClick={() => handleRoleSelect('Admin')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '12px',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              color: '#fca5a5', cursor: 'pointer', fontSize: '13px',
              fontWeight: '600', fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.3s ease', backdropFilter: 'blur(8px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.5)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(244, 63, 94, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.25)';
              e.currentTarget.style.color = '#fca5a5';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <ShieldCheck size={16} /> Admin Access
          </button>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '48px', transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)', opacity: animatingRole ? 0 : 1, transform: animatingRole ? 'scale(0.95)' : 'scale(1)', zIndex: 1 }}>
          <div style={{
            width: '80px', height: '80px', background: '#ffffff', 
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', padding: '12px',
            boxShadow: '0 10px 25px rgba(229, 62, 62, 0.4)'
          }}>
            <img src="/Asserts/logo.svg" alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: '#f8fafc', letterSpacing: '-0.5px', fontFamily: "'DM Sans', sans-serif" }}>INDOTECH DISPATCH MANAGEMENT SYSTEM</h2>
          <p style={{ color: '#94a3b8', fontSize: '16px', fontWeight: '400' }}>Select your authorization level to proceed</p>
        </div>

        {/* 4 Primary role cards — centered 2×2 grid */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(2, 180px)', gap: '20px', justifyContent: 'center',
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)', opacity: animatingRole ? 0 : 1, 
          transform: animatingRole ? 'translateY(20px)' : 'translateY(0)', zIndex: 1 
        }}>
          {primaryRoles.map(r => {
            const Icon = r.icon;
            return (
              <div
                key={r.name}
                className="role-card"
                onClick={() => handleRoleSelect(r.name)}
                style={{
                  height: '200px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '20px', padding: '28px 20px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = r.color;
                  e.currentTarget.style.background = `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, ${r.color}15 100%)`;
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = `0 20px 40px -10px ${r.shadow}`;
                  e.currentTarget.querySelector('.icon-wrap').style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.querySelector('.icon-wrap').style.transform = 'scale(1)';
                }}
              >
                <div className="icon-wrap" style={{
                  width: '64px', height: '64px', borderRadius: '16px',
                  background: `${r.color}1a`, display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', marginBottom: '20px', transition: 'transform 0.3s ease'
                }}>
                  <Icon size={32} color={r.color} strokeWidth={1.5} />
                </div>
                <div style={{ color: '#f8fafc', fontSize: '15px', fontWeight: '600', textAlign: 'center', letterSpacing: '0.3px' }}>{r.name}</div>
                <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', marginTop: '8px', fontWeight: '500' }}>{r.desc}</div>
              </div>
            );
          })}
        </div>
        
        <div style={{ position: 'absolute', bottom: '30px', textAlign: 'center', color: '#475569', fontSize: '12px', zIndex: 1, fontWeight: '500', letterSpacing: '1px' }}>
          INDOTECH DISPATCH MANAGEMENT SYSTEM
        </div>
      </div>
    );
  }

  return (
    <div style={bgStyle}>
      <div style={glow1}></div><div style={glow2}></div>
      
      <div style={{ width: '100%', maxWidth: '440px', zIndex: 1, animation: 'fadeIn 0.4s ease-out forwards' }}>
        
        {step !== 'role_selection' && selectedRole && (
          <button
            onClick={() => { setStep('role_selection'); setSelectedRole(null); reset(); setEmail(''); setPassword(''); }}
            style={{ 
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', 
              color: '#cbd5e1', cursor: 'pointer', fontSize: '13px', padding: '8px 16px', 
              borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px',
              marginBottom: '24px', transition: 'all 0.2s', backdropFilter: 'blur(10px)',
              fontFamily: "'DM Sans', sans-serif"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cbd5e1'; }}
          >
            <ChevronLeft size={16} /> Change Role
          </button>
        )}

        <div style={glassCard}>
          {/* Logo & Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '60px', height: '60px', background: '#ffffff', 
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', padding: '10px',
              boxShadow: '0 8px 16px rgba(229, 62, 62, 0.3)'
            }}>
              <img src="/Asserts/logo.svg" alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '6px', color: '#f8fafc', letterSpacing: '-0.5px', fontFamily: "'DM Sans', sans-serif" }}>Welcome Back</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Please enter your credentials to access the system.</p>
          </div>

          {selectedRole && (
            <div style={{
              background: `linear-gradient(90deg, ${
                selectedRole === 'Admin' ? '#e53e3e' :
                selectedRole === 'Supervisor' ? '#3182ce' :
                selectedRole === 'User' ? '#38a169' :
                selectedRole === 'Dashboard User' ? '#805ad5' : '#dd6b20'
              }22, rgba(0,0,0,0))`,
              borderLeft: `3px solid ${
                selectedRole === 'Admin' ? '#e53e3e' :
                selectedRole === 'Supervisor' ? '#3182ce' :
                selectedRole === 'User' ? '#38a169' :
                selectedRole === 'Dashboard User' ? '#805ad5' : '#dd6b20'
              }`,
              color: '#e2e8f0', padding: '10px 16px', borderRadius: '4px', fontSize: '13px', 
              fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px'
            }}>
              {selectedRole === 'Admin' && <ShieldCheck size={16} color="#e53e3e" />}
              {selectedRole === 'Supervisor' && <UserCog size={16} color="#3182ce" />}
              {selectedRole === 'User' && <HardHat size={16} color="#38a169" />}
              {selectedRole === 'Dashboard User' && <BarChart3 size={16} color="#805ad5" />}
              {selectedRole === 'Security' && <Lock size={16} color="#dd6b20" />}
              Authenticating as <strong style={{ color: '#fff' }}>{selectedRole}</strong>
            </div>
          )}

          {/* ── Error / Info banners */}
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} /> <span>{error}</span>
            </div>
          )}
          {info && (
            <div style={{ background: 'rgba(56, 161, 105, 0.1)', border: '1px solid rgba(56, 161, 105, 0.2)', color: '#6ee7b7', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', fontSize: '13px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <CheckCircle2 size={18} /> <span>{info}</span>
            </div>
          )}

          {/* ════════════ LOGIN ════════════ */}
          {step === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={inputWrap}>
                <label style={inputLabel}>Email Address</label>
                <Mail size={18} style={inputIcon} />
                <input className="glass-input" style={inputField} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="professional@indotech.com" required />
              </div>
              
              <div style={inputWrap}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ ...inputLabel, marginBottom: 0 }}>Password</label>
                  <button type="button" style={linkStyle} onClick={() => { setStep('forgot'); reset(); }}>Forgot?</button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Key size={18} style={inputIcon} />
                  <input className="glass-input" style={inputField} type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ ...btnPrimary, marginTop: '12px', opacity: loading ? 0.7 : 1 }}>
                {loading ? <><Loader2 size={18} className="spin" /> Authenticating...</> : <>Secure Login <ArrowRight size={18} /></>}
              </button>
            </form>
          )}

          {/* ════════════ FORGOT PASSWORD ════════════ */}
          {step === 'forgot' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(229, 62, 62, 0.1)', color: '#fc8181', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Key size={32} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#f8fafc', marginBottom: '8px', fontFamily: "'DM Sans', sans-serif" }}>Password Recovery</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Enter your email to receive a reset link.</p>
              </div>
              <form onSubmit={handleForgot}>
                <div style={inputWrap}>
                  <label style={inputLabel}>Email Address</label>
                  <Mail size={18} style={inputIcon} />
                  <input className="glass-input" style={inputField} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@indotech.com" required />
                </div>
                <button type="submit" disabled={loading} style={{ ...btnPrimary, marginTop: '20px', opacity: loading ? 0.7 : 1 }}>
                  {loading ? <><Loader2 size={18} className="spin" /> Sending...</> : 'Send Recovery Link'}
                </button>
              </form>
            </>
          )}

          {/* ════════════ RESET SENT ════════════ */}
          {step === 'reset_sent' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(56, 161, 105, 0.1)', color: '#68d391', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>Request Processed</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                If an account exists for <strong style={{ color: '#e2e8f0' }}>{email}</strong>, a recovery link has been sent.
              </p>
              <button onClick={() => { setStep('login'); reset(); }} style={btnPrimary}>
                Return to Login
              </button>
            </div>
          )}

        </div>
        <p style={{ textAlign: 'center', color: '#475569', fontSize: '12px', marginTop: '32px', fontWeight: '500', letterSpacing: '1px' }}>
          INDOTECH DISPATCH MANAGEMENT SYSTEM
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        .glass-input:focus {
          border-color: #e53e3e !important;
          background: rgba(15, 23, 42, 0.8) !important;
          box-shadow: 0 0 0 3px rgba(229, 62, 62, 0.15);
        }
        .glass-input::placeholder {
          color: #475569;
        }
      `}</style>
    </div>
  );
};

export default Login;
