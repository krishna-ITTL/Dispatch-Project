import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

const Users = () => {
  const { user } = useOutletContext();
  const toast = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', role: 'User', email: '', password: '' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      setProfiles(data || []);
    } catch (e) {
      console.error(e);
      toast('Failed to fetch users', 'error');
    } finally { setLoading(false); }
  };

  const openModal = (u = null) => {
    if (u) {
      setEditingUser(u);
      setFormData({ name: u.name, role: u.role, email: '', password: '' });
    } else {
      setEditingUser(null);
      setFormData({ name: '', role: 'User', email: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const saveUser = async () => {
    try {
      if (editingUser) {
        const { error } = await supabase.from('profiles').update({ name: formData.name, role: formData.role }).eq('id', editingUser.id);
        if (error) throw error;
        toast('User updated');
      } else {
        if (!formData.email || !formData.password || !formData.name) {
          toast('Name, email, and password are required', 'error');
          return;
        }
        if (formData.password.length < 6) {
          toast('Password must be at least 6 characters', 'error');
          return;
        }
        
        // Use Supabase Auth to create user
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { name: formData.name }
          }
        });
        
        if (error) throw error;
        
        if (data?.user) {
          if (data.user.identities && data.user.identities.length === 0) {
            throw new Error('This email is already registered.');
          }
          // Upsert the profile with selected role
          const { error: profErr } = await supabase.from('profiles').upsert([
            { id: data.user.id, name: formData.name, role: formData.role }
          ]);
          if (profErr) throw profErr;
        }
        toast('User created! They may need to verify their email.');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (e) {
      toast(e.message || 'Failed to save user', 'error');
    }
  };

  const deleteUser = async (id, name) => {
    if (id === user.id) { toast('Cannot delete yourself!', 'error'); return; }
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      toast('User deleted');
      fetchUsers();
    } catch (e) {
      toast('Failed to delete user', 'error');
    }
  };

  const roleColor = (r) => ({ Admin: '#e53e3e', Supervisor: '#3182ce', User: '#38a169', Security: '#ed8936', 'Dashboard User': '#805ad5' }[r] || '#718096');

  return (
    <div>
      <div className="page-header">
        <h2>User Management</h2>
        <button className="btn btn-red" onClick={() => openModal()}>+ Add User</button>
      </div>
      <p style={{ color: '#718096', fontSize: '13px', marginBottom: '20px' }}>Manage user accounts and assign roles. Role determines module access and permissions.</p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>NAME</th><th>ROLE</th><th>ACTIONS</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : profiles.length === 0 ? (
              <tr><td colSpan="3" style={{ textAlign: 'center', color: '#718096', padding: '24px' }}>No users found.</td></tr>
            ) : (
              profiles.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: roleColor(u.role), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '13px' }}>
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <strong>{u.name}</strong>
                        {u.id === user?.id && <span style={{ background: '#edf2f7', color: '#4a5568', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>You</span>}
                      </div>
                    </div>
                  </td>
                  <td><span style={{ background: roleColor(u.role), color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}>{u.role}</span></td>
                  <td style={{ display: 'flex', gap: '4px' }}>
                    <button className="icon-btn" onClick={() => openModal(u)}>✏️</button>
                    {u.id !== user?.id && <button className="icon-btn danger" onClick={() => deleteUser(u.id, u.name)}>🗑️</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', marginTop: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Role Permissions Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ background: '#fff5f5', borderRadius: '10px', padding: '16px', border: '1px solid #fed7d7' }}>
            <h4 style={{ color: '#e53e3e', marginBottom: '12px' }}>🔴 Admin</h4>
            <div style={{ fontSize: '12px', lineHeight: '22px' }}>✅ All Modules<br/>✅ Create / Edit / Delete<br/>✅ User Management<br/>✅ Reports & Export<br/>✅ Master List</div>
          </div>
          <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: '10px', padding: '16px' }}>
            <h4 style={{ color: '#3182ce', marginBottom: '12px' }}>🔵 Supervisor</h4>
            <div style={{ fontSize: '12px', lineHeight: '22px' }}>✅ All Modules<br/>✅ Create / Edit / Delete<br/>❌ User Management<br/>✅ Reports & Export<br/>✅ Master List</div>
          </div>
          <div style={{ background: '#f0fff4', border: '1px solid #c6f6d5', borderRadius: '10px', padding: '16px' }}>
            <h4 style={{ color: '#38a169', marginBottom: '12px' }}>🟢 User</h4>
            <div style={{ fontSize: '12px', lineHeight: '22px' }}>✅ Dashboard, WO, Packing, Loading<br/>✅ View & Add only<br/>❌ Delete / Reports / Users</div>
          </div>
          <div style={{ background: '#feebc8', border: '1px solid #fbd38d', borderRadius: '10px', padding: '16px' }}>
            <h4 style={{ color: '#dd6b20', marginBottom: '12px' }}>🟠 Security</h4>
            <div style={{ fontSize: '12px', lineHeight: '22px' }}>✅ Security Vehicle Entry module<br/>❌ Core modules<br/>❌ Admin / Master Lists</div>
          </div>
          <div style={{ background: '#faf5ff', border: '1px solid #e9d8fd', borderRadius: '10px', padding: '16px' }}>
            <h4 style={{ color: '#805ad5', marginBottom: '12px' }}>🟣 Dashboard User</h4>
            <div style={{ fontSize: '12px', lineHeight: '22px' }}>✅ View Dashboard Analytics<br/>❌ Data Entry<br/>❌ User Management</div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setIsModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="form-group"><label>Name</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" /></div>
            {!editingUser && (
              <>
                <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email Address" /></div>
                <div className="form-group"><label>Password</label><input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="At least 6 characters" /></div>
              </>
            )}
            <div className="form-group"><label>Role</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                {['Admin', 'Supervisor', 'Security', 'Dashboard User', 'User'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-red" onClick={saveUser}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
