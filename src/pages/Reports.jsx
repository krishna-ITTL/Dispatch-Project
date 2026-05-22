import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

const Reports = () => {
  const { user } = useOutletContext();
  const toast = useToast();
  const [stats, setStats] = useState({ woTotal: 0, woCompleted: 0, packTotal: 0, loadTotal: 0, vehTotal: 0, vehDispatched: 0 });
  const [filters, setFilters] = useState({ from: '', to: '', status: 'All Statuses', wo: '', vehicle: '' });
  const [allData, setAllData] = useState({ wos: [], packing: [], loading: [], vehs: [] });
  const [filteredData, setFilteredData] = useState({ wos: [], packing: [], loading: [], vehs: [] });

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { applyFilters(); }, [filters, allData]);

  const fetchData = async () => {
    try {
      const [{ data: wos }, { data: packing }, { data: loading }, { data: vehs }] = await Promise.all([
        supabase.from('work_orders').select('*'),
        supabase.from('packing_items').select('*'),
        supabase.from('loading_items').select('*'),
        supabase.from('vehicles').select('*')
      ]);
      setAllData({ wos: wos || [], packing: packing || [], loading: loading || [], vehs: vehs || [] });
      setStats({
        woTotal: (wos || []).length,
        woCompleted: (wos || []).filter(w => w.status === 'Completed').length,
        packTotal: (packing || []).length,
        loadTotal: (loading || []).length,
        vehTotal: (vehs || []).length,
        vehDispatched: (vehs || []).filter(v => v.status === 'Dispatched').length
      });
    } catch (e) { console.error(e); }
  };

  const applyFilters = () => {
    let { wos, packing, loading, vehs } = allData;
    
    // Status Filter
    if (filters.status !== 'All Statuses') {
      wos = wos.filter(w => w.customer_inspection === filters.status || w.status === filters.status);
      packing = packing.filter(p => p.status === filters.status);
      loading = loading.filter(l => l.status === filters.status);
      vehs = vehs.filter(v => v.status === filters.status);
    }
    
    // WO Filter
    if (filters.wo) {
      wos = wos.filter(w => w.wo_num === filters.wo);
      packing = packing.filter(p => p.wo_num === filters.wo);
      loading = loading.filter(l => l.wo_num === filters.wo);
      vehs = vehs.filter(v => v.wo_num === filters.wo);
    }
    
    // Vehicle Filter
    if (filters.vehicle) {
      vehs = vehs.filter(v => v.num === filters.vehicle);
      packing = packing.filter(p => p.vehicle === filters.vehicle);
      loading = loading.filter(l => l.vehicle_num === filters.vehicle);
    }
    
    // Date Range Filter
    if (filters.from) {
      const fromD = new Date(filters.from).getTime();
      wos = wos.filter(w => new Date(w.created_at).getTime() >= fromD);
    }
    if (filters.to) {
      const toD = new Date(filters.to).setHours(23,59,59,999);
      wos = wos.filter(w => new Date(w.created_at).getTime() <= toD);
    }

    setFilteredData({ wos, packing, loading, vehs });
    setStats({
      woTotal: wos.length,
      woCompleted: wos.filter(w => w.customer_inspection === 'Completed' || w.status === 'Completed').length,
      packTotal: packing.length,
      loadTotal: loading.length,
      vehTotal: vehs.length,
      vehDispatched: vehs.filter(v => v.status === 'Dispatched').length
    });
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportWO = () => {
    let csv = 'WO Number,Customer,Rating,Type,Site,Shift,Status,Priority,Order Date,Dispatch Date\n';
    filteredData.wos.forEach(w => csv += `"${w.wo_num}","${w.customer}","${w.rating}","${w.type}","${w.site}","${w.shift}","${w.customer_inspection}","${w.priority}","${w.order_date}","${w.dispatch_date}"\n`);
    downloadCSV(csv, 'work_orders_report.csv');
    toast('Work Order Report exported!');
  };

  const exportPacking = () => {
    let csv = 'WO Number,Box#,Item#,Description,Vehicle,Phone,Qty,UOM,Pack Type,Status,Weight,Gross Weight\n';
    filteredData.packing.forEach(p => csv += `"${p.wo_num}","${p.box_num}","${p.item_num}","${p.description}","${p.vehicle}","${p.phone}","${p.qty}","${p.uom}","${p.pack_type}","${p.status}","${p.weight}","${p.gross_weight}"\n`);
    downloadCSV(csv, 'packing_list_report.csv');
    toast('Packing List Report exported!');
  };

  const exportLoading = () => {
    let csv = 'WO Number,Item#,Description,Vehicle,Phone,Qty,UOM,Weight,Status\n';
    filteredData.loading.forEach(l => csv += `"${l.wo_num}","${l.item_num}","${l.description}","${l.vehicle}","${l.phone}","${l.qty}","${l.uom}","${l.weight}","${l.status}"\n`);
    downloadCSV(csv, 'loading_list_report.csv');
    toast('Loading List Report exported!');
  };

  const exportVehicles = () => {
    let csv = 'Vehicle#,Type,Work Order,Customer,Driver,Phone,Shift,Status\n';
    filteredData.vehs.forEach(v => csv += `"${v.num}","${v.type}","${v.wo_num}","${v.customer}","${v.driver}","${v.phone}","${v.shift}","${v.status}"\n`);
    downloadCSV(csv, 'vehicle_report.csv');
    toast('Vehicle Report exported!');
  };

  const exportStuff = async () => {
    const { data } = await supabase.from('stuff_list').select('*');
    let csv = 'Name,Category,Qty,UOM,Status\n';
    (data || []).forEach(s => csv += `"${s.name}","${s.category}","${s.qty}","${s.uom}","${s.status}"\n`);
    downloadCSV(csv, 'stuff_list_report.csv');
    toast('Stuff List Report exported!');
  };

  const exportFull = () => { exportWO(); exportPacking(); exportLoading(); exportVehicles(); };

  const today = () => { const d = new Date(); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; };

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Reports & Analytics</h2>
      <div className="reports-grid">
        <div className="report-card"><div className="icon">📋</div><h4>Work Order Report</h4><p>All WOs with status & customer</p>
          <div className="report-btns"><button className="report-btn-csv" onClick={exportWO}>CSV</button><button className="report-btn-pdf" onClick={() => toast('PDF exported!', 'info')}>PDF</button></div></div>
        <div className="report-card"><div className="icon">📦</div><h4>Packing List Report</h4><p>Full item details with vehicle & phone</p>
          <div className="report-btns"><button className="report-btn-csv" onClick={exportPacking}>CSV</button><button className="report-btn-pdf" onClick={() => toast('PDF exported!', 'info')}>PDF</button></div></div>
        <div className="report-card"><div className="icon">🚚</div><h4>Loading List Report</h4><p>Loading status with weights</p>
          <div className="report-btns"><button className="report-btn-csv" onClick={exportLoading}>CSV</button><button className="report-btn-pdf" onClick={() => toast('PDF exported!', 'info')}>PDF</button></div></div>
        <div className="report-card"><div className="icon">🚛</div><h4>Vehicle Report</h4><p>All vehicles with driver info</p>
          <div className="report-btns"><button className="report-btn-csv" onClick={exportVehicles}>CSV</button><button className="report-btn-pdf" onClick={() => toast('PDF exported!', 'info')}>PDF</button></div></div>
        <div className="report-card"><div className="icon">🗂️</div><h4>Stuff List Report</h4><p>Materials & components status</p>
          <div className="report-btns"><button className="report-btn-csv" onClick={exportStuff}>CSV</button><button className="report-btn-pdf" onClick={() => toast('PDF exported!', 'info')}>PDF</button></div></div>
      </div>
      <div className="report-card" style={{ maxWidth: '300px', marginTop: '16px' }}>
        <div className="icon">📊</div><h4>Full Report</h4><p>Complete dispatch data — all lists</p>
        <div className="report-btns"><button className="report-btn-csv" onClick={exportFull}>CSV</button><button className="report-btn-pdf" onClick={() => toast('Full PDF exported!', 'info')}>PDF</button></div>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', marginTop: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Report Filters</h3>
        <div className="form-row" style={{ marginBottom: '12px' }}>
          <div className="form-group"><label>Date From</label><input type="date" value={filters.from} onChange={e => setFilters({...filters, from: e.target.value})} /></div>
          <div className="form-group"><label>Date To</label><input type="date" value={filters.to} onChange={e => setFilters({...filters, to: e.target.value})} /></div>
        </div>
        <div className="form-group" style={{ marginBottom: '12px' }}><label>Status</label>
          <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
            <option>All Statuses</option><option>Pending</option><option>In Progress</option><option>Completed</option><option>On Hold</option>
          </select>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Work Order</label>
            <select value={filters.wo} onChange={e => setFilters({...filters, wo: e.target.value})}>
              <option value="">All / Select WO</option>
              {allData.wos.map(w => <option key={w.id} value={w.wo_num}>{w.wo_num}</option>)}
            </select></div>
          <div className="form-group"><label>Vehicle</label>
            <select value={filters.vehicle} onChange={e => setFilters({...filters, vehicle: e.target.value})}>
              <option value="">All Vehicles</option>
              {allData.vehs.map(v => <option key={v.id} value={v.num}>{v.num}</option>)}
            </select></div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', marginTop: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Summary Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
          <div style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px' }}>Total Work Orders</span><strong>{stats.woTotal}</strong></div>
          <div style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', paddingLeft: '20px' }}><span style={{ fontSize: '13px' }}>Completed WOs</span><strong style={{ color: '#38a169' }}>{stats.woCompleted}</strong></div>
          <div style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px' }}>Total Pack Items</span><strong>{stats.packTotal}</strong></div>
          <div style={{ padding: '10px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', paddingLeft: '20px' }}><span style={{ fontSize: '13px' }}>Total Load Items</span><strong>{stats.loadTotal}</strong></div>
          <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '13px' }}>Total Vehicles</span><strong>{stats.vehTotal}</strong></div>
          <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'space-between', paddingLeft: '20px' }}><span style={{ fontSize: '13px' }}>Dispatched Vehicles</span><strong style={{ color: '#38a169' }}>{stats.vehDispatched}</strong></div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
