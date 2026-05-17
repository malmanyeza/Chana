import React from 'react';
import { Search, Bell } from 'lucide-react';

export default function Header({ title }: { title: string }) {
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
        
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={20} color="var(--text-muted)" />
          <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, backgroundColor: 'var(--primary)', borderRadius: '50%' }}></div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div className="avatar-placeholder" style={{ width: 36, height: 36 }}>A</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Admin User</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Superadmin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
