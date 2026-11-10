import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packages = JSON.parse(readFileSync("src/data/theme-world-packages.json", "utf8"));
const artist = JSON.parse(readFileSync("src/data/artist-worlds-v4.0.1.json", "utf8"));
const providerCatalog = readFileSync("src/music/providerCatalog.ts", "utf8");
const database = readFileSync("src-tauri/src/database.rs", "utf8");

assert.equal(packages.length, 17, "V33 must expose exactly 17 approved theme packages");
assert.equal(packages.filter((entry) => entry.approved).length, 17, "Every shipped V33 package must be approved");
assert.equal(packages.reduce((count, entry) => count + entry.rooms.length, 0), 34, "V33 room count drifted");
assert.equal(packages.reduce((count, entry) => count + entry.objects.length, 0), 85, "V33 ecology-object count drifted");
assert.equal(packages.reduce((count, entry) => count + entry.weather.length, 0), 17, "V33 weather count drifted");
assert.deepEqual(packages.map((entry) => entry.id), [
  "frutiger-aero", "utopian-scholastic", "wacky-pomo", "contempo-eclectic", "vaporwave",
  "neo-y2k", "liminal-leisure", "diner-kitsch", "cassette-futurism", "googie-kitsch",
  "french-synthpop", "memphis", "ethereal-cgi", "divine-machinery", "dark-fantasy",
  "atomic-age", "jazz-design",
]);

assert.equal(artist.artists.length, 5);
assert.equal(artist.worlds.length, 10);
assert.equal(artist.districts.length, 20);
assert.equal(artist.weather.length, 20);
assert.equal(artist.interactions.length, 25);
assert.equal(artist.music_routes.length, 21);
assert.equal(artist.discovery_links.length, 75);
assert.equal(artist.provenance.length, 50);
assert.equal(artist.districts.find((entry) => entry.district_id === "district.saveroom.paradise-zero-lagoon")?.district, "Azure Save Coast");
assert.deepEqual([...new Set(artist.artists.map((entry) => entry.display_name))], ["Frawgy", "Lightweaverart", "Dreamrelicc", "Karoline Georges", "saveroom"]);
assert.deepEqual([...new Set(artist.music_routes.map((route) => route.approval_status))], ["CANDIDATE", "SEARCH_ROUTE", "GENERATIVE_CANDIDATE", "OFFICIAL_SOURCE", "OFFICIAL_SOUNDTRACK"]);

for (const provider of ["Spotify", "Apple Music", "Deezer", "SoundCloud", "TIDAL", "YouTube Music"]) {
  assert.ok(providerCatalog.includes(`name: "${provider}"`), `Missing real provider adapter: ${provider}`);
}
for (const command of ["catalog_summary", "list_music_routes", "assign_room_soundtrack", "room_soundtrack", "record_native_history"]) {
  assert.ok(database.includes(`fn ${command}`), `Native SQLite command missing: ${command}`);
}
assert.ok(database.includes("83aac630afa4e6522d28452bb6a7c0ebe183eee6812b89b6d742662876af06ec"));
assert.ok(database.includes("9865ef491c5baeec39702a0a6724df1bf9c9a29ed062a30e6bb6af270dd6b00a"));

console.log("Verified catalog, artist-world, music-provider, and native persistence authority: PASS");
