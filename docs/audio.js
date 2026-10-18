import {preferences,remember} from './preferences.js';
/** Licensed menu/combat recordings, original boss scores, archive voices and discreet effects. */
export class GameAudio {
  constructor() {
    this.enabled = preferences.sound;this.voiceVolume=preferences.voice;this.voiceClips=[];this.voiceCache=new Map();this.voiceHistory=new Map();this.voiceBags=new Map();this.voiceWarm=false;this.voiceToken=0;this.voiceUntil=0;
    this.voiceLoads=new Map();this.voiceQueue=[];this.voiceManifestLoaded=false;this.voiceManifestLoad=null;this.voiceManifest=this.readyVoices();
    this.scene = 'home';this.masterVolume=.8;this.scoreKind=null;this.scoreToken=0;this.scoreCache=new Map();this.scoreLoads=new Map();this.scoreFailures=new Map();this.scoreOffset=0;this.scoreStarted=0;this.scoreCelebrating=false;
    this.scores={battle:{title:'Five Armies',artist:'Kevin MacLeod',src:'assets/music-battle/score-battle-five-armies.mp3'},miniboss:{title:'Clash Defiant',artist:'Kevin MacLeod',src:'assets/music-battle/score-miniboss-clash-defiant.mp3'},final:{title:'Volatile Reaction',artist:'Kevin MacLeod',src:'assets/music-battle/score-final-volatile-reaction.mp3'}};this.voicePriority=0;this.lastVoiceAt=-10;this.jingle=null;this.cueCache=new Map();this.lastCapture=-1;this.lastCaptureIndex=-1;
    this.ctx = null;
    this.voices = new Set();
    this.lastStep = -1;
    this.lastBoom = -1;
    this.nextWind = 0;
    // Per-recording loudness trim: approximately -46 LUFS at the default music/master
    // levels, comparable to capture effects. Sliders stay independent; combat is unchanged.
    this.playlist = [
      { title: 'Bossa Antigua', artist: 'Kevin MacLeod', src: 'assets/music/bossa-antigua.mp3', menuGain:1.7 },
      { title: 'BossaBossa', artist: 'Kevin MacLeod', src: 'assets/music/bossa-bossa.mp3', menuGain:1 },
      { title: 'Samba Isobel', artist: 'Kevin MacLeod', src: 'assets/music/samba-isobel.mp3', menuGain:.95 }
    ];
    this.trackIndex = 0;
    this.musicVolume = preferences.music;this.duckUntil=0;this.nextFuse=0;
    this.effectsVolume = preferences.effects;
    this.musicFailures = 0;
    this.disposed = false;
    this.hidden = typeof document !== 'undefined' && document.hidden;
    this._onVisibility = () => {
      this.hidden = document.hidden;if(this.hidden){this.stopVoice();this.stopJingle();}
      this._volume();
      if (this.ctx) this.nextWind = this.ctx.currentTime + .1;
      if(!this.hidden)this._restoreAudio();
    };
    this._onPageShow=()=>{this.hidden=document.hidden;this._restoreAudio();};
    this._onOnline=()=>{
      for(const [kind,failure] of this.scoreFailures)if(failure.transient)this.scoreFailures.delete(kind);
      if(this.player?.error){this.musicFailures=0;this.player.load();}
      this._restoreAudio();
    };
    this._onAudioState=()=>{if(this.ctx?.state==='running'&&!this.disposed)this._volume();};
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this._onVisibility);
    if(typeof window!=='undefined'){window.addEventListener('pageshow',this._onPageShow);window.addEventListener('online',this._onOnline);}
  }

  _restoreAudio() {
    // Returning to Safari may leave an existing context interrupted. This is best effort;
    // a denied resume still uses the next explicit user gesture, without changing preferences.
    if(this.ctx&&!this.disposed&&!this.hidden&&this.enabled&&this.scene!=='paused')void this.unlock();
  }

  async unlock() {
    if(this.disposed)return false;
    try {
      if (!this.ctx) {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Audio) return false;
        this.ctx = new Audio({ latencyHint: 'interactive' });
        const c = this.ctx;
        this.master = c.createGain(); this.master.gain.value = 0;
        this.ambient = c.createGain(); this.ambient.gain.value = 0;
        this.effects = c.createGain(); this.effects.gain.value = this.effectsVolume;
        this.recording = c.createGain(); this.recording.gain.value = 0;this.voiceBus=c.createGain();this.voiceBus.gain.value=this.voiceVolume;this.voiceOutput=c.createGain();this.voiceOutput.gain.value=0;this.voiceBus.connect(this.voiceOutput);
        const limiter = c.createDynamicsCompressor();
        limiter.threshold.value = -12; limiter.knee.value = 12;
        limiter.ratio.value = 3; limiter.attack.value = .006; limiter.release.value = .15;
        this.ambient.connect(this.master); this.effects.connect(this.master);
        this.recording.connect(this.master);
        this.scoreGain=c.createGain();this.scoreGain.gain.value=0;this.scoreGain.connect(this.master);
        // Speech bypasses the effects compressor; only the final near-ceiling guard is shared.
        this.outputMix=c.createGain();const ceiling=c.createDynamicsCompressor();
        ceiling.threshold.value=-1;ceiling.knee.value=0;ceiling.ratio.value=20;ceiling.attack.value=.001;ceiling.release.value=.06;
        this.master.connect(limiter);limiter.connect(this.outputMix);this.voiceOutput.connect(this.outputMix);
        this.outputMix.connect(ceiling);ceiling.connect(c.destination);
        this._makeBuffers();
        try{this._prepareMusic();}catch(error){this.musicError=error?.name||'MediaError';this.player?.pause();this.player=null;}
        this.nextWind = c.currentTime + .1;
        c.addEventListener?.('statechange',this._onAudioState);
      }
      // Call play before awaiting resume so mobile browsers retain the user gesture.
      if (this.player && !this.scoreKind && this.enabled && !this.hidden && this.scene !== 'paused' && this.musicVolume) {
        this._playMenu();
      }
      if (this.ctx.state === 'suspended'||this.ctx.state==='interrupted') await this.ctx.resume();
      this._volume();
      // Fetch/decode speech on demand; decoding the whole roster competed with the menu on first input.
      if(!this.voiceManifestLoaded&&!this.voiceManifestLoad)void this.readyVoices();
      if(!this.cuesWarm){this.cuesWarm=true;Promise.allSettled(["victory-normal","victory-miniboss","victory-final","capture-metal-1","capture-metal-2","capture-metal-3"].map(async id=>{const r=await fetch('assets/cues/'+id+'.mp3');if(r.ok)this.cueCache.set(id,await this.ctx.decodeAudioData(await r.arrayBuffer()));}));}
      return this.ctx.state === 'running';
    } catch(error) { this.unlockError=error?.name||'AudioError';return false; }
  }

  readyVoices() {
    if(this.voiceManifestLoaded)return Promise.resolve(this.voiceClips);
    if(this.voiceManifestLoad)return this.voiceManifestLoad;
    const pending=(async()=>{try{
      const response=await fetch('voice-credits.json?v=27',{cache:'no-store'});
      if(!response.ok)throw Error('Voice manifest unavailable');
      const data=await response.json(),clips=Array.isArray(data)?data:data.clips;
      if(!Array.isArray(clips))throw Error('Invalid voice manifest');
      if(!this.disposed){this.voiceClips=clips.filter(c=>c.status==='approved');this.voiceManifestLoaded=true;}
      return this.voiceClips;
    }catch{return this.voiceClips;}})();
    this.voiceManifestLoad=pending;this.voiceManifest=pending;pending.then(()=>{if(this.voiceManifestLoad===pending)this.voiceManifestLoad=null;});return pending;
  }

  _playMenu() {
    if(!this.player||this.menuPlayPending||this.disposed)return;
    try{
      const result=this.player.play();
      if(result?.then){this.menuPlayPending=true;result.then(()=>{this.musicError=null;},error=>{this.musicError=error?.name||'PlaybackError';}).finally(()=>{this.menuPlayPending=false;});}
    }catch(error){this.musicError=error?.name||'PlaybackError';}
  }

  _prepareMusic() {
    if (typeof Audio === 'undefined' || !this.ctx.createMediaElementSource) return;
    this.player = new Audio();
    this.player.preload = 'auto';
    this.player.setAttribute('playsinline', '');
    this.player.src = this.playlist[this.trackIndex].src;this.player.loop=false;
    this.mediaSource = this.ctx.createMediaElementSource(this.player);
    this.mediaSource.connect(this.recording);
    this.player.addEventListener('ended', () => this.nextTrack());
    this.player.addEventListener('playing', () => { this.musicFailures = 0; });
    this.player.addEventListener('loadeddata', () => this._syncMusic());
    this.player.addEventListener('error', () => {
      if (++this.musicFailures < this.playlist.length && !this.disposed) this.nextTrack();
    });
  }

  get currentTrack() { return this.scores[this.scoreKind] || this.playlist[this.trackIndex]; }
  getTrack() { return this.currentTrack; }

  setEffectsVolume(volume) {
    if (!Number.isFinite(Number(volume))) return;
    this.effectsVolume = Math.max(0, Math.min(1, Number(volume)));
    remember({effects:this.effectsVolume});this._volume();
  }

  setMusicVolume(volume) {
    if (!Number.isFinite(Number(volume))) return;
    this.musicVolume = Math.max(0, Math.min(1, Number(volume)));remember({music:this.musicVolume});
    this._syncMusic();if(this.jingleGain&&this.ctx)this.jingleGain.gain.setTargetAtTime(this.musicVolume*(this.jingleScale||.55),this.ctx.currentTime,.04);
  }

  stopJingle(){this.jingleToken=(this.jingleToken||0)+1;if(this.jingle){try{this.jingle.stop();}catch{}this.jingle=null;}this.jingleGain=null;}
  /** Same-kind calls keep time across the stage introduction and active combat. */
  score(kind) {
    const aliases={'miniboss-politico':'miniboss','miniboss-juridico':'miniboss','final-presidencial':'final'};
    const next=kind==null?null:(aliases[kind]||kind);
    if(next!==null&&!this.scores[next])return false;
    if(next===this.scoreKind&&!this.scoreCelebrating){this._syncMusic();return true;}
    this.stopJingle();this._pauseScore();this.scoreToken++;this.scoreKind=next;
    if(this.scoreFailures.get(next)?.transient)this.scoreFailures.delete(next);
    this.scoreOffset=0;this.scoreCelebrating=false;this._syncMusic();return true;
  }

  _pauseScore() {
    const source=this.scoreSource;
    if(!source)return;
    this.scoreSource=null;
    if(this.ctx&&source.buffer?.duration)this.scoreOffset=(this.scoreOffset+Math.max(0,this.ctx.currentTime-this.scoreStarted))%source.buffer.duration;
    try{source.stop();source.disconnect();}catch{}
  }

  _syncScore() {
    const c=this.ctx,kind=this.scoreKind;
    if(!c||!this.scoreGain)return;
    if(!kind||this.disposed||!this.enabled||this.hidden||this.scene==='paused'||!this.musicVolume||this.scoreCelebrating){this._pauseScore();return;}
    if(this.scoreSource||c.state!=='running')return;
    const failure=this.scoreFailures.get(kind);
    if(failure&&(!failure.transient||failure.attempts>=3||c.currentTime<failure.retryAt))return;
    const buffer=this.scoreCache.get(kind);
    if(buffer){
      const source=c.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(this.scoreGain);
      this.scoreOffset%=buffer.duration;this.scoreStarted=c.currentTime;this.scoreSource=source;
      source.start(0,this.scoreOffset);this._musicFade();return;
    }
    if(this.scoreLoads.has(kind))return;
    const pending=(async()=>{
      let transient=true;
      try{
        const response=await fetch(this.scores[kind].src);
        if(!response.ok){transient=response.status===408||response.status===429||response.status>=500;throw Error('score unavailable');}
        const data=await response.arrayBuffer();if(this.disposed||this.ctx!==c)return;
        transient=false; // A decode failure needs a corrected asset, not repeated downloads.
        const decoded=await c.decodeAudioData(data);if(this.disposed||this.ctx!==c)return;
        // Keep only the current long recording decoded to bound mobile audio memory.
        if(this.scoreKind!==kind)return;
        this.scoreCache.clear();this.scoreCache.set(kind,decoded);this.scoreFailures.delete(kind);
      }catch{
        if(!this.disposed){const attempts=(failure?.attempts||0)+1;this.scoreFailures.set(kind,{transient,attempts,retryAt:c.currentTime+(attempts===1?1:3)});}
      }
    })();
    this.scoreLoads.set(kind,pending);
    pending.finally(()=>{this.scoreLoads.delete(kind);if(!this.disposed)this._syncScore();});
  }

  victoryTheme(kind='normal') {return this._playCelebration(kind,'triumph');}

  selectTrack(index) {
    if(this.scoreKind||!Number.isInteger(index)||index<0||index>=this.playlist.length)return;
    this.trackIndex=(index+this.playlist.length-1)%this.playlist.length;this.nextTrack();
  }

  nextTrack() {
    if (!this.player || this.disposed || this.scoreKind) return;
    this.trackIndex = (this.trackIndex + 1) % this.playlist.length;
    this.player.pause();
    this.player.src = this.currentTrack.src;
    this.recording.gain.cancelScheduledValues(this.ctx.currentTime);
    this.recording.gain.setValueAtTime(0, this.ctx.currentTime);
    this._syncMusic();
  }

  _syncMusic() {
    this._syncScore();this._musicFade();
    if (!this.player || this.disposed) return;
    if(this.scoreKind||this.scoreCelebrating){this.player.pause();return;}
    if (!this.enabled || this.hidden || this.scene === 'paused' || !this.musicVolume) {
      this.player.pause();
      return;
    }
    // unlock() retries playback on a user gesture if the browser denied the first attempt.
    if (this.player.paused && this.ctx.state === 'running') this._playMenu();
    this._musicFade();
  }

  _musicFade() {
    if(!this.ctx)return;
    const c=this.ctx,duck=c.currentTime<this.voiceUntil?.22:c.currentTime<this.duckUntil?.58:1;
    if(this.scoreGain)this.scoreGain.gain.setTargetAtTime(this.scoreKind&&!this.scoreCelebrating?this.musicVolume*2.2*duck:0,c.currentTime,.12);
    if(!this.player||!this.recording)return;
    const time=this.player.currentTime||0,duration=this.player.duration;
    const fadeIn=Math.min(1,time/1.25),fadeOut=Number.isFinite(duration)?Math.min(1,Math.max(0,duration-time)/1.25):1;
    this.recording.gain.setTargetAtTime(this.scoreKind||this.scoreCelebrating?0:this.musicVolume*(this.playlist[this.trackIndex].menuGain??1)*duck*Math.min(fadeIn,fadeOut),c.currentTime,.08);
  }

  _makeBuffers() {
    const c = this.ctx, length = Math.floor(c.sampleRate * 5);
    this.pink = c.createBuffer(1, length, c.sampleRate);
    this.brown = c.createBuffer(1, length, c.sampleRate);
    const p = this.pink.getChannelData(0), b = this.brown.getChannelData(0);
    let slow = 0, fast = 0, deep = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      slow = .97 * slow + .03 * white;
      fast = .7 * fast + .3 * white;
      deep = .995 * deep + .005 * white;
      p[i] = slow * 1.5 + fast * .5 + white * .12;
      b[i] = deep * 5;
    }
    // Several irregular fire takes prevent each small flare from sounding identical.
    this.fires = Array.from({ length: 6 }, () => {
      const buffer = c.createBuffer(1, Math.floor(c.sampleRate * .64), c.sampleRate);
      const a = buffer.getChannelData(0), offset = Math.floor(Math.random() * (length - a.length));
      for (let i = 0; i < a.length; i++) {
        const t = i / c.sampleRate;
        const whoosh = Math.sin(Math.PI * Math.min(1, t / .105)) * .4;
        const fire = Math.min(1, t / .04) * Math.max(0, 1 - t / .64) ** 1.6 * .16;
        a[i] = p[offset + i] * (whoosh + fire);
      }
      for (let j = 0; j < 11; j++) {
        const start = Math.floor((.065 + Math.random() * .52) * c.sampleRate);
        const size = Math.floor((.0015 + Math.random() * .005) * c.sampleRate);
        const strength = (.08 + Math.random() * .12) * (1 - start / a.length * .65);
        for (let i = 0; i < size && start + i < a.length; i++) {
          a[start + i] += (Math.random() * 2 - 1) * strength * (1 - i / size) ** 2;
        }
      }
      return buffer;
    });
  }

  setEnabled(enabled) {
    this.enabled = !!enabled;remember({sound:this.enabled});if(!this.enabled){this.stopVoice();this.stopJingle();}
    this._volume();
    if (this.ctx) this.nextWind = this.ctx.currentTime + .1;
  }

  setScene(scene) {
    if (scene === this.scene) return;
    this.scene = scene;if(scene==='paused'){this.stopVoice();this.stopJingle();}
    if (this.ctx) this.nextWind = this.ctx.currentTime + .1;
    this._volume();
  }

  _volume() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.enabled && !this.hidden ? this.masterVolume : 0, t, .04);
    if(this.voiceOutput){this.voiceOutput.gain.cancelScheduledValues(t);this.voiceOutput.gain.setTargetAtTime(this.enabled&&!this.hidden&&this.scene!=='paused'?this.masterVolume:0,t,.025);}
    this.ambient.gain.cancelScheduledValues(t);
    this.ambient.gain.setTargetAtTime(this.scene === 'paused' ? 0 : .12*this.effectsVolume/.28, t, .18);
    this.effects.gain.cancelScheduledValues(t);
    this.effects.gain.setTargetAtTime(this.scene === 'paused' ? 0 : this.effectsVolume, t, .06);
    this._syncMusic();
  }

  /** Call every frame to maintain soft fades and a barely audible outdoor ambience. */
  update(_dt, _game) {
    const c = this.ctx;
    if (!c || c.state !== 'running' || !this.enabled || this.hidden || this.scene === 'paused') return;
    this._musicFade();this._drainVoice();
    if(this.scoreKind&&!this.scoreSource&&this.scoreFailures.has(this.scoreKind))this._syncScore();
    if(this.jingleGain)this.jingleGain.gain.setTargetAtTime(this.musicVolume*(this.jingleScale||.75)*(c.currentTime<this.voiceUntil?.35:1),c.currentTime,.07);
    this.effects.gain.setTargetAtTime(this.effectsVolume*(c.currentTime<this.voiceUntil?.5:1),c.currentTime,.07);
    const urgent=_game?.bombs?.find(b=>b.t<1.4);
    if(this.scene==='match'&&urgent&&c.currentTime>this.nextFuse){this.play('fuse',{x:urgent.x});this.nextFuse=c.currentTime+(urgent.t<.65?.19:.36);}
    if (c.currentTime >= this.nextWind) {
      this._sound(this.brown, c.currentTime + .01, 4.8, .035, 110, 850, this.ambient, -.25 + Math.random() * .5, 1.4, 2.8);
      this.nextWind = c.currentTime + 3.5;
    }
  }

  _track(source, nodes, t, duration, essential=false) {
    if (this.voices.size >= 40&&!essential) {
      try { source.disconnect(); for (const n of nodes) n.disconnect(); } catch {}
      return false;
    }
    const voice = { source, nodes };
    this.voices.add(voice);
    source.onended = () => {
      this.voices.delete(voice);
      try { source.disconnect(); for (const n of nodes) n.disconnect(); } catch {}
    };
    source.start(t); source.stop(t + duration + .025);
    return true;
  }

  _route(gain, bus, pan) {
    if (this.ctx.createStereoPanner && pan) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      gain.connect(p); p.connect(bus); return [p];
    }
    gain.connect(bus); return [];
  }

  _sound(buffer, t, duration, level, low = 180, high = 4000, bus = this.effects, pan = 0, attack = .003, hold = 0) {
    const c = this.ctx, s = c.createBufferSource(), hp = c.createBiquadFilter(), lp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buffer;
    hp.type = 'highpass'; hp.frequency.value = low; hp.Q.value = .6;
    lp.type = 'lowpass'; lp.frequency.value = high; lp.Q.value = .6;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + Math.min(attack, duration * .4));
    if (hold) g.gain.setValueAtTime(level, t + Math.min(hold, duration * .85));
    g.gain.exponentialRampToValueAtTime(.0001, t + duration);
    s.connect(hp); hp.connect(lp); lp.connect(g);
    this._track(s, [hp, lp, g, ...this._route(g, bus, pan)], t, duration);
  }

  _chime(t, pan = 0, strength = 1) {
    // One short ceramic/glass contact: inharmonic partials, never an arpeggio.
    [[1360, .075, .13], [3277, .017, .075], [5010, .007, .035]].forEach(([f, level, duration]) => {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level * strength, t + .002);
      g.gain.exponentialRampToValueAtTime(.0001, t + duration);
      o.connect(g); this._track(o, [g, ...this._route(g, this.effects, pan)], t, duration);
    });
  }

  celebrationTheme(kind='normal') {return this._playCelebration(kind,'victory');}

  async _playCelebration(kind='normal',phase='victory') {
    if(!['normal','miniboss','final'].includes(kind))kind='normal';
    this.stopJingle();this.scoreCelebrating=true;this._pauseScore();this._musicFade();
    const token=this.jingleToken,id='v12-'+phase+'-'+kind;
    try{
      await this.unlock();
      if(token!==this.jingleToken||!this.enabled||this.hidden||!this.ctx||this.scene==='paused')return;
      let buffer=this.cueCache.get(id);
      if(!buffer){
        const path=phase==='victory'&&kind==='normal'?'assets/cues/victory-normal.mp3':'assets/music-v12/'+phase+'-'+kind+'.mp3';
        const response=await fetch(path);if(!response.ok)return;
        buffer=await this.ctx.decodeAudioData(await response.arrayBuffer());this.cueCache.set(id,buffer);
      }
      if(token!==this.jingleToken||!this.enabled||this.hidden||this.scene==='paused'||this.disposed)return;
      const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;
      this.jingleScale=phase==='victory'&&kind==='normal'?2.8:2.5;gain.gain.value=this.musicVolume*this.jingleScale;
      this.jingleGain=gain;source.connect(gain);gain.connect(this.master);this.jingle=source;
      this.duckUntil=this.ctx.currentTime+buffer.duration;source.start();
      source.onended=()=>{if(this.jingle===source){this.jingle=null;this.jingleGain=null;}source.disconnect();gain.disconnect();};
    }catch{}
  }


  captureCue(t,pan){if(t-this.lastCapture<.13)return true;const index=(this.lastCaptureIndex+1+Math.floor(Math.random()*2))%3,buffer=this.cueCache.get('capture-metal-'+(index+1));if(!buffer)return false;this.lastCapture=t;this.lastCaptureIndex=index;const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;gain.gain.value=.55;source.connect(gain);this._track(source,[gain,...this._route(gain,this.effects,pan)],t,buffer.duration);return true;}
  _metal(t,pan,strength=.4){const c=this.ctx;for(const [i,f] of [840,1397,2213].entries()){const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.10*strength/(i+1),t);g.gain.exponentialRampToValueAtTime(.0001,t+.11+i*.02);o.connect(g);this._track(o,[g,...this._route(g,this.effects,pan)],t,.18);}this._sound(this.pink,t,.035,.07*strength,900,4600,this.effects,pan);}
  play(name, data = {}) {
    const c = this.ctx;
    if (!c || c.state !== 'running' || !this.enabled || this.hidden || this.scene === 'paused') return;
    const t = c.currentTime + .003;
    const pan = Number.isFinite(data.pan) ? data.pan : Number.isFinite(data.x) ? Math.max(-.8, Math.min(.8, (data.x - 7) / 8)) : 0;
    switch (name) {
      case 'place':
        this._sound(this.pink, t, .065, .24, 280, 1800, this.effects, pan);
        this._sound(this.brown, t + .012, .04, .14, 160, 800, this.effects, pan);
        break;
      case 'fuse': this._metal(t,pan,.055);break;
      case 'legacyFuse':
        this._sound(this.fires[Math.floor(Math.random() * this.fires.length)], t, .09, .16, 1700, 4800, this.effects, pan);
        break;
      case 'boom': { if(!this.captureCue(t,pan)){this._metal(t,pan,.4);this._metal(t+.045,pan,.2);}break;}
      case 'legacyBoom': {
        const strength = t - this.lastBoom < .075 ? .45 : 1;
        this.lastBoom = t;
        // Soft 100ms ignition followed by 600ms of crackling flame; no detonation.
        this._sound(this.fires[Math.floor(Math.random() * this.fires.length)], t, .64,  .82 * strength, 280, 4900, this.effects, pan, .006, .5);
        break;
      }
      case 'shield': this._chime(t,pan,.65);this._chime(t+.065,-pan,.25);break;
      case 'comicHit': {
        if(this.captureCue(t,pan))break;
        const o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(210,t);o.frequency.exponentialRampToValueAtTime(75,t+.11);o.frequency.exponentialRampToValueAtTime(145,t+.23);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.connect(g);this._track(o,[g,...this._route(g,this.effects,pan)],t,.32);break;
      }
      case 'cheer':
        this._chime(t,pan,.22);break;
      case 'hit':
        this.duckUntil=t+.8;
        this._sound(this.brown, t, .09, .38, 140, 1200, this.effects, pan);
        this._sound(this.pink, t, .045, .16, 550, 2300, this.effects, pan);
        break;
      case 'power': this._chime(t, pan, .7); break;
      case 'throw':
        this._sound(this.pink, t, .16, .16, 600, 3400, this.effects, pan, .035);
        break;
      case 'countdown':
        this._sound(this.pink, t, .04, data.value === 0 || data.value === 'go' ? .22 : .13, 750, 2600, this.effects, 0);
        break;
      case 'win':
        for(let i=0;i<7;i++)this._sound(this.pink,t+i*.075,.055,.11,900,3200,this.effects,i%2?.35:-.35);
        this._chime(t, 0, .5);
        this._sound(this.pink, t + .025, .27, .055, 1700, 4000, this.effects, 0, .06);
        break;
      case 'draw':
        this._sound(this.pink, t, .12, .12, 500, 1900, this.effects, 0, .018);
        break;
      case 'step':
        if (t - this.lastStep < .16) return;
        this.lastStep = t;
        this._sound(this.pink, t, .045, .075, 330, 1700, this.effects, pan);
        break;
    }
  }

  pickVoice(candidate,event='hit',opponentId=null) {
    const characterId=typeof candidate==='number'?['lula','flavio'][candidate]:candidate;
    if(!characterId)return null;
    const clips=this.voiceClips.filter(c=>{const events=c.events||[c.event];return c.status==='approved'&&(c.characterId||['lula','flavio'][c.candidate])===characterId&&events.includes(event)&&(!events.includes('win')||(event==='win'&&events.length===1))&&(!c.allowedOpponentIds||c.allowedOpponentIds.includes(opponentId));});
    if(!clips.length)return null;
    const key=characterId+':'+event, fingerprint=clips.map(c=>c.id).sort().join('|');
    let bag=this.voiceBags.get(key);
    // A complete shuffled cycle prevents a frequently selected line from crowding out the others.
    if(!bag||bag.fingerprint!==fingerprint||!bag.ids.length){
      const ids=clips.map(c=>c.id);
      for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
      const last=this.voiceHistory.get(key);
      if(ids.length>1&&ids[0]===last){const j=1+Math.floor(Math.random()*(ids.length-1));[ids[0],ids[j]]=[ids[j],ids[0]];}
      bag={fingerprint,ids};this.voiceBags.set(key,bag);
    }
    const id=bag.ids.shift();this.voiceHistory.set(key,id);
    return clips.find(c=>c.id===id)||null;
  }
  setVoiceVolume(value){if(!Number.isFinite(value))return;this.voiceVolume=Math.max(0,Math.min(1,value));remember({voice:this.voiceVolume});if(this.voiceBus)this.voiceBus.gain.setTargetAtTime(this.voiceVolume,this.ctx.currentTime,.04);if(!this.voiceVolume)this.stopVoice();}
  stopVoice(preserveCadence=false){this.voiceToken++;if(this.voiceSource){try{if(this.voiceGain&&this.ctx){this.voiceGain.gain.setTargetAtTime(.0001,this.ctx.currentTime,.008);this.voiceSource.stop(this.ctx.currentTime+.035);}else this.voiceSource.stop();}catch{}this.voiceSource=null;}this.voiceUntil=0;
    if(!preserveCadence){this.lastVoiceAt=-10;this.voicePriority=0;this.lastVoiceCharacter=null;for(const pending of this.voiceQueue||[])pending.resolve(false);this.voiceQueue=[];}
  }
  _drainVoice(){
    const queue=this.voiceQueue;if(!queue?.length||!this.ctx)return;
    const now=this.ctx.currentTime;
    while(queue.length&&(now>queue[0].expires||!this._voiceAllowed(queue[0].options))){queue.shift().resolve(false);}
    if(queue.length&&now>=Math.max(this.voiceUntil,this.lastVoiceAt+2.8)){
      const next=queue.shift();this.playVoice(next.clip,next.preview,next.priority,next.options).then(next.resolve);
    }
  }
  _voiceAllowed(options={}){try{return !this.disposed&&this.enabled&&!!this.voiceVolume&&!this.hidden&&this.scene!=='paused'&&options.shouldPlay?.()!==false;}catch{return false;}}
  _loadVoice(clip){
    if(this.voiceCache.has(clip.id))return Promise.resolve(this.voiceCache.get(clip.id));
    if(this.voiceLoads.has(clip.id))return this.voiceLoads.get(clip.id);
    const ctx=this.ctx,pending=(async()=>{const response=await fetch(clip.file);if(!response.ok)throw Error('Voice unavailable');const buffer=await ctx.decodeAudioData(await response.arrayBuffer());if(!this.disposed&&this.ctx===ctx)this.voiceCache.set(clip.id,buffer);return buffer;})();
    this.voiceLoads.set(clip.id,pending);pending.then(()=>this.voiceLoads.delete(clip.id),()=>this.voiceLoads.delete(clip.id));return pending;
  }
  async playVoice(clip,preview=false,priority=1,options={}){if(!clip||!this._voiceAllowed(options))return false;
    const character=clip.characterId??clip.candidate;
    if(!preview&&this.ctx&&this.ctx.currentTime<Math.max(this.voiceUntil,this.lastVoiceAt+2.8)&&priority<=this.voicePriority){
      if(priority<this.voicePriority||character===this.lastVoiceCharacter)return false;
      return new Promise(resolve=>{if(this.voiceQueue.length>=2)this.voiceQueue.shift().resolve(false);const now=this.ctx.currentTime;this.voiceQueue.push({clip,preview,priority,options,resolve,expires:Math.min(now+12,Math.max(now+4,this.voiceUntil+1))});});
    }
    const previous={priority:this.voicePriority,at:this.lastVoiceAt,character:this.lastVoiceCharacter};this.stopVoice(priority<=1);this.voicePriority=priority;this.lastVoiceAt=this.ctx?.currentTime||0;this.lastVoiceCharacter=character;
    const token=this.voiceToken,abort=()=>{if(token===this.voiceToken){this.voicePriority=previous.priority;this.lastVoiceAt=previous.at;this.lastVoiceCharacter=previous.character;}return false;};await this.unlock();if(!this.ctx||this.ctx.state!=='running'||!this._voiceAllowed(options))return abort();
    try{const buffer=await this._loadVoice(clip);if(token!==this.voiceToken)return false;if(!this._voiceAllowed(options))return abort();
      const source=this.ctx.createBufferSource();source.buffer=buffer;const gain=this.ctx.createGain();gain.gain.value=1;source.connect(gain);gain.connect(this.voiceBus);this.voiceSource=source;this.voiceGain=gain;source.addEventListener('ended',()=>{if(this.voiceSource===source)this.voiceSource=null;});const begin=this.ctx.currentTime;this.lastVoiceAt=begin;this.voiceUntil=begin+buffer.duration+.2;const started=this._track(source,[gain],begin,buffer.duration,true);if(started){try{options.onStart?.(clip,{begin,duration:buffer.duration});}catch{}}return started;
    }catch{return abort();}
  }

  dispose() {this.stopJingle();this.stopVoice();this._pauseScore();this.scoreToken++;
    this.disposed = true;
    if (this.player) {
      this.player.pause();
      this.player.removeAttribute('src');
      this.player.load();
      this.player = null;
    }
    if (this.mediaSource) this.mediaSource.disconnect();
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this._onVisibility);
    if(typeof window!=='undefined'){window.removeEventListener('pageshow',this._onPageShow);window.removeEventListener('online',this._onOnline);}
    for (const v of this.voices) { try { v.source.stop(); } catch {} }
    this.voices.clear();
    if (this.ctx){this.ctx.removeEventListener?.('statechange',this._onAudioState);this.ctx.close().catch(() => {});}
    this.ctx = null;this.scoreCache.clear();this.scoreLoads.clear();
  }
}
