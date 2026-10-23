// Real SQLite SQL/constraints/transactions; NOT a Cloudflare D1 emulator.
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
export function database(path=':memory:'){
 const db=new DatabaseSync(path);db.exec(readFileSync(new URL('../migrations/0001_accounts.sql',import.meta.url),'utf8'));
 return {
  sql:db,
  prepare(sql){return {sql,args:[],bind(...args){this.args=args;return this;},
   async first(){return db.prepare(sql).get(...this.args)||null;},
   async all(){return {results:db.prepare(sql).all(...this.args)};},
   async run(){const r=db.prepare(sql).run(...this.args);return {success:true,meta:{changes:Number(r.changes)}};}};},
  async batch(statements){db.exec('BEGIN IMMEDIATE');try{const out=[];for(const s of statements){const r=db.prepare(s.sql).run(...s.args);out.push({success:true,meta:{changes:Number(r.changes)}});}db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}
 };
}
