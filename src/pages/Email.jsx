import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

const Email = () => {
  const { user } = useOutletContext();
  const toast = useToast();
  const [config, setConfig] = useState({
    recipients: 'manager@indotech.com\ndispatch@indotech.com',
    cc: 'supervisor@indotech.com',
    subjectPrefix: '[INDOTECH Dispatch]',
    senderName: 'INDOTECH DMS'
  });
  const [triggers, setTriggers] = useState({
    newWO: true, statusUpdate: true, dispatchComplete: true, packingStarted: true, reportGenerated: true, delayAlert: true
  });

  const triggerList = [
    { key: 'newWO', name: 'New Work Order', desc: 'When a new WO is created' },
    { key: 'statusUpdate', name: 'Status Update', desc: 'When any item status changes' },
    { key: 'dispatchComplete', name: 'Dispatch Complete', desc: 'When WO status → Completed' },
    { key: 'packingStarted', name: 'Packing Started', desc: 'Vehicle moves to Packing' },
    { key: 'reportGenerated', name: 'Report Generated', desc: 'When a report is exported' },
    { key: 'delayAlert', name: 'Delay Alert', desc: 'WO past dispatch date' }
  ];

  const templateList = [
    { name: 'Dispatch Notification', subject: '{prefix} Dispatch Complete — {woNum}', body: 'Dear Team,\n\nWork Order {woNum} has been dispatched.\n\nCustomer: {customer}\nVehicle: {vehicle}\nDate: {date}\n\nRegards,\n{senderName}' },
    { name: 'Status Update', subject: '{prefix} Status Update — {woNum}', body: 'Status for {woNum} has changed to {status}.' },
    { name: 'Daily Summary', subject: '{prefix} Daily Summary — {date}', body: 'Summary of today\'s dispatch activities...' }
  ];

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Email Automation</h2>
      <div className="email-grid">
        <div className="email-config-card">
          <h3>🔧 Configuration</h3>
          <div className="form-group"><label>Primary Recipients</label><textarea rows="3" value={config.recipients} onChange={e => setConfig({...config, recipients: e.target.value})} /></div>
          <div className="form-group"><label>CC</label><textarea rows="2" value={config.cc} onChange={e => setConfig({...config, cc: e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label>Subject Prefix</label><input value={config.subjectPrefix} onChange={e => setConfig({...config, subjectPrefix: e.target.value})} /></div>
            <div className="form-group"><label>Sender Name</label><input value={config.senderName} onChange={e => setConfig({...config, senderName: e.target.value})} /></div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-red" onClick={() => toast('Config saved!')}>Save Config</button>
            <button className="btn btn-green" onClick={() => toast('Test email sent!', 'info')}>📧 Send Test</button>
          </div>
        </div>

        <div className="email-config-card">
          <h3>⚡ Auto Triggers</h3>
          {triggerList.map(t => (
            <div key={t.key} className="auto-trigger">
              <div className="trigger-info">
                <div className="trigger-name">{t.name}</div>
                <div className="trigger-desc">{t.desc}</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={triggers[t.key]} onChange={e => setTriggers({...triggers, [t.key]: e.target.checked})} />
                <span className="toggle-slider"></span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', marginTop: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>📝 Email Templates</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {templateList.map((t, i) => (
            <div key={i} style={{ background: '#f7fafc', borderRadius: '8px', padding: '14px 16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>{t.name}</div>
              <div style={{ fontSize: '12px', color: '#718096' }}>Subject: {t.subject}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Email;
