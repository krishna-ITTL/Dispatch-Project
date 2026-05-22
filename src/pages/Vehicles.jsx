import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import { logActivity } from '../lib/activityLogger';

const Vehicles = () => {
  const { user } = useOutletContext();
  const toast = useToast();
  
  const [vehicles, setVehicles] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [masterTypes, setMasterTypes] = useState([]);
  const [masterCustomers, setMasterCustomers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    num: '', type: '', wo_num: '', customer: '', driver: '', phone: '', shift: '', status: 'Pending'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        { data: vehs },
        { data: wos },
        { data: masterLists }
      ] = await Promise.all([
        supabase.from('vehicles').select('*').order('id', { ascending: false }),
        supabase.from('work_orders').select('wo_num, customer'),
        supabase.from('master_list').select('*').in('category_key', ['Vehicle Types', 'Customers'])
      ]);

      setVehicles(vehs || []);
      setWorkOrders(wos || []);
      
      const mList = masterLists || [];
      setMasterTypes(mList.filter(m => m.category_key === 'Vehicle Types').map(m => m.value));
      setMasterCustomers(mList.filter(m => m.category_key === 'Customers').map(m => m.value));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = () => true;
  const canDelete = () => user?.role === 'Admin' || user?.role === 'Supervisor';

  const filteredVehicles = vehicles.filter(v => {
    if (filter !== 'All' && v.status !== filter) return false;
    if (search && !String(v.num || '').toLowerCase().includes(search.toLowerCase()) && 
        !(v.driver || '').toLowerCase().includes(search.toLowerCase()) &&
        !(v.wo_num || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: vehicles.length,
    packing: vehicles.filter(v => v.status === 'Packing').length,
    loading: vehicles.filter(v => v.status === 'Loading').length,
    dispatched: vehicles.filter(v => v.status === 'Dispatched' || v.status === 'Delivered').length
  };

  const openModal = (veh = null) => {
    if (veh) {
      setEditingVehicle(veh);
      setFormData({
        num: veh.num || '', type: veh.type || '', wo_num: veh.wo_num || '', 
        customer: veh.customer || '', driver: veh.driver || '', phone: veh.phone || '', 
        shift: veh.shift || '', status: veh.status || 'Pending'
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        num: '', type: '', wo_num: '', customer: '', driver: '', phone: '', shift: '', status: 'Pending'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleWOChange = (e) => {
    const woNum = e.target.value;
    const wo = workOrders.find(x => x.wo_num === woNum);
    setFormData({ ...formData, wo_num: woNum, customer: wo ? wo.customer : '' });
  };

  const saveVehicle = async () => {
    if (!formData.num || !formData.type) {
      toast('Vehicle Number and Type are required', 'error');
      return;
    }

    try {
      if (editingVehicle) {
        const { error } = await supabase.from('vehicles').update(formData).eq('id', editingVehicle.id);
        if (error) throw error;
        await logActivity(user?.id, 'Vehicles', 'UPDATE', `Updated Vehicle ${formData.num}`);
        toast('Vehicle updated');
      } else {
        const { error } = await supabase.from('vehicles').insert([formData]);
        if (error) throw error;
        await logActivity(user?.id, 'Vehicles', 'CREATE', `Added Vehicle ${formData.num}`);
        toast('Vehicle added');
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      toast('Failed to save vehicle', 'error');
    }
  };

  const deleteVehicle = async (id, num) => {
    if (!window.confirm(`Are you sure you want to delete ${num}?`)) return;
    
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      await logActivity(user?.id, 'Vehicles', 'DELETE', `Deleted Vehicle ${num}`);
      toast('Vehicle deleted');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast('Failed to delete vehicle', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Vehicle Management</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="search-wrap">
            <input 
              className="search-input" 
              placeholder="Search..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          {canEdit() && (
            <button className="btn btn-red" onClick={() => openModal()}>
              + Add Vehicle
            </button>
          )}
        </div>
      </div>

      {user?.role !== 'Security' && (
        <div className="packing-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="packing-stat"><div className="icon" style={{fontSize: '24px'}}>🚛</div><div className="label">Total</div><div className="value">{stats.total}</div><div className="sub">All vehicles</div></div>
          <div className="packing-stat"><div className="icon" style={{fontSize: '24px'}}>📦</div><div className="label">Packing</div><div className="value val-orange">{stats.packing}</div></div>
          <div className="packing-stat"><div className="icon" style={{fontSize: '24px'}}>🚚</div><div className="label">Loading</div><div className="value val-blue">{stats.loading}</div></div>
          <div className="packing-stat"><div className="icon" style={{fontSize: '24px'}}>✅</div><div className="label">Dispatched</div><div className="value val-green">{stats.dispatched}</div></div>
        </div>
      )}

      <div className="filter-tabs" style={{ marginBottom: '20px' }}>
        {['All', 'Pending', 'Packing', 'Loading', 'Dispatched', 'Delivered'].map(f => (
          <button 
            key={f} 
            className={`filter-tab ${filter === f ? 'active' : ''}`} 
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>VEHICLE #</th><th>TYPE</th><th>WORK ORDER</th><th>CUSTOMER</th>
              <th>DRIVER</th><th>PHONE</th><th>DATE & TIME</th><th>STATUS</th><th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : filteredVehicles.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', color: '#718096', padding: '24px' }}>No vehicles found.</td></tr>
            ) : (
              filteredVehicles.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.num}</strong></td>
                  <td>{v.type}</td>
                  <td style={{ color: '#e53e3e', fontWeight: '600' }}>{v.wo_num}</td>
                  <td>{v.customer}</td>
                  <td>{v.driver}</td>
                  <td style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px' }}>{v.phone}</td>
                  <td>{v.shift}</td>
                  <td>
                    <select 
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      value={v.status}
                      onChange={async (e) => {
                        try {
                          await supabase.from('vehicles').update({ status: e.target.value }).eq('id', v.id);
                          toast('Status updated');
                          fetchData();
                        } catch(err) {
                          toast('Failed to update', 'error');
                        }
                      }}
                    >
                      {['Pending', 'Packing', 'Loading', 'Dispatched', 'Delivered'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ display: 'flex', gap: '4px' }}>
                    {canEdit() && <button className="icon-btn" onClick={() => openModal(v)}>✏️</button>}
                    {canDelete() && <button className="icon-btn danger" onClick={() => deleteVehicle(v.id, v.num)}>🗑️</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={{ padding: '12px 16px', fontSize: '12px', color: '#718096' }}>
          {filteredVehicles.length} vehicles
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') closeModal(); }}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Vehicle Number *</label>
                <input value={formData.num} onChange={e => setFormData({ ...formData, num: e.target.value })} placeholder="e.g. TRK-001" />
              </div>
              <div className="form-group">
                <label>Vehicle Type *</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  <option value="">Select...</option>
                  {masterTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Work Order</label>
                <select value={formData.wo_num} onChange={handleWOChange} style={{ color: formData.wo_num ? '#e53e3e' : '#1a202c', fontWeight: formData.wo_num ? '600' : 'normal' }}>
                  <option value="">-- None --</option>
                  {workOrders.map(w => <option key={w.wo_num} value={w.wo_num}>{w.wo_num}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Customer</label>
                <select value={formData.customer} onChange={e => setFormData({ ...formData, customer: e.target.value })}>
                  <option value="">Select...</option>
                  {masterCustomers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Driver Name</label>
                <input value={formData.driver} onChange={e => setFormData({ ...formData, driver: e.target.value })} placeholder="Driver name" />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date and Time</label>
                <input 
                  type="datetime-local" 
                  value={formData.shift} 
                  onChange={e => setFormData({ ...formData, shift: e.target.value })} 
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  {['Pending', 'Packing', 'Loading', 'Dispatched', 'Delivered'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button className="btn btn-red" onClick={saveVehicle}>Save Vehicle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
