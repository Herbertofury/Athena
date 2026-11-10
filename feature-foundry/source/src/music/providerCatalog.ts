export type ProviderId = "spotify" | "apple" | "deezer" | "soundcloud" | "tidal" | "youtube";

export type ProviderCapability = {
  publicCatalog: boolean;
  authenticatedLibrary: boolean;
  embeddedPlayback: boolean;
  externalHandoff: boolean;
  authMode: string;
  accountIdentity: string;
  tokenOwner: string;
  quotaOwner: string;
  fallback: string;
  reviewed: string;
};

export type ProviderDefinition = {
  id: ProviderId;
  name: string;
  shortName: string;
  accent: string;
  homeUrl: string;
  searchUrl: (query: string) => string;
  allowedHosts: string[];
  capability: ProviderCapability;
};

const externalCapability = (authMode: string, reviewed = "2026-08-19"): ProviderCapability => ({
  publicCatalog: true,
  authenticatedLibrary: false,
  embeddedPlayback: false,
  externalHandoff: true,
  authMode,
  accountIdentity: "Not activated in this runtime",
  tokenOwner: "Provider application",
  quotaOwner: "Provider",
  fallback: "Verified external navigation",
  reviewed,
});

export const PROVIDERS: readonly ProviderDefinition[] = [
  {
    id: "spotify",
    name: "Spotify",
    shortName: "S",
    accent: "#1ed760",
    homeUrl: "https://open.spotify.com/",
    searchUrl: (query) => `https://open.spotify.com/search/${encodeURIComponent(query)}`,
    allowedHosts: ["open.spotify.com"],
    capability: {
      publicCatalog: true,
      authenticatedLibrary: true,
      embeddedPlayback: true,
      externalHandoff: true,
      authMode: "Authorization Code with PKCE",
      accountIdentity: "account_id after authorized profile verification",
      tokenOwner: "Session memory; no export",
      quotaOwner: "Spotify developer account",
      fallback: "Verified external navigation",
      reviewed: "2026-08-19",
    },
  },
  {
    id: "apple",
    name: "Apple Music",
    shortName: "♪",
    accent: "#fa2d48",
    homeUrl: "https://music.apple.com/",
    searchUrl: (query) => `https://music.apple.com/us/search?term=${encodeURIComponent(query)}`,
    allowedHosts: ["music.apple.com"],
    capability: {
      publicCatalog: true,
      authenticatedLibrary: true,
      embeddedPlayback: true,
      externalHandoff: true,
      authMode: "MusicKit managed user authorization + developer token",
      accountIdentity: "Music User Token managed by MusicKit",
      tokenOwner: "Session memory; signing key never enters the app",
      quotaOwner: "Apple developer team",
      fallback: "Verified external navigation",
      reviewed: "2026-08-19",
    },
  },
  {
    id: "deezer",
    name: "Deezer",
    shortName: "D",
    accent: "#a238ff",
    homeUrl: "https://www.deezer.com/",
    searchUrl: (query) => `https://www.deezer.com/search/${encodeURIComponent(query)}`,
    allowedHosts: ["www.deezer.com", "deezer.com"],
    capability: externalCapability("External handoff; authenticated scope not activated"),
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    shortName: "SC",
    accent: "#ff5500",
    homeUrl: "https://soundcloud.com/",
    searchUrl: (query) => `https://soundcloud.com/search?q=${encodeURIComponent(query)}`,
    allowedHosts: ["soundcloud.com", "www.soundcloud.com"],
    capability: externalCapability("External handoff; authenticated scope not activated"),
  },
  {
    id: "tidal",
    name: "TIDAL",
    shortName: "T",
    accent: "#ffffff",
    homeUrl: "https://tidal.com/",
    searchUrl: (query) => `https://tidal.com/search?q=${encodeURIComponent(query)}`,
    allowedHosts: ["tidal.com", "listen.tidal.com"],
    capability: externalCapability("External handoff; authenticated scope not activated"),
  },
  {
    id: "youtube",
    name: "YouTube Music",
    shortName: "▶",
    accent: "#ff0033",
    homeUrl: "https://music.youtube.com/",
    searchUrl: (query) => `https://music.youtube.com/search?q=${encodeURIComponent(query)}`,
    allowedHosts: ["music.youtube.com"],
    capability: externalCapability("External handoff; authenticated scope not activated"),
  },
] as const;

export const providerById = (id: ProviderId): ProviderDefinition => {
  const provider = PROVIDERS.find((candidate) => candidate.id === id);
  if (!provider) throw new Error(`Unknown music provider: ${id}`);
  return provider;
};

export const isProviderId = (value: string): value is ProviderId =>
  PROVIDERS.some((provider) => provider.id === value);
