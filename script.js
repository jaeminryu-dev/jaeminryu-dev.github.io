"use strict";
(() => {
  const themeToggle = document.querySelector(".theme-toggle");
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    if (themeToggle) {
      const light = theme === "light";
      themeToggle.classList.toggle("is-light", light);
      themeToggle.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
      themeToggle.setAttribute("aria-pressed", String(light));
    }
  };
  let savedTheme = "dark";
  try { savedTheme = localStorage.getItem("site-theme") || "dark"; } catch (_) {}
  applyTheme(savedTheme);
  if (themeToggle) themeToggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
    try { localStorage.setItem("site-theme", nextTheme); } catch (_) {}
  });
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#primary-navigation");
  if (header && menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const open = header.classList.toggle("menu-open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
      header.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
    }));
  }
  const summary = document.querySelector(".hero-summary");
  if (summary) {
    const text = summary.dataset.text || summary.textContent.trim();
    summary.textContent = "";
    let index = 0;
    const typeSummary = () => {
      summary.textContent = text.slice(0, index);
      index += 1;
      if (index <= text.length) window.setTimeout(typeSummary, 32);
    };
    window.setTimeout(typeSummary, 450);
  }
  const revealSections = document.querySelectorAll("main > section:not(.hero)");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    revealSections.forEach((section) => section.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: .15, rootMargin: "0px 0px -8%" });
    revealSections.forEach((section) => {
      section.classList.add("scroll-reveal");
      revealObserver.observe(section);
    });
  }
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
  function reset() { clearInterval(timer); timer = null; live = false; paused = false; ended = false; points = 0; snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}]; dir = {x:1,y:0}; next = {x:1,y:0}; enemies = []; enemies = Array.from({length:1}, enemy); fruit(); hud("Ready"); draw(); }
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





// Lightweight offline dino runner
(() => {
  const c = document.querySelector("#dino-board");
  if (!c) return;
  const x = c.getContext("2d"), width = c.width, ground = 178;
  const scoreEl = document.querySelector("#dino-score"), bestEl = document.querySelector("#dino-best"), statusEl = document.querySelector("#dino-status");
  const start = document.querySelector("#dino-start"), pause = document.querySelector("#dino-pause"), restart = document.querySelector("#dino-restart"), jumpButton = document.querySelector("#dino-jump");
  const storage = { get() { try { return Number(localStorage.getItem("dino-best") || 0); } catch (_) { return 0; } }, set(value) { try { localStorage.setItem("dino-best", value); } catch (_) {} } };
  const dino = { x: 58, y: ground - 42, w: 30, h: 42, vy: 0, duck: false };
  let timer = null, running = false, paused = false, ended = false, score = 0, best = storage.get(), speed = 6, spawn = 55, obstacles = [];
  const hud = (state) => { scoreEl.textContent = Math.floor(score); bestEl.textContent = best; statusEl.textContent = state; };
  const reset = () => { clearInterval(timer); timer = null; running = false; paused = false; ended = false; score = 0; speed = 6; spawn = 55; obstacles = []; dino.y = ground - dino.h; dino.vy = 0; dino.duck = false; hud("Ready"); draw(); };
  const jump = () => { if (ended) reset(); if (!running) begin(); if (dino.y >= ground - dino.h - .5) dino.vy = -13; };
  const begin = () => { if (running) return; if (ended) reset(); running = true; paused = false; hud("Running"); if (!timer) timer = setInterval(tick, 30); };
  const toggle = () => { if (!running || ended) return; paused = !paused; hud(paused ? "Paused" : "Running"); };
  const over = () => { running = false; ended = true; clearInterval(timer); timer = null; if (Math.floor(score) > best) { best = Math.floor(score); storage.set(best); } hud("Game over"); draw(); };
  const hit = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  const addObstacle = () => { const h = 24 + Math.floor(Math.random()*24), w = 13 + Math.floor(Math.random()*13); obstacles.push({x: width + 8, y: ground-h, w, h}); spawn = 65 + Math.floor(Math.random()*65); };
  function tick() {
    if (!running || paused) return;
    dino.vy += .78; dino.y += dino.vy; if (dino.y > ground-dino.h) { dino.y = ground-dino.h; dino.vy = 0; }
    if (--spawn <= 0) addObstacle(); obstacles.forEach((o) => { o.x -= speed; }); obstacles = obstacles.filter((o) => o.x + o.w > 0);
    const box = {x:dino.x+4, y:dino.y+(dino.duck?12:3), w:dino.w-8, h:dino.duck?dino.h-12:dino.h-5}; if (obstacles.some((o) => hit(box,o))) return over();
    score += .12; speed = Math.min(11, 6 + score/180); if (Math.floor(score) > best) { best=Math.floor(score); storage.set(best); } hud("Running"); draw();
  }
  const block = (px,py,w,h,color) => { x.fillStyle=color; x.fillRect(px,py,w,h); };
  function draw() {
    x.clearRect(0,0,width,c.height); x.fillStyle="#0d1a2d"; x.fillRect(0,0,width,c.height); x.strokeStyle="#315477"; x.setLineDash([5,5]); x.beginPath(); x.moveTo(0,ground+1); x.lineTo(width,ground+1); x.stroke(); x.setLineDash([]);
    const bodyHeight = dino.duck ? 28 : dino.h; block(dino.x,dino.y+(dino.duck?14:0),dino.w,bodyHeight,"#6ee7b7"); block(dino.x+dino.w-3,dino.y+(dino.duck?14:0),12,12,"#2ea879"); block(dino.x+19,dino.y+(dino.duck?17:3),3,3,"#08111f");
    obstacles.forEach((o) => { block(o.x,o.y,o.w,o.h,"#e35d6a"); block(o.x+Math.floor(o.w/2)-2,o.y-8,4,9,"#e35d6a"); });
    x.fillStyle="#8da2bc"; x.font="12px ui-monospace, monospace"; x.fillText("RUN", 12, 22);
  }
  document.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); jump(); } if (e.key === "ArrowDown") { e.preventDefault(); dino.duck = true; } if (e.key === "p") toggle(); });
  document.addEventListener("keyup", (e) => { if (e.key === "ArrowDown") dino.duck = false; });
  c.addEventListener("pointerdown", (e) => { e.preventDefault(); jump(); });
  jumpButton.addEventListener("click", jump); start.addEventListener("click", begin); pause.addEventListener("click", toggle); restart.addEventListener("click", () => { reset(); begin(); }); reset();
})();
