import type { ProviderId } from "../music/providerCatalog";
import verifiedPackages from "../data/theme-world-packages.json";
import artistWorldDatabase from "../data/artist-worlds-v4.0.1.json";

export type BaseThemeId = "frutiger" | "vaporwave" | "pomo" | "backrooms" | "diner" | "memphis";
export type CatalogLineage = "v33-runtime" | "artist-worlds-v4.0.1";

export type WorldObjectRecord = {
  id: string;
  themeId: string;
  name: string;
  role: string;
  lanePreference: string;
  material: string;
  shape: string;
  affordances: string[];
  behavior: { damage: string; residue: string; restitution: number };
  socketProfile: string[];
};

type ThemeWorldPackage = {
  id: string;
  name: string;
  approved: boolean;
  materialLanguage: string;
  world: string;
  motif: string;
  motion: string;
  packageVersion: string;
  visual: { colors: string[]; ambient: string[]; pattern: string; cursor: string; loader: string; celebration: string };
  worlds: Array<{ id: string; name: string; environment: string; protectedCenter: boolean }>;
  districts: Array<{ id: string; name: string; worldId: string; roomIds: string[] }>;
  rooms: Array<{ id: string; name: string; districtId: string; safeCenter: boolean; anchorProfile: string }>;
  weather: Array<{ id: string; name: string; layers: string[]; reactsTo: string[]; performanceCost: string }>;
  timeLighting: { default: string; states: string[]; userOverride: boolean };
  sound: { soundtrackMode: string; ambience: string; uiLanguage: string; musicReactiveOptional: boolean };
  objects: WorldObjectRecord[];
  interactions: { profile: string; hover: string; click: string; drag: string; damage: string; recover: string };
  tokens: { accent: string; secondary: string; surface: string; ink: string; pattern: string; motion: string; materialLanguage: string };
};

type ArtistWorldRow = {
  world_id: string;
  artist_id: string;
  world_name: string;
  variant: string;
  world_thesis: string;
  emotional_experience: string;
  palette: string;
  material_language: string;
  shape_language: string;
  lighting: string;
  ui_language: string;
  mascot_buddy: string;
  do_not_reduce_to: string;
};

export type MusicRouteRecord = {
  playlist_id: string;
  artist_id: string;
  playlist: string;
  suggested_routing: string;
  spotify_uri: string;
  open_in_spotify: string;
  approval_status: string;
  curator_notes: string;
};

type ArtistDistrictRow = {
  district_id: string;
  artist_id: string;
  district: string;
  thesis: string;
  environment_weather: string;
  best_use_mode: string;
};

type ArtistWeatherRow = {
  weather_id: string;
  artist_id: string;
  weather_state: string;
  intensity: string;
  behavior: string;
  triggers_routing: string;
  performance_accessibility_guardrails: string;
};

type ArtistDatabase = {
  authority: Record<string, string>;
  worlds: ArtistWorldRow[];
  districts: ArtistDistrictRow[];
  weather: ArtistWeatherRow[];
  music_routes: MusicRouteRecord[];
};

export type PremiumTheme = {
  id: string;
  name: string;
  lineage: CatalogLineage;
  approved: boolean;
  baseTheme: BaseThemeId;
  description: string;
  worldName: string;
  districts: string[];
  rooms: string[];
  palette: [string, string, string, string];
  mascot: string;
  weather: string[];
  materialLanguage: string;
  motion: string;
  objects: WorldObjectRecord[];
  musicRoutes: MusicRouteRecord[];
  soundtrack: {
    provider: ProviderId;
    label: string;
    query: string;
    url: string;
    status: string;
  };
};

const BASE_THEME: Record<string, BaseThemeId> = {
  "frutiger-aero": "frutiger", "utopian-scholastic": "frutiger", "wacky-pomo": "pomo",
  "contempo-eclectic": "memphis", vaporwave: "vaporwave", "neo-y2k": "vaporwave",
  "liminal-leisure": "backrooms", "diner-kitsch": "diner", "cassette-futurism": "vaporwave",
  "googie-kitsch": "diner", "french-synthpop": "vaporwave", memphis: "memphis",
  "ethereal-cgi": "frutiger", "divine-machinery": "frutiger", "dark-fantasy": "backrooms",
  "atomic-age": "diner", "jazz-design": "memphis",
};

const ARTIST_BASE_THEME: Record<string, BaseThemeId> = {
  "artist.frawgy006": "frutiger", "artist.lightweaverart": "vaporwave",
  "artist.dreamrelicc": "backrooms", "artist.karoline-georges": "memphis", "artist.saveroom": "frutiger",
};

const runtimePackages = verifiedPackages as ThemeWorldPackage[];
const artistDatabase = artistWorldDatabase as unknown as ArtistDatabase;

const SEMANTIC_COLORS: Readonly<Record<string, string>> = {
  "frog green": "#6f973d", moss: "#344f32", "aqua dew": "#9fe3d5", cream: "#fff0c0",
  "coral fruit": "#f47f78", "warm sunlight": "#f6d88f", "deep violet": "#211438", "electric lavender": "#b570ff",
  "moon blue": "#667fd5", "pink bioluminescence": "#ff79c7", "silver dew": "#d8e6e5", "cobalt blue": "#195bd3",
  "hot magenta": "#ff278f", ultraviolet: "#7040ff", "porcelain skin": "#f7d8cd", "ink black": "#090b13",
  "chrome silver": "#bdcbd5", "electric blue": "#2c8dff", "acid green": "#b7f432", "saturated violet": "#6f36cc",
  "wet silver": "#9db0b9", "skin warmth": "#e5a18c", "starlight silver": "#dce5f1", "obsidian black": "#080a10",
  "chapel white": "#f4f0df", "gilded gold": "#cba95b", "ember red": "#b7372e", "distant blue": "#334d78",
  "coal night": "#11141a", "tungsten orange": "#dc7c36", "incense gray": "#756d69", "polished silver": "#c4c9c7",
  "plasma red": "#e83a48", "antique ivory": "#e9ddbd", "bone ivory": "#e2d4b3", "antique gold": "#b78a3d",
  "moss green": "#52653c", "dusty rose": "#b7767e", "powder blue": "#9fbad0", "velvet black": "#141016",
  "amber resin": "#d6943f", "translucent white": "#eff5ee", "tissue pink": "#efb7c1", "oxidized gold": "#9c7d3c",
  sage: "#93a889", burgundy: "#6d2639", aquamarine: "#61d8ce", "cloud white": "#eff7f4",
  "violet hair": "#7657a5", "royal blue": "#294eab", "palm green": "#3d8b62", "lavender dusk": "#8a76af",
  "moon silver": "#c8d2dd", "sapphire blue": "#2459a8", "blush pink": "#df9ca8", "waterfall cyan": "#66dbe6",
  "moss gray": "#69776c", "warm window gold": "#d7a750",
};

const colorParts = (value: string): [string, string, string, string] => {
  const colors = value.split(";").map((color) => SEMANTIC_COLORS[color.trim().toLowerCase()] ?? color.trim()).filter(Boolean);
  return [colors[0] ?? "#67d9ff", colors[1] ?? "#7cf6a5", colors[2] ?? "#e9fbff", colors[3] ?? "#146b93"];
};

export const DURABLE_THEME_CATALOG: readonly PremiumTheme[] = runtimePackages.map((record) => ({
  id: record.id,
  name: record.name,
  lineage: "v33-runtime",
  approved: record.approved,
  baseTheme: BASE_THEME[record.id] ?? "frutiger",
  description: `${record.worlds[0]?.name ?? record.name} · ${record.materialLanguage} · ${record.motion} interaction ecology.`,
  worldName: record.worlds[0]?.name ?? record.name,
  districts: record.districts.map((district) => district.name),
  rooms: record.rooms.map((room) => room.name),
  palette: [record.visual.colors[0] ?? "#67d9ff", record.visual.colors[1] ?? "#7cf6a5", record.visual.colors[2] ?? "#e9fbff", record.visual.colors[3] ?? "#146b93"],
  mascot: `${record.name} companion`,
  weather: record.weather.map((weather) => weather.name),
  materialLanguage: record.materialLanguage,
  motion: record.motion,
  objects: record.objects,
  musicRoutes: [],
  soundtrack: { provider: "spotify", label: record.sound.ambience, query: `${record.name} ${record.worlds[0]?.name ?? "living world"}`, url: "", status: "UNASSIGNED" },
}));

export const ARTIST_WORLD_CATALOG: readonly PremiumTheme[] = artistDatabase.worlds.map((record) => {
  const districts = artistDatabase.districts.filter((district) => district.artist_id === record.artist_id);
  const weather = artistDatabase.weather.filter((state) => state.artist_id === record.artist_id);
  const musicRoutes = artistDatabase.music_routes.filter((route) => route.artist_id === record.artist_id);
  const preferredRoute = musicRoutes.find((route) => route.approval_status === "OFFICIAL_SOUNDTRACK") ?? musicRoutes[0];
  return {
    id: record.world_id,
    name: record.world_name,
    lineage: "artist-worlds-v4.0.1",
    approved: true,
    baseTheme: ARTIST_BASE_THEME[record.artist_id] ?? "frutiger",
    description: record.world_thesis,
    worldName: record.world_name,
    districts: districts.map((district) => district.district),
    rooms: districts.map((district) => district.district),
    palette: colorParts(record.palette),
    mascot: record.mascot_buddy,
    weather: weather.map((state) => state.weather_state),
    materialLanguage: record.material_language,
    motion: record.shape_language,
    objects: districts.map((district, index) => ({
      id: `${record.world_id}:district-object:${index + 1}`,
      themeId: record.world_id,
      name: district.district,
      role: "district-anchor",
      lanePreference: index % 2 === 0 ? "left" : "right",
      material: record.material_language,
      shape: record.shape_language,
      affordances: ["inspect", "enter", "route-weather", "route-music"],
      behavior: { damage: "reversible-state", residue: "none", restitution: 0.24 },
      socketProfile: ["surface"],
    })),
    musicRoutes,
    soundtrack: {
      provider: "spotify",
      label: preferredRoute?.playlist ?? `${record.world_name} soundtrack`,
      query: `${record.world_name} ${record.variant}`,
      url: preferredRoute?.open_in_spotify ?? "",
      status: preferredRoute?.approval_status ?? "UNASSIGNED",
    },
  };
});

export const THEME_CATALOG: readonly PremiumTheme[] = [...DURABLE_THEME_CATALOG, ...ARTIST_WORLD_CATALOG];

const LEGACY_THEME_ALIASES: Record<string, string> = {
  frutiger: "frutiger-aero", pomo: "wacky-pomo", backrooms: "liminal-leisure",
  diner: "diner-kitsch", memphis: "memphis",
};

export const themeById = (id: string): PremiumTheme => {
  const normalized = LEGACY_THEME_ALIASES[id] ?? id;
  return THEME_CATALOG.find((theme) => theme.id === normalized) ?? DURABLE_THEME_CATALOG[0]!;
};

export const activePremiumThemeId = (): string =>
  document.body.dataset.premiumTheme ?? LEGACY_THEME_ALIASES[document.body.dataset.theme ?? ""] ?? "frutiger-aero";

export const catalogDiagnostics = () => ({
  durableThemes: DURABLE_THEME_CATALOG.length,
  durableRooms: DURABLE_THEME_CATALOG.reduce((count, theme) => count + theme.rooms.length, 0),
  durableObjects: DURABLE_THEME_CATALOG.reduce((count, theme) => count + theme.objects.length, 0),
  artistWorlds: ARTIST_WORLD_CATALOG.length,
  artistDistricts: new Set(ARTIST_WORLD_CATALOG.flatMap((theme) => theme.districts)).size,
  artistMusicRoutes: artistDatabase.music_routes.length,
  artistDatabaseAuthority: artistDatabase.authority,
});
