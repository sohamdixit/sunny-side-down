import { useEffect, useState } from 'react';
import type { Place, Route } from './lib/api';
import { fetchRoute } from './lib/api';
import type { Mode } from './lib/exposure';
import { addRecent } from './lib/store';
import { departureOverride } from './lib/time';
import { Home } from './screens/Home';
import { Result } from './screens/Result';
import { Commutes } from './screens/Commutes';
import { TripIcon, CommuteIcon } from './icons';

export interface Trip {
  from: Place;
  to: Place;
  mode: Mode;
  route: Route;
  departure: Date;
}

const DEFAULT_FROM: Place = {
  name: 'HSR Layout (default)',
  detail: 'Bengaluru',
  pos: { lat: 12.9116, lon: 77.6389 },
};

type Screen = { name: 'home' } | { name: 'commutes' } | { name: 'result'; trip: Trip };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [from, setFrom] = useState<Place>(DEFAULT_FROM);
  const [mode, setMode] = useState<Mode>('cab');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) =>
        setFrom({
          name: 'Current location',
          detail: '',
          pos: { lat: p.coords.latitude, lon: p.coords.longitude },
        }),
      () => {
        /* denied or unavailable - keep the labeled default */
      },
      { timeout: 8000 },
    );
  }, []);

  async function go(to: Place, fromOverride?: Place, departure = departureOverride() ?? new Date()) {
    const origin = fromOverride ?? from;
    setBusy(true);
    setError(null);
    try {
      const route = await fetchRoute(origin.pos, to.pos, departure);
      addRecent({ place: to, mode });
      setScreen({ name: 'result', trip: { from: origin, to, mode, route, departure } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'something went wrong');
    } finally {
      setBusy(false);
    }
  }

  const nav = (
    <nav className="nav">
      <button
        className={screen.name === 'home' ? 'on' : ''}
        onClick={() => setScreen({ name: 'home' })}
      >
        <TripIcon />
        Trip
      </button>
      <button
        className={screen.name === 'commutes' ? 'on' : ''}
        onClick={() => setScreen({ name: 'commutes' })}
      >
        <CommuteIcon />
        Commutes
      </button>
    </nav>
  );

  return (
    <div className="phone">
      {screen.name === 'home' && (
        <Home
          from={from}
          mode={mode}
          setMode={setMode}
          busy={busy}
          error={error}
          onGo={go}
          nav={nav}
        />
      )}
      {screen.name === 'commutes' && <Commutes nav={nav} />}
      {screen.name === 'result' && (
        <Result trip={screen.trip} onBack={() => setScreen({ name: 'home' })} />
      )}
    </div>
  );
}
