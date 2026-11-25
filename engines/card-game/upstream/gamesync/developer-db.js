/**
 * @module cardgame/developer-db
 * @description Comprehensive developer/publisher database for hero enrichment.
 * Each entry carries metadata used to enhance hero portraits, lore text,
 * pack flavour, and affinity scoring.
 *
 * Sourced from Wikipedia "List of video game developers" + curated additions.
 * Only active (or culturally significant defunct) studios included.
 *
 * Fields:
 *   name       — canonical display name
 *   aliases    — alternate spellings/names the user's library might contain
 *   country    — ISO 3166-1 alpha-2
 *   founded    — year
 *   notable    — up to 3 best-known franchises/games
 *   tags       — classification tags for affinity
 *   palette    — optional {primary, secondary} hex colours for hero theming
 */

const DB = [
  // ── A ──────────────────────────────────────────────────
  { name: "11 Bit Studios",     aliases: ["11bit"], country: "PL", founded: 2010, notable: ["This War of Mine", "Frostpunk"], tags: ["indie","strategy"] },
  { name: "2K Games",           aliases: ["2K","2K Sports"], country: "US", founded: 2005, notable: ["NBA 2K","Civilization","BioShock"], tags: ["publisher","sports","strategy"] },
  { name: "343 Industries",     aliases: ["Halo Studios"], country: "US", founded: 2009, notable: ["Halo Infinite","Halo 4","Halo 5"], tags: ["aaa","fps"] },
  { name: "3D Realms",          aliases: [], country: "US", founded: 1987, notable: ["Duke Nukem"], tags: ["classic","fps"] },
  { name: "4A Games",           aliases: [], country: "UA", founded: 2005, notable: ["Metro 2033","Metro Exodus"], tags: ["fps","survival"] },
  { name: "Activision",         aliases: ["Activision Publishing"], country: "US", founded: 1979, notable: ["Call of Duty","Tony Hawk"], tags: ["publisher","aaa","fps"] },
  { name: "Amazon Games",       aliases: ["Amazon Game Studios"], country: "US", founded: 2012, notable: ["New World","Lost Ark"], tags: ["mmo","aaa"] },
  { name: "Amplitude Studios",  aliases: ["Amplitude"], country: "FR", founded: 2011, notable: ["Endless Legend","Humankind"], tags: ["strategy","4x"] },
  { name: "Ankama",             aliases: [], country: "FR", founded: 2001, notable: ["Dofus","Wakfu"], tags: ["mmo","indie"] },
  { name: "Arrowhead Game Studios", aliases: ["Arrowhead"], country: "SE", founded: 2008, notable: ["Helldivers 2","Helldivers"], tags: ["coop","action"] },
  { name: "Arkane Studios",     aliases: ["Arkane Lyon","Arkane Austin"], country: "FR", founded: 1999, notable: ["Dishonored","Deathloop","Prey"], tags: ["immersive sim","fps"] },
  { name: "ArenaNet",           aliases: [], country: "US", founded: 2000, notable: ["Guild Wars 2","Guild Wars"], tags: ["mmo"] },
  { name: "Asobo Studio",       aliases: ["Asobo"], country: "FR", founded: 2002, notable: ["A Plague Tale","Microsoft Flight Simulator"], tags: ["adventure","sim"] },
  { name: "Atlus",              aliases: ["Atlus Co.","ATLUS"], country: "JP", founded: 1986, notable: ["Persona 5","Shin Megami Tensei","Catherine"], tags: ["jrpg"] },
  { name: "Avalanche Studios",  aliases: ["Avalanche Studios Group"], country: "SE", founded: 2003, notable: ["Just Cause","theHunter"], tags: ["open world","action"] },
  // ── B ──────────────────────────────────────────────────
  { name: "Bandai Namco",       aliases: ["Bandai Namco Entertainment","Bandai Namco Studios","BANDAI NAMCO Entertainment","Namco Bandai"], country: "JP", founded: 1955, notable: ["Tekken","Tales","Dark Souls"], tags: ["publisher","jrpg","fighting"] },
  { name: "Behaviour Interactive", aliases: ["Behaviour","BHVR"], country: "CA", founded: 1992, notable: ["Dead by Daylight"], tags: ["horror","multiplayer"] },
  { name: "Bethesda Game Studios", aliases: ["Bethesda Softworks","Bethesda","BGS"], country: "US", founded: 2001, notable: ["Skyrim","Fallout 4","Starfield"], tags: ["aaa","rpg","open world"], palette: { primary: "#4a6741", secondary: "#2c3e28" } },
  { name: "BioWare",            aliases: ["BioWare Corp."], country: "CA", founded: 1995, notable: ["Mass Effect","Dragon Age","Star Wars: KOTOR"], tags: ["rpg","aaa"], palette: { primary: "#c83232", secondary: "#6e1a1a" } },
  { name: "Blizzard Entertainment", aliases: ["Blizzard","Blizzard North"], country: "US", founded: 1991, notable: ["World of Warcraft","Overwatch","Diablo"], tags: ["aaa","mmo","arpg"], palette: { primary: "#148eff", secondary: "#002d72" } },
  { name: "Bloober Team",       aliases: [], country: "PL", founded: 2008, notable: ["Layers of Fear","Silent Hill 2 Remake"], tags: ["horror","indie"] },
  { name: "Bohemia Interactive", aliases: ["Bohemia","BI"], country: "CZ", founded: 1999, notable: ["Arma","DayZ"], tags: ["sim","survival","fps"] },
  { name: "Bungie",             aliases: ["Bungie Inc.","Bungie LLC"], country: "US", founded: 1991, notable: ["Destiny 2","Halo","Marathon"], tags: ["fps","aaa","looter"], palette: { primary: "#5fbcd3", secondary: "#1a4c61" } },
  // ── C ──────────────────────────────────────────────────
  { name: "Capcom",             aliases: ["CAPCOM Co.","CAPCOM"], country: "JP", founded: 1979, notable: ["Resident Evil","Monster Hunter","Street Fighter"], tags: ["aaa","action","fighting"], palette: { primary: "#004daa", secondary: "#002d5c" } },
  { name: "CD Projekt Red",     aliases: ["CD Projekt","CDPR","CD PROJEKT RED","GOG.com"], country: "PL", founded: 2002, notable: ["The Witcher 3","Cyberpunk 2077"], tags: ["aaa","rpg","open world"], palette: { primary: "#dc0000", secondary: "#7a0000" } },
  { name: "CCP Games",          aliases: ["CCP"], country: "IS", founded: 1997, notable: ["EVE Online"], tags: ["mmo","sandbox"] },
  { name: "CI Games",           aliases: [], country: "PL", founded: 2002, notable: ["Lords of the Fallen","Sniper Ghost Warrior"], tags: ["action","rpg"] },
  { name: "Codemasters",        aliases: ["Codemasters Software"], country: "GB", founded: 1985, notable: ["F1","Dirt","Grid"], tags: ["racing"] },
  { name: "Coffee Stain Studios", aliases: ["Coffee Stain"], country: "SE", founded: 2010, notable: ["Satisfactory","Goat Simulator","Deep Rock Galactic"], tags: ["indie","sandbox"] },
  { name: "Colossal Order",     aliases: [], country: "FI", founded: 2009, notable: ["Cities: Skylines","Cities: Skylines II"], tags: ["city builder","sim"] },
  { name: "Creative Assembly",  aliases: ["The Creative Assembly"], country: "GB", founded: 1987, notable: ["Total War","Alien: Isolation"], tags: ["strategy","aaa"] },
  { name: "Criterion Games",    aliases: ["Criterion Software","Criterion"], country: "GB", founded: 1993, notable: ["Burnout","Need for Speed"], tags: ["racing","action"] },
  { name: "Croteam",            aliases: [], country: "HR", founded: 1993, notable: ["Serious Sam","The Talos Principle"], tags: ["fps","puzzle"] },
  { name: "Crytek",             aliases: ["Crytek GmbH"], country: "DE", founded: 1999, notable: ["Crysis","Hunt: Showdown"], tags: ["fps","tech"] },
  { name: "CyberConnect2",      aliases: ["CC2"], country: "JP", founded: 1996, notable: [".hack","Naruto: Ultimate Ninja Storm"], tags: ["action","anime"] },
  { name: "Cygames",            aliases: [], country: "JP", founded: 2011, notable: ["Granblue Fantasy","Shadowverse"], tags: ["gacha","mobile"] },
  // ── D ──────────────────────────────────────────────────
  { name: "Deep Silver",        aliases: ["Deep Silver Volition"], country: "AT", founded: 2003, notable: ["Saints Row","Dead Island","Metro"], tags: ["publisher","action"] },
  { name: "Devolver Digital",   aliases: ["Devolver"], country: "US", founded: 2009, notable: ["Hotline Miami","Cult of the Lamb","Enter the Gungeon"], tags: ["publisher","indie"] },
  { name: "Digital Extremes",   aliases: [], country: "CA", founded: 1993, notable: ["Warframe"], tags: ["f2p","looter","action"] },
  { name: "Don't Nod",          aliases: ["DONTNOD","DONTNOD Entertainment","DON'T NOD"], country: "FR", founded: 2008, notable: ["Life Is Strange","Tell Me Why"], tags: ["narrative","adventure"] },
  { name: "Double Fine",        aliases: ["Double Fine Productions"], country: "US", founded: 2000, notable: ["Psychonauts","Broken Age"], tags: ["indie","adventure","platformer"] },
  { name: "DreamCatcher Games", aliases: [], country: "CA", founded: 1996, notable: ["Painkiller","Iron Storm"], tags: ["publisher"] },
  // ── E ──────────────────────────────────────────────────
  { name: "EA",                 aliases: ["Electronic Arts","EA Games","EA Sports","EA Play","EA DICE","DICE","EA Vancouver","EA Tiburon"], country: "US", founded: 1982, notable: ["FIFA/EA FC","Madden","Battlefield"], tags: ["publisher","aaa","sports"], palette: { primary: "#1a6ce0", secondary: "#0d3570" } },
  { name: "Egosoft",            aliases: [], country: "DE", founded: 1988, notable: ["X4: Foundations","X3"], tags: ["space","sim"] },
  { name: "Epic Games",         aliases: ["Epic","Epic Games Inc."], country: "US", founded: 1991, notable: ["Fortnite","Unreal","Gears of War"], tags: ["aaa","engine","shooter"], palette: { primary: "#2a2a2a", secondary: "#0078f2" } },
  { name: "Ensemble Studios",   aliases: [], country: "US", founded: 1995, notable: ["Age of Empires","Age of Mythology"], tags: ["rts","strategy"] },
  // ── F ──────────────────────────────────────────────────
  { name: "Facepunch Studios",  aliases: ["Facepunch"], country: "GB", founded: 2009, notable: ["Rust","Garry's Mod"], tags: ["survival","sandbox"] },
  { name: "Fatshark",           aliases: [], country: "SE", founded: 2008, notable: ["Warhammer: Vermintide","Darktide"], tags: ["coop","action"] },
  { name: "Firaxis Games",      aliases: ["Firaxis"], country: "US", founded: 1996, notable: ["Civilization VI","XCOM","Marvel's Midnight Suns"], tags: ["strategy","turn-based"] },
  { name: "Frictional Games",   aliases: ["Frictional"], country: "SE", founded: 2001, notable: ["Amnesia","SOMA"], tags: ["horror","indie"] },
  { name: "FromSoftware",       aliases: ["From Software","FROMSOFTWARE"], country: "JP", founded: 1986, notable: ["Elden Ring","Dark Souls","Sekiro"], tags: ["aaa","soulslike","rpg"], palette: { primary: "#c79b3b", secondary: "#5e4a1d" } },
  { name: "Frontier Developments", aliases: ["Frontier"], country: "GB", founded: 1994, notable: ["Elite Dangerous","Planet Coaster","Jurassic World Evolution"], tags: ["sim","management"] },
  { name: "Frozenbyte",         aliases: [], country: "FI", founded: 2001, notable: ["Trine"], tags: ["indie","platformer"] },
  { name: "Funcom",             aliases: [], country: "NO", founded: 1993, notable: ["Conan Exiles","The Secret World"], tags: ["mmo","survival"] },
  // ── G ──────────────────────────────────────────────────
  { name: "Game Freak",         aliases: [], country: "JP", founded: 1989, notable: ["Pokémon"], tags: ["rpg","nintendo"] },
  { name: "Gameloft",           aliases: [], country: "FR", founded: 1999, notable: ["Asphalt","Modern Combat"], tags: ["mobile"] },
  { name: "Gearbox Software",   aliases: ["Gearbox","Gearbox Entertainment"], country: "US", founded: 1999, notable: ["Borderlands","Homeworld","Brothers in Arms"], tags: ["fps","looter"] },
  { name: "Ghost Ship Games",   aliases: ["Ghost Ship"], country: "DK", founded: 2016, notable: ["Deep Rock Galactic"], tags: ["coop","indie"] },
  { name: "Grinding Gear Games",aliases: ["GGG"], country: "NZ", founded: 2006, notable: ["Path of Exile","Path of Exile 2"], tags: ["arpg","f2p"] },
  { name: "GSC Game World",     aliases: ["GSC"], country: "UA", founded: 1995, notable: ["S.T.A.L.K.E.R.","S.T.A.L.K.E.R. 2","Cossacks"], tags: ["fps","survival"] },
  { name: "Guerrilla Games",    aliases: ["Guerrilla"], country: "NL", founded: 2000, notable: ["Horizon Zero Dawn","Horizon Forbidden West","Killzone"], tags: ["aaa","action","open world"] },
  { name: "Gunfire Games",      aliases: ["Gunfire"], country: "US", founded: 2014, notable: ["Remnant: From the Ashes","Darksiders"], tags: ["soulslike","action"] },
  // ── H ──────────────────────────────────────────────────
  { name: "Hazelight Studios",  aliases: ["Hazelight"], country: "SE", founded: 2014, notable: ["It Takes Two","A Way Out"], tags: ["coop","adventure"] },
  { name: "Hello Games",        aliases: [], country: "GB", founded: 2008, notable: ["No Man's Sky"], tags: ["indie","exploration","survival"] },
  { name: "Housemarque",        aliases: [], country: "FI", founded: 1995, notable: ["Returnal","Resogun"], tags: ["action","arcade"] },
  // ── I ──────────────────────────────────────────────────
  { name: "id Software",        aliases: ["id","id Software LLC"], country: "US", founded: 1991, notable: ["DOOM","Quake","Wolfenstein"], tags: ["fps","classic"], palette: { primary: "#bb2222", secondary: "#550000" } },
  { name: "Infinity Ward",      aliases: [], country: "US", founded: 2002, notable: ["Call of Duty: Modern Warfare","Call of Duty 4"], tags: ["fps","aaa"] },
  { name: "Insomniac Games",    aliases: ["Insomniac"], country: "US", founded: 1994, notable: ["Spider-Man","Ratchet & Clank","Spyro"], tags: ["action","platformer","aaa"] },
  { name: "IO Interactive",     aliases: ["IOI","IO"], country: "DK", founded: 1998, notable: ["Hitman","Hitman World of Assassination"], tags: ["stealth","action"] },
  { name: "Iron Gate Studio",   aliases: ["Iron Gate","Iron Gate AB"], country: "SE", founded: 2018, notable: ["Valheim"], tags: ["survival","indie"] },
  { name: "Irrational Games",   aliases: [], country: "US", founded: 1996, notable: ["BioShock","BioShock Infinite","System Shock 2"], tags: ["fps","narrative"] },
  // ── J ──────────────────────────────────────────────────
  { name: "Jagex",              aliases: ["Jagex Ltd"], country: "GB", founded: 2001, notable: ["RuneScape","Old School RuneScape"], tags: ["mmo"] },
  // ── K ──────────────────────────────────────────────────
  { name: "Keen Software House",aliases: ["Keen"], country: "CZ", founded: 2010, notable: ["Space Engineers","Medieval Engineers"], tags: ["sandbox","voxel"] },
  { name: "Klei Entertainment", aliases: ["Klei"], country: "CA", founded: 2005, notable: ["Don't Starve","Oxygen Not Included"], tags: ["indie","survival","sim"] },
  { name: "Koei Tecmo",         aliases: ["Koei Tecmo Games","Koei","Tecmo","KOEI TECMO GAMES"], country: "JP", founded: 1978, notable: ["Nioh","Dynasty Warriors","Dead or Alive"], tags: ["action","rpg","publisher"] },
  { name: "Kojima Productions", aliases: ["Kojima"], country: "JP", founded: 2005, notable: ["Death Stranding","Metal Gear Solid V"], tags: ["action","auteur"] },
  { name: "Konami",             aliases: ["KONAMI","Konami Digital Entertainment"], country: "JP", founded: 1969, notable: ["Metal Gear","Castlevania","Silent Hill"], tags: ["publisher","aaa","classic"] },
  { name: "Krafton",            aliases: ["KRAFTON","Krafton Inc.","PUBG Corporation","PUBG Studios"], country: "KR", founded: 2007, notable: ["PUBG","The Callisto Protocol"], tags: ["battle royale","shooter"] },
  // ── L ──────────────────────────────────────────────────
  { name: "Larian Studios",     aliases: ["Larian"], country: "BE", founded: 1996, notable: ["Baldur's Gate 3","Divinity: Original Sin 2"], tags: ["crpg","rpg"], palette: { primary: "#8b5e3c", secondary: "#4d3422" } },
  { name: "Level-5",            aliases: ["LEVEL-5"], country: "JP", founded: 1998, notable: ["Ni no Kuni","Professor Layton","Yo-Kai Watch"], tags: ["rpg","adventure"] },
  // ── M ──────────────────────────────────────────────────
  { name: "MachineGames",       aliases: [], country: "SE", founded: 2009, notable: ["Wolfenstein: The New Order","Indiana Jones"], tags: ["fps","action"] },
  { name: "Maxis",              aliases: [], country: "US", founded: 1987, notable: ["The Sims","SimCity","Spore"], tags: ["sim","management"] },
  { name: "Media Molecule",     aliases: [], country: "GB", founded: 2006, notable: ["LittleBigPlanet","Dreams","Tearaway"], tags: ["creative","platformer"] },
  { name: "Mercury Steam",      aliases: ["MercurySteam"], country: "ES", founded: 2002, notable: ["Metroid Dread","Castlevania: Lords of Shadow"], tags: ["action","metroidvania"] },
  { name: "miHoYo",             aliases: ["HoYoverse","COGNOSPHERE","miHoYo Co."], country: "CN", founded: 2012, notable: ["Genshin Impact","Honkai: Star Rail","Zenless Zone Zero"], tags: ["gacha","open world","anime"], palette: { primary: "#5b8bd4", secondary: "#2d4469" } },
  { name: "Mojang Studios",     aliases: ["Mojang","Mojang AB"], country: "SE", founded: 2009, notable: ["Minecraft"], tags: ["sandbox","survival","indie"], palette: { primary: "#62a84b", secondary: "#3e6e31" } },
  { name: "Monolith Productions", aliases: ["Monolith"], country: "US", founded: 1994, notable: ["Middle-earth: Shadow of Mordor","F.E.A.R."], tags: ["action","fps"] },
  { name: "Monolith Soft",      aliases: ["MonolithSoft"], country: "JP", founded: 1999, notable: ["Xenoblade Chronicles"], tags: ["jrpg","action"] },
  { name: "Moon Studios",       aliases: [], country: "AT", founded: 2010, notable: ["Ori and the Blind Forest","Ori and the Will of the Wisps"], tags: ["indie","platformer","metroidvania"] },
  { name: "Motion Twin",        aliases: [], country: "FR", founded: 2001, notable: ["Dead Cells"], tags: ["roguelike","indie","action"] },
  { name: "Massive Entertainment", aliases: ["Ubisoft Massive"], country: "SE", founded: 1997, notable: ["The Division","Star Wars Outlaws"], tags: ["aaa","open world","shooter"] },
  // ── N ──────────────────────────────────────────────────
  { name: "Naughty Dog",        aliases: [], country: "US", founded: 1986, notable: ["The Last of Us","Uncharted","Crash Bandicoot"], tags: ["aaa","action","narrative"], palette: { primary: "#e6a817", secondary: "#7a5a0c" } },
  { name: "NCSoft",             aliases: ["NCsoft","NCSOFT"], country: "KR", founded: 1997, notable: ["Lineage","Guild Wars","Blade & Soul"], tags: ["mmo","publisher"] },
  { name: "NetEase Games",      aliases: ["NetEase"], country: "CN", founded: 1997, notable: ["Identity V","Naraka: Bladepoint"], tags: ["publisher","mobile"] },
  { name: "NetherRealm Studios",aliases: ["NetherRealm"], country: "US", founded: 2010, notable: ["Mortal Kombat","Injustice"], tags: ["fighting","aaa"] },
  { name: "Niantic",            aliases: [], country: "US", founded: 2010, notable: ["Pokémon Go","Ingress"], tags: ["mobile","ar"] },
  { name: "Nihon Falcom",       aliases: ["Falcom"], country: "JP", founded: 1981, notable: ["Ys","Trails","The Legend of Heroes"], tags: ["jrpg"] },
  { name: "Ninja Theory",       aliases: [], country: "GB", founded: 2000, notable: ["Hellblade","DmC: Devil May Cry"], tags: ["action","narrative"] },
  { name: "Nintendo",           aliases: ["Nintendo Co.","Nintendo EPD","Nintendo EAD"], country: "JP", founded: 1889, notable: ["Zelda","Mario","Pokémon"], tags: ["first-party","aaa","platformer"], palette: { primary: "#e60012", secondary: "#c10010" } },
  { name: "Nippon Ichi Software", aliases: ["NIS","NIS America","NISA"], country: "JP", founded: 1991, notable: ["Disgaea"], tags: ["srpg","jrpg","publisher"] },
  // ── O ──────────────────────────────────────────────────
  { name: "Obsidian Entertainment", aliases: ["Obsidian"], country: "US", founded: 2004, notable: ["The Outer Worlds","Pillars of Eternity","Fallout: New Vegas"], tags: ["crpg","rpg"] },
  { name: "Omega Force",        aliases: [], country: "JP", founded: 1997, notable: ["Dynasty Warriors","Hyrule Warriors"], tags: ["musou","action"] },
  { name: "Overkill Software",  aliases: ["OVERKILL"], country: "SE", founded: 2009, notable: ["Payday 2","Payday 3"], tags: ["coop","fps"] },
  // ── P ──────────────────────────────────────────────────
  { name: "Paradox Interactive",aliases: ["Paradox Development Studio","Paradox"], country: "SE", founded: 1999, notable: ["Crusader Kings","Europa Universalis","Stellaris"], tags: ["grand strategy","sim","publisher"] },
  { name: "People Can Fly",     aliases: [], country: "PL", founded: 2002, notable: ["Bulletstorm","Outriders","Painkiller"], tags: ["fps","action"] },
  { name: "Piranha Bytes",      aliases: [], country: "DE", founded: 1997, notable: ["Gothic","Risen","ELEX"], tags: ["rpg","open world"] },
  { name: "PlatinumGames",      aliases: ["Platinum Games"], country: "JP", founded: 2006, notable: ["Bayonetta","NieR: Automata","Vanquish"], tags: ["action","character action"] },
  { name: "Playground Games",   aliases: ["Playground"], country: "GB", founded: 2009, notable: ["Forza Horizon","Fable"], tags: ["racing","open world","aaa"] },
  { name: "Polyphony Digital",  aliases: [], country: "JP", founded: 1998, notable: ["Gran Turismo"], tags: ["racing","sim"] },
  { name: "PopCap Games",       aliases: ["PopCap"], country: "US", founded: 2000, notable: ["Plants vs. Zombies","Bejeweled","Peggle"], tags: ["casual"] },
  { name: "Psyonix",            aliases: [], country: "US", founded: 2001, notable: ["Rocket League"], tags: ["sports","indie","multiplayer"] },
  // ── Q ──────────────────────────────────────────────────
  { name: "Quantic Dream",      aliases: [], country: "FR", founded: 1997, notable: ["Detroit: Become Human","Heavy Rain"], tags: ["narrative","adventure"] },
  // ── R ──────────────────────────────────────────────────
  { name: "Rare",               aliases: ["Rare Ltd","Rareware"], country: "GB", founded: 1985, notable: ["Sea of Thieves","GoldenEye 007","Banjo-Kazooie"], tags: ["first-party","platformer","adventure"] },
  { name: "Raven Software",     aliases: ["Raven"], country: "US", founded: 1990, notable: ["Call of Duty: Warzone","Hexen","Singularity"], tags: ["fps"] },
  { name: "Rebellion Developments", aliases: ["Rebellion"], country: "GB", founded: 1992, notable: ["Sniper Elite","Aliens vs. Predator"], tags: ["action","shooter"] },
  { name: "Red Barrels",        aliases: [], country: "CA", founded: 2011, notable: ["Outlast","Outlast 2"], tags: ["horror","indie"] },
  { name: "Relic Entertainment",aliases: ["Relic"], country: "CA", founded: 1997, notable: ["Company of Heroes","Warhammer 40K: Dawn of War","Homeworld"], tags: ["rts","strategy"] },
  { name: "Remedy Entertainment",aliases: ["Remedy"], country: "FI", founded: 1995, notable: ["Alan Wake","Control","Max Payne"], tags: ["action","narrative","tps"], palette: { primary: "#b8232a", secondary: "#5e1115" } },
  { name: "Respawn Entertainment",aliases: ["Respawn"], country: "US", founded: 2010, notable: ["Apex Legends","Titanfall","Star Wars Jedi"], tags: ["fps","aaa","action"] },
  { name: "Retro Studios",      aliases: [], country: "US", founded: 1998, notable: ["Metroid Prime"], tags: ["first-party","fps","adventure"] },
  { name: "Revolution Software",aliases: [], country: "GB", founded: 1990, notable: ["Broken Sword"], tags: ["adventure","classic"] },
  { name: "Riot Games",         aliases: ["Riot"], country: "US", founded: 2006, notable: ["League of Legends","Valorant","Teamfight Tactics"], tags: ["moba","fps","f2p"], palette: { primary: "#d13639", secondary: "#6e1c1e" } },
  { name: "Rockstar Games",     aliases: ["Rockstar","Rockstar North","Rockstar San Diego","R*"], country: "US", founded: 1998, notable: ["GTA V","Red Dead Redemption 2","GTA VI"], tags: ["aaa","open world","action"], palette: { primary: "#fcaf17", secondary: "#7a5a0c" } },
  { name: "Rocksteady Studios", aliases: ["Rocksteady"], country: "GB", founded: 2005, notable: ["Batman: Arkham","Suicide Squad"], tags: ["action","aaa"] },
  // ── S ──────────────────────────────────────────────────
  { name: "Saber Interactive",  aliases: ["Saber"], country: "US", founded: 2001, notable: ["World War Z","SnowRunner"], tags: ["action","sim"] },
  { name: "Santa Monica Studio",aliases: ["SIE Santa Monica","Santa Monica"], country: "US", founded: 1999, notable: ["God of War","God of War Ragnarök"], tags: ["aaa","action","narrative"], palette: { primary: "#2861a4", secondary: "#142f52" } },
  { name: "SCS Software",       aliases: ["SCS"], country: "CZ", founded: 1997, notable: ["Euro Truck Simulator 2","American Truck Simulator"], tags: ["sim","driving"] },
  { name: "Sega",               aliases: ["SEGA","Sega of America","Sega Europe"], country: "JP", founded: 1960, notable: ["Sonic","Yakuza/Like a Dragon","Total War"], tags: ["publisher","aaa","classic"], palette: { primary: "#0060a8", secondary: "#003364" } },
  { name: "Shift Up",           aliases: ["SHIFT UP"], country: "KR", founded: 2013, notable: ["Stellar Blade","Nikke"], tags: ["action","mobile"] },
  { name: "Sierra Entertainment",aliases: ["Sierra","Sierra On-Line"], country: "US", founded: 1979, notable: ["King's Quest","Half-Life (publisher)"], tags: ["classic","adventure","publisher"] },
  { name: "Sledgehammer Games", aliases: ["SHG","Sledgehammer"], country: "US", founded: 2009, notable: ["Call of Duty: WWII","Call of Duty: Modern Warfare III"], tags: ["fps","aaa"] },
  { name: "Smilegate",          aliases: ["Smilegate RPG"], country: "KR", founded: 2002, notable: ["CrossFire","Lost Ark"], tags: ["mmo","fps"] },
  { name: "SNK",                aliases: ["SNK Corporation"], country: "JP", founded: 2001, notable: ["King of Fighters","Metal Slug","Samurai Shodown"], tags: ["fighting","classic"] },
  { name: "Sony Interactive Entertainment", aliases: ["SIE","PlayStation Studios","Sony","SCE","SCEA"], country: "JP", founded: 1994, notable: ["God of War","Spider-Man","The Last of Us"], tags: ["first-party","aaa","publisher"] },
  { name: "Sports Interactive", aliases: ["SI"], country: "GB", founded: 1994, notable: ["Football Manager"], tags: ["sports","sim","management"] },
  { name: "Square Enix",        aliases: ["Square","Enix","SQUARE ENIX","Square Enix Co."], country: "JP", founded: 1975, notable: ["Final Fantasy","Kingdom Hearts","Dragon Quest"], tags: ["jrpg","aaa","publisher"], palette: { primary: "#5c6bc0", secondary: "#283593" } },
  { name: "Starbreeze Studios", aliases: ["Starbreeze"], country: "SE", founded: 1998, notable: ["Payday","The Darkness"], tags: ["fps","coop"] },
  { name: "Stardock",           aliases: [], country: "US", founded: 1991, notable: ["Galactic Civilizations","Sins of a Solar Empire"], tags: ["4x","strategy"] },
  { name: "Studio Wildcard",    aliases: ["Wildcard"], country: "US", founded: 2014, notable: ["Ark: Survival Evolved","Ark: Survival Ascended"], tags: ["survival","open world"] },
  { name: "Sucker Punch Productions", aliases: ["Sucker Punch"], country: "US", founded: 1997, notable: ["Ghost of Tsushima","Infamous","Sly Cooper"], tags: ["aaa","open world","action"] },
  { name: "Sumo Digital",       aliases: ["Sumo"], country: "GB", founded: 2003, notable: ["Team Sonic Racing","Crackdown 3"], tags: ["action","racing"] },
  { name: "Supercell",          aliases: [], country: "FI", founded: 2010, notable: ["Clash of Clans","Clash Royale","Brawl Stars"], tags: ["mobile","strategy"] },
  { name: "Supergiant Games",   aliases: ["Supergiant"], country: "US", founded: 2009, notable: ["Hades","Hades II","Transistor"], tags: ["indie","roguelike","action"], palette: { primary: "#f56b42", secondary: "#7a3621" } },
  { name: "Supermassive Games", aliases: ["Supermassive"], country: "GB", founded: 2008, notable: ["Until Dawn","The Dark Pictures"], tags: ["horror","narrative"] },
  // ── T ──────────────────────────────────────────────────
  { name: "Take-Two Interactive",aliases: ["Take-Two","Take2","T2"], country: "US", founded: 1993, notable: ["GTA","Red Dead","NBA 2K"], tags: ["publisher","aaa"] },
  { name: "TaleWorlds Entertainment",aliases: ["TaleWorlds"], country: "TR", founded: 2005, notable: ["Mount & Blade","Bannerlord"], tags: ["rpg","strategy","sandbox"] },
  { name: "Team Cherry",        aliases: [], country: "AU", founded: 2014, notable: ["Hollow Knight","Silksong"], tags: ["indie","metroidvania"], palette: { primary: "#4a5568", secondary: "#252d3a" } },
  { name: "Team Ninja",         aliases: [], country: "JP", founded: 1995, notable: ["Ninja Gaiden","Nioh","Dead or Alive"], tags: ["action","soulslike"] },
  { name: "Team17",             aliases: ["Team 17"], country: "GB", founded: 1990, notable: ["Worms","Overcooked","The Escapists"], tags: ["publisher","indie"] },
  { name: "Techland",           aliases: [], country: "PL", founded: 1991, notable: ["Dying Light","Dead Island","Call of Juarez"], tags: ["fps","survival","open world"] },
  { name: "Telltale Games",     aliases: ["Telltale"], country: "US", founded: 2004, notable: ["The Walking Dead","Wolf Among Us","Tales from the Borderlands"], tags: ["narrative","adventure"] },
  { name: "Tencent Games",      aliases: ["Tencent","TiMi Studios","TiMi"], country: "CN", founded: 2003, notable: ["PUBG Mobile","Honor of Kings"], tags: ["publisher","mobile"] },
  { name: "Thatgamecompany",    aliases: [], country: "US", founded: 2006, notable: ["Journey","Sky"], tags: ["indie","art","exploration"] },
  { name: "The Coalition",      aliases: ["Coalition"], country: "CA", founded: 2010, notable: ["Gears of War","Gears 5"], tags: ["tps","aaa"] },
  { name: "THQ Nordic",         aliases: ["THQ","Nordic Games"], country: "AT", founded: 2011, notable: ["SpongeBob","Gothic Remake","Darksiders"], tags: ["publisher","aa"] },
  { name: "Toby Fox",           aliases: [], country: "US", founded: 2015, notable: ["Undertale","Deltarune"], tags: ["indie","rpg"] },
  { name: "Toys for Bob",       aliases: [], country: "US", founded: 1989, notable: ["Spyro Reignited","Crash Bandicoot 4","Skylanders"], tags: ["platformer","action"] },
  { name: "Treyarch",           aliases: [], country: "US", founded: 1996, notable: ["Call of Duty: Black Ops","Call of Duty: Zombies"], tags: ["fps","aaa"] },
  { name: "Tripwire Interactive", aliases: ["Tripwire"], country: "US", founded: 2005, notable: ["Killing Floor","Red Orchestra"], tags: ["fps","coop"] },
  { name: "Turn 10 Studios",    aliases: ["Turn 10"], country: "US", founded: 2001, notable: ["Forza Motorsport"], tags: ["racing","sim","aaa"] },
  { name: "Turtle Rock Studios",aliases: ["Turtle Rock"], country: "US", founded: 2002, notable: ["Left 4 Dead","Back 4 Blood","Evolve"], tags: ["coop","fps"] },
  // ── U ──────────────────────────────────────────────────
  { name: "Ubisoft",            aliases: ["Ubisoft Montreal","Ubisoft Toronto","Ubisoft Quebec","Ubisoft Paris","Ubisoft Entertainment"], country: "FR", founded: 1986, notable: ["Assassin's Creed","Far Cry","Rainbow Six"], tags: ["publisher","aaa","open world"], palette: { primary: "#0070ff", secondary: "#003d8a" } },
  { name: "Undead Labs",        aliases: [], country: "US", founded: 2009, notable: ["State of Decay","State of Decay 2"], tags: ["survival","open world"] },
  { name: "Unknown Worlds Entertainment", aliases: ["Unknown Worlds"], country: "US", founded: 2001, notable: ["Subnautica"], tags: ["survival","exploration","indie"] },
  // ── V ──────────────────────────────────────────────────
  { name: "Valve",              aliases: ["Valve Corporation","Valve Software"], country: "US", founded: 1996, notable: ["Half-Life","Portal","Counter-Strike 2","Dota 2"], tags: ["fps","aaa","platform"], palette: { primary: "#171a21", secondary: "#1b2838" } },
  { name: "Vanillaware",        aliases: [], country: "JP", founded: 2002, notable: ["13 Sentinels","Odin Sphere","Dragon's Crown"], tags: ["jrpg","2d"] },
  { name: "Visual Concepts",    aliases: [], country: "US", founded: 1988, notable: ["NBA 2K","WWE 2K"], tags: ["sports"] },
  { name: "Volition",           aliases: [], country: "US", founded: 1996, notable: ["Saints Row","Red Faction"], tags: ["open world","action"] },
  // ── W ──────────────────────────────────────────────────
  { name: "Wargaming",          aliases: ["Wargaming.net"], country: "CY", founded: 1998, notable: ["World of Tanks","World of Warships"], tags: ["f2p","sim","military"] },
  { name: "Warhorse Studios",   aliases: ["Warhorse"], country: "CZ", founded: 2011, notable: ["Kingdom Come: Deliverance"], tags: ["rpg","open world"] },
  { name: "Warner Bros. Interactive Entertainment", aliases: ["WB Games","Warner Bros. Games","WBIE"], country: "US", founded: 1988, notable: ["Batman: Arkham","Hogwarts Legacy","Mortal Kombat"], tags: ["publisher","aaa"] },
  // ── X ──────────────────────────────────────────────────
  { name: "Xbox Game Studios",  aliases: ["Microsoft Game Studios","Microsoft Studios","Xbox","XGS"], country: "US", founded: 2002, notable: ["Halo","Forza","Age of Empires"], tags: ["first-party","publisher","aaa"] },
  // ── Y ──────────────────────────────────────────────────
  { name: "Yager Development",  aliases: ["Yager"], country: "DE", founded: 1999, notable: ["Spec Ops: The Line","The Cycle"], tags: ["fps"] },
  // ── Z ──────────────────────────────────────────────────
  { name: "ZeniMax Online Studios", aliases: ["ZOS","ZeniMax"], country: "US", founded: 2007, notable: ["The Elder Scrolls Online"], tags: ["mmo","rpg"] },
  { name: "Zynga",              aliases: [], country: "US", founded: 2007, notable: ["FarmVille","Words with Friends"], tags: ["mobile","social","casual"] },

  // ── Additional notable / indie studios ────────────────
  { name: "ConcernedApe",       aliases: ["Eric Barone"], country: "US", founded: 2012, notable: ["Stardew Valley","Haunted Chocolatier"], tags: ["indie","farming","sim"] },
  { name: "Re-Logic",           aliases: [], country: "US", founded: 2011, notable: ["Terraria"], tags: ["indie","sandbox","survival"] },
  { name: "Innersloth",         aliases: [], country: "US", founded: 2015, notable: ["Among Us"], tags: ["indie","social","party"] },
  { name: "Wube Software",      aliases: ["Wube"], country: "CZ", founded: 2012, notable: ["Factorio"], tags: ["indie","management","automation"] },
  { name: "Subset Games",       aliases: [], country: "CN", founded: 2011, notable: ["FTL","Into the Breach"], tags: ["indie","roguelike","strategy"] },
  { name: "Yacht Club Games",   aliases: ["Yacht Club"], country: "US", founded: 2013, notable: ["Shovel Knight"], tags: ["indie","platformer","retro"] },
  { name: "Cellar Door Games",  aliases: [], country: "CA", founded: 2009, notable: ["Rogue Legacy","Rogue Legacy 2"], tags: ["indie","roguelike"] },
  { name: "Heart Machine",      aliases: [], country: "US", founded: 2013, notable: ["Hyper Light Drifter","Hyper Light Breaker"], tags: ["indie","action"] },
  { name: "Thomas Happ Games",  aliases: ["Thomas Happ"], country: "US", founded: 2010, notable: ["Axiom Verge"], tags: ["indie","metroidvania"] },
  { name: "Hopoo Games",        aliases: ["Hopoo"], country: "US", founded: 2013, notable: ["Risk of Rain 2","Risk of Rain"], tags: ["indie","roguelike"] },
  { name: "Poncle",             aliases: [], country: "IT", founded: 2022, notable: ["Vampire Survivors"], tags: ["indie","roguelike","action"] },
  { name: "Kinetic Games",      aliases: [], country: "GB", founded: 2018, notable: ["Phasmophobia"], tags: ["indie","horror","coop"] },
  { name: "Endnight Games",     aliases: ["Endnight"], country: "CA", founded: 2013, notable: ["The Forest","Sons of the Forest"], tags: ["indie","survival","horror"] },
  { name: "Iron Gate Studio",   aliases: ["Iron Gate","Iron Gate AB"], country: "SE", founded: 2018, notable: ["Valheim"], tags: ["indie","survival"] },
  { name: "Pocket Pair",        aliases: [], country: "JP", founded: 2015, notable: ["Palworld","Craftopia"], tags: ["indie","survival","open world"] },
  { name: "Stunlock Studios",   aliases: ["Stunlock"], country: "SE", founded: 2010, notable: ["V Rising","Battlerite"], tags: ["indie","survival","action"] },
  { name: "Ludeon Studios",     aliases: ["Ludeon"], country: "CA", founded: 2013, notable: ["RimWorld"], tags: ["indie","colony sim","management"] },
  { name: "Paradox Tectonic",   aliases: [], country: "SE", founded: 2019, notable: ["Life by You"], tags: ["sim"] },
  { name: "Numskull Games",     aliases: [], country: "GB", founded: 2002, notable: ["Ride 5"], tags: ["publisher"] },
  { name: "11 Bit Studios",     aliases: [], country: "PL", founded: 2010, notable: ["Frostpunk 2"], tags: ["indie","strategy"] },
  { name: "Frogwares",          aliases: [], country: "UA", founded: 2000, notable: ["Sherlock Holmes","The Sinking City"], tags: ["adventure","mystery"] },
  { name: "GSC Game World",     aliases: [], country: "UA", founded: 1995, notable: ["S.T.A.L.K.E.R. 2"], tags: ["fps","survival"] },
  { name: "Playdead",           aliases: [], country: "DK", founded: 2006, notable: ["Inside","Limbo"], tags: ["indie","puzzle","platformer"] },
  { name: "DONTNOD",            aliases: ["DONTNOD Entertainment"], country: "FR", founded: 2008, notable: ["Life Is Strange"], tags: ["narrative"] },
  { name: "Flying Wild Hog",    aliases: [], country: "PL", founded: 2009, notable: ["Shadow Warrior","Trek to Yomi"], tags: ["fps","action"] },
  { name: "Sandlot",            aliases: [], country: "JP", founded: 2001, notable: ["Earth Defense Force"], tags: ["action","coop"] },
  { name: "Spike Chunsoft",     aliases: ["Chunsoft","Spike"], country: "JP", founded: 2012, notable: ["Danganronpa","Zero Escape","Mystery Dungeon"], tags: ["visual novel","jrpg"] },
  { name: "Granzella",          aliases: [], country: "JP", founded: 2011, notable: ["Disaster Report 4"], tags: ["adventure"] },
  { name: "Access Games",       aliases: [], country: "JP", founded: 2002, notable: ["Deadly Premonition"], tags: ["adventure","cult"] },
  { name: "Annapurna Interactive", aliases: ["Annapurna"], country: "US", founded: 2016, notable: ["Outer Wilds","Stray","What Remains of Edith Finch"], tags: ["publisher","indie","narrative"] },
  { name: "Raw Fury",           aliases: [], country: "SE", founded: 2015, notable: ["Kingdom Two Crowns","Sable"], tags: ["publisher","indie"] },
  { name: "Thunderful",         aliases: ["Thunderful Group","Image & Form"], country: "SE", founded: 2019, notable: ["SteamWorld"], tags: ["publisher","indie"] },
  { name: "Wired Productions",  aliases: [], country: "GB", founded: 2012, notable: ["The Falconeer"], tags: ["publisher","indie"] },
  { name: "3909 LLC",           aliases: ["3909"], country: "US", founded: 2020, notable: ["Stationeers"], tags: ["indie","sim"] },
  { name: "Playsaurus",         aliases: [], country: "US", founded: 2010, notable: ["Clicker Heroes"], tags: ["idle","indie"] },
  { name: "Ghostlore",          aliases: [], country: "SG", founded: 2020, notable: ["Ghostlore"], tags: ["arpg","indie"] },
  { name: "Owlcat Games",       aliases: ["Owlcat"], country: "CY", founded: 2016, notable: ["Pathfinder: Wrath of the Righteous","Pathfinder: Kingmaker"], tags: ["crpg","rpg"] },
  { name: "Amplitude Studios",  aliases: ["Amplitude"], country: "FR", founded: 2011, notable: ["Endless Legend","Humankind","Endless Space"], tags: ["4x","strategy"] },
  { name: "Spiders",            aliases: [], country: "FR", founded: 2008, notable: ["GreedFall","Steelrising"], tags: ["rpg","action"] },
  { name: "Deck13",             aliases: ["DECK13"], country: "DE", founded: 2001, notable: ["The Surge","Lords of the Fallen (2014)"], tags: ["soulslike","action"] },
  { name: "Tango Gameworks",    aliases: ["Tango"], country: "JP", founded: 2010, notable: ["Hi-Fi RUSH","The Evil Within","Ghostwire: Tokyo"], tags: ["action","horror"] },
  { name: "WayForward Technologies", aliases: ["WayForward"], country: "US", founded: 1990, notable: ["Shantae","River City Girls"], tags: ["2d","platformer","retro"] },
  { name: "Devolver Digital",   aliases: ["Devolver"], country: "US", founded: 2009, notable: ["Cult of the Lamb","Inscryption","Loop Hero"], tags: ["publisher","indie"] },
  { name: "tinyBuild",          aliases: ["tinybuild"], country: "US", founded: 2013, notable: ["Hello Neighbor","Graveyard Keeper"], tags: ["publisher","indie"] },
  { name: "505 Games",          aliases: ["505"], country: "IT", founded: 2006, notable: ["Control","Terraria (publisher)","Death Stranding (PC)"], tags: ["publisher"] },
  { name: "Focus Entertainment",aliases: ["Focus Home Interactive","Focus Home"], country: "FR", founded: 1996, notable: ["A Plague Tale (publisher)","SnowRunner","Insurgency: Sandstorm"], tags: ["publisher","aa"] },
  { name: "Nacon",              aliases: ["Bigben Interactive"], country: "FR", founded: 2019, notable: ["WRC","RoboCop: Rogue City"], tags: ["publisher","racing"] },
  { name: "Koch Media",         aliases: ["Plaion","Deep Silver"], country: "AT", founded: 1994, notable: ["Dead Island","Saints Row","Metro"], tags: ["publisher"] },
  { name: "Microids",           aliases: [], country: "FR", founded: 1985, notable: ["Syberia","Blacksad"], tags: ["publisher","adventure"] },
  { name: "Kalypso Media",      aliases: ["Kalypso"], country: "DE", founded: 2006, notable: ["Tropico","Commandos"], tags: ["publisher","strategy"] },
  { name: "Curve Games",        aliases: ["Curve Digital"], country: "GB", founded: 2005, notable: ["Human: Fall Flat (publisher)"], tags: ["publisher","indie"] },
  { name: "Merge Games",        aliases: [], country: "GB", founded: 2009, notable: ["Dead Cells (publisher)","Spirit of the North"], tags: ["publisher","indie"] },
  { name: "Daedalic Entertainment", aliases: ["Daedalic"], country: "DE", founded: 2007, notable: ["The Lord of the Rings: Gollum","Edna & Harvey"], tags: ["publisher","adventure"] },
  { name: "Hooded Horse",       aliases: [], country: "US", founded: 2019, notable: ["Manor Lords","Against the Storm"], tags: ["publisher","strategy","indie"] },
  { name: "Shiro Games",        aliases: ["Shiro"], country: "FR", founded: 2012, notable: ["Northgard","Dune: Spice Wars"], tags: ["rts","strategy"] },
  { name: "Crate Entertainment",aliases: ["Crate"], country: "US", founded: 2008, notable: ["Grim Dawn","Farthest Frontier"], tags: ["arpg","indie"] },
  { name: "Iceberg Interactive",aliases: ["Iceberg"], country: "NL", founded: 2009, notable: ["Killing Floor 2 (publisher)","StarDrive"], tags: ["publisher"] },
  { name: "XSEED Games",        aliases: ["XSEED","Marvelous USA"], country: "US", founded: 2004, notable: ["Story of Seasons","Rune Factory (localizer)","Trails (localizer)"], tags: ["publisher","localization","jrpg"] },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Lookup index — lowercased canonical name AND all aliases
   ═══════════════════════════════════════════════════════════════════════════ */

const _index = new Map();

for (const entry of DB) {
  const key = entry.name.toLowerCase().trim();
  if (!_index.has(key)) _index.set(key, entry);
  for (const alias of (entry.aliases || [])) {
    const ak = alias.toLowerCase().trim();
    if (!_index.has(ak)) _index.set(ak, entry);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Reverse lookup — game title → developer
   Matches partial substrings (e.g. "Skyrim" matches Bethesda's "Skyrim")
   ═══════════════════════════════════════════════════════════════════════════ */
const _titleIndex = new Map(); // lowercased notable title fragment → entry

for (const entry of DB) {
  for (const title of (entry.notable || [])) {
    const lower = title.toLowerCase().trim();
    if (lower && !_titleIndex.has(lower)) _titleIndex.set(lower, entry);
  }
}

/**
 * Look up a developer by name (case-insensitive, alias-aware).
 * @param {string} name — developer name from the user's game library
 * @returns {object|null} — DB entry or null
 */
export function lookupDeveloper(name) {
  if (!name) return null;
  const key = String(name).toLowerCase().trim();
  return _index.get(key) || null;
}

/**
 * Look up a developer by game title (fuzzy substring match against notable games).
 * Returns the developer entry if the game title contains any notable game name,
 * or if a notable game name is found within the title.
 * @param {string} gameTitle
 * @returns {object|null}
 */
export function lookupDeveloperByGameTitle(gameTitle) {
  if (!gameTitle) return null;
  const lower = gameTitle.toLowerCase().trim();

  // Exact match first
  if (_titleIndex.has(lower)) return _titleIndex.get(lower);

  // Check if the game title starts with a notable title (franchise-prefix match).
  // E.g. "Halo" matches "Halo Wars" but NOT "Nippon Marathon" for "Marathon".
  for (const [notable, entry] of _titleIndex) {
    if (notable.length >= 4 && lower.startsWith(notable)) return entry;
    // Also check with colon/dash separators: "halo: reach" starts with "halo"
    const colonIdx = lower.indexOf(':');
    if (colonIdx > 0 && notable.length >= 4) {
      const prefix = lower.slice(0, colonIdx).trim();
      if (prefix === notable) return entry;
    }
  }
  return null;
}

/**
 * Return the full database array (read-only).
 */
export function getAllDevelopers() {
  return DB;
}

/**
 * Return enrichment data for a hero derived from a developer name.
 * Provides palette override, notable games tagline, country flag, and tags.
 * @param {string} devName
 * @returns {{ palette?: object, tagline?: string, country?: string, tags?: string[], founded?: number }|null}
 */
export function getHeroEnrichment(devName) {
  const entry = lookupDeveloper(devName);
  if (!entry) return null;
  const tagline = entry.notable?.length
    ? entry.notable.slice(0, 3).join(" · ")
    : "";
  return {
    palette: entry.palette || null,
    tagline,
    country: entry.country || null,
    tags: entry.tags || [],
    founded: entry.founded || null,
  };
}

export default DB;
