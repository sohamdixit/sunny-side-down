import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Place } from '../lib/api';
import { searchPlaces } from '../lib/api';
import type { Mode } from '../lib/exposure';
import { getRecents } from '../lib/store';
import { SunIcon, SearchIcon, PinIcon } from '../icons';

interface Props {
  from: Place;
  mode: Mode;
  setMode: (m: Mode) => void;
  busy: boolean;
  error: string | null;
  onGo: (to: Place) => void;
  nav: ReactNode;
}

export function Home({ from, mode, setMode, busy, error, onGo, nav }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [picked, setPicked] = useState<Place | null>(null);
  const [searching, setSearching] = useState(false);
  const seq = useRef(0);
  const recents = getRecents();

  useEffect(() => {
    if (picked || query.trim().length < 3) {
      setResults([]);
      return;
    }
    const mySeq = ++seq.current;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const places = await searchPlaces(query, from.pos);
        if (seq.current === mySeq) setResults(places);
      } catch {
        if (seq.current === mySeq) setResults([]);
      } finally {
        if (seq.current === mySeq) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, picked, from.pos]);

  return (
    <>
      <div className="brand">
        <SunIcon size={24} />
        Sunny Side Down
      </div>

      <div>
        <h1>Where to?</h1>
        <div className="sub">We&rsquo;ll tell you which door to get in from.</div>
      </div>

      <div className="from-row">
        <PinIcon />
        From &middot; {from.name}
        {from.detail ? ` — ${from.detail}` : ''}
      </div>

      <div className="search-wrap">
        <div className="search">
          <SearchIcon />
          <input
            placeholder="Search destination"
            value={picked ? picked.name : query}
            onChange={(e) => {
              setPicked(null);
              setQuery(e.target.value);
            }}
          />
        </div>
        {results.length > 0 && (
          <div className="suggestions">
            {results.map((p, i) => (
              <button
                key={i}
                className="suggestion"
                onClick={() => {
                  setPicked(p);
                  setResults([]);
                }}
              >
                <div className="name">{p.name}</div>
                {p.detail && <div className="detail">{p.detail}</div>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="chip-row">
        <div className="seg">
          <button className={mode === 'cab' ? 'on' : ''} onClick={() => setMode('cab')}>
            Cab
          </button>
          <button className={mode === 'auto' ? 'on' : ''} onClick={() => setMode('auto')}>
            Auto
          </button>
        </div>
        <div className="sub" style={{ marginLeft: 'auto' }}>
          Leaving now
        </div>
      </div>

      <button className="btn-primary" disabled={!picked || busy} onClick={() => picked && onGo(picked)}>
        {busy ? 'Finding your seat…' : searching ? 'Searching…' : 'Find my seat'}
      </button>

      {error && <div className="error">Couldn&rsquo;t fetch a route: {error}. Try again in a moment.</div>}

      {recents.length > 0 && (
        <div className="stack">
          <div className="label">RECENT</div>
          {recents.map((r, i) => (
            <button key={i} className="recent" onClick={() => onGo(r.place)}>
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
