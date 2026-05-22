import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

// Default master data from legacy system
const DEFAULT_MASTER_DATA = {
  'Transformer Ratings': ['10 MVA / 33kV','31.5 MVA / 132kV','63 MVA / 220kV','100 MVA / 220kV','125 MVA / 220kV','160 MVA / 220kV','250 MVA / 400kV','315 MVA / 400kV','500 MVA / 765kV'],
  'Transformer Types': ['Power Transformer','Distribution Transformer','Auto Transformer','Generator Transformer','Rectifier Transformer'],
  'Vehicle Types': ['Packing Vehicle','Loading Vehicle','Dispatch Vehicle','Crane Vehicle','Trailer Vehicle','Flatbed Vehicle'],
  'Shifts': ['Shift 1','Shift 2','Shift 3'],
  'Packing List Items': ['Main Transformer Body (DRY AIR FILLED with fittings & accessories)','OLTC - Reversing Type (3 Pole) - EASUN MR','OLTC - Diverter Switch','Rating & Diagram Plate','Radiators (Set)','Oil Conservator with fittings','Buchholz Relay','PRD - Pressure Relief Device','WTI - Winding Temperature Indicator','OTI - Oil Temperature Indicator','Bushings - HV','Bushings - LV','Bushings - Tertiary','Silica Gel Breather','Terminal Box','Fan Assembly','Cooler Bank','Marshalling Box','Accessories Box','Neutral Grounding Resistor'],
  'Customers': ['NTPC Ltd.','PGCIL','Tata Power','Adani Energy','KSEB','Krishna','Renew Power','NPCIL','BHEL','PGVCL']
  
};

const MasterList = () => {
  const { user } = useOutletContext();
  const toast = useToast();
  
  const [masterList, setMasterList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [newCategoryModalOpen, setNewCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newItems, setNewItems] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('master_list').select('*').order('id', { ascending: true });
      if (error) throw error;
      setMasterList(data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(masterList.map(m => m.category_key)));
  const itemsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = masterList.filter(m => m.category_key === cat);
    return acc;
  }, {});

  const seedDefaultData = async () => {
    if (!window.confirm('This will add all default master data (Transformer Ratings, Types, Vehicles, Customers, Packing Items, Shifts). Continue?')) return;
    
    setSeeding(true);
    try {
      const records = [];
      for (const [category_key, items] of Object.entries(DEFAULT_MASTER_DATA)) {
        for (const value of items) {
          records.push({ category_key, value });
        }
      }
      
      // Insert in batches to avoid issues
      const batchSize = 20;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from('master_list').upsert(batch, { onConflict: 'category_key,value' });
        if (error) throw error;
      }
      
      toast('All default master data loaded successfully!');
      fetchData();
    } catch (error) {
      console.error('Seed error:', error);
      toast('Failed to seed data: ' + error.message, 'error');
    } finally {
      setSeeding(false);
    }
  };

  const addItem = async (category_key) => {
    const val = newItems[category_key];
    if (!val || !val.trim()) return;

    try {
      const { error } = await supabase.from('master_list').insert([{ category_key, value: val.trim() }]);
      if (error) throw error;
      
      toast(`Item added to ${category_key}`);
      setNewItems({ ...newItems, [category_key]: '' });
      fetchData();
    } catch (error) {
      console.error('Save error:', error);
      toast('Failed to add item', 'error');
    }
  };

  const deleteItem = async (id, value) => {
    if (!window.confirm(`Are you sure you want to delete "${value}"?`)) return;
    
    try {
      const { error } = await supabase.from('master_list').delete().eq('id', id);
      if (error) throw error;
      toast('Item deleted');
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      toast('Failed to delete item', 'error');
    }
  };

  const createCategory = async () => {
    if (!newCatName.trim()) {
      toast('Category name is required', 'error');
      return;
    }
    
    try {
      const { error } = await supabase.from('master_list').insert([{ category_key: newCatName.trim(), value: 'New Item' }]);
      if (error) throw error;
      toast('Category created');
      setNewCatName('');
      setNewCategoryModalOpen(false);
      fetchData();
    } catch(err) {
      toast('Failed to create category', 'error');
    }
  };

  const deleteCategory = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete the entire category "${cat}"?`)) return;
    try {
      const { error } = await supabase.from('master_list').delete().eq('category_key', cat);
      if (error) throw error;
      toast(`Category ${cat} deleted`);
      fetchData();
    } catch(err) {
      toast('Failed to delete category', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Master List</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={seedDefaultData} disabled={seeding}>
            {seeding ? '⏳ Seeding...' : '🌱 Load Default Data'}
          </button>
          <button className="btn btn-red" onClick={() => setNewCategoryModalOpen(true)}>
            + New Category
          </button>
        </div>
      </div>

      <div style={{ background: '#fefcbf', border: '1px solid #fbd38d', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#975a16', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <span>💡</span> Type in any category's input and press <strong>Enter</strong> or click <strong>+ Add</strong>. Changes instantly appear in all form dropdowns. Click <strong>🌱 Load Default Data</strong> to populate all categories from legacy system.
      </div>

      {loading ? (
        <div style={{ color: '#718096', fontSize: '14px', padding: '20px' }}>Loading...</div>
      ) : categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#718096' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
          <h3 style={{ marginBottom: '8px', color: '#4a5568' }}>No Master Data Found</h3>
          <p style={{ marginBottom: '20px' }}>Click <strong>"🌱 Load Default Data"</strong> above to populate all categories from the legacy system, or create a new category manually.</p>
        </div>
      ) : (
        <div className="master-grid">
          {categories.map(cat => {
            const items = itemsByCategory[cat];
            return (
              <div key={cat} className="master-card">
                <div className="master-card-header">
                  <h4>⚡ {cat} <span className="count">{items.length} items</span></h4>
                  <div className="header-actions">
                    <button className="icon-btn danger" onClick={() => deleteCategory(cat)}>🗑️</button>
                  </div>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {items.map((item, idx) => (
                    <div key={item.id} className="master-item">
                      <div><span className="num">{idx + 1}</span> {item.value}</div>
                      <div className="master-item-actions">
                        <button className="icon-btn danger" onClick={() => deleteItem(item.id, item.value)}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="master-add">
                  <input 
                    placeholder="Add item..." 
                    value={newItems[cat] || ''}
                    onChange={(e) => setNewItems({...newItems, [cat]: e.target.value})}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addItem(cat);
                    }}
                  />
                  <button className="add-btn" onClick={() => addItem(cat)}>+ Add</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {newCategoryModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setNewCategoryModalOpen(false); }}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>New Category</h3>
              <button className="modal-close" onClick={() => setNewCategoryModalOpen(false)}>×</button>
            </div>
            
            <div className="form-group">
              <label>Category Display Name *</label>
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="e.g. Accessory Types" />
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setNewCategoryModalOpen(false)}>Cancel</button>
              <button className="btn btn-red" onClick={createCategory}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterList;
