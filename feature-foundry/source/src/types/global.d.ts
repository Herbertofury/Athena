type FeatureFoundryTheme = {
  name: string;
  description: string;
  districts: string[];
  left: string;
  right: string;
  weather: string[];
  temp: string;
  detail: string;
  playlist: string;
  track: string;
  artist: string;
  selectedCopy: string;
  selectedWeather: string;
  selectedObjects: string;
  palette: string[];
  scene: string;
  mascot: string;
  kit: string[];
};

type FeatureFoundryPrototype = {
  buildVersion: string;
  themes: Record<string, FeatureFoundryTheme>;
  assets: unknown[];
  getState?: () => Record<string, unknown>;
  getObjectSnapshots?: () => unknown[];
  getSelectedSnapshot?: () => unknown;
  getRuntimeDiagnostics?: () => unknown;
  setTheme?: (theme: string, notify?: boolean) => void;
  scheduleCinematicWorld?: () => void;
  setVisualQuality?: (quality: string, notify?: boolean) => void;
};

declare global {
  type MusicKitInstance = {
    authorize: () => Promise<string>;
    unauthorize?: () => Promise<void>;
    setQueue: (options: { url: string }) => Promise<void>;
    play: () => Promise<void>;
    pause: () => Promise<void>;
    skipToNextItem?: () => Promise<void>;
    api?: { music: (path: string, parameters?: Record<string, unknown>) => Promise<unknown> };
  };

  type MusicKitNamespace = {
    configure: (configuration: Record<string, unknown>) => MusicKitInstance;
    getInstance: () => MusicKitInstance;
  };

  interface Window {
    __TAURI_INTERNALS__?: unknown;
    ffPrototype?: FeatureFoundryPrototype;
    MusicKit?: MusicKitNamespace;
    render_game_to_text?: () => string;
    advanceTime?: (milliseconds?: number) => string;
  }
}

export {};
