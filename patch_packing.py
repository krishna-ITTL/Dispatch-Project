import re

with open('src/pages/PackingList.jsx', 'r') as f:
    content = f.read()

# 1. State changes
content = re.sub(
    r"const \[useCustomDesc, setUseCustomDesc\] = useState\(false\);\s*// Modal WO selection \(separate from page-level WO selector\)\s*const \[modalWOId, setModalWOId\] = useState\(''\);\s*const \[formData, setFormData\] = useState\(\{[\s\S]*?\}\);",
    """// Modal WO selection (separate from page-level WO selector)
  const [modalWOId, setModalWOId] = useState('');

  const getEmptyItemRow = () => ({ box_num: '', item_num: '', description: '', qty: 1, uom: 'No.', pack_type: 'Open Type' });

  const [formData, setFormData] = useState({
    wo_num: '', customer: '', mva: '', rating: '', total_boxes: '',
    items: [getEmptyItemRow()]
  });""",
    content
)

# 2. Open Modal
content = re.sub(
    r"const openModal = \(item = null\) => \{[\s\S]*?setIsModalOpen\(true\);\s*\};",
    """const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setModalWOId(item.wo_id?.toString() || selectedWOId);
      setFormData({
        wo_num: item.wo_num || '', customer: item.customer || '', mva: item.mva || '', rating: item.rating || '', total_boxes: item.total_boxes || '',
        items: [{
          box_num: item.box_num || '', item_num: item.item_num || '',
          description: item.custom_desc || item.description || '',
          qty: item.qty || 1, uom: item.uom || 'No.', pack_type: item.pack_type || 'Open Type'
        }]
      });
    } else {
      setEditingItem(null);
      setModalWOId(selectedWOId);
      setFormData({
        wo_num: '', customer: '', mva: '', rating: '', total_boxes: '',
        items: [getEmptyItemRow()]
      });
    }
    setIsModalOpen(true);
  };""",
    content
)

# 3. Save Item
content = re.sub(
    r"const saveItem = async \(\) => \{[\s\S]*?toast\('Failed to save: ' \+ error\.message, 'error'\);\s*\}\s*\};",
    """const saveItem = async () => {
    if (!modalWOId) { toast('Please select a Work Order', 'error'); return; }

    try {
      const payloads = formData.items.map(row => {
        if (!row.description) throw new Error('Item description is required for all rows');
        return {
          wo_id: modalWOId,
          wo_num: formData.wo_num,
          customer: formData.customer,
          mva: formData.mva,
          rating: formData.rating,
          total_boxes: formData.total_boxes,
          box_num: row.box_num,
          item_num: row.item_num,
          description: row.description,
          custom_desc: '', 
          qty: parseInt(row.qty) || 1,
          uom: row.uom,
          pack_type: row.pack_type,
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
          description: payload.description, qty: payload.qty, uom: payload.uom
        }).eq('packing_item_id', editingItem.id);

        toast('Packing item updated & synced');
      } else {
        // Bulk insert
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
          notes: `Auto-synced from Packing (Box ${item.box_num || '-'})`
        }));
        
        if (loadingPayloads.length > 0) {
          const { error: loadErr } = await supabase.from('loading_items').insert(loadingPayloads);
          if (loadErr) throw loadErr;
        }

        toast(`${insertedItems.length} item(s) added & synced`);
      }
      closeModal();
      fetchPackingItems(selectedWOId);
    } catch (error) {
      toast('Failed to save: ' + error.message, 'error');
    }
  };""",
    content
)

# 4. syncToLoadingList (remove or neuter it)
content = re.sub(
    r"const syncToLoadingList = async \(item, newStatus\) => \{[\s\S]*?\}\s*\};",
    """// Sync happens perfectly on create/update now.
  const syncToLoadingList = async (item, newStatus) => {};""",
    content
)

# 5. JSX changes for Modal
jsx_start = content.find('{/* ── SECTION 2: Packing Details ── */}')
jsx_end = content.find('<div className="modal-actions">', jsx_start)

new_jsx = """{/* ── SECTION 2: Packing Items (Multi-Row Support) ── */}
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

            """

content = content[:jsx_start] + new_jsx + content[jsx_end:]

with open('src/pages/PackingList.jsx', 'w') as f:
    f.write(content)
