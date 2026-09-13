/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Mapbox public access token. Absent = fall back to the OSRM demo server. */
  readonly VITE_MAPBOX_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
