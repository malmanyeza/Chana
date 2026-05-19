import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { X, Sparkles, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { playNotificationSound } from '../services/soundService';

interface NotificationToast {
  id: string;
  type: 'signup' | 'payment';
  title: string;
  message: string;
}

export default function Layout({ title }: { title: string }) {
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  useEffect(() => {
    // Listen to changes on the profiles table
    const channel = supabase
      .channel('dashboard-realtime-notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('Realtime profile event received:', payload);
          const { eventType, new: newProfile, old: oldProfile } = payload;

          if (eventType === 'INSERT') {
            const name = newProfile?.full_name || 'A new member';
            const id = Math.random().toString(36).substring(7);
            
            // Play signup chime
            playNotificationSound('signup');
            
            // Add toast
            setToasts((prev) => [
              ...prev,
              {
                id,
                type: 'signup',
                title: 'New Signup! 🎉',
                message: `${name} has just registered on Chana.`
              }
            ]);
            
            // Auto dismiss toast after 6 seconds
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 6000);
          } else if (eventType === 'UPDATE') {
            // Check if user upgraded to premium
            const wasPremium = oldProfile ? !!oldProfile.is_premium : false;
            const isPremium = newProfile ? !!newProfile.is_premium : false;

            if (!wasPremium && isPremium) {
              const name = newProfile?.full_name || 'A user';
              const id = Math.random().toString(36).substring(7);

              // Play cash register ring! 💸
              playNotificationSound('payment');

              // Add toast
              setToasts((prev) => [
                ...prev,
                {
                  id,
                  type: 'payment',
                  title: 'Payment Received! 💸',
                  message: `${name} just upgraded to Chana Gold!`
                }
              ]);

              // Auto dismiss toast after 6 seconds
              setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
              }, 6000);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header title={title} />
        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {/* Floating Realtime Notification Toasts */}
      <div className="toasts-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card type-${toast.type}`}>
            <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '2px' }}>
              {toast.type === 'payment' ? (
                <div style={{ backgroundColor: 'rgba(245, 196, 0, 0.12)', padding: '8px', borderRadius: '8px', color: '#F5C400', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} />
                </div>
              ) : (
                <div style={{ backgroundColor: 'rgba(108, 99, 255, 0.12)', padding: '8px', borderRadius: '8px', color: '#6C63FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={18} />
                </div>
              )}
            </div>
            
            <div className="toast-content">
              <h4 className="toast-title">{toast.title}</h4>
              <p className="toast-sub">{toast.message}</p>
            </div>

            <button 
              className="toast-close" 
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
