/* ==========================================================
   장난감 공부방 - script.js
   섹션 구성
   1) 캐릭터 데이터
   2) 전역 상태
   3) 유틸(글자수/시간/ID/달 키)
   4) DOM 참조
   5) 화면 상태 관리
   6) 이름 입력
   7) 캐릭터 렌더 & 발바닥 이름 배치
   8) 타이머
   9) 마우스/터치 감지
   10) 캐릭터 행동 AI
   11) 캐릭터 선택
   12) 월간 기록
   13) HOME / FINISH
   14) 초기화 & 메인 루프
   ========================================================== */


/* ==========================================================
   1) 캐릭터 데이터
   - name : 발바닥 이름 표시 위치/회전은 사진 기준으로 캐릭터마다 개별 지정
   - nameTop / nameLeft : 캐릭터 박스 기준 % (발바닥 소[sole] 부분)
   - nameRot : 발바닥 각도에 맞춘 회전(도)
   - nameScale : 이름 글자 크기 배율
   - 행동 파라미터 : speed(px/s), pauseChance, lookTilt, leanDeg, restMin/Max(ms)
   ========================================================== */
const CHARACTERS = [
  {
    id:"mickey", name:"미키", image:"mickey.png",
    nameTop:88, nameLeft:35, nameRot:2,  nameScale:0.9,  nameColor:"#3a2a1c",
    speed:26, pauseChance:0.35, lookTilt:4, leanDeg:2, restMin:1200, restMax:2600
  },
  {
    id:"pooh", name:"곰돌이 푸", image:"pooh.png",
    nameTop:86, nameLeft:39, nameRot:0,  nameScale:0.8,  nameColor:"#4a3527",
    speed:18, pauseChance:0.5,  lookTilt:3, leanDeg:2, restMin:1600, restMax:3200
  },
  {
    id:"felix", name:"펠릭스", image:"felix.png",
    nameTop:82, nameLeft:40, nameRot:0,  nameScale:0.8,  nameColor:"#ffffff",
    speed:40, pauseChance:0.22, lookTilt:5, leanDeg:3, restMin:800,  restMax:1800
  },
  {
    id:"sherlock", name:"셜록", image:"sherlock.png",
    nameTop:85, nameLeft:31, nameRot:-8, nameScale:0.78, nameColor:"#fff2dd",
    speed:28, pauseChance:0.4,  lookTilt:6, leanDeg:2, restMin:1600, restMax:3400
  },
  {
    id:"alice", name:"앨리스", image:"alice.png",
    nameTop:85, nameLeft:39, nameRot:-4, nameScale:0.78, nameColor:"#fff2dd",
    speed:22, pauseChance:0.42, lookTilt:4, leanDeg:2, restMin:1400, restMax:3000
  },
  {
    id:"pinocchio", name:"피노키오", image:"pinocchio.png",
    nameTop:88, nameLeft:40, nameRot:0,  nameScale:0.78, nameColor:"#ffffff",
    speed:30, pauseChance:0.3,  lookTilt:5, leanDeg:5, restMin:900,  restMax:2000
  },
  {
    id:"scarecrow", name:"허수아비", image:"scarecrow.png",
    nameTop:88, nameLeft:40, nameRot:0,  nameScale:0.8,  nameColor:"#3a2a1c",
    speed:16, pauseChance:0.45, lookTilt:6, leanDeg:6, restMin:1500, restMax:3200
  },
  {
    id:"dracula", name:"드라큘라", image:"dracula.png",
    nameTop:86, nameLeft:40, nameRot:-3, nameScale:0.78, nameColor:"#ffffff",
    speed:20, pauseChance:0.4,  lookTilt:3, leanDeg:2, restMin:1600, restMax:3400
  }
];
const getChar = id => CHARACTERS.find(c => c.id === id) || CHARACTERS[0];


/* ==========================================================
   2) 전역 상태
   ========================================================== */
const state = {
  screen: "name",          // "name" | "study" | "result"
  studyState: "idle",      // "idle" | "studying" | "paused"
  watching: false,         // 사용자가 화면을 보고 있는가(마우스 움직임)
  selectorOpen: false,

  user: { id: null, name: "" },
  currentCharId: CHARACTERS[0].id,

  elapsedMs: 0,            // 이번 세션 누적 공부 시간
};

// 행동 AI 내부 상태
const beh = {
  x:0, y:0, rot:0,          // 현재 위치(좌상단 px)·회전
  tx:0, ty:0, trot:0,       // 목표
  phase:"pause",            // "walk" | "pause"
  phaseEndsAt:0,
  moveSpeed:20,
  mode:"home"               // "home"(제자리 복귀) | "living"(살아 움직임)
};

// 화면/캐릭터 크기 정보
const layout = { roomW:0, roomH:0, cw:0, ch:0, aspect:1.15, home:{x:0,y:0}, bounds:{minX:0,maxX:0,minY:0,maxY:0} };

const IDLE_RESUME_MS = 10000;  // 10초 동안 마우스가 멈추면 다시 살아 움직임(시작 직후에도 동일)
let idleTimer = null;


/* ==========================================================
   3) 유틸
   ========================================================== */
// 사용자 인식 문자(grapheme) 수 세기 — 유니코드 대응
const seg = (typeof Intl !== "undefined" && Intl.Segmenter)
  ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
  : null;

function graphemes(str){
  if (seg) return Array.from(seg.segment(str), s => s.segment);
  return Array.from(str); // 폴백: 코드포인트 단위
}
function graphemeCount(str){ return graphemes(str).length; }
function truncateGraphemes(str, max){ return graphemes(str).slice(0, max).join(""); }

function formatTime(ms){
  const t = Math.floor(ms / 1000);
  const h = String(Math.floor(t / 3600)).padStart(2, "0");
  const m = String(Math.floor((t % 3600) / 60)).padStart(2, "0");
  const s = String(t % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}
function uid(){ return "u_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); }
function monthKey(d = new Date()){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function rand(a, b){ return a + Math.random() * (b - a); }


/* ==========================================================
   4) DOM 참조
   ========================================================== */
const el = {
  room:        document.getElementById("room"),
  topbar:      document.getElementById("topbar"),
  timer:       document.getElementById("timer"),
  statusChip:  document.getElementById("statusChip"),
  homeBtn:     document.getElementById("homeBtn"),
  finishBtn:   document.getElementById("finishBtn"),

  character:   document.getElementById("character"),
  charImg:     document.getElementById("charImg"),
  charFallback:document.getElementById("charFallback"),
  footName:    document.getElementById("footName"),

  nameScreen:  document.getElementById("nameScreen"),
  nameInput:   document.getElementById("nameInput"),
  nameHint:    document.getElementById("nameHint"),
  startBtn:    document.getElementById("startBtn"),

  selectScreen:document.getElementById("selectScreen"),
  charGrid:    document.getElementById("charGrid"),
  closeSelect: document.getElementById("closeSelect"),

  resultScreen:document.getElementById("resultScreen"),
  resultImg:   document.getElementById("resultImg"),
  resultName:  document.getElementById("resultName"),
  resultTime:  document.getElementById("resultTime"),
  rankingList: document.getElementById("rankingList"),
  againBtn:    document.getElementById("againBtn"),
};


/* ==========================================================
   5) 화면 상태 관리
   ========================================================== */
function showScreen(name){
  state.screen = name;
  el.nameScreen.hidden   = name !== "name";
  el.resultScreen.hidden = name !== "result";
  el.topbar.hidden       = name !== "study";
  el.statusChip.hidden   = name !== "study";
  el.character.hidden     = name === "name"; // 결과에서는 굳이 숨기지 않아도 되지만 이름화면에선 숨김
  if (name === "result") el.character.hidden = true;
}


/* ==========================================================
   6) 이름 입력
   ========================================================== */
function updateNameState(){
  // 5글자 초과 입력 즉시 자름
  const raw = el.nameInput.value;
  const cut = truncateGraphemes(raw, 5);
  if (cut !== raw) el.nameInput.value = cut;

  const n = graphemeCount(cut.trim());
  el.startBtn.disabled = n < 1;
  el.nameHint.textContent = `한국어·영어·중국어·아랍어 등 모두 가능 · ${n}/5`;
}

function startSession(){
  const name = el.nameInput.value.trim();
  if (graphemeCount(name) < 1) return;

  // 시작할 때마다 새로운 고유 ID 부여(홈으로 나갔다 오면 새 방문 기록으로 집계됨)
  state.user.id = uid();
  state.user.name = name;

  state.elapsedMs = 0;
  showScreen("study");
  renderCharacter();
  resetToHome(true);        // 처음엔 제자리에 앉힌 상태로 시작
  setWatching(true);        // 시작 직후엔 보고 있는 상태 → 잠시 뒤 살아 움직임
}


/* ==========================================================
   7) 캐릭터 렌더 & 발바닥 이름 배치
   ========================================================== */
function renderCharacter(){
  const c = getChar(state.currentCharId);

  el.charImg.src = c.image;
  el.charImg.alt = c.name;
  el.charFallback.hidden = true;
  el.charImg.style.display = "block";

  // 이미지 없을 때 자리표시(원)로 대체 — 구조 확인용
  el.charImg.onerror = () => {
    el.charImg.style.display = "none";
    el.charFallback.hidden = false;
    el.charFallback.textContent = c.name;
    layout.aspect = 1.15;
    recomputeLayout();
  };
  el.charImg.onload = () => {
    layout.aspect = el.charImg.naturalHeight / el.charImg.naturalWidth || 1.15;
    recomputeLayout();
    placeFootName();
  };

  placeFootName();
}

function hexLum(hex){
  const h = hex.replace("#", "");
  const r = parseInt(h.substr(0,2),16), g = parseInt(h.substr(2,2),16), b = parseInt(h.substr(4,2),16);
  return (0.299*r + 0.587*g + 0.114*b) / 255; // 0(어두움)~1(밝음)
}

function placeFootName(){
  const c = getChar(state.currentCharId);
  el.footName.textContent = state.user.name;
  el.footName.style.top    = c.nameTop + "%";
  el.footName.style.left   = c.nameLeft + "%";
  const fontPx = Math.max(9, layout.cw * 0.11 * c.nameScale);
  el.footName.style.fontSize = fontPx + "px";
  el.footName.style.transform = `translate(-50%,-50%) rotate(${c.nameRot}deg)`;

  // 밑창 색과 대비되는 글자색 + 반대색 얇은 테두리(가독성)
  el.footName.style.color = c.nameColor;
  const light = hexLum(c.nameColor) > 0.6;
  el.footName.style.textShadow = light
    ? "0 1px 2px rgba(0,0,0,.6), 0 0 1px rgba(0,0,0,.55)"   // 밝은 글자 → 어두운 테두리
    : "0 1px 0 rgba(255,255,255,.65), 0 0 2px rgba(255,255,255,.45)"; // 어두운 글자 → 밝은 테두리
}


/* ==========================================================
   8) 타이머
   - studyState === "studying" 일 때만 누적
   ========================================================== */
function updateTimerDisplay(){
  el.timer.textContent = formatTime(state.elapsedMs);
}
function setStudyState(s){
  state.studyState = s;
  if (state.screen !== "study") return;
  const studying = s === "studying";
  el.statusChip.textContent = studying ? "공부 중" : "보는 중";
  el.statusChip.classList.toggle("watching", !studying);
}


/* ==========================================================
   9) 마우스/터치 감지
   - 움직이면 즉시 정지 + 제자리 복귀 + 타이머 일시정지
   - 일정 시간 멈추면 다시 살아 움직임 + 타이머 재개
   ========================================================== */
function setWatching(on){
  state.watching = on;
  if (on){
    // 보는 중: 타이머 멈춤, 캐릭터 제자리로
    if (state.screen === "study") setStudyState("paused");
    beh.mode = "home";
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => setWatching(false), IDLE_RESUME_MS);
  } else {
    // 다시 공부: 선택창/화면 조건이 맞을 때만 재개
    if (state.screen === "study" && !state.selectorOpen){
      setStudyState("studying");
      beh.mode = "living";
      beh.phase = "pause";                 // 깨어나는 듯 잠깐 멈췄다 시작(WAKING)
      beh.trot  = getChar(state.currentCharId).lookTilt * 0.5;
      beh.phaseEndsAt = performance.now() + 600;
    }
  }
}

function onActivity(){
  // 공부 화면에서 선택창이 없을 때만 '보는 중'으로 전환
  if (state.screen !== "study" || state.selectorOpen) return;
  setWatching(true);
}

window.addEventListener("mousemove", onActivity, { passive:true });
window.addEventListener("touchmove", onActivity, { passive:true });
window.addEventListener("wheel",     onActivity, { passive:true });
window.addEventListener("keydown",   onActivity);


/* ==========================================================
   10) 캐릭터 행동 AI
   ========================================================== */
function recomputeLayout(){
  const r = el.room.getBoundingClientRect();
  layout.roomW = r.width;
  layout.roomH = r.height;

  // 캐릭터 폭: 방 크기에 비례, 상한 있음
  layout.cw = Math.min(layout.roomW * 0.42, layout.roomH * 0.44, 210);
  layout.ch = layout.cw * layout.aspect;
  el.character.style.width = layout.cw + "px";

  // 이동 범위(바닥 영역에서만 돌아다니도록)
  const pad = layout.roomW * 0.03;
  const minBase = layout.roomH * 0.72;   // 나무 바닥 위에서만 돌아다니도록
  const maxBase = layout.roomH * 0.97;
  layout.bounds.minX = pad;
  layout.bounds.maxX = Math.max(pad, layout.roomW - layout.cw - pad);
  layout.bounds.minY = Math.max(0, minBase - layout.ch);
  layout.bounds.maxY = Math.max(0, maxBase - layout.ch);

  // 제자리(홈): 방 아래 중앙
  layout.home.x = (layout.roomW - layout.cw) / 2;
  layout.home.y = layout.bounds.maxY;

  // 현재 위치가 범위를 벗어났으면 보정
  beh.x = clamp(beh.x, layout.bounds.minX, layout.bounds.maxX);
  beh.y = clamp(beh.y, layout.bounds.minY, layout.bounds.maxY);

  placeFootName();
}
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function resetToHome(snap){
  if (snap){
    beh.x = layout.home.x; beh.y = layout.home.y; beh.rot = 0;
  }
  beh.tx = layout.home.x; beh.ty = layout.home.y; beh.trot = 0;
  beh.mode = "home";
  applyTransform();
}

function decideNextLiving(now){
  const c = getChar(state.currentCharId);
  if (Math.random() < c.pauseChance){
    // 멈춰서 주변을 살핌(LOOKING_AROUND / RESTING)
    beh.phase = "pause";
    beh.trot = (Math.random() * 2 - 1) * c.lookTilt;
    beh.phaseEndsAt = now + rand(c.restMin, c.restMax);
  } else {
    // 방 안 다른 곳으로 천천히 이동(WALKING)
    beh.phase = "walk";
    beh.tx = rand(layout.bounds.minX, layout.bounds.maxX);
    beh.ty = rand(layout.bounds.minY, layout.bounds.maxY);
    const dir = beh.tx > beh.x ? 1 : -1;
    beh.trot = dir * c.leanDeg;
    beh.moveSpeed = c.speed * (0.8 + Math.random() * 0.4);
  }
}

function updateBehavior(now, dt){
  const c = getChar(state.currentCharId);
  let targetX, targetY, speed;

  if (beh.mode === "home"){
    // 원래 자리로 빠르게 복귀 후 얌전히 앉아 있음(IDLE)
    targetX = layout.home.x; targetY = layout.home.y;
    speed = c.speed * 4;
    beh.trot = 0;
  } else {
    // living
    if (beh.phase === "pause"){
      if (now >= beh.phaseEndsAt) decideNextLiving(now);
    }
    if (beh.phase === "walk"){
      targetX = beh.tx; targetY = beh.ty; speed = beh.moveSpeed;
    } else {
      targetX = beh.x; targetY = beh.y; speed = 0;
    }
  }

  // 목표를 향해 이동
  const dx = targetX - beh.x, dy = targetY - beh.y;
  const dist = Math.hypot(dx, dy);
  const stepLen = speed * dt;
  if (dist > 0.5 && stepLen > 0){
    if (stepLen >= dist){ beh.x = targetX; beh.y = targetY; }
    else { beh.x += dx / dist * stepLen; beh.y += dy / dist * stepLen; }
  }
  // 걷다가 도착하면 다음 행동 결정
  if (beh.mode === "living" && beh.phase === "walk" && dist <= 0.5){
    decideNextLiving(now);
  }

  // 회전 부드럽게 보간
  beh.rot += (beh.trot - beh.rot) * Math.min(1, dt * 3);

  // 숨쉬는 듯한 미세한 흔들림(IDLE / 멈춤일 때)
  let breathe = 0;
  if (beh.mode === "home" || beh.phase === "pause"){
    breathe = Math.sin(now * 0.003) * 0.6;
  }

  applyTransform(breathe);
}

function applyTransform(extraRot = 0){
  el.character.style.transform =
    `translate(${beh.x}px, ${beh.y}px) rotate(${(beh.rot + extraRot).toFixed(2)}deg)`;
}

// 캐릭터 클릭 → 선택창
el.character.addEventListener("click", () => {
  if (state.screen !== "study") return;
  openSelector();
});


/* ==========================================================
   11) 캐릭터 선택
   ========================================================== */
function buildGrid(){
  el.charGrid.innerHTML = "";
  CHARACTERS.forEach(c => {
    const cell = document.createElement("div");
    cell.className = "char-cell" + (c.id === state.currentCharId ? " active" : "");
    const img = document.createElement("img");
    img.src = c.image; img.alt = c.name; img.draggable = false;
    img.onerror = () => {
      img.replaceWith(Object.assign(document.createElement("div"), { className:"cell-fallback" }));
    };
    const label = document.createElement("span");
    label.textContent = c.name;
    cell.appendChild(img);
    cell.appendChild(label);
    cell.addEventListener("click", () => selectCharacter(c.id));
    el.charGrid.appendChild(cell);
  });
}

function openSelector(){
  state.selectorOpen = true;
  setStudyState("paused");        // 선택창 열면 타이머·행동 정지
  beh.mode = "home";
  buildGrid();
  el.selectScreen.hidden = false;
}
function closeSelector(){
  state.selectorOpen = false;
  el.selectScreen.hidden = true;
  // 방금 조작했으므로 '보는 중'으로 두고, 잠시 뒤 자동 재개
  setWatching(true);
}
function selectCharacter(id){
  state.currentCharId = id;       // 이름·시간·상태는 그대로 유지
  renderCharacter();
  closeSelector();
}


/* ==========================================================
   12) 월간 기록 (localStorage)
   구조: { "YYYY-MM": { userId: { name, seconds } } }
   ========================================================== */
const STORE_KEY = "toystudy_records";

function loadStore(){
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch { return {}; }
}
function saveStore(store){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch {}
}
function findUserIdByName(name){
  const month = loadStore()[monthKey()] || {};
  for (const id in month){ if (month[id].name === name) return id; }
  return null;
}
function saveRecord(){
  if (!state.user.id) return;
  if (state.elapsedMs < 1000) return;          // 1초 미만은 기록하지 않음
  const store = loadStore();
  const mk = monthKey();
  if (!store[mk]) store[mk] = {};
  const cur = store[mk][state.user.id] || { name: state.user.name, seconds: 0, charId: state.currentCharId };
  cur.name = state.user.name;
  cur.charId = state.currentCharId;             // 마지막으로 선택한 캐릭터
  cur.seconds += Math.floor(state.elapsedMs / 1000);
  store[mk][state.user.id] = cur;
  saveStore(store);
}
function renderRanking(){
  const month = loadStore()[monthKey()] || {};
  const rows = Object.entries(month)
    .map(([id, v]) => ({ id, name: v.name, seconds: v.seconds, charId: v.charId }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 10);

  el.rankingList.innerHTML = "";
  if (rows.length === 0){
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "아직 기록이 없어.";
    el.rankingList.appendChild(li);
    return;
  }
  rows.forEach((r, i) => {
    const li = document.createElement("li");
    if (r.id === state.user.id) li.classList.add("me");

    const rank = document.createElement("span");
    rank.className = "rank-num";
    rank.textContent = i + 1;

    const face = document.createElement("img");
    face.className = "rank-face";
    const c = getChar(r.charId);
    face.src = c.image; face.alt = c.name; face.draggable = false;
    face.onerror = () => {
      const fb = document.createElement("span");
      fb.className = "rank-face fallback";
      face.replaceWith(fb);
    };

    const nm = document.createElement("span");
    nm.className = "rank-name";
    nm.textContent = r.name;

    const tm = document.createElement("span");
    tm.className = "rank-time";
    tm.textContent = formatTime(r.seconds * 1000);

    li.append(rank, face, nm, tm);
    el.rankingList.appendChild(li);
  });
}


/* ==========================================================
   13) HOME / FINISH
   ========================================================== */
function goHome(){
  saveRecord();
  setStudyState("idle");
  clearTimeout(idleTimer);
  state.watching = false;
  state.elapsedMs = 0;
  showScreen("name");
  el.nameInput.value = "";   // 새 방문자로 다시 시작(다음 START 때 새 ID 부여)
  updateNameState();
}

function finishSession(){
  saveRecord();
  setStudyState("idle");
  clearTimeout(idleTimer);

  const c = getChar(state.currentCharId);
  el.resultImg.src = c.image;
  el.resultImg.alt = c.name;
  el.resultImg.onerror = () => { el.resultImg.style.visibility = "hidden"; };
  el.resultImg.style.visibility = "visible";
  el.resultName.textContent = `${state.user.name} · ${c.name}`;
  el.resultTime.textContent = formatTime(state.elapsedMs);
  renderRanking();

  showScreen("result");
}


/* ==========================================================
   14) 초기화 & 메인 루프
   ========================================================== */
function bindUI(){
  el.nameInput.addEventListener("input", updateNameState);
  el.nameInput.addEventListener("keydown", e => { if (e.key === "Enter" && !el.startBtn.disabled) startSession(); });
  el.startBtn.addEventListener("click", startSession);

  el.homeBtn.addEventListener("click", goHome);
  el.finishBtn.addEventListener("click", finishSession);
  el.closeSelect.addEventListener("click", closeSelector);
  el.againBtn.addEventListener("click", () => { showScreen("name"); updateNameState(); });

  window.addEventListener("resize", recomputeLayout);
}

let lastTs = 0;
function loop(ts){
  if (!lastTs) lastTs = ts;
  let dt = (ts - lastTs) / 1000;
  lastTs = ts;
  if (dt > 0.1) dt = 0.1; // 탭 복귀 등으로 큰 점프 방지

  // 타이머 누적
  if (state.screen === "study" && state.studyState === "studying"){
    state.elapsedMs += dt * 1000;
    updateTimerDisplay();
  }

  // 행동 AI
  if (state.screen === "study"){
    updateBehavior(ts, dt);
  }

  requestAnimationFrame(loop);
}

function init(){
  bindUI();
  updateNameState();
  recomputeLayout();
  showScreen("name");
  requestAnimationFrame(loop);
}
init();
