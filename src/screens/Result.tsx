import { useEffect, useMemo, useRef, useState } from 'react';
import type { Trip } from '../App';
import {
  computeExposure,
  frontPassengerSide,
  verdict,
  MODE_LABELS,
  type DriveSide,
  type SeatId,
} from '../lib/exposure';
import { progressAlong } from '../lib/geo';
import { addCommute } from '../lib/store';
import { watchPosition, clearWatch, type GeoFailure, type WatchHandle } from '../lib/location';
import { fmtTime, hhmm } from '../lib/time';
import { BackIcon, SunIcon, SwapIcon, ClockIcon, CheckBadge, WheelIcon } from '../icons';

/** Kept plain on purpose: this is the answer, it should read at a glance. */
const SEAT_NAMES: Record<SeatId, string> = {
  fp: 'Front passenger',
  rl: 'Rear left',
  rr: 'Rear right',
};

const TRACK_TROUBLE: Record<GeoFailure, string> = {
  denied: "Can't follow along without location.",
  disabled: 'Turn on location to follow along.',
  timeout: 'Lost your signal for a moment.',
  unsupported: "This device won't share its location.",
};

function seatColor(pct: number) {
  if (pct >= 45) return 'var(--sun-seat)';
  if (pct >= 20) return '#f3d9ac';
  return 'var(--sage-soft)';
}

interface Props {
  trip: Trip;
  driveSide: DriveSide;
  onFlipDriveSide: () => void;
  onBack: () => void;
}

export function Result({ trip, driveSide, onFlipDriveSide, onBack }: Props) {
  const [offsetMin, setOffsetMin] = useState(0);
  const [selected, setSelected] = useState<SeatId>('rl');
  const [progress, setProgress] = useState<number | null>(null);
  const [tracking, setTracking] = useState(false);
  const [trackTrouble, setTrackTrouble] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const watchId = useRef<WatchHandle | null>(null);

  const departure = useMemo(
    () => new Date(trip.departure.getTime() + offsetMin * 60000),
    [trip.departure, offsetMin],
  );

  const exp = useMemo(
    () => computeExposure(trip.route.coords, trip.route.durationSec, departure, trip.mode, driveSide),
    [trip, departure, driveSide],
  );

  const v = verdict(exp, trip.mode, driveSide);
  const arrival = new Date(departure.getTime() + exp.durationSec * 1000);
  const mid = new Date(departure.getTime() + exp.durationSec * 500);
  const mins = Math.round(exp.durationSec / 60);
  const sunnySide = exp.seats.rr.sunSeconds >= exp.seats.rl.sunSeconds ? 'right' : 'left';
  const fpOnLeft = frontPassengerSide(driveSide) === 'L';

  useEffect(() => {
    if (v.best !== 'either') setSelected(v.best);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A seat that no longer exists (auto has no front passenger) can't stay selected.
  useEffect(() => {
    if (trip.mode !== 'car' && selected === 'fp') setSelected('rl');
  }, [trip.mode, selected]);

  useEffect(() => {
    return () => {
      clearWatch(watchId.current);
      watchId.current = null;
    };
  }, []);

  async function toggleTracking() {
    if (tracking) {
      clearWatch(watchId.current);
      watchId.current = null;
      setTracking(false);
      setProgress(null);
      return;
    }
    setTracking(true);
    setTrackTrouble(null);
    const handle = await watchPosition(
      (pos) => setProgress(progressAlong(trip.route.coords, pos)),
      (reason) => {
        setTracking(false);
        setTrackTrouble(TRACK_TROUBLE[reason]);
      },
    );
    if (handle) watchId.current = handle;
    else setTracking(false);
  }

  const summary = exp.night
    ? 'Sit literally anywhere.'
    : v.side === 'either'
      ? 'It’s a draw. Sit wherever you like.'
      : `${SEAT_NAMES[v.best as SeatId]} wins. Tap any seat to compare.`;

  const flipNote = exp.night
    ? 'Nothing to dodge tonight.'
    : exp.flipAtSec !== null
      ? `The sun swaps sides ${Math.round(exp.flipAtSec / 60)} min in. Swap with it.`
      : 'The sun sticks to one side the whole way.';

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

  const driverCell = (
    <div className="seat driver" key="driver">
      <WheelIcon />
      <div className="tag">DRIVER</div>
    </div>
  );
  // An auto-rickshaw has no front passenger seat to offer.
  const frontCell = trip.mode === 'car' ? seatEl('fp') : <div key="empty" />;

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
            ~{mins} min · leaving {fmtTime(departure)} · {MODE_LABELS[trip.mode]}
          </div>
        </div>
      </div>

      <div className="card seatmap-card">
        <div className="car-wrap">
          <div className="car">
            <span className="wheel front near" />
            <span className="wheel front off" />
            <span className="wheel rear near" />
            <span className="wheel rear off" />
            <div className="windscreen" />
            <div className="seats">
              {fpOnLeft ? frontCell : driverCell}
              {fpOnLeft ? driverCell : frontCell}
              {seatEl('rl')}
              {seatEl('rr')}
            </div>
            <div className="rear-window" />
          </div>
          {!exp.night && (
            <div className={`sun-badge ${sunnySide}`}>
              <SunIcon size={26} />
              sun
            </div>
          )}
        </div>
        <div className="summary">{summary}</div>
        <button className="linkish drive-flip" onClick={onFlipDriveSide}>
          Driver sits on the {driveSide} · tap to flip
        </button>
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
              ? `Following you — ${Math.round(progress * 100)}% there · stop`
              : 'Looking for you… · stop'
            : 'Follow me along'}
        </button>
        {trackTrouble && <div className="note">{trackTrouble}</div>}
      </div>

      <div className="card stack">
        <div className="dep-head">
          <div className="label">LEAVING AT</div>
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
          Drag to watch the sun move.
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
            departAt: hhmm(trip.departure),
          });
          setSaved(true);
        }}
      >
        {saved ? 'Saved ✓' : 'I do this every day'}
      </button>

    </>
  );
}
