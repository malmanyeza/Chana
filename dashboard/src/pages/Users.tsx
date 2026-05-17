import React, { useEffect, useState } from 'react';
import { fetchDashboardData } from '../services/userService';
import type { UserStats } from '../services/userService';
import { Search } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchDashboardData();
        setUsers(result.users);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === 'all' || user.gender === genderFilter;
    
    return matchesSearch && matchesGender;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading full user directory...</p>
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)' }}>All Users Directory</h2>
        
        <div style={{ display: 'flex', gap: 16 }}>
          <select 
            value={genderFilter} 
            onChange={(e) => setGenderFilter(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Genders</option>
            <option value="man">Men</option>
            <option value="woman">Women</option>
            <option value="unspecified">Unspecified</option>
          </select>

          <div style={{ position: 'relative' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search names or IDs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-sm)', 
                padding: '8px 16px 8px 36px',
                color: 'var(--text-main)',
                outline: 'none',
                width: '240px'
              }} 
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2 className="table-title">Registered Users ({filteredUsers.length})</h2>
          <button style={{ 
            backgroundColor: 'transparent', 
            color: 'var(--primary)', 
            border: '1px solid var(--primary)', 
            padding: '8px 16px', 
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 500
          }}>
            Export Selection
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
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
                  <td>
                    <button style={{
                      backgroundColor: 'transparent',
                      color: 'var(--text-muted)',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}>
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>
                    No users match your filters.
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
