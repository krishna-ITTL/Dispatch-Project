import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import { Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';

const StuffList = () => {
  const { user } = useOutletContext();
  const toast = useToast();
  
  const [stuffItems, setStuffItems] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '', category: 'Accessories', qty: 0, uom: 'Nos', status: 'Available'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('stuff_list').select('*').order('id', { ascending: false });
      if (error) throw error;
      setStuffItems(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const canEdit = () => true;
  const canDelete = () => user && (user.role === 'Admin' || user.role === 'Power User');

  const filteredItems = stuffItems.filter(p => {
    if (filter !== 'All' && p.status !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total = stuffItems.length;
  const available = stuffItems.filter(s => s.status === 'Available').length;
  const lowStock = stuffItems.filter(s => s.status === 'Low Stock').length;
  const outOfStock = stuffItems.filter(s => s.status === 'Out of Stock').length;

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '', category: item.category || 'Accessories',
        qty: item.qty || 0, uom: item.uom || 'Nos', status: item.status || 'Available'
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '', category: 'Accessories', qty: 0, uom: 'Nos', status: 'Available'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const saveItem = async () => {
    if (!formData.name) {
      toast('Name is required', 'error');
      return;
    }

    const payload = {
      name: formData.name,
      category: formData.category,
      qty: parseInt(formData.qty) || 0,
      uom: formData.uom,
      status: formData.status
    };

    try {
      if (editingItem) {
        const { error } = await supabase.from('stuff_list').update(payload).eq('id', editingItem.id);
        if (error) throw error;
        toast('Item updated');
      } else {
        const { error } = await supabase.from('stuff_list').insert([payload]);
        if (error) throw error;
        toast('Item added');
      }
      closeModal();
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      toast('Failed to save item', 'error');
    }
  };

  const deleteItem = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    
    try {
      const { error } = await supabase.from('stuff_list').delete().eq('id', id);
      if (error) throw error;
      toast('Item deleted');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast('Failed to delete item', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Stuff List</h2>
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
              + Add Item
            </button>
          )}
        </div>
      </div>

      <div className="packing-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="packing-stat"><div className="icon" style={{fontSize: '24px'}}>🗂️</div><div className="label">Total Items</div><div className="value">{total}</div></div>
        <div className="packing-stat"><div className="icon" style={{fontSize: '24px'}}><img src="/Asserts/approve.png" width="18" height="18" alt="Approve" /></div><div className="label">Available</div><div className="value val-green">{available}</div></div>
        <div className="packing-stat"><div className="icon" style={{fontSize: '24px'}}>⚠️</div><div className="label">Low Stock</div><div className="value val-orange">{lowStock}</div></div>
        <div className="packing-stat"><div className="icon" style={{fontSize: '24px'}}><XCircle size={22} style={{color:'#e53e3e'}} /></div><div className="label">Out of Stock</div><div className="value val-red">{outOfStock}</div></div>
      </div>

      <div className="filter-tabs" style={{ marginBottom: '20px' }}>
        {['All', 'Available', 'Low Stock', 'Out of Stock'].map(f => (
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
              <th>ITEM NAME</th><th>CATEGORY</th><th>QTY</th><th>UOM</th><th>STATUS</th><th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', color: '#718096', padding: '24px' }}>No items found.</td></tr>
            ) : (
              filteredItems.map(p => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.category}</td>
                  <td>{p.qty}</td>
                  <td>{p.uom}</td>
                  <td>
                    <span className={`badge badge-${p.status === 'Available' ? 'completed' : p.status === 'Low Stock' ? 'urgent' : 'high'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: '4px' }}>
                    {canEdit() && <button className="icon-btn" onClick={() => openModal(p)}><img src="/Asserts/edit.gif" width="18" height="18" alt="Edit" /></button>}
                    {canDelete() && <button className="icon-btn danger" onClick={() => deleteItem(p.id, p.name)}><img src="/Asserts/bin.gif" width="18" height="18" alt="Delete" /></button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') closeModal(); }}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Stuff Item' : 'Add Stuff Item'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="form-group">
              <label>Item Name *</label>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Silica Gel" />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                {['Accessories', 'Seals', 'Fasteners', 'Packing', 'Spares', 'Tools'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" value={formData.qty} onChange={e => setFormData({ ...formData, qty: e.target.value })} min="0" />
              </div>
              <div className="form-group">
                <label>UOM</label>
                <select value={formData.uom} onChange={e => setFormData({ ...formData, uom: e.target.value })}>
                  {['Nos', 'Bags', 'Sets', 'Rolls', 'Pcs', 'Kgs'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                {['Available', 'Low Stock', 'Out of Stock'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button className="btn btn-red" onClick={saveItem}>Save Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StuffList;
