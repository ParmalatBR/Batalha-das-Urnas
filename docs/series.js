export class DuelSeries {
 constructor(format=3){this.format=[0,3,5].includes(format)?format:3;this.target=this.format?Math.floor(this.format/2)+1:0;this.scores=[0,0];this.rounds=0;this.complete=false;this.winner=null;}
 record(winner){if(this.complete||![null,0,1].includes(winner))return false;this.rounds++;if(winner!==null){this.scores[winner]++;if(this.target&&this.scores[winner]>=this.target){this.complete=true;this.winner=winner;}}return this.complete;}
}
const historyKey='urna-duels-v8';
export function cleanHistory(value){if(!Array.isArray(value))return [];return value.filter(r=>r&&[0,1].includes(r.winner)&&[3,5].includes(r.format)&&[0,1,2,3].includes(r.stage)&&Array.isArray(r.scores)&&r.scores.length===2&&r.scores.every(n=>Number.isInteger(n)&&n>=0&&n<=3)&&r.scores[r.winner]===Math.floor(r.format/2)+1&&r.scores[1-r.winner]<r.scores[r.winner]&&typeof r.date==='string'&&Number.isFinite(Date.parse(r.date))&&['solo','duo'].includes(r.mode)).slice(0,8);}
export function readHistory(){try{return cleanHistory(JSON.parse(localStorage.getItem(historyKey)||'[]'));}catch{return [];}}
export function saveDuel(series,stage,mode){if(!series.complete)return false;const record={winner:series.winner,scores:[...series.scores],format:series.format,rounds:series.rounds,stage,mode,date:new Date().toISOString()};try{const text=JSON.stringify([record,...readHistory()].slice(0,8));localStorage.setItem(historyKey,text);return localStorage.getItem(historyKey)===text;}catch{return false;}}
