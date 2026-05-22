import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import { logActivity } from '../lib/activityLogger';
import { getPackingDateUpdates } from '../lib/packingDateRules';
const STATUSES = ['Not Started', 'In Progress', 'Packed'];

// ── Reusable Searchable Dropdown ───────────────────────────────────
const SearchableDropdown = ({ value, onChange, options, placeholder, displayKey, valueKey }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const filtered = (options || []).filter(o => {
    const label = displayKey ? (o[displayKey] || '') : (o || '');
    return String(label).toLowerCase().includes(q.toLowerCase());
  });

  const getDisplay = (val) => {
    if (!val) return '';
    if (displayKey) {
      const found = options.find(o => o[valueKey] === val);
      return found ? found[displayKey] : val;
    }
    return val;
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        value={open ? q : getDisplay(value)}
        onChange={e => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => { setQ(''); setOpen(true); }}
        placeholder={placeholder}
        autoComplete="off"
        style={{ width: '100%' }}
        readOnly={false}
      />
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1100,
          background: '#fff', border: '1.5px solid #e53e3e', borderRadius: '8px',
          boxShadow: '0 8px 28px rgba(0,0,0,0.14)', maxHeight: '200px',
          overflowY: 'auto', marginTop: '2px'
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 14px', fontSize: '12px', color: '#999' }}>No results found</div>
          ) : filtered.map((o, i) => {
            const label = displayKey ? o[displayKey] : o;
            const val = valueKey ? o[valueKey] : o;
            return (
              <div key={i}
                onMouseDown={() => { onChange(val); setQ(''); setOpen(false); }}
                style={{ padding: '9px 14px', fontSize: '13px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', transition: 'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Read-only display field ────────────────────────────────────────
const ReadField = ({ label, value }) => (
  <div>
    <label style={{ fontSize: '11px', fontWeight: '700', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>{label}</label>
    <div style={{ background: '#f7fafc', border: '1.5px solid #e2e8f0', borderRadius: '7px', padding: '9px 12px', fontSize: '13px', color: '#4a5568', minHeight: '38px' }}>
      {value || <span style={{ color: '#cbd5e0' }}>—</span>}
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────
const PackingList = () => {
  const { user } = useOutletContext() || {};
  const toast = useToast();

  const [workOrders, setWorkOrders] = useState([]);
  const [selectedWOId, setSelectedWOId] = useState('');
  const [packingItems, setPackingItems] = useState([]);
  const [masterItems, setMasterItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  // Modal WO selection (separate from page-level WO selector)
  const [modalWOId, setModalWOId] = useState('');

  const getEmptyItemRow = () => ({ 
    box_num: '', item_num: '', description: '', qty: 1, uom: 'No.', pack_type: 'Open Type',
    weight: 0, length: 0, width: 0, height: 0, production_sig: '', quality_sig: '' 
  });

  const [formData, setFormData] = useState({
    wo_num: '', customer: '', mva: '', voltage_range: '', total_boxes: '',
    items: [getEmptyItemRow()]
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        { data: wos },
        { data: masterLists }
      ] = await Promise.all([
        supabase.from('work_orders').select('*').order('id', { ascending: false }),
        supabase.from('master_list').select('*').ilike('category_key', 'Packing List Items')
      ]);

      const fetchedWOs = wos || [];
      setWorkOrders(fetchedWOs);
      setMasterItems((masterLists || []).map(m => m.value));
      if (fetchedWOs.length > 0 && !selectedWOId) {
        setSelectedWOId(fetchedWOs[0].id.toString());
      }
    } catch (error) {
      console.error(error);
      toast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedWOId, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (selectedWOId) fetchPackingItems(selectedWOId);
    else setPackingItems([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWOId]);

  const fetchPackingItems = async (woId) => {
    try {
      const { data, error } = await supabase
        .from('packing_items').select('*').eq('wo_id', woId).order('id', { ascending: true });
      if (error) throw error;
      setPackingItems(data || []);
    } catch (error) { console.error(error); }
  };

  const selectedWO = workOrders.find(w => w.id.toString() === selectedWOId);
  // WO selected inside modal
  const modalWO = workOrders.find(w => w.id.toString() === modalWOId);
  // Total boxes for modal WO (count distinct box numbers already packed)
  const modalTotalBoxes = modalWO
    ? packingItems.filter(p => p.wo_id?.toString() === modalWOId).map(p => p.box_num).filter(Boolean)
    : [];
  const uniqueBoxCount = [...new Set(modalTotalBoxes)].length;

  const canEdit = () => true;
  const canDelete = () => user && (user?.role === 'Admin' || user?.role === 'Supervisor');
  const canEditDates = () => user && (user?.role === 'Admin' || user?.role === 'Supervisor');

  const filteredItems = packingItems.filter(p => {
    if (filter !== 'All' && p.status !== filter) return false;
    if (search && !(p.description || '').toLowerCase().includes(search.toLowerCase()) &&
      !(p.custom_desc || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total = packingItems.length;
  const notStarted = packingItems.filter(p => p.status === 'Not Started').length;
  const inProgress = packingItems.filter(p => p.status === 'In Progress').length;
  const packed = packingItems.filter(p => p.status === 'Packed').length;
  const pct = total ? Math.round((packed / total) * 100) : 0;

  // Sync happens perfectly on create/update now.
  const syncToLoadingList = async (item, newStatus) => {};

  const cycleStatus = async (item) => {
    const idx = STATUSES.indexOf(item.status);
    const newStatus = STATUSES[(idx + 1) % STATUSES.length];
    try {
      const dateUpdates = getPackingDateUpdates(item.status, newStatus, user?.role);
      const { error } = await supabase.from('packing_items').update({ status: newStatus, ...dateUpdates }).eq('id', item.id);
      if (error) throw error;
      await syncToLoadingList(item, newStatus);
      await logActivity(user?.id, 'Packing List', 'UPDATE', `Changed status of Item ${item.item_num || item.description} to ${newStatus}`);
      setPackingItems(packingItems.map(p => p.id === item.id ? { ...p, status: newStatus, ...dateUpdates } : p));
      if (newStatus === 'Packed') toast(`Packed → added to Loading List`);
    } catch (error) {
      toast('Failed to update status', 'error');
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setModalWOId(item.wo_id?.toString() || selectedWOId);
      setFormData({
        wo_num: item.wo_num || '', customer: item.customer || '', mva: item.mva || '', voltage_range: item.voltage_range || item.rating || '', total_boxes: item.total_boxes || '',
        items: [{
          box_num: item.box_num || '', item_num: item.item_num || '',
          description: item.custom_desc || item.description || '',
          qty: item.qty || 1, uom: item.uom || 'No.', pack_type: item.pack_type || 'Open Type',
          weight: item.weight || 0, length: item.length || 0, width: item.width || 0, height: item.height || 0,
          production_sig: item.production_sig || '', quality_sig: item.quality_sig || '',
          packing_start_date: item.packing_start_date || null,
          packing_end_date: item.packing_end_date || null
        }]
      });
    } else {
      setEditingItem(null);
      setModalWOId(selectedWOId);
      const selectedWO = workOrders.find(w => w.id.toString() === selectedWOId?.toString());
      setFormData({
        wo_num: selectedWO?.wo_num || '', 
        customer: selectedWO?.customer || '', 
        mva: selectedWO?.mva || '', 
        voltage_range: selectedWO?.voltage_range || '', 
        total_boxes: '',
        items: [getEmptyItemRow()]
      });
    }
    setIsModalOpen(true);
  };

  const handleWOSelect = (woId) => {
    setModalWOId(woId);
    const selectedWO = workOrders.find(w => w.id.toString() === woId?.toString());
    if (selectedWO) {
      setFormData(prev => ({
        ...prev,
        wo_num: selectedWO.wo_num || '',
        customer: selectedWO.customer || '',
        mva: selectedWO.mva || '',
        voltage_range: selectedWO.voltage_range || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, wo_num: '', customer: '', mva: '', voltage_range: '' }));
    }
  };

  const closeModal = () => setIsModalOpen(false);

  const saveItem = async () => {
    if (!modalWOId) { toast('Please select a Work Order', 'error'); return; }

    try {
      const payloads = formData.items.map(row => {
        if (!row.description) throw new Error('Item description is required for all rows');
        return {
          wo_id: modalWOId,
          wo_num: formData.wo_num,
          box_num: row.box_num,
          item_num: row.item_num,
          description: row.description,
          custom_desc: '', 
          qty: row.qty,
          uom: row.uom,
          pack_type: row.pack_type,
          weight: row.weight,
          length: row.length,
          width: row.width,
          height: row.height,
          production_sig: row.production_sig,
          quality_sig: row.quality_sig,
          packing_start_date: canEditDates() && row.packing_start_date !== undefined ? row.packing_start_date : null,
          packing_end_date: canEditDates() && row.packing_end_date !== undefined ? row.packing_end_date : null,
          status: editingItem ? editingItem.status : 'Not Started'
        };
      });

      if (editingItem) {
        const payload = payloads[0];
        const { error } = await supabase.from('packing_items').update(payload).eq('id', editingItem.id);
        if (error) throw error;
        
        // AUTO-SYNC TO LOADING LIST (Update)
        await supabase.from('loading_items').update({
          wo_id: payload.wo_id, wo_num: payload.wo_num, item_num: payload.item_num,
          description: payload.description, qty: payload.qty, uom: payload.uom,
          box_num: payload.box_num
        }).eq('packing_item_id', editingItem.id);

        await logActivity(user?.id, 'Packing List', 'UPDATE', `Updated Packing Item ${payload.item_num || payload.description}`);
        toast('Item updated successfully');
      } else {
        const { data: insertedItems, error } = await supabase.from('packing_items').insert(payloads).select();
        if (error) throw error;

        // AUTO-SYNC TO LOADING LIST (Insert)
        const loadingPayloads = insertedItems.map(item => ({
          packing_item_id: item.id,
          wo_id: item.wo_id,
          wo_num: item.wo_num,
          item_num: item.item_num,
          description: item.description,
          qty: item.qty,
          uom: item.uom,
          weight: 0,
          status: 'Reported',
          box_num: item.box_num,
          notes: `Auto-synced from Packing`
        }));
        
        if (loadingPayloads.length > 0) {
          const { error: loadErr } = await supabase.from('loading_items').insert(loadingPayloads);
          if (loadErr) throw loadErr;
        }

        await logActivity(user?.id, 'Packing List', 'CREATE', `Added ${payloads.length} packing items to WO ${formData.wo_num}`);
        toast('Items saved successfully');
      }
      closeModal();
      fetchPackingItems(selectedWOId);
    } catch (error) {
      toast('Failed to save: ' + error.message, 'error');
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      const { error } = await supabase.from('packing_items').delete().eq('id', id);
      if (error) throw error;
      // Auto-remove from loading list
      await supabase.from('loading_items').delete().eq('packing_item_id', id);
      await logActivity(user?.id, 'Packing List', 'DELETE', `Deleted packing item ID ${id}`);
      setPackingItems(packingItems.filter(p => p.id !== id));
      toast('Item deleted');
    } catch (error) { toast('Failed to delete item', 'error'); }
  };

  const statusBadge = s => ({
    'Not Started': 'badge-pending',
    'In Progress': 'badge-inprogress',
    'Packed': 'badge-completed'
  }[s] || 'badge-normal');

  // Build WO display options for searchable dropdown
  const woOptions = workOrders.map(w => ({
    id: w.id.toString(),
    label: `${w.wo_num} — ${w.customer}`
  }));

  return (
    <div>
      <div className="page-header"><h2>Packing List</h2></div>

      <div className="autofill-note">
        📦 Items marked as <strong>"Packed"</strong> are automatically added to the <strong>Loading List</strong>. Click status badge to cycle.
      </div>

      {/* ── Page Level WO Selector ── */}
      <div className="wo-selector-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#718096', fontWeight: '600' }}>WORK ORDER</span>
          <select value={selectedWOId} onChange={e => setSelectedWOId(e.target.value)} style={{ minWidth: '260px' }}>
            {workOrders.map(w => <option key={w.id} value={w.id}>{w.wo_num} — {w.customer}</option>)}
          </select>
          {selectedWO && (
            <div className="wo-detail-bar">
              {selectedWO.mva && <span className="wo-detail-tag">⚡ <strong>{selectedWO.mva}</strong></span>}
              {selectedWO.rating && <span className="wo-detail-tag">🔧 {selectedWO.rating}</span>}
              {selectedWO.individual_box && <span className="wo-detail-tag">📦 {selectedWO.individual_box}</span>}
              <span className={`badge badge-${(selectedWO.customer_inspection || 'pending').toLowerCase().replace(' ', '')}`}>
                {selectedWO.customer_inspection || 'Pending'}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {canEdit() && <button className="btn btn-red" onClick={() => openModal()}>+ Add Item</button>}
        </div>
      </div>

      {/* Stats */}
      <div className="packing-stats">
        <div className="packing-stat"><div className="label">Total</div><div className="value">{total}</div><div className="sub">Items</div></div>
        <div className="packing-stat"><div className="label">Not Started</div><div className="value val-orange">{notStarted}</div><div className="sub">Pending</div></div>
        <div className="packing-stat"><div className="label">In Progress</div><div className="value val-blue">{inProgress}</div><div className="sub">Packing</div></div>
        <div className="packing-stat"><div className="label">Packed</div><div className="value val-green">{packed}</div><div className="sub">→ Loading</div></div>
        <div className="packing-stat">
          <div className="label">Progress</div>
          <div className="value val-green">{pct}%</div>
          <div style={{ width: '80%', height: '4px', background: '#e2e8f0', borderRadius: '2px', margin: '6px auto 0' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#38a169', borderRadius: '2px' }}></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-tabs" style={{ marginBottom: '12px' }}>
        {['All', ...STATUSES].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}{f !== 'All' && <span style={{ opacity: 0.6, marginLeft: '4px' }}>({packingItems.filter(p => p.status === f).length})</span>}
          </button>
        ))}
        <div className="search-wrap" style={{ marginLeft: 'auto' }}>
          <input className="search-input" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>BOX #</th><th>ITEM #</th><th>DESCRIPTION</th><th>QTY</th><th>UOM</th><th>PACK TYPE</th><th>STATUS</th><th>START DATE</th><th>END DATE</th><th>ACTIONS</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px' }}>Loading...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan="10" style={{ textAlign: 'center', color: '#718096', padding: '24px' }}>
                {packingItems.length === 0 ? 'No packing items yet. Click "+ Add Item" to start.' : 'No items match the current filter.'}
              </td></tr>
            ) : filteredItems.map(p => (
              <tr key={p.id}>
                <td>{p.box_num}</td>
                <td>{p.item_num}</td>
                <td>
                  <strong style={{ fontSize: '13px' }}>{p.description}</strong>
                  {p.custom_desc && <div style={{ fontSize: '11px', color: '#718096' }}>{p.custom_desc}</div>}
                </td>
                <td>{p.qty}</td>
                <td>{p.uom}</td>
                <td>{p.pack_type}</td>
                <td>
                  <button className={`badge ${statusBadge(p.status)}`}
                    onClick={() => cycleStatus(p)}
                    style={{ cursor: 'pointer', border: 'none', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600' }}
                    title="Click to cycle status">
                    {p.status}
                  </button>
                </td>
                <td>{p.packing_start_date || '—'}</td>
                <td>{p.packing_end_date || '—'}</td>
                <td style={{ display: 'flex', gap: '4px' }}>
                  {canEdit() && <button className="icon-btn" onClick={() => openModal(p)}>✏️</button>}
                  {canDelete() && <button className="icon-btn danger" onClick={() => deleteItem(p.id)}>🗑️</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: '10px 16px', fontSize: '12px', color: '#718096', display: 'flex', justifyContent: 'space-between' }}>
          <span>{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</span>
          <span>{packed}/{total} packed ({pct}%)</span>
        </div>
      </div>

      {/* ══════════ ADD / EDIT MODAL ══════════ */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={e => { if (e.target.className === 'modal-overlay') closeModal(); }}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Packing Item' : 'Add Packing Item'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>


            <div className="form-row">
              <div className="form-group">
                <label>Work Order Number</label>
                <select value={modalWOId || ''} onChange={e => handleWOSelect(e.target.value)}>
                  <option value="">-- Select Work Order --</option>
                  {workOrders.map(wo => (
                    <option key={wo.id} value={wo.id}>{wo.wo_num}</option>
                  ))}
                </select>
                {canEditDates() && (
                  <div style={{ marginTop: '8px' }}>
                    <label>Packing Start Date</label>
                    <input type="date" value={formData.items[0].packing_start_date || ''} onChange={e => {
                      const newItems = [...formData.items];
                      newItems[0].packing_start_date = e.target.value;
                      setFormData({ ...formData, items: newItems });
                    }} />
                    <label>Packing End Date</label>
                    <input type="date" value={formData.items[0].packing_end_date || ''} onChange={e => {
                      const newItems = [...formData.items];
                      newItems[0].packing_end_date = e.target.value;
                      setFormData({ ...formData, items: newItems });
                    }} />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Customer Name</label>
                <input value={formData.customer} readOnly style={{ background: '#f7fafc', cursor: 'not-allowed' }} placeholder="Auto-filled" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Transformer MVA</label>
                <input value={formData.mva} readOnly style={{ background: '#f7fafc', cursor: 'not-allowed' }} placeholder="Auto-filled" />
              </div>
              <div className="form-group">
                <label>Voltage Range</label>
                <input value={formData.voltage_range} readOnly style={{ background: '#f7fafc', cursor: 'not-allowed' }} placeholder="Auto-filled" />
              </div>
            </div>

            <div className="form-group">
              <label>Total Number of Boxes</label>
              <input value={formData.total_boxes} onChange={e => setFormData({ ...formData, total_boxes: e.target.value })} placeholder="e.g. 10" />
            </div>

            {/* ── SECTION 2: Packing Items (Multi-Row Support) ── */}
            <div style={{ marginTop: '20px', marginBottom: '10px', fontSize: '11px', fontWeight: '700', color: '#92400e', letterSpacing: '1px', textTransform: 'uppercase' }}>
              📦 Packing Items
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', background: '#f7fafc' }}>
              {formData.items.map((row, idx) => (
                <div key={idx} style={{ position: 'relative', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', marginBottom: '10px' }}>
                  {!editingItem && formData.items.length > 1 && (
                    <button onClick={() => {
                      const newItems = [...formData.items];
                      newItems.splice(idx, 1);
                      setFormData({...formData, items: newItems});
                    }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'transparent', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold' }}>✕ Remove</button>
                  )}
                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label>Box Number</label>
                      <input value={row.box_num} onChange={e => {
                        const newItems = [...formData.items]; newItems[idx].box_num = e.target.value; setFormData({...formData, items: newItems});
                      }} placeholder="e.g. BOX-001" />
                    </div>
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label>Item Number</label>
                      <input value={row.item_num} onChange={e => {
                        const newItems = [...formData.items]; newItems[idx].item_num = e.target.value; setFormData({...formData, items: newItems});
                      }} placeholder="e.g. 1" />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label>Item Description *</label>
                    <input
                      list="packingItemsList"
                      value={row.description}
                      onChange={e => {
                        const newItems = [...formData.items]; newItems[idx].description = e.target.value; setFormData({...formData, items: newItems});
                      }}
                      placeholder="Search from list or type manually..."
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', backgroundColor: '#fff' }}
                      autoComplete="off"
                    />
                    <datalist id="packingItemsList">
                      {masterItems.map((mItem, i) => (
                        <option key={i} value={mItem} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-row-3" style={{ marginBottom: 0 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Quantity</label>
                      <input type="number" value={row.qty} onChange={e => {
                        const newItems = [...formData.items]; newItems[idx].qty = e.target.value; setFormData({...formData, items: newItems});
                      }} min="1" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>UOM</label>
                      <select value={row.uom} onChange={e => {
                        const newItems = [...formData.items]; newItems[idx].uom = e.target.value; setFormData({...formData, items: newItems});
                      }}>
                        {['No.', 'Set', 'Nos'].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Packing Type</label>
                      <select value={row.pack_type} onChange={e => {
                        const newItems = [...formData.items]; newItems[idx].pack_type = e.target.value; setFormData({...formData, items: newItems});
                      }}>
                        {['Open Type', 'Wooden Box', 'Steel Box', 'Loose Packing'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>


                </div>
              ))}
              
              {!editingItem && (
                <button className="btn btn-outline" style={{ width: '100%', marginTop: '4px' }} onClick={() => {
                  setFormData({...formData, items: [...formData.items, getEmptyItemRow()]});
                }}>+ Add Another Row</button>
              )}
            </div>

            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button className="btn btn-red" onClick={saveItem}>{editingItem ? 'Save Changes' : 'Save Items'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackingList;
