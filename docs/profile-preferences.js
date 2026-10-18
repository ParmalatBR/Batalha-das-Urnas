// Shared allowlist for account preferences; no device paths or credentials.
export function profilePreferences(raw={}){
 const out={};if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
 for(const key of ['sound','subtitles','flashes','reduced','focus','celebrations','skipSeen'])if(typeof raw[key]==='boolean')out[key]=raw[key];
 for(const key of ['music','effects','voice','master'])if(Number.isFinite(raw[key]))out[key]=Math.min(1,Math.max(0,raw[key]));
 for(const [key,values]of Object.entries({quality:['light','high'],light:['day','dusk'],difficulty:['easy','calm','normal','hard','extreme'],series:[0,3,5],duration:[90,120,180],eventRate:['rare','normal','frequent']}))if(values.includes(raw[key]))out[key]=raw[key];
 const keys=['up','down','left','right','cuff','item','signature'];
 if(raw.keys&&keys.every(k=>typeof raw.keys[k]==='string'&&/^(Key[A-OQ-Z]|Space|Digit[0-9])$/.test(raw.keys[k]))&&new Set(keys.map(k=>raw.keys[k])).size===7)out.keys=Object.fromEntries(keys.map(k=>[k,raw.keys[k]]));
 return out;
}
