export function safeSourceUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&new Set(['modrinth.com','www.nexusmods.com','store.steampowered.com','www.youtube.com']).has(u.hostname)?u.href:null;}catch{return null;}}
export const MEDIA_HOSTS = new Set(['cdn.modrinth.com','staticdelivery.nexusmods.com','shared.akamai.steamstatic.com','store.akamai.steamstatic.com','video.akamai.steamstatic.com','i.ytimg.com']);
export function safeMediaUrl(value) {try{const u=new URL(value);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&MEDIA_HOSTS.has(u.hostname)?u.href:null;}catch{return null;}}
export function validateFixture(data) {
  if(data?.schema_version!==1||data.access!=='public-only'||data.private_data_included!==false||!Array.isArray(data.cards))throw Error('Unsupported or non-public fixture');
  const ids=new Set();
  for(const c of data.cards){if(typeof c.id!=='string'||ids.has(c.id)||typeof c.title!=='string'||!Array.isArray(c.gallery)||!Array.isArray(c.videos))throw Error('Invalid card identity or media lists');ids.add(c.id);if(!safeSourceUrl(c.source))throw Error('Disallowed source link');if(!providerOwnsHost(c.cover,c.provider))throw Error('Disallowed cover host');for(const m of c.gallery)if(!providerOwnsHost(m.preview,c.provider)||!providerOwnsHost(m.original,c.provider))throw Error('Disallowed gallery host');for(const v of c.videos){if(v.kind==='youtube'){if(!/^[A-Za-z0-9_-]{11}$/.test(v.id))throw Error('Invalid video ID');}else if(!providerOwnsHost(v.hls,c.provider))throw Error('Disallowed trailer host');}}
  return data;
}
export function mediaCounts(data){return {cards:data.cards.length,gallery_images:data.cards.reduce((n,c)=>n+c.gallery.length,0),video_entries:data.cards.reduce((n,c)=>n+c.videos.length,0)};}

export function providerOwnsHost(value,provider){const safe=safeMediaUrl(value);if(!safe)return false;const host=new URL(safe).hostname;const hosts={Modrinth:['cdn.modrinth.com'],'Nexus Mods':['staticdelivery.nexusmods.com'],Steam:['shared.akamai.steamstatic.com','store.akamai.steamstatic.com','video.akamai.steamstatic.com'],YouTube:['i.ytimg.com']};return Boolean(hosts[provider]?.includes(host));}
