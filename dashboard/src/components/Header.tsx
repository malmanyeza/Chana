import React, { useState, useEffect } from 'react';
import { Search, Bell, Sun, Moon } from 'lucide-react';

export default function Header({ title }: { title: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search..." 
            style={{ 
              backgroundColor: 'var(--bg-main)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-full)', 
              padding: '8px 16px 8px 36px',
              color: 'var(--text-main)',
              outline: 'none',
              width: '240px'
            }} 
          />
        </div>

        <button 
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-fast)',
            outline: 'none',
          }}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={20} color="var(--text-muted)" />
          <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, backgroundColor: 'var(--primary)', borderRadius: '50%' }}></div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div className="avatar-placeholder" style={{ width: 36, height: 36, backgroundColor: 'rgba(255, 87, 34, 0.15)', color: 'var(--primary)' }}>C</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Chana Admin</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>admin@chana.com</span>
          </div>
        </div>
      </div>
    </header>
  );
}
