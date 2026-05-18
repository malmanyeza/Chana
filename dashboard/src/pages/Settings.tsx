import React, { useState, useEffect } from 'react';
import { Save, Plus } from 'lucide-react';
import { fetchPlans, updatePlanPrice, fetchSystemSetting, updateSystemSetting } from '../services/settingsService';
import type { SubscriptionPlan } from '../services/settingsService';

export default function Settings() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [freeSwipesLimit, setFreeSwipesLimit] = useState<number>(20);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const plansData = await fetchPlans();
      if (plansData.length > 0) {
        setPlans(plansData);
      }
      
      const limit = await fetchSystemSetting('free_swipes_limit', '20');
      setFreeSwipesLimit(parseInt(limit) || 20);
      
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handlePriceChange = (index: number, newPrice: string) => {
    const updated = [...plans];
    updated[index].price = parseFloat(newPrice) || 0;
    setPlans(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    let success = true;
    
    // Save each plan to the database
    for (const plan of plans) {
      const saved = await updatePlanPrice(plan.id, plan.price);
      if (!saved) success = false;
    }

    // Save free swipes limit
    const savedLimit = await updateSystemSetting('free_swipes_limit', freeSwipesLimit.toString());
    if (!savedLimit) success = false;

    setSaving(false);
    if (success) {
      alert('Settings updated successfully in the database!');
    } else {
      alert('Error saving some settings. Check console.');
    }
  };

  if (loading) {
    return <div style={{ padding: 32 }}>Loading settings...</div>;
  }


  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)' }}>App Settings</h2>
        <button 
          onClick={handleSave}
          disabled={saving}
          style={{ 
            backgroundColor: 'var(--primary)', 
            color: '#FFF', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: saving ? 0.7 : 1
          }}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="table-container" style={{ padding: 32, marginBottom: 32 }}>
        <h3 style={{ marginBottom: 24, fontSize: 18 }}>Subscription Pricing</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {plans.map((plan, index) => (
            <div key={plan.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{plan.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Billed per {plan.period}</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>$</span>
                <input 
                  type="number" 
                  value={plan.price.toFixed(2)}
                  onChange={(e) => handlePriceChange(index, e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    width: 100,
                    fontSize: 16,
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <button 
          style={{ 
            marginTop: 24,
            backgroundColor: 'transparent', 
            color: 'var(--primary)', 
            border: '1px dashed var(--primary)', 
            padding: '12px', 
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%'
          }}
        >
          <Plus size={18} />
          Add New Subscription Plan
        </button>
      </div>
      
      <div className="table-container" style={{ padding: 32 }}>
        <h3 style={{ marginBottom: 8, fontSize: 18 }}>App Swipe Limits</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Configure dynamic limitations for free-tier users.</p>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Daily Free Swipes Limit</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Maximum swipes a standard user can send every 24 hours</div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input 
              type="number" 
              value={freeSwipesLimit}
              onChange={(e) => setFreeSwipesLimit(parseInt(e.target.value) || 0)}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                width: 100,
                fontSize: 16,
                fontWeight: 600,
                outline: 'none',
                textAlign: 'center'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
