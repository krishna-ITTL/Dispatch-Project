import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useOutletContext } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [greeting, setGreeting] = useState('');
  const [stats, setStats] = useState({
    woTotal: 0,
    woInProg: 0,
    woCompleted: 0,
    woPending: 0,
    woDelayed: 0,
    vehTotal: 0,
    vehDispatched: 0,
    packTotal: 0,
    packPacked: 0,
    packVerified: 0,
    loadListsTotal: 0,
    loadListsDispatched: 0,
    stuffTotal: 0,
    stuffAvail: 0
  });
  const [recentWOs, setRecentWOs] = useState([]);
  const [packProgress, setPackProgress] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [shift] = useState(1); // Hardcoded shift for now

  useEffect(() => {
    // Clock
    const tick = () => {
      const now = new Date();
      const h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hh = String(h % 12 || 12).padStart(2, '0');
      
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      
      setTimeStr(`${hh}:${m} ${ampm}`);
      setDateStr(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
      setGreeting(`Good ${h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'}`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const dataTimer = setInterval(fetchDashboardData, 30000); // Auto-refresh every 30s
    return () => clearInterval(dataTimer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Stats
      const [
        { data: wos },
        { data: vehicles },
        { data: packItems },
        { data: loadLists },
        { data: stuff },
        { data: activities }
      ] = await Promise.all([
        supabase.from('work_orders').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('packing_items').select('*'),
        supabase.from('loading_lists').select('*'),
        supabase.from('stuff_list').select('*'),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      const woData = wos || [];
      const packData = packItems || [];
      const today = new Date().toISOString().split('T')[0];

      setStats({
        woTotal: woData.length,
        woInProg: woData.filter(w => w.customer_inspection === 'In Progress').length,
        woCompleted: woData.filter(w => w.customer_inspection === 'Completed').length,
        woPending: woData.filter(w => w.customer_inspection === 'Pending').length,
        woDelayed: woData.filter(w => w.delivery_deadline && w.delivery_deadline < today && w.customer_inspection !== 'Completed').length,
        vehTotal: (vehicles || []).length,
        vehDispatched: (vehicles || []).filter(v => v.status === 'Dispatched' || v.status === 'Delivered').length,
        packTotal: packData.length,
        packPacked: packData.filter(p => p.status === 'Packed' || p.status === 'Verified').length,
        packVerified: packData.filter(p => p.status === 'Verified').length,
        loadListsTotal: (loadLists || []).length,
        loadListsDispatched: (loadLists || []).filter(l => l.status === 'Dispatched' || l.status === 'Delivered').length,
        stuffTotal: (stuff || []).length,
        stuffAvail: (stuff || []).filter(s => s.status === 'Available').length
      });

      // 2. Recent WOs
      setRecentWOs(woData.sort((a,b) => b.id - a.id).slice(0, 5));

      // 3. Packing Progress
      const topWOs = woData.sort((a,b) => b.id - a.id).slice(0, 3);
      const pp = topWOs.map(wo => {
        const items = packData.filter(p => p.wo_id?.toString() === wo.id?.toString() || p.wo_num === wo.wo_num);
        const done = items.filter(p => p.status === 'Packed' || p.status === 'Verified').length;
        const pct = items.length ? Math.round((done / items.length) * 100) : 0;
        return { wo, total: items.length, done, pct };
      });
      setPackProgress(pp);

      // 4. Activity Log
      if (activities && activities.length > 0) {
        setActivityLog(activities.map(a => {
          const date = new Date(a.created_at);
          const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return { text: a.text, time };
        }));
      } else {
        setActivityLog([{ text: 'System initialized', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      }

    } catch (error) {
      console.error('Error fetching dashboard:', error);
    }
  };

  const statusClass = (s) => {
    const m = { 'Completed': 'completed', 'Pending': 'pending', 'On Hold': 'onhold', 'In Progress': 'inprogress', 'Not Started': 'pending' };
    return m[s] || 'normal';
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', marginBottom: '4px' }}>{greeting}, {user?.name || 'User'}! 👋</h2>
          <p style={{ color: '#718096', fontSize: '14px', margin: 0 }}>INDOTECH Dispatch Management System — Shift {shift}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#2d3748' }}>{timeStr}</div>
          <div style={{ fontSize: '12px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{dateStr}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Work Orders Summary */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Work Orders</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#1a202c', lineHeight: '1.2' }}>{stats.woTotal}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ebf8ff', color: '#3182ce', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📋</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', fontWeight: '600' }}>
            <span style={{ color: '#38a169', background: '#f0fff4', padding: '2px 8px', borderRadius: '10px' }}>{stats.woCompleted} Done</span>
            <span style={{ color: '#dd6b20', background: '#fffaf0', padding: '2px 8px', borderRadius: '10px' }}>{stats.woInProg} In Prog</span>
            <span style={{ color: '#e53e3e', background: '#fff5f5', padding: '2px 8px', borderRadius: '10px' }}>{stats.woDelayed} Delayed</span>
          </div>
        </div>

        {/* Vehicles Summary */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vehicles Today</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#1a202c', lineHeight: '1.2' }}>{stats.vehTotal}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff5f5', color: '#e53e3e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🚛</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', fontWeight: '600' }}>
            <span style={{ color: '#38a169', background: '#f0fff4', padding: '2px 8px', borderRadius: '10px' }}>{stats.vehDispatched} Dispatched</span>
            <span style={{ color: '#718096', background: '#f7fafc', padding: '2px 8px', borderRadius: '10px' }}>{stats.vehTotal - stats.vehDispatched} In Yard</span>
          </div>
        </div>

        {/* Packing Summary */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Packing Progress</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#1a202c', lineHeight: '1.2' }}>{stats.packTotal > 0 ? Math.round((stats.packPacked / stats.packTotal) * 100) : 0}%</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0fff4', color: '#38a169', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📦</div>
          </div>
          <div style={{ background: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ width: `${stats.packTotal > 0 ? (stats.packPacked / stats.packTotal) * 100 : 0}%`, background: '#38a169', height: '100%' }}></div>
          </div>
          <div style={{ fontSize: '12px', color: '#718096', fontWeight: '600' }}>{stats.packPacked} of {stats.packTotal} items packed</div>
        </div>

        {/* Loading Summary */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Loading Lists</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#1a202c', lineHeight: '1.2' }}>{stats.loadListsTotal}</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#faf5ff', color: '#805ad5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🚚</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', fontWeight: '600' }}>
            <span style={{ color: '#805ad5', background: '#faf5ff', padding: '2px 8px', borderRadius: '10px' }}>{stats.loadListsDispatched} Dispatched</span>
            <span style={{ color: '#718096', background: '#f7fafc', padding: '2px 8px', borderRadius: '10px' }}>{stats.loadListsTotal - stats.loadListsDispatched} Pending</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Main Operational Flow */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#2d3748' }}>Active Work Orders</h3>
            <button onClick={() => navigate('/work-orders')} style={{ background: 'none', border: 'none', color: '#e53e3e', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>View All →</button>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#a0aec0', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ paddingBottom: '12px' }}>WO Number</th>
                <th style={{ paddingBottom: '12px' }}>Customer</th>
                <th style={{ paddingBottom: '12px' }}>Status</th>
                <th style={{ paddingBottom: '12px', textAlign: 'right' }}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {recentWOs.map(wo => {
                const pp = packProgress.find(p => p.wo.id === wo.id);
                const progressPct = pp ? pp.pct : 0;
                return (
                  <tr key={wo.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '16px 0', fontWeight: '700', color: '#2d3748' }}>{wo.wo_num}</td>
                    <td style={{ padding: '16px 0', color: '#4a5568', fontSize: '13px', fontWeight: '600' }}>{wo.customer}</td>
                    <td style={{ padding: '16px 0' }}>
                      <span className={`badge badge-${statusClass(wo.status)}`} style={{ padding: '4px 10px', fontSize: '11px' }}>{wo.status}</span>
                    </td>
                    <td style={{ padding: '16px 0', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                        <div style={{ width: '80px', height: '6px', background: '#edf2f7', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${progressPct}%`, background: progressPct === 100 ? '#48bb78' : '#e53e3e', height: '100%' }}></div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#4a5568', width: '30px' }}>{progressPct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {recentWOs.length === 0 && <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#a0aec0' }}>No active work orders.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Sidebar Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#2d3748' }}>Daily Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activityLog.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e53e3e', marginTop: '6px', flexShrink: 0 }}></div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#2d3748', fontWeight: '500', lineHeight: '1.4' }}>{a.text}</div>
                    <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '2px' }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
