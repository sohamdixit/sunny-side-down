import { useCallback, useEffect, useState } from 'react';
import type { Place, Route } from './lib/api';
import { fetchRoute, friendlyError } from './lib/api';
import type { DriveSide, Mode } from './lib/exposure';
import { addRecent, getDriveSide, setDriveSide as persistDriveSide } from './lib/store';
import { departureOverride } from './lib/time';
import { isNight } from './lib/sun';
import { getCurrentPosition, type GeoFailure } from './lib/location';
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

/** 'locating' on boot; a failure reason once we know we can't self-locate. */
export type LocStatus = 'idle' | 'locating' | GeoFailure;

type Screen = { name: 'home' } | { name: 'commutes' } | { name: 'result'; trip: Trip };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  // No placeholder origin. A default city would be a lie, and it silently sent
  // every sun calculation to the wrong hemisphere when geolocation failed.
  const [from, setFrom] = useState<Place | null>(null);
  const [locStatus, setLocStatus] = useState<LocStatus>('locating');
  const [mode, setMode] = useState<Mode>('car');
  const [driveSide, setDriveSideState] = useState<DriveSide>(getDriveSide);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plannedDep, setPlannedDep] = useState<Date | null>(null);

  const effectiveDep = plannedDep ?? departureOverride() ?? new Date();
  // null = we don't know where they are yet, which is neither day nor night.
  const night: boolean | null = from ? isNight(effectiveDep, from.pos) : null;

  const locate = useCallback(() => {
    setLocStatus('locating');
    void getCurrentPosition().then((r) => {
      if (r.ok) {
        setFrom({
          name: 'Where you are',
          // Showing coordinates makes a WRONG fix visible instead of silent.
          detail: `${r.pos.lat.toFixed(3)}, ${r.pos.lon.toFixed(3)}`,
          pos: r.pos,
        });
        setLocStatus('idle');
      } else {
        setLocStatus(r.reason);
      }
    });
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  function flipDriveSide() {
    const next: DriveSide = driveSide === 'left' ? 'right' : 'left';
    setDriveSideState(next);
    persistDriveSide(next);
  }

  async function go(
    to: Place,
    fromOverride?: Place,
    departure = plannedDep ?? departureOverride() ?? new Date(),
  ) {
    const origin = fromOverride ?? from;
    if (!origin) return;
    setBusy(true);
    setError(null);
    try {
      const route = await fetchRoute(origin.pos, to.pos, departure);
      addRecent({ place: to, mode });
      setScreen({ name: 'result', trip: { from: origin, to, mode, route, departure } });
    } catch (e) {
      console.error('route fetch failed:', e);
      setError(friendlyError(e));
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
        Regulars
      </button>
    </nav>
  );

  return (
    <div className={night === true ? 'phone night' : 'phone'}>
      {screen.name === 'home' && (
        <Home
          from={from}
          setFrom={setFrom}
          onLocate={locate}
          locStatus={locStatus}
          night={night}
          plannedDep={plannedDep}
          setPlannedDep={setPlannedDep}
          mode={mode}
          setMode={setMode}
          busy={busy}
          error={error}
          onGo={go}
          nav={nav}
        />
      )}
      {screen.name === 'commutes' && <Commutes driveSide={driveSide} nav={nav} />}
      {screen.name === 'result' && (
        <Result
          trip={screen.trip}
          driveSide={driveSide}
          onFlipDriveSide={flipDriveSide}
          onBack={() => setScreen({ name: 'home' })}
        />
      )}
    </div>
  );
}
