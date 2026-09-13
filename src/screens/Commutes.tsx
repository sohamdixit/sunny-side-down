import { useEffect, useState, type ReactNode } from 'react';
import { fetchRoute } from '../lib/api';
import { computeExposure, verdict, MODE_LABELS, type DriveSide } from '../lib/exposure';
import { getCommutes, removeCommute, type Commute } from '../lib/store';
import { todayAt, fmtTime } from '../lib/time';

type ChipState = 'checking' | 'LEFT' | 'RIGHT' | 'ANY' | 'failed';

function CommuteCard({
  c,
  driveSide,
  onRemove,
}: {
  c: Commute;
  driveSide: DriveSide;
  onRemove: () => void;
}) {
  const [chip, setChip] = useState<ChipState>('checking');

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [h, m] = c.departAt.split(':').map(Number);
        const dep = todayAt(h, m);
        const route = await fetchRoute(c.from.pos, c.to.pos, dep);
        const exp = computeExposure(route.coords, route.durationSec, dep, c.mode, driveSide);
        const v = verdict(exp, c.mode, driveSide);
        if (live) setChip(v.side === 'either' ? 'ANY' : v.side === 'left' ? 'LEFT' : 'RIGHT');
      } catch {
        if (live) setChip('failed');
      }
    })();
    return () => {
      live = false;
    };
  }, [c, driveSide]);

  const [h, m] = c.departAt.split(':').map(Number);

  return (
    <div className="card commute-card">
      <div className="commute-top">
        <div className="who">
          <div className="name">{c.label}</div>
          <div className="detail">
            Daily · {fmtTime(todayAt(h, m))} · {MODE_LABELS[c.mode]}
          </div>
        </div>
        <div className={`chip${chip === 'ANY' ? ' sage' : ''}`}>
          {chip === 'checking' ? '…' : chip === 'failed' ? 'hmm' : chip}
        </div>
      </div>
      <button className="linkish" style={{ alignSelf: 'flex-start' }} onClick={onRemove}>
        Forget it
      </button>
    </div>
  );
}

export function Commutes({ driveSide, nav }: { driveSide: DriveSide; nav: ReactNode }) {
  const [commutes, setCommutes] = useState(getCommutes());

  return (
    <>
      <div>
        <h1 style={{ fontSize: 30 }}>Regulars</h1>
        <div className="sub">Rechecked every day — the sun keeps moving on you.</div>
      </div>

      {commutes.length === 0 && (
        <div className="card">
          <div className="sub">
            Nothing here yet. Save a trip and it’ll turn up, freshly checked each morning.
          </div>
        </div>
      )}

      {commutes.map((c) => (
        <CommuteCard
          key={c.id}
          c={c}
          driveSide={driveSide}
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
