import { useState, type ReactNode } from 'react';
import type { Place } from '../lib/api';
import type { LocStatus } from '../App';
import { MODE_LABELS, type Mode } from '../lib/exposure';
import { getRecents } from '../lib/store';
import { todayAt, hhmm } from '../lib/time';
import { PlaceSearch } from '../components/PlaceSearch';
import { SunIcon, PinIcon, SleepingSun } from '../icons';

interface Props {
  from: Place | null;
  setFrom: (p: Place) => void;
  onLocate: () => void;
  locStatus: LocStatus;
  night: boolean | null;
  plannedDep: Date | null;
  setPlannedDep: (d: Date | null) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  busy: boolean;
  error: string | null;
  onGo: (to: Place) => void;
  nav: ReactNode;
}

const LOC_TROUBLE: Record<string, string> = {
  denied: "We're not allowed to peek at your location. Turn it on, or just tell us where you are.",
  disabled: 'Your location is switched off. Flip it on, or type where you are.',
  timeout: "We couldn't pin you down. Type where you are instead.",
  unsupported: "This device keeps its location to itself. Type where you are instead.",
};

export function Home({
  from,
  setFrom,
  onLocate,
  locStatus,
  night,
  plannedDep,
  setPlannedDep,
  mode,
  setMode,
  busy,
  error,
  onGo,
  nav,
}: Props) {
  const [picked, setPicked] = useState<Place | null>(null);
  const [editingFrom, setEditingFrom] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const recents = getRecents();

  const locating = locStatus === 'locating';
  // Only nag about location while we still lack an origin - once they've
  // typed one, we don't need theirs and saying so is just noise.
  const trouble = !from ? LOC_TROUBLE[locStatus] : undefined;
  const needsOrigin = !from;
  const showOriginSearch = editingFrom || (needsOrigin && !locating);

  const subtitle = needsOrigin
    ? 'First things first — where are you?'
    : night
      ? 'The sun is sleeping. Don’t wake it.'
      : 'Let’s find you a seat the sun can’t reach.';

  return (
    <>
      {night === true && (
        <div className="night-bg" aria-hidden="true">
          <SleepingSun />
        </div>
      )}

      <div className="brand">
        <SunIcon size={24} />
        Sunny Side Down
      </div>

      <div>
        <h1>Where to?</h1>
        <div className="sub">{subtitle}</div>
      </div>

      {trouble && (
        <div className="notice">
          <span>{trouble}</span>
          <button className="linkish" onClick={onLocate}>
            Try again
          </button>
        </div>
      )}

      {locating && needsOrigin && <div className="from-row">Working out where you are…</div>}

      {showOriginSearch ? (
        <div className="stack" style={{ gap: 6 }}>
          <div className="label">STARTING FROM</div>
          <PlaceSearch
            near={from?.pos}
            placeholder="Where are you right now?"
            picked={null}
            autoFocus={editingFrom}
            topAction={{
              label: 'Just use where I am',
              onClick: () => {
                onLocate();
                setEditingFrom(false);
              },
            }}
            onPick={(p) => {
              if (p) {
                setFrom(p);
                setEditingFrom(false);
              }
            }}
          />
          {!needsOrigin && (
            <button
              className="linkish"
              style={{ alignSelf: 'flex-end' }}
              onClick={() => setEditingFrom(false)}
            >
              Never mind
            </button>
          )}
        </div>
      ) : (
        from && (
          <button className="from-row from-btn" onClick={() => setEditingFrom(true)}>
            <PinIcon />
            From &middot; {from.name}
            {from.detail ? ` — ${from.detail}` : ''}
            <span className="change">change</span>
          </button>
        )
      )}

      <PlaceSearch
        near={from?.pos}
        placeholder="And where are we going?"
        picked={picked}
        onPick={setPicked}
      />

      <div className="chip-row">
        <div className="seg">
          <button className={mode === 'car' ? 'on' : ''} onClick={() => setMode('car')}>
            {MODE_LABELS.car}
          </button>
          <button className={mode === 'auto' ? 'on' : ''} onClick={() => setMode('auto')}>
            {MODE_LABELS.auto}
          </button>
        </div>
        <div className="leaving">
          {editingTime || plannedDep ? (
            <>
              <input
                type="time"
                className="time-input"
                autoFocus={editingTime && !plannedDep}
                value={plannedDep ? hhmm(plannedDep) : ''}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  if (!Number.isNaN(h) && !Number.isNaN(m)) setPlannedDep(todayAt(h, m));
                }}
              />
              <button
                className="linkish"
                onClick={() => {
                  setPlannedDep(null);
                  setEditingTime(false);
                }}
              >
                now
              </button>
            </>
          ) : (
            <button className="leaving-btn" onClick={() => setEditingTime(true)}>
              Leaving now
            </button>
          )}
        </div>
      </div>

      <button
        className="btn-primary"
        disabled={needsOrigin || !picked || busy}
        onClick={() => picked && onGo(picked)}
      >
        {busy
          ? 'Asking the sun…'
          : needsOrigin
            ? 'Tell us where you are first'
            : 'Find my shade'}
      </button>

      {error && <div className="error">{error}</div>}

      {recents.length > 0 && (
        <div className="stack">
          <div className="label">BEEN THERE</div>
          {recents.map((r, i) => (
            <button
              key={i}
              className="recent"
              disabled={needsOrigin}
              onClick={() => onGo(r.place)}
            >
              <div style={{ flex: 1 }}>
                <div className="name">{r.place.name}</div>
                {r.place.detail && <div className="detail">{r.place.detail}</div>}
              </div>
            </button>
          ))}
        </div>
      )}

      {nav}
    </>
  );
}
