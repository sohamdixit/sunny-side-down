import { useEffect, useState, type ReactNode } from 'react';
import { fetchRoute } from '../lib/api';
import { computeExposure, verdict } from '../lib/exposure';
import { getCommutes, removeCommute, type Commute } from '../lib/store';
import { istToday } from '../lib/time';

type ChipState = 'checking' | 'LEFT' | 'RIGHT' | 'EITHER' | 'failed';

function CommuteCard({ c, onRemove }: { c: Commute; onRemove: () => void }) {
  const [chip, setChip] = useState<ChipState>('checking');

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [h, m] = c.departAt.split(':').map(Number);
        const dep = istToday(h, m);
        const route = await fetchRoute(c.from.pos, c.to.pos, dep);
        const exp = computeExposure(route.coords, route.durationSec, dep, c.mode);
        const v = verdict(exp, c.mode);
        if (live) setChip(v.side === 'either' ? 'EITHER' : v.side === 'left' ? 'LEFT' : 'RIGHT');
      } catch {
        if (live) setChip('failed');
      }
    })();
    return () => {
      live = false;
    };
  }, [c]);

  const hh = Number(c.departAt.split(':')[0]);
  const ampm = `${((hh + 11) % 12) + 1}:${c.departAt.split(':')[1]} ${hh >= 12 ? 'PM' : 'AM'}`;

  return (
    <div className="card commute-card">
      <div className="commute-top">
        <div className="who">
          <div className="name">{c.label}</div>
          <div className="detail">
            Daily · {ampm} · {c.mode === 'cab' ? 'Cab' : 'Auto'}
          </div>
        </div>
        <div className={`chip${chip === 'EITHER' ? ' sage' : ''}`}>
          {chip === 'checking' ? '…' : chip === 'failed' ? 'retry later' : chip}
        </div>
      </div>
      <button className="linkish" style={{ alignSelf: 'flex-start' }} onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

export function Commutes({ nav }: { nav: ReactNode }) {
  const [commutes, setCommutes] = useState(getCommutes());

  return (
    <>
      <div>
        <h1 style={{ fontSize: 30 }}>Commutes</h1>
        <div className="sub">Checked at their departure time — the answer changes with the season.</div>
      </div>

      {commutes.length === 0 && (
        <div className="card">
          <div className="sub">
            No saved commutes yet. Run a trip and tap “Save as a commute” on the result screen.
          </div>
        </div>
      )}

      {commutes.map((c) => (
        <CommuteCard
          key={c.id}
          c={c}
          onRemove={() => {
            removeCommute(c.id);
            setCommutes(getCommutes());
          }}
        />
      ))}

      {nav}
    </>
  );
}
