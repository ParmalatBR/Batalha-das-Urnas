import {DEFAULT_DIFFICULTY,DIFFICULTY_IDS,normalizeDifficulty} from './difficulty.js';
const key='urna-preferences-v5';
const defaults={series:3,music:.045,effects:.28,voice:.65,celebrations:true,sound:true,focus:false,reduced:false,light:'day',difficulty:DEFAULT_DIFFICULTY,duration:120,quality:'high'};
let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
export const preferences={...defaults};
for(const k of ['sound','focus','reduced','celebrations'])if(typeof saved[k]==='boolean')preferences[k]=saved[k];
for(const k of ['music','effects','voice'])if(Number.isFinite(saved[k]))preferences[k]=Math.max(0,Math.min(1,saved[k]));
for(const [k,values] of Object.entries({light:['day','dusk'],difficulty:DIFFICULTY_IDS,series:[0,3,5],duration:[90,120,180],quality:['high','light']}))if(values.includes(saved[k]))preferences[k]=saved[k];
const listeners=new Set();
export function onPreferencesChanged(fn){listeners.add(fn);return ()=>listeners.delete(fn);}
export function remember(patch){Object.assign(preferences,patch);preferences.difficulty=normalizeDifficulty(preferences.difficulty);try{localStorage.setItem(key,JSON.stringify(preferences));for(const fn of listeners){try{fn();}catch{}}}catch{}}
