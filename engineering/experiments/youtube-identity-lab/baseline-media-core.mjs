import {bilibiliEmbedUrl} from './bilibili-player.mjs';
export function safeSourceUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&new Set(['modrinth.com','www.nexusmods.com','store.steampowered.com','www.youtube.com','www.bilibili.com']).has(u.hostname)?u.href:null;}catch{return null;}}
export const MEDIA_HOSTS = new Set(['cdn.modrinth.com','staticdelivery.nexusmods.com','shared.akamai.steamstatic.com','store.akamai.steamstatic.com','video.akamai.steamstatic.com','i.ytimg.com']);
export function safeMediaUrl(value) {try{const u=new URL(value);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&MEDIA_HOSTS.has(u.hostname)?u.href:null;}catch{return null;}}
const SOURCE_HOSTS = Object.freeze({
  Modrinth: 'modrinth.com',
  'Nexus Mods': 'www.nexusmods.com',
  Steam: 'store.steampowered.com',
  YouTube: 'www.youtube.com',
  Bilibili: 'www.bilibili.com',
});
export function validateFixture(data) {
  if (data?.schema_version !== 1 || data.access !== 'public-only' || data.private_data_included !== false || !Array.isArray(data.cards)) {
    throw Error('Unsupported or non-public fixture');
  }
  const ids = new Set();
  for (const card of data.cards) {
    if (!card || typeof card.id !== 'string' || !card.id || ids.has(card.id) || typeof card.title !== 'string' || !Array.isArray(card.gallery) || !Array.isArray(card.videos)) {
      throw Error('Invalid card identity or media lists');
    }
    ids.add(card.id);
    const source = safeSourceUrl(card.source);
    if (!source || new URL(source).hostname !== SOURCE_HOSTS[card.provider]) throw Error('Disallowed provider source link');
    if(card.provider==='Bilibili'){if(card.cover!==null||card.cover_status!=='official-player-only'||card.gallery.length!==0||card.videos.length!==1)throw Error('Unverified Bilibili cover or media scope');}
    else if (!providerOwnsHost(card.cover, card.provider)) throw Error('Disallowed cover host');
    for (const media of card.gallery) {
      if (!media || !providerOwnsHost(media.preview, card.provider) || !providerOwnsHost(media.original, card.provider)) throw Error('Disallowed gallery host');
    }
    for (const video of card.videos) {
      if (!video || typeof video !== 'object') throw Error('Invalid video entry');
      if(video.kind==='bilibili'){
        if(card.provider!=='Bilibili'||card.id!=='bilibili:'+video.id)throw Error('Invalid Bilibili provider identity');
        bilibiliEmbedUrl(video.id);const u=new URL(source);if(u.pathname!=='/video/'+video.id+'/'||u.search||u.hash)throw Error('Mismatched Bilibili source identity');
      } else if (video.kind === 'youtube') {
        if (card.provider !== 'YouTube' || typeof video.id !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(video.id)) throw Error('Invalid video provider or ID');
      } else {
        // Existing Steam snapshots omit kind. Do not interpret future kinds as HLS.
        if (card.provider !== 'Steam' || (video.kind !== undefined && video.kind !== 'hls') || !providerOwnsHost(video.hls, card.provider)) throw Error('Unsupported video player or trailer host');
        if (video.poster != null && !providerOwnsHost(video.poster, card.provider)) throw Error('Disallowed trailer poster host');
      }
    }
  }
  return data;
}
export function mediaCounts(data){return {cards:data.cards.length,gallery_images:data.cards.reduce((n,c)=>n+c.gallery.length,0),video_entries:data.cards.reduce((n,c)=>n+c.videos.length,0)};}

export function providerOwnsHost(value,provider){const safe=safeMediaUrl(value);if(!safe)return false;const host=new URL(safe).hostname;const hosts={Modrinth:['cdn.modrinth.com'],'Nexus Mods':['staticdelivery.nexusmods.com'],Steam:['shared.akamai.steamstatic.com','store.akamai.steamstatic.com','video.akamai.steamstatic.com'],YouTube:['i.ytimg.com']};return Boolean(hosts[provider]?.includes(host));}

export function nativePlaybackLabel(type) {
  const labels={playing:'Playing the selected source trailer.',pause:'Paused.',ended:'Playback ended.',error:'Playback failed. The source entry is preserved.'};
  return Object.hasOwn(labels,type)?labels[type]:null;
}
