import { useEffect, useRef, useState } from 'react';
import type { Place } from '../lib/api';
import { searchPlaces } from '../lib/api';
import type { LatLng } from '../lib/geo';
import { SearchIcon, PinIcon } from '../icons';

interface TopAction {
  label: string;
  onClick: () => void;
}

interface Props {
  /** Optional ranking bias; absent before we know where the user is. */
  near?: LatLng;
  placeholder: string;
  /** Currently chosen place shown in the input; null while typing. */
  picked: Place | null;
  onPick: (p: Place | null) => void;
  /** Optional pinned row at the top of the dropdown (e.g. "Use current location"). */
  topAction?: TopAction;
  autoFocus?: boolean;
}

export function PlaceSearch({ near, placeholder, picked, onPick, topAction, autoFocus }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    if (picked || query.trim().length < 3) {
      setResults([]);
      return;
    }
    const mySeq = ++seq.current;
    const t = setTimeout(async () => {
      try {
        const places = await searchPlaces(query, near);
        if (seq.current === mySeq) setResults(places);
      } catch {
        if (seq.current === mySeq) setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, picked, near]);

  return (
    <>
      <div className="search-wrap">
        <div className="search">
          <SearchIcon />
          <input
            autoFocus={autoFocus}
            placeholder={placeholder}
            value={picked ? picked.name : query}
            onChange={(e) => {
              onPick(null);
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
                  onPick(p);
                  setResults([]);
                  setQuery('');
                }}
              >
                <div className="name">{p.name}</div>
                {p.detail && <div className="detail">{p.detail}</div>}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* In normal flow, not inside the overlay: as a floating row it sat on
          top of whatever came next and never went away. */}
      {topAction && !picked && (
        <button className="top-action" onClick={topAction.onClick}>
          <PinIcon />
          {topAction.label}
        </button>
      )}
    </>
  );
}
