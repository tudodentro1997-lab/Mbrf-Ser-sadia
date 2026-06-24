import React, { useState } from 'react';
import { Calendar, User, LogOut, LogIn, Sun, Moon, Shield, Menu, X } from 'lucide-react';

export default function Navbar({ user, currentPage, onNavigate, onLogout, theme, toggleTheme }) {
  const [isOpen, setIsOpen] = useState(false);

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') return <span className="badge badge-danger">ADMIN</span>;
    if (role === 'SOCIO') return <span className="badge badge-success">SÓCIO</span>;
    return <span className="badge badge-info">VISITANTE</span>;
  };

  return (
    <nav style={{
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      transition: 'background-color var(--transition-normal)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px'
      }}>
        {/* Logo */}
        <div 
          onClick={() => onNavigate('home')} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.25rem',
            color: 'var(--primary)'
          }}
        >
          <div style={{
            backgroundColor: 'var(--primary)',
            color: '#fff',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar size={22} />
          </div>
          <span>MBRF <span style={{ color: 'var(--text-primary)' }}>Sadia</span></span>
        </div>

        {/* Desktop Menu */}
        <div style={{ display: 'none', alignItems: 'center', gap: '20px' }} className="desktop-menu-container">
          <button 
            onClick={() => onNavigate('home')}
            className="btn btn-secondary"
            style={{ 
              border: 'none', 
              background: 'transparent',
              fontWeight: currentPage === 'home' ? '700' : '500',
              color: currentPage === 'home' ? 'var(--primary)' : 'var(--text-secondary)'
            }}
          >
            Locais
          </button>
          
          {user && (
            <button 
              onClick={() => onNavigate('my-bookings')}
              className="btn btn-secondary"
              style={{ 
                border: 'none', 
                background: 'transparent',
                fontWeight: currentPage === 'my-bookings' ? '700' : '500',
                color: currentPage === 'my-bookings' ? 'var(--primary)' : 'var(--text-secondary)'
              }}
            >
              Minhas Reservas
            </button>
          )}

          {user && user.role === 'ADMIN' && (
            <button 
              onClick={() => onNavigate('admin')}
              className="btn btn-secondary"
              style={{ 
                border: 'none', 
                background: 'transparent',
                fontWeight: currentPage === 'admin' ? '700' : '500',
                color: currentPage === 'admin' ? 'var(--danger)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Shield size={16} /> Painel Admin
            </button>
          )}
        </div>

        {/* Actions / Auth */}
        <div style={{ display: 'none', alignItems: 'center', gap: '15px' }} className="desktop-menu-container">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', width: '40px', height: '40px' }}
            title="Alternar Tema"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>{user.name}</span>
                {getRoleBadge(user.role)}
              </div>
              <button 
                onClick={onLogout} 
                className="btn btn-secondary"
                style={{ 
                  color: 'var(--danger)', 
                  borderColor: 'var(--danger-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onNavigate('login')} 
              className="btn btn-primary"
            >
              <LogIn size={16} /> Entrar / Cadastrar
            </button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className="mobile-trigger-container">
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', width: '42px', height: '42px' }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="btn btn-secondary"
            style={{ padding: '8px' }}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }} className="mobile-menu">
          <button 
            onClick={() => { onNavigate('home'); setIsOpen(false); }}
            style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent', textAlign: 'left', padding: '10px 0' }}
          >
            Locais
          </button>
          
          {user && (
            <button 
              onClick={() => { onNavigate('my-bookings'); setIsOpen(false); }}
              style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent', textAlign: 'left', padding: '10px 0' }}
            >
              Minhas Reservas
            </button>
          )}

          {user && user.role === 'ADMIN' && (
            <button 
              onClick={() => { onNavigate('admin'); setIsOpen(false); }}
              style={{ justifyContent: 'flex-start', border: 'none', background: 'transparent', textAlign: 'left', padding: '10px 0', color: 'var(--danger)' }}
            >
              Painel Admin
            </button>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', padding: '12px 0 0 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {user ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{user.name}</span>
                  {getRoleBadge(user.role)}
                </div>
                <button 
                  onClick={() => { onLogout(); setIsOpen(false); }} 
                  className="btn btn-secondary"
                  style={{ color: 'var(--danger)', width: '100%' }}
                >
                  <LogOut size={16} /> Sair
                </button>
              </>
            ) : (
              <button 
                onClick={() => { onNavigate('login'); setIsOpen(false); }} 
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <LogIn size={16} /> Entrar / Cadastrar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Estilos responsivos embutidos */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-menu-container {
            display: flex !important;
          }
          .mobile-trigger-container {
            display: none !important;
          }
          .mobile-menu {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
