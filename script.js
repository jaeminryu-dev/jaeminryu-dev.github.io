"use strict";
(() => {
  const c = document.querySelector("#game-board");
  if (!c) return;
  const x = c.getContext("2d"), n = 21, u = c.width / n;
  const score = document.querySelector("#score"), bestEl = document.querySelector("#high-score"), stateEl = document.querySelector("#game-status");
  const start = document.querySelector("#start-game"), pause = document.querySelector("#pause-game"), restart = document.querySelector("#restart-game");
  const storage = {
    getBest() { try { return Number(localStorage.getItem("snake-best") || 0); } catch (_) { return 0; } },
    setBest(value) { try { localStorage.setItem("snake-best", value); } catch (_) {} }
  };
  let timer, live = false, paused = false, ended = false, points = 0, best = storage.getBest(), snake, dir, next, food, enemies;
  const cell = () => ({x: Math.floor(Math.random() * n), y: Math.floor(Math.random() * n)});
  const same = (a,b) => a.x === b.x && a.y === b.y;
  const hud = (s) => { score.textContent = points; bestEl.textContent = best; stateEl.textContent = s; };
  const used = (p) => snake.some((z) => same(z,p)) || enemies.some((z) => same(z,p));
  function fruit() { let p = cell(); while (used(p)) p = cell(); food = {...p, rotten: Math.random() < .18}; }
  function enemy() { let p = cell(); while (used(p) || (Math.abs(p.x-10)<5 && Math.abs(p.y-10)<5)) p = cell(); return {...p, dx: Math.random()<.5?1:-1, dy:0, born:Date.now(), exploding:false, exploded:0}; }
  function reset() { clearInterval(timer); timer = null; live = false; paused = false; ended = false; points = 0; snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}]; dir = {x:1,y:0}; next = {x:1,y:0}; enemies = []; enemies = Array.from({length:5}, enemy); fruit(); hud("Ready"); draw(); }
  function turn(v) { if (v && !(v.x === -dir.x && v.y === -dir.y)) next = v; }
  function begin() { if (live) return; if (ended) reset(); live = true; paused = false; hud("Playing"); if (!timer) timer = setInterval(tick,140); }
  function toggle() { if (!live || ended) return; paused = !paused; hud(paused ? "Paused" : "Playing"); }
  function over() { live = false; ended = true; clearInterval(timer); timer = null; if (points > best) { best = points; storage.setBest(best); } hud("Game over"); draw(); }
  function moveEnemies(now) {
    enemies.forEach((e) => {
      if (e.exploding) { if (now-e.exploded >= 2000) Object.assign(e, enemy()); return; }
      if (now-e.born >= 5000) { e.exploding = true; e.exploded = now; return; }
      if (Math.random() < .12) { const h = Math.random() < .5; e.dx = h ? (Math.random()<.5?-1:1) : 0; e.dy = h ? 0 : (Math.random()<.5?-1:1); }
      const nx=e.x+e.dx, ny=e.y+e.dy;
      if (nx<0 || nx>=n) e.dx *= -1; else if (ny<0 || ny>=n) e.dy *= -1; else { e.x=nx; e.y=ny; }
    });
  }
  function tick() {
    if (!live || paused) return;
    dir = next; const head = {x:snake[0].x+dir.x,y:snake[0].y+dir.y}, now=Date.now(); moveEnemies(now);
    if (head.x<0 || head.x>=n || head.y<0 || head.y>=n || snake.some((z)=>same(z,head))) return over();
    snake.unshift(head);
    if (same(head,food)) { if (food.rotten) { snake.splice(Math.max(1,snake.length-2)); points=Math.max(0,points-5); } else points+=10; fruit(); } else snake.pop();
    if (enemies.some((e)=>e.exploding && Math.abs(e.x-head.x)<=1 && Math.abs(e.y-head.y)<=1)) return over();
    if (points > best) { best=points; storage.setBest(best); } hud("Playing"); draw();
  }
  function block(px,py,color) { x.fillStyle=color; x.fillRect(px*u+2,py*u+2,u-4,u-4); }
  function draw() {
    x.fillStyle="#050b14"; x.fillRect(0,0,c.width,c.height); x.strokeStyle="rgba(49,84,119,.18)";
    for (let i=0;i<=n;i+=1) { x.beginPath(); x.moveTo(i*u,0); x.lineTo(i*u,c.height); x.stroke(); x.beginPath(); x.moveTo(0,i*u); x.lineTo(c.width,i*u); x.stroke(); }
    block(food.x,food.y,food.rotten?"#b86b77":"#f8d477");
    enemies.forEach((e)=>{ if(e.exploding){x.fillStyle="rgba(248,139,74,.7)";x.beginPath();x.arc(e.x*u+u/2,e.y*u+u/2,u*1.4,0,Math.PI*2);x.fill();}else block(e.x,e.y,"#f08a5d");});
    snake.forEach((z,i)=>block(z.x,z.y,i?"#2ea879":"#6ee7b7"));
  }
  const keys={ArrowUp:{x:0,y:-1},w:{x:0,y:-1},ArrowDown:{x:0,y:1},s:{x:0,y:1},ArrowLeft:{x:-1,y:0},a:{x:-1,y:0},ArrowRight:{x:1,y:0},d:{x:1,y:0}};
  document.addEventListener("keydown",(e)=>{if(keys[e.key]){e.preventDefault();turn(keys[e.key]);}if(e.key===" "){e.preventDefault();toggle();}});
  document.querySelectorAll("[data-direction]").forEach((b)=>b.addEventListener("pointerdown",(e)=>{e.preventDefault();turn({up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}}[b.dataset.direction]);}));
  start.addEventListener("click",begin); pause.addEventListener("click",toggle); restart.addEventListener("click",()=>{reset();begin();}); reset();
})();
