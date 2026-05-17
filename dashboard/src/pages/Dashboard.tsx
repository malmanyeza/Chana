import React, { useEffect, useState } from 'react';
import { Users, Heart, MessageCircle, Activity } from 'lucide-react';
import { fetchDashboardData } from '../services/userService';
import type { DashboardMetrics, UserStats } from '../services/userService';

export default function Dashboard() {
  const [data, setData] = useState<{ users: UserStats[], metrics: DashboardMetrics } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchDashboardData();
        setData(result);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container" style={{ color: 'var(--error)' }}>
        <h2>Error Loading Data</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, users } = data;

  return (
    <div>
      {/* Metrics Overview */}
      <div className="grid-cards">
        <div className="stat-card">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p>{metrics.totalUsers}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(233, 30, 99, 0.1)', color: 'var(--accent)' }}>
            <Heart size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Likes Sent</h3>
            <p>{metrics.totalLikes}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', color: 'var(--success)' }}>
            <MessageCircle size={24} />
          </div>
          <div className="stat-info">
            <h3>Total Matches</h3>
            <p>{metrics.totalMatches}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(33, 150, 243, 0.1)', color: '#2196F3' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <h3>Active Profiles</h3>
            <p>{metrics.activeUsers}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">Recent Users</h2>
          <button style={{ 
            backgroundColor: 'var(--primary)', 
            color: '#FFF', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 500
          }}>
            Export CSV
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Location</th>
                <th>Total Likes</th>
                <th>Pending Likes</th>
                <th>Matches</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} className="avatar" />
                      ) : (
                        <div className="avatar-placeholder">{user.fullName.charAt(0)}</div>
                      )}
                      <div>
                        <div className="user-name">{user.fullName}</div>
                        <div className="user-email">{user.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td>{user.age || '--'}</td>
                  <td>
                    <span className={`badge ${
                      user.gender === 'woman' ? 'badge-purple' : 
                      user.gender === 'man' ? 'badge-blue' : 'badge-orange'
                    }`}>
                      {user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}
                    </span>
                  </td>
                  <td>{user.location || '--'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.totalLikesReceived}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{user.pendingLikes}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>{user.matches}</td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {new Date(user.joinedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
