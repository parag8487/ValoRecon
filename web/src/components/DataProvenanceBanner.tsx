import React, { useEffect, useState } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { getRiotStatus, RiotStatusData } from '../api/client';

export const DataProvenanceBanner: React.FC = () => {
  const [status, setStatus] = useState<RiotStatusData>({ connected: false, gameRunning: false });

  useEffect(() => {
    const check = () => {
      getRiotStatus()
        .then(setStatus)
        .catch(() => setStatus({ connected: false, gameRunning: false }));
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  if (status.connected) {
    return null; // When connected live to Riot, don't show demo banner
  }

  return (
    <div style={{
      background: 'rgba(255, 152, 0, 0.08)',
      borderBottom: '1px solid rgba(255, 152, 0, 0.2)',
      padding: '4px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontSize: '11px',
      color: '#ffb74d',
      fontWeight: 500,
      userSelect: 'none'
    }}>
      <Info size={13} />
      <span>
        DEMO MODE — Local Riot Client is offline. Showing high-fidelity mock career & match fixtures. Launch VALORANT to stream live game stats.
      </span>
    </div>
  );
};
