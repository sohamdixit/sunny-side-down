import { useEffect, useMemo, useRef, useState } from 'react';
import type { Trip } from '../App';
import { computeExposure, verdict, type SeatId } from '../lib/exposure';
import { progressAlong } from '../lib/geo';
import { addCommute } from '../lib/store';
import { fmtIST as fmtTime, istHHMM } from '../lib/time';
import { BackIcon, SunIcon, SwapIcon, ClockIcon, CheckBadge, WheelIcon } from '../icons';

const SEAT_NAMES: Record<SeatId, string> = {
  fl: 'Front left',
  rl: 'Rear left',
  rr: 'Rear right',
};


function seatColor(pct: number) {
  if (pct >= 45) return 'var(--sun-seat)';
  if (pct >= 20) return '#f3d9ac';
  return 'var(--sage-soft)';
}

export function Result({ trip, onBack }: { trip: Trip; onBack: () => void }) {
  const [offsetMin, setOffsetMin] = useState(0);
  const [selected, setSelected] = useState<SeatId>('rl');
  const [progress, setProgress] = useState<number | null>(null);
  const [tracking, setTracking] = useState(false);
  const [saved, setSaved] = useState(false);
  const watchId = useRef<number | null>(null);

  const departure = useMemo(
    () => new Date(trip.departure.getTime() + offsetMin * 60000),
    [trip.departure, offsetMin],
  );

  const exp = useMemo(
    () => computeExposure(trip.route.coords, trip.route.durationSec, departure, trip.mode),
    [trip, departure],
  );

  const v = verdict(exp, trip.mode);
  const arrival = new Date(departure.getTime() + exp.durationSec * 1000);
  const mid = new Date(departure.getTime() + exp.durationSec * 500);
  const mins = Math.round(exp.durationSec / 60);
  const sunnySide = exp.seats.rr.sunSeconds >= exp.seats.rl.sunSeconds ? 'right' : 'left';

  useEffect(() => {
    if (v.best !== 'either') setSelected(v.best);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  function toggleTracking() {
    if (tracking) {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      setTracking(false);
      setProgress(null);
      return;
    }
    if (!navigator.geolocation) return;
    watchId.current = navigator.geolocation.watchPosition(
      (p) =>
        setProgress(
          progressAlong(trip.route.coords, { lat: p.coords.latitude, lon: p.coords.longitude }),
        ),
      () => setTracking(false),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    setTracking(true);
  }

  const summary = exp.night
    ? 'Sun’s down for this trip — sit anywhere.'
    : v.side === 'either'
      ? 'Both sides are about the same today — sit anywhere.'
      : `Shadiest today: ${SEAT_NAMES[v.best as SeatId].toLowerCase()} · tap a seat to compare`;

  const flipNote = exp.night
    ? 'No sun to dodge on this one.'
    : exp.flipAtSec !== null
      ? `Sun switches sides about ${Math.round(exp.flipAtSec / 60)} min in.`
      : 'The sun stays on one side for this whole route.';

  const seatEl = (id: SeatId) => (
    <button
      key={id}
      className={`seat${selected === id ? ' selected' : ''}`}
      style={{ background: seatColor(exp.seats[id].pct) }}
      onClick={() => setSelected(id)}
    >
      {v.best === id && <CheckBadge />}
      <div className="mins">{exp.seats[id].pct}%</div>
    </button>
  );

  return (
    <>
      <div className="back-row">
        <button className="back-btn" onClick={onBack}>
          <BackIcon />
        </button>
        <div>
          <div className="route-title">
            {trip.from.name} → {trip.to.name}
          </div>
          <div className="route-sub">
            ~{mins} min · leaving {fmtTime(departure)} · {trip.mode === 'cab' ? 'Cab' : 'Auto'}
          </div>
        </div>
      </div>

      <div className="card seatmap-card">
        <div className="car-wrap">
          <div className="car">
            {trip.mode === 'cab' ? seatEl('fl') : <div />}
            <div className="seat driver">
              <WheelIcon />
              <div className="tag">DRIVER</div>
            </div>
            {seatEl('rl')}
            {seatEl('rr')}
          </div>
          {!exp.night && (
            <div className={`sun-badge ${sunnySide}`}>
              <SunIcon size={26} />
              sun
            </div>
          )}
        </div>
        <div className="summary">{summary}</div>
      </div>

      <div className="card stack">
        <div className="tl-head">
          <div className="seatname">{SEAT_NAMES[selected]}</div>
          <div className="pct">{exp.seats[selected].pct}% of the ride in sun</div>
        </div>
        <div className="tl-bar">
          {exp.slices.map((s, i) => (
            <div
              key={i}
              className="cell"
              style={{ background: s.intensity[selected] >= 0.35 ? 'var(--sun)' : 'var(--shade)' }}
            />
          ))}
          {progress !== null && (
            <div className="tl-progress" style={{ left: `${Math.round(progress * 100)}%` }} />
          )}
        </div>
        <div className="tl-ticks">
          <span>{fmtTime(departure)}</span>
          <span>{fmtTime(mid)}</span>
          <span>{fmtTime(arrival)}</span>
        </div>
        <div className="note">
          <SwapIcon />
          {flipNote}
        </div>
        <button className="linkish" onClick={toggleTracking}>
          {tracking
            ? progress !== null
              ? `Tracking — ${Math.round(progress * 100)}% of the way there · stop`
              : 'Waiting for GPS… · stop'
            : 'Track my trip live'}
        </button>
      </div>

      <div className="card stack">
        <div className="dep-head">
          <div className="label">DEPARTURE</div>
          <div className="dep-time">{fmtTime(departure)}</div>
        </div>
        <input
          type="range"
          min={-30}
          max={90}
          step={5}
          value={offsetMin}
          onChange={(e) => setOffsetMin(Number(e.target.value))}
        />
        <div className="tl-ticks">
          <span>-30 min</span>
          <span>now</span>
          <span>+90 min</span>
        </div>
        <div className="note">
          <ClockIcon />
          Drag to see how leaving earlier or later changes the shady side.
        </div>
      </div>

      <button
        className="linkish"
        disabled={saved}
        onClick={() => {
          addCommute({
            id: String(Date.now()),
            label: `${trip.from.name} → ${trip.to.name}`,
            from: trip.from,
            to: trip.to,
            mode: trip.mode,
            departAt: istHHMM(trip.departure),
          });
          setSaved(true);
        }}
      >
        {saved ? 'Saved to commutes ✓' : 'Save as a commute'}
      </button>

      <div className="ad">Ad banner · 320×50</div>
    </>
  );
}
