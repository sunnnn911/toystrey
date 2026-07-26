/* ==========================================================
   장난감 공부방
   ========================================================== */


/* ==========================================================
   1. 캐릭터 데이터
   ========================================================== */

const CHARACTERS = [

  {
    id: "mickey",
    name: "미키",
    image: "mickey.png",

    nameTop: 88,
    nameLeft: 35,
    nameRot: 2,
    nameScale: 0.9,
    nameColor: "#3a2a1c",

    speed: 26,
    pauseChance: 0.35,
    lookTilt: 4,
    leanDeg: 2,
    restMin: 1200,
    restMax: 2600
  },

  {
    id: "pooh",
    name: "곰돌이 푸",
    image: "pooh.png",

    nameTop: 86,
    nameLeft: 39,
    nameRot: 0,
    nameScale: 0.8,
    nameColor: "#4a3527",

    speed: 18,
    pauseChance: 0.5,
    lookTilt: 3,
    leanDeg: 2,
    restMin: 1600,
    restMax: 3200
  },

  {
    id: "felix",
    name: "펠릭스",
    image: "felix.png",

    nameTop: 82,
    nameLeft: 40,
    nameRot: 0,
    nameScale: 0.8,
    nameColor: "#ffffff",

    speed: 40,
    pauseChance: 0.22,
    lookTilt: 5,
    leanDeg: 3,
    restMin: 800,
    restMax: 1800
  },

  {
    id: "sherlock",
    name: "셜록",
    image: "sherlock.png",

    nameTop: 85,
    nameLeft: 31,
    nameRot: -8,
    nameScale: 0.78,
    nameColor: "#fff2dd",

    speed: 28,
    pauseChance: 0.4,
    lookTilt: 6,
    leanDeg: 2,
    restMin: 1600,
    restMax: 3400
  },

  {
    id: "alice",
    name: "앨리스",
    image: "alice.png",

    nameTop: 85,
    nameLeft: 39,
    nameRot: -4,
    nameScale: 0.78,
    nameColor: "#fff2dd",

    speed: 22,
    pauseChance: 0.42,
    lookTilt: 4,
    leanDeg: 2,
    restMin: 1400,
    restMax: 3000
  },

  {
    id: "pinocchio",
    name: "피노키오",
    image: "pinocchio.png",

    nameTop: 88,
    nameLeft: 40,
    nameRot: 0,
    nameScale: 0.78,
    nameColor: "#ffffff",

    speed: 30,
    pauseChance: 0.3,
    lookTilt: 5,
    leanDeg: 5,
    restMin: 900,
    restMax: 2000
  },

  {
    id: "scarecrow",
    name: "허수아비",
    image: "scarecrow.png",

    nameTop: 88,
    nameLeft: 40,
    nameRot: 0,
    nameScale: 0.8,
    nameColor: "#3a2a1c",

    speed: 16,
    pauseChance: 0.45,
    lookTilt: 6,
    leanDeg: 6,
    restMin: 1500,
    restMax: 3200
  },

  {
    id: "dracula",
    name: "드라큘라",
    image: "dracula.png",

    nameTop: 86,
    nameLeft: 40,
    nameRot: -3,
    nameScale: 0.78,
    nameColor: "#ffffff",

    speed: 20,
    pauseChance: 0.4,
    lookTilt: 3,
    leanDeg: 2,
    restMin: 1600,
    restMax: 3400
  }

];


function getChar(id) {

  return CHARACTERS.find(
    character => character.id === id
  ) || CHARACTERS[0];

}


/* ==========================================================
   2. 상태
   ========================================================== */

const state = {

  screen: "name",

  studyState: "idle",

  watching: false,

  selectorOpen: false,

  user: {

    id: null,

    name: ""

  },

  currentCharId: "mickey",

  elapsedMs: 0

};


/* ==========================================================
   3. 행동 AI 상태
   ========================================================== */

const behavior = {

  x: 0,
  y: 0,
  rot: 0,

  tx: 0,
  ty: 0,
  trot: 0,

  phase: "pause",

  phaseEndsAt: 0,

  moveSpeed: 20,

  mode: "home"

};


const layout = {

  roomW: 0,
  roomH: 0,

  cw: 0,
  ch: 0,

  aspect: 1.15,

  home: {
    x: 0,
    y: 0
  },

  bounds: {

    minX: 0,
    maxX: 0,

    minY: 0,
    maxY: 0

  }

};


const IDLE_RESUME_MS = 10000;

let idleTimer = null;


/* ==========================================================
   4. 유틸리티
   ========================================================== */

const segmenter =
  typeof Intl !== "undefined" &&
  Intl.Segmenter

    ? new Intl.Segmenter(
        undefined,
        {
          granularity: "grapheme"
        }
      )

    : null;


function graphemes(text) {

  if (segmenter) {

    return Array.from(
      segmenter.segment(text),
      item => item.segment
    );

  }

  return Array.from(text);

}


function graphemeCount(text) {

  return graphemes(text).length;

}


function truncateGraphemes(text, max) {

  return graphemes(text)
    .slice(0, max)
    .join("");

}


function formatTime(ms) {

  const totalSeconds =
    Math.floor(ms / 1000);

  const hours =
    Math.floor(totalSeconds / 3600);

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60
    );

  const seconds =
    totalSeconds % 60;


  return [

    String(hours).padStart(2, "0"),

    String(minutes).padStart(2, "0"),

    String(seconds).padStart(2, "0")

  ].join(":");

}


function createUserId() {

  return (

    "user_" +

    crypto.randomUUID()

  );

}


function getMonthKey() {

  const date = new Date();

  return (

    date.getFullYear() +

    "-" +

    String(
      date.getMonth() + 1
    ).padStart(2, "0")

  );

}


function randomBetween(min, max) {

  return min +
    Math.random() *
    (max - min);

}


function clamp(value, min, max) {

  return Math.max(
    min,
    Math.min(max, value)
  );

}


/* ==========================================================
   5. DOM
   ========================================================== */

const el = {

  room: document.getElementById("room"),

  topbar: document.getElementById("topbar"),

  timer: document.getElementById("timer"),

  statusChip:
    document.getElementById(
      "statusChip"
    ),

  homeBtn:
    document.getElementById(
      "homeBtn"
    ),

  finishBtn:
    document.getElementById(
      "finishBtn"
    ),

  character:
    document.getElementById(
      "character"
    ),

  charImg:
    document.getElementById(
      "charImg"
    ),

  charFallback:
    document.getElementById(
      "charFallback"
    ),

  footName:
    document.getElementById(
      "footName"
    ),

  nameScreen:
    document.getElementById(
      "nameScreen"
    ),

  nameInput:
    document.getElementById(
      "nameInput"
    ),

  nameHint:
    document.getElementById(
      "nameHint"
    ),

  startBtn:
    document.getElementById(
      "startBtn"
    ),

  selectScreen:
    document.getElementById(
      "selectScreen"
    ),

  charGrid:
    document.getElementById(
      "charGrid"
    ),

  closeSelect:
    document.getElementById(
      "closeSelect"
    ),

  resultScreen:
    document.getElementById(
      "resultScreen"
    ),

  resultImg:
    document.getElementById(
      "resultImg"
    ),

  resultName:
    document.getElementById(
      "resultName"
    ),

  resultTime:
    document.getElementById(
      "resultTime"
    ),

  rankingList:
    document.getElementById(
      "rankingList"
    ),

  againBtn:
    document.getElementById(
      "againBtn"
    )

};


/* ==========================================================
   6. 화면 전환
   ========================================================== */

function showScreen(screenName) {

  state.screen = screenName;


  // 우선 전부 숨김

  el.nameScreen.classList.add(
    "hidden"
  );

  el.selectScreen.classList.add(
    "hidden"
  );

  el.resultScreen.classList.add(
    "hidden"
  );

  el.topbar.classList.add(
    "hidden"
  );

  el.statusChip.classList.add(
    "hidden"
  );

  el.character.classList.add(
    "hidden"
  );


  // 이름 화면

  if (screenName === "name") {

    el.nameScreen.classList.remove(
      "hidden"
    );

  }


  // 공부 화면

  if (screenName === "study") {

    el.topbar.classList.remove(
      "hidden"
    );

    el.statusChip.classList.remove(
      "hidden"
    );

    el.character.classList.remove(
      "hidden"
    );

  }


  // 결과 화면

  if (screenName === "result") {

    el.resultScreen.classList.remove(
      "hidden"
    );

  }

}


/* ==========================================================
   7. 이름 입력
   ========================================================== */

function updateNameState() {

  const original =
    el.nameInput.value;


  const cut =
    truncateGraphemes(
      original,
      5
    );


  if (original !== cut) {

    el.nameInput.value = cut;

  }


  const name =
    cut.trim();


  const count =
    graphemeCount(name);


  el.nameHint.textContent =

    `한국어·영어·중국어·아랍어 등 모두 가능 · ${count}/5`;


  el.startBtn.disabled =
    count < 1;

}


function startSession() {

  const name =
    el.nameInput.value.trim();


  if (
    graphemeCount(name) < 1
  ) {

    return;

  }


  state.user.id =
    createUserId();


  state.user.name =
    name;


  state.elapsedMs =
    0;


  updateTimerDisplay();


  showScreen("study");


  renderCharacter();


  requestAnimationFrame(() => {

    recomputeLayout();

    resetToHome(true);

  });


  setWatching(true);

}


/* ==========================================================
   8. 캐릭터 렌더링
   ========================================================== */

function renderCharacter() {

  const character =
    getChar(
      state.currentCharId
    );


  el.charImg.onerror =
    function() {

      el.charImg.classList.add(
        "hidden"
      );

      el.charFallback.classList.remove(
        "hidden"
      );

      el.charFallback.textContent =
        character.name;

    };


  el.charImg.onload =
    function() {

      el.charImg.classList.remove(
        "hidden"
      );

      el.charFallback.classList.add(
        "hidden"
      );


      layout.aspect =
        el.charImg.naturalHeight /
        el.charImg.naturalWidth;


      recomputeLayout();

      placeFootName();

    };


  el.charImg.src =
    character.image;


  el.charImg.alt =
    character.name;


  placeFootName();

}


function placeFootName() {

  const character =
    getChar(
      state.currentCharId
    );


  el.footName.textContent =
    state.user.name;


  el.footName.style.top =
    character.nameTop + "%";


  el.footName.style.left =
    character.nameLeft + "%";


  el.footName.style.transform =

    `translate(-50%, -50%) rotate(${character.nameRot}deg)`;


  el.footName.style.fontSize =

    Math.max(
      9,
      layout.cw *
      0.11 *
      character.nameScale
    ) + "px";


  el.footName.style.color =
    character.nameColor;

}


/* ==========================================================
   9. 타이머
   ========================================================== */

function updateTimerDisplay() {

  el.timer.textContent =
    formatTime(
      state.elapsedMs
    );

}


function setStudyState(newState) {

  state.studyState =
    newState;


  if (
    state.screen !== "study"
  ) {

    return;

  }


  if (
    newState === "studying"
  ) {

    el.statusChip.textContent =
      "공부 중";

    el.statusChip.classList.remove(
      "watching"
    );

  }


  else {

    el.statusChip.textContent =
      "보는 중";

    el.statusChip.classList.add(
      "watching"
    );

  }

}


/* ==========================================================
   10. 마우스 및 터치 감지
   ========================================================== */

function setWatching(isWatching) {

  state.watching =
    isWatching;


  if (isWatching) {

    setStudyState(
      "paused"
    );


    behavior.mode =
      "home";


    clearTimeout(
      idleTimer
    );


    idleTimer =
      setTimeout(
        () => {

          setWatching(
            false
          );

        },

        IDLE_RESUME_MS

      );

  }


  else {

    if (

      state.screen === "study" &&

      !state.selectorOpen

    ) {

      setStudyState(
        "studying"
      );


      behavior.mode =
        "living";


      behavior.phase =
        "pause";


      behavior.phaseEndsAt =
        performance.now() +
        700;

    }

  }

}


function onActivity() {

  if (

    state.screen !== "study" ||

    state.selectorOpen

  ) {

    return;

  }


  setWatching(
    true
  );

}


window.addEventListener(
  "mousemove",
  onActivity,
  { passive: true }
);


window.addEventListener(
  "touchmove",
  onActivity,
  { passive: true }
);


window.addEventListener(
  "wheel",
  onActivity,
  { passive: true }
);


window.addEventListener(
  "keydown",
  onActivity
);


/* ==========================================================
   11. 레이아웃
   ========================================================== */

function recomputeLayout() {

  const roomRect =
    el.room.getBoundingClientRect();


  layout.roomW =
    roomRect.width;


  layout.roomH =
    roomRect.height;


  layout.cw =

    Math.min(

      layout.roomW * 0.42,

      layout.roomH * 0.44,

      210

    );


  layout.ch =
    layout.cw *
    layout.aspect;


  el.character.style.width =
    layout.cw + "px";


  const padding =
    layout.roomW * 0.03;


  layout.bounds.minX =
    padding;


  layout.bounds.maxX =

    Math.max(

      padding,

      layout.roomW -
      layout.cw -
      padding

    );


  layout.bounds.minY =

    Math.max(

      0,

      layout.roomH * 0.72 -
      layout.ch

    );


  layout.bounds.maxY =

    Math.max(

      0,

      layout.roomH * 0.97 -
      layout.ch

    );


  layout.home.x =

    (layout.roomW -
      layout.cw) / 2;


  layout.home.y =
    layout.bounds.maxY;


  behavior.x =
    clamp(

      behavior.x,

      layout.bounds.minX,

      layout.bounds.maxX

    );


  behavior.y =
    clamp(

      behavior.y,

      layout.bounds.minY,

      layout.bounds.maxY

    );


  placeFootName();

}


/* ==========================================================
   12. 캐릭터 행동
   ========================================================== */

function resetToHome(snap) {

  if (snap) {

    behavior.x =
      layout.home.x;

    behavior.y =
      layout.home.y;

    behavior.rot =
      0;

  }


  behavior.tx =
    layout.home.x;


  behavior.ty =
    layout.home.y;


  behavior.trot =
    0;


  behavior.mode =
    "home";


  applyTransform();

}


function decideNextLiving(now) {

  const character =
    getChar(
      state.currentCharId
    );


  if (

    Math.random() <
    character.pauseChance

  ) {

    behavior.phase =
      "pause";


    behavior.trot =

      (

        Math.random() * 2 - 1

      ) *

      character.lookTilt;


    behavior.phaseEndsAt =

      now +

      randomBetween(

        character.restMin,

        character.restMax

      );

  }


  else {

    behavior.phase =
      "walk";


    behavior.tx =

      randomBetween(

        layout.bounds.minX,

        layout.bounds.maxX

      );


    behavior.ty =

      randomBetween(

        layout.bounds.minY,

        layout.bounds.maxY

      );


    const direction =

      behavior.tx >
      behavior.x

        ? 1
        : -1;


    behavior.trot =

      direction *
      character.leanDeg;


    behavior.moveSpeed =

      character.speed *
      randomBetween(
        0.8,
        1.2
      );

  }

}


function updateBehavior(now, dt) {

  const character =
    getChar(
      state.currentCharId
    );


  let targetX =
    behavior.x;


  let targetY =
    behavior.y;


  let speed =
    0;


  if (

    behavior.mode ===
    "home"

  ) {

    targetX =
      layout.home.x;


    targetY =
      layout.home.y;


    speed =
      character.speed *
      4;


    behavior.trot =
      0;

  }


  else {

    if (

      behavior.phase ===
      "pause"

    ) {

      if (

        now >=
        behavior.phaseEndsAt

      ) {

        decideNextLiving(
          now
        );

      }

    }


    if (

      behavior.phase ===
      "walk"

    ) {

      targetX =
        behavior.tx;


      targetY =
        behavior.ty;


      speed =
        behavior.moveSpeed;

    }

  }


  const dx =
    targetX -
    behavior.x;


  const dy =
    targetY -
    behavior.y;


  const distance =
    Math.hypot(
      dx,
      dy
    );


  const step =
    speed *
    dt;


  if (

    distance > 0.5 &&
    step > 0

  ) {

    if (

      step >=
      distance

    ) {

      behavior.x =
        targetX;


      behavior.y =
        targetY;

    }


    else {

      behavior.x +=
        dx /
        distance *
        step;


      behavior.y +=
        dy /
        distance *
        step;

    }

  }


  if (

    behavior.mode ===
    "living" &&

    behavior.phase ===
    "walk" &&

    distance <= 0.5

  ) {

    decideNextLiving(
      now
    );

  }


  behavior.rot +=

    (

      behavior.trot -
      behavior.rot

    ) *

    Math.min(

      1,

      dt * 3

    );


  applyTransform();

}


function applyTransform() {

  el.character.style.transform =

    `translate(${behavior.x}px, ${behavior.y}px) rotate(${behavior.rot.toFixed(2)}deg)`;

}


/* ==========================================================
   13. 캐릭터 선택
   ========================================================== */

function buildCharacterGrid() {

  el.charGrid.innerHTML =
    "";


  CHARACTERS.forEach(
    character => {


      const cell =
        document.createElement(
          "div"
        );


      cell.className =
        "char-cell";


      if (

        character.id ===
        state.currentCharId

      ) {

        cell.classList.add(
          "active"
        );

      }


      const image =
        document.createElement(
          "img"
        );


      image.src =
        character.image;


      image.alt =
        character.name;


      const label =
        document.createElement(
          "span"
        );


      label.textContent =
        character.name;


      cell.appendChild(
        image
      );


      cell.appendChild(
        label
      );


      cell.addEventListener(
        "click",
        () => {

          state.currentCharId =
            character.id;


          renderCharacter();


          closeSelector();

        }

      );


      el.charGrid.appendChild(
        cell
      );

    }

  );

}


function openSelector() {

  state.selectorOpen =
    true;


  setStudyState(
    "paused"
  );


  behavior.mode =
    "home";


  buildCharacterGrid();


  el.selectScreen.classList.remove(
    "hidden"
  );

}


function closeSelector() {

  state.selectorOpen =
    false;


  el.selectScreen.classList.add(
    "hidden"
  );


  setWatching(
    true
  );

}


/* 캐릭터 클릭 */

el.character.addEventListener(
  "click",
  openSelector
);


/* ==========================================================
   14. 월간 기록
   ========================================================== */

const STORE_KEY =
  "toy_study_records";


function loadStore() {

  try {

    return JSON.parse(
      localStorage.getItem(
        STORE_KEY
      )
    ) || {};

  }

  catch {

    return {};

  }

}


function saveStore(store) {

  try {

    localStorage.setItem(

      STORE_KEY,

      JSON.stringify(
        store
      )

    );

  }

  catch {

    console.warn(
      "기록을 저장할 수 없습니다."
    );

  }

}


function saveRecord() {

  if (
    !state.user.id
  ) {

    return;

  }


  const seconds =
    Math.floor(
      state.elapsedMs / 1000
    );


  if (
    seconds <= 0
  ) {

    return;

  }


  const store =
    loadStore();


  const month =
    getMonthKey();


  if (
    !store[month]
  ) {

    store[month] =
      {};

  }


  const existing =
    store[month][
      state.user.id
    ];


  if (
    existing
  ) {

    existing.seconds +=
      seconds;


    existing.charId =
      state.currentCharId;

  }


  else {

    store[month][
      state.user.id
    ] = {

      name:
        state.user.name,

      seconds:
        seconds,

      charId:
        state.currentCharId

    };

  }


  saveStore(
    store
  );

}


function renderRanking() {

  const store =
    loadStore();


  const month =
    store[
      getMonthKey()
    ] || {};


  const rows =

    Object.entries(
      month
    )

    .map(
      ([id, data]) => ({

        id,

        name:
          data.name,

        seconds:
          data.seconds,

        charId:
          data.charId

      })

    )

    .sort(
      (a, b) =>
        b.seconds -
        a.seconds
    )

    .slice(
      0,
      10
    );


  el.rankingList.innerHTML =
    "";


  if (
    rows.length === 0
  ) {

    const empty =
      document.createElement(
        "li"
      );


    empty.textContent =
      "아직 기록이 없어.";


    el.rankingList.appendChild(
      empty
    );


    return;

  }


  rows.forEach(
    (row, index) => {


      const li =
        document.createElement(
          "li"
        );


      const rank =
        document.createElement(
          "span"
        );


      rank.className =
        "rank-num";


      rank.textContent =
        index + 1;


      const image =
        document.createElement(
          "img"
        );


      image.className =
        "rank-face";


      image.src =
        getChar(
          row.charId
        ).image;


      image.alt =
        getChar(
          row.charId
        ).name;


      const name =
        document.createElement(
          "span"
        );


      name.className =
        "rank-name";


      name.textContent =
        row.name;


      const time =
        document.createElement(
          "span"
        );


      time.className =
        "rank-time";


      time.textContent =
        formatTime(
          row.seconds *
          1000
        );


      li.append(
        rank,
        image,
        name,
        time
      );


      if (

        row.id ===
        state.user.id

      ) {

        li.style.color =
          "var(--accent-deep)";


        li.style.fontWeight =
          "800";

      }


      el.rankingList.appendChild(
        li
      );

    }

  );

}


/* ==========================================================
   15. HOME
   ========================================================== */

function goHome() {

  saveRecord();


  clearTimeout(
    idleTimer
  );


  state.screen =
    "name";


  state.studyState =
    "idle";


  state.watching =
    false;


  state.elapsedMs =
    0;


  state.user.id =
    null;


  state.user.name =
    "";


  el.nameInput.value =
    "";


  updateNameState();


  showScreen(
    "name"
  );

}


/* ==========================================================
   16. FINISH
   ========================================================== */

function finishSession() {

  saveRecord();


  clearTimeout(
    idleTimer
  );


  state.studyState =
    "idle";


  const character =
    getChar(
      state.currentCharId
    );


  el.resultImg.src =
    character.image;


  el.resultImg.alt =
    character.name;


  el.resultName.textContent =

    `${state.user.name} · ${character.name}`;


  el.resultTime.textContent =

    formatTime(
      state.elapsedMs
    );


  renderRanking();


  showScreen(
    "result"
  );

}


/* ==========================================================
   17. 이벤트 연결
   ========================================================== */

function bindEvents() {


  el.nameInput.addEventListener(
    "input",
    updateNameState
  );


  el.nameInput.addEventListener(
    "keydown",
    event => {

      if (

        event.key ===
        "Enter" &&

        !el.startBtn.disabled

      ) {

        startSession();

      }

    }

  );


  el.startBtn.addEventListener(
    "click",
    startSession
  );


  el.homeBtn.addEventListener(
    "click",
    goHome
  );


  el.finishBtn.addEventListener(
    "click",
    finishSession
  );


  el.closeSelect.addEventListener(
    "click",
    closeSelector
  );


  el.againBtn.addEventListener(
    "click",
    () => {

      showScreen(
        "name"
      );


      el.nameInput.value =
        "";


      updateNameState();

    }

  );


  window.addEventListener(
    "resize",
    recomputeLayout
  );

}


/* ==========================================================
   18. 메인 루프
   ========================================================== */

let lastTimestamp =
  0;


function mainLoop(timestamp) {


  if (
    !lastTimestamp
  ) {

    lastTimestamp =
      timestamp;

  }


  let dt =

    (

      timestamp -
      lastTimestamp

    ) / 1000;


  lastTimestamp =
    timestamp;


  if (
    dt > 0.1
  ) {

    dt =
      0.1;

  }


  if (

    state.screen === "study" &&

    state.studyState ===
    "studying"

  ) {

    state.elapsedMs +=
      dt * 1000;


    updateTimerDisplay();

  }


  if (

    state.screen ===
    "study"

  ) {

    updateBehavior(
      timestamp,
      dt
    );

  }


  requestAnimationFrame(
    mainLoop
  );

}


/* ==========================================================
   19. 초기화
   ========================================================== */

function init() {


  // 처음에는 반드시 이름 화면

  showScreen(
    "name"
  );


  bindEvents();


  updateNameState();


  requestAnimationFrame(
    () => {

      recomputeLayout();

    }

  );


  requestAnimationFrame(
    mainLoop
  );

}


init();
