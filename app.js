const STORAGE_KEY = "digitalMafiaM2";

const roles = [
  { id:"source", icon:"🔎", name:"출처 추적자", mission:"최초 출처와 공식 출처의 차이를 찾으세요.", clue:"의심 계정은 오늘 19:58에 만들어졌습니다. 공식 계정과 철자가 한 글자 다릅니다." },
  { id:"context", icon:"🧩", name:"맥락 복원자", mission:"잘린 장면의 앞뒤 정보를 복원하세요.", clue:"원본 영상 뒷부분에서 교사는 ‘공연만 30분 늦어지고 축제는 계속된다’고 말합니다." },
  { id:"spread", icon:"📡", name:"확산 분석가", mission:"반복되는 게시 시각과 문구를 비교하세요.", clue:"다섯 계정은 오늘 생성되었고 12초 동안 같은 문장을 같은 순서로 게시했습니다." },
  { id:"privacy", icon:"🛡️", name:"개인정보 수호자", mission:"확인 과정에서 더 퍼뜨리면 안 되는 정보를 표시하세요.", clue:"영상에는 학생 얼굴, 명찰, 교실 위치가 선명하며 공개 동의는 확인되지 않았습니다." },
  { id:"question", icon:"❓", name:"질문 설계자", mission:"팀의 의심을 확인 가능한 질문 하나로 바꾸세요.", clue:"‘누가 거짓말했나’보다 ‘어떤 공식 자료로 취소 여부를 확인할 수 있나’를 물으세요." }
];

const defaultState = {
  screen: "join", step: 0, sessionCode: "", team: "", alias: "", roleId: "",
  firstVerdict: "", suspicion: "", question: "", notes: {r1:"", r2:"", r3:""},
  evidence: [], finalVerdict: "", tactics: [], response: "", reflection: ""
};

let state = loadState();
const app = document.querySelector("#app");
const saveStatus = document.querySelector("#saveStatus");

function loadState(){
  try { return {...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")}; }
  catch { return {...defaultState}; }
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  saveStatus.textContent = "방금 임시 저장됨";
  setTimeout(()=> saveStatus.textContent = "이 기기에 임시 저장", 900);
}
function setState(patch){ state = {...state, ...patch}; saveState(); render(); }
function role(){ return roles.find(r=>r.id===state.roleId) || roles[0]; }
function esc(value=""){ return String(value).replace(/[&<>'"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
function shell(title, lead, body, step=state.step){
  const pct = Math.max(5, Math.min(100, (step/9)*100));
  return `<section class="panel">
    <div class="stepbar"><span>${step}/9</span><div class="progress"><span style="width:${pct}%"></span></div><span>${esc(state.team || "미입장")}</span></div>
    <h2 class="round-title">${title}</h2><p class="lead">${lead}</p>${body}
  </section>`;
}
function actions(nextLabel="다음", back=true){
  return `<div class="actions">${back?'<button class="btn ghost" data-action="back">이전</button>':''}<button class="btn" data-action="next">${nextLabel}</button></div><p id="formError" class="error" role="alert"></p>`;
}

function joinScreen(){
  return `<section class="panel hero">
    <span class="tag danger-tag">M2 정적 시연판</span>
    <h2>사람이 아니라<br>정보를 의심하라.</h2>
    <p>가짜 계정, 잘린 영상, 비정상적인 확산 속에서 근거를 찾아 ‘축제 취소’ 주장의 진위를 판단하세요.</p>
    <div class="form-grid">
      <label>세션 코드<input id="sessionCode" inputmode="numeric" maxlength="4" value="${esc(state.sessionCode || "2026")}" aria-describedby="demoHint"></label>
      <label>팀 번호<select id="team"><option value="">선택</option>${[1,2,3,4,5,6,7].map(n=>`<option ${state.team===n+"팀"?"selected":""}>${n}팀</option>`).join("")}</select></label>
      <label>별칭<input id="alias" maxlength="10" value="${esc(state.alias)}" placeholder="실명 대신 별칭"></label>
    </div>
    <p id="demoHint" class="notice">시연판에서는 세션 코드 <strong>2026</strong>을 사용합니다. 입력 내용은 현재 브라우저에만 저장됩니다.</p>
    <div class="actions"><button class="btn" data-action="join">수사팀 입장</button><button class="btn secondary" data-action="reset">기록 초기화</button></div>
    <p id="formError" class="error" role="alert"></p>
  </section>`;
}

function roleScreen(){ const r=role(); return shell("비밀 역할 확인", "팀원마다 다른 관점으로 단서를 읽습니다. 역할은 악역이 아니라 조사 능력입니다.", `
  <div class="role-card"><div class="role-icon">${r.icon}</div><div><p class="tag">${esc(state.team)}</p><h2>${r.name}</h2><p class="mission">${r.mission}</p><p>${r.clue}</p></div></div>
  <p class="notice">역할 내용을 팀에 보여주지 않아도 되지만, 발견한 근거는 반드시 팀과 공유하세요.</p>${actions("사건 확인", false)}`, 1); }

function noticeScreen(){
  return shell("사건 발생", "게시물을 40초 동안 관찰한 뒤 첫 판단을 남기세요.", `
  ${incidentCard()}
  <h3>첫 판단</h3><div class="choices">${["사실 같다","거짓 같다","아직 판단할 수 없다"].map(v=>`<label class="choice"><input type="radio" name="firstVerdict" value="${v}" ${state.firstVerdict===v?"checked":""}><span>${v}</span></label>`).join("")}</div>
  <label>가장 수상한 지점<textarea id="suspicion" maxlength="120" placeholder="예: 원문 링크가 없고 계정 철자가 이상하다.">${esc(state.suspicion)}</textarea></label>${actions("검증 질문 만들기")}`, 2);
}

function questionScreen(){
  return shell("무엇을 확인해야 할까?", "정답을 맞히기 전에 검색하거나 자료를 비교해 확인할 수 있는 질문을 만드세요.", `
  <label>팀의 핵심 질문<textarea id="question" maxlength="160" placeholder="어떤 공식 자료를 확인하면 ‘축제가 취소되었다’는 주장이 사실인지 판단할 수 있을까?">${esc(state.question)}</textarea></label>
  <p class="notice">사람을 비난하는 질문보다 ‘자료로 확인할 수 있는 질문’이 좋습니다.</p>${actions("1라운드 시작")}`, 3);
}

function roundScreen(round){
  const data = {
    1:{title:"1라운드 · 출처의 밤",lead:"화면 모양보다 계정·주소·원문이 어디에 있는지 확인하세요.",cards:[incidentCard(), officialCard()],note:"r1",placeholder:"더 믿을 만한 출처와 그 이유를 적으세요."},
    2:{title:"2라운드 · 맥락의 밤",lead:"실제 영상도 앞뒤가 잘리면 다른 뜻으로 사용될 수 있습니다.",cards:[videoCard(), broadcastCard()],note:"r2",placeholder:"영상에서 빠진 맥락과 공유 위험을 적으세요."},
    3:{title:"3라운드 · 확산의 밤",lead:"많이 퍼졌다는 사실이 주장의 신뢰도를 보장하는지 판단하세요.",cards:[spreadCard(), rumorCard()],note:"r3",placeholder:"비정상 확산 징후와 현재 판단을 적으세요."}
  }[round];
  return shell(data.title, data.lead, `<div class="evidence-grid">${data.cards.join("")}${roleClue()}</div>
    <label>팀 조사 메모<textarea id="roundNote" maxlength="260" placeholder="${data.placeholder}">${esc(state.notes[data.note])}</textarea></label>${actions(round===3?"증거 연결":"다음 라운드")}`, 3+round);
}

function knitScreen(){
  const ids=["E01 사칭 계정","E02 잘린 영상","E03 공식 공지","E04 방송 대본","E05 확산 기록","E06 익명 제보"];
  return shell("증거 연결", "최종 판단에 사용할 서로 다른 종류의 단서를 두 개 이상 고르세요.", `
  <div class="check-grid">${ids.map(item=>{const id=item.slice(0,3);return `<label class="check-card"><input type="checkbox" name="evidence" value="${id}" ${state.evidence.includes(id)?"checked":""}><span><strong class="evidence-id">${id}</strong><br>${item.slice(4)}</span></label>`}).join("")}</div>
  <div class="panel"><strong>팀의 질문</strong><p>${esc(state.question || "아직 작성하지 않음")}</p></div>${actions("최종 판정")}`, 7);
}

function finalScreen(){
  const verdicts=["사실","거짓","판단 보류"], tactics=["공식 계정 사칭","영상 맥락 제거","인위적 확산"];
  return shell("최종 판정", "판정·근거·조작 수법·안전한 행동을 한 번에 제출하세요.", `
  <h3>판정</h3><div class="choices">${verdicts.map(v=>`<label class="choice"><input type="radio" name="finalVerdict" value="${v}" ${state.finalVerdict===v?"checked":""}><span>${v}</span></label>`).join("")}</div>
  <h3>조작 수법</h3><div class="check-grid">${tactics.map(v=>`<label class="check-card"><input type="checkbox" name="tactics" value="${v}" ${state.tactics.includes(v)?"checked":""}><span>${v}</span></label>`).join("")}</div>
  <label>안전한 대응문 <span id="count">${state.response.length}/80</span><textarea id="response" maxlength="80" placeholder="공식 공지를 확인하기 전에는 재전송하지 말고…">${esc(state.response)}</textarea></label>${actions("진실 공개")}`, 8);
}

function revealScreen(){ const score=calculateScore(); return shell("진실 공개", "축제는 취소되지 않았습니다. 무대 점검으로 공연 시작만 30분 늦어졌습니다.", `
  <div class="score"><div class="score-ring" style="--score:${score}"><strong>${score}</strong></div><div><p class="tag">팀 근거 점수</p><h3>${score>=80?"근거를 연결한 수사팀":"근거를 더 연결해 보세요"}</h3><p class="lead">정답만이 아니라 출처·맥락·확산·개인정보를 함께 확인했는지 평가했습니다.</p></div></div>
  <div class="truth"><h3>조작의 전모</h3><p>가짜 계정이 안전 점검 영상을 잘라 ‘전면 취소’라고 바꾸었고, 새로 만든 계정들이 같은 문구를 12초 안에 반복했습니다. 공식 홈페이지에는 공연 시작 시간만 변경된다고 안내되어 있었습니다.</p></div>
  <ul class="summary-list"><li><strong>팀 판정:</strong> ${esc(state.finalVerdict || "미제출")}</li><li><strong>선택 근거:</strong> ${esc(state.evidence.join(", ") || "없음")}</li><li><strong>대응문:</strong> ${esc(state.response || "미작성")}</li></ul>${actions("개인 성찰")}`, 9); }

function reflectionScreen(){
  return shell("다음에 무엇을 먼저 확인할까?", "처음 판단이 바뀐 이유와 다음 상황에서 사용할 질문을 남기세요.", `
  <label>나의 다음 질문<textarea id="reflection" maxlength="180" placeholder="다음에 비슷한 게시물을 보면…">${esc(state.reflection)}</textarea></label>
  <div class="actions"><button class="btn ghost" data-action="back">결과 다시 보기</button><button class="btn" data-action="finish">성찰 저장</button></div><p id="formError" class="error" role="alert"></p>`, 9);
}

function finishedScreen(){ return `<section class="panel hero"><span class="tag">수사 종료</span><h2>진실보다 먼저<br>퍼지지 않기.</h2><p>${esc(state.alias)} 수사관의 기록이 이 기기에 저장되었습니다. 실제 수업판에서는 교사 결과판에 팀의 질문·근거·성찰이 함께 모입니다.</p><div class="panel"><strong>나의 다음 질문</strong><p>${esc(state.reflection)}</p></div><div class="actions"><button class="btn secondary" data-action="reset">처음부터 다시</button><a class="btn" href="teacher.html">교사용 화면 보기</a></div></section>`; }

function incidentCard(){ return `<article class="incident"><div class="account"><div class="avatar">별</div><div><strong>별빛중학교 공식 알림</strong><br><small>@starlight_school_offical · 오후 8:41</small></div></div><div class="post">긴급: 내일 예정된 별빛축제가 안전사고로 전면 취소되었습니다. 학생들은 등교하지 말고 이 글을 모든 단체방에 전달해 주세요.</div><div class="metrics">조회 3,842 · 공유 619 · 원문 링크 없음</div></article>`; }
function officialCard(){ return `<article class="evidence-card"><span class="evidence-id">E03 · 공식 홈페이지</span><h3>일부 일정 변경 안내</h3><p>무대 전기 점검으로 공연 시작을 09:30에서 10:00로 변경합니다. 체험 부스와 정상 등교 일정은 변동 없습니다.</p><code>starlight-ms.school.example</code></article>`; }
function videoCard(){ return `<article class="evidence-card"><span class="evidence-id">E02 · 12초 영상</span><h3>“모두 대피 중”</h3><p>안전띠, “지금은 들어오면 안 됩니다”라는 말, 건물 밖으로 이동하는 학생만 보인다. 자막은 “사고로 축제 완전 취소”라고 적혀 있다.</p></article>`; }
function broadcastCard(){ return `<article class="evidence-card"><span class="evidence-id">E04 · 방송 대본</span><h3>점검 후 공연 시작</h3><p>“무대 점검 동안 체육관 밖에서 기다려 주세요. 점검 완료 후 공연을 시작합니다. 축제가 취소된 것은 아닙니다.”</p></article>`; }
function spreadCard(){ return `<article class="evidence-card"><span class="evidence-id">E05 · 확산 기록</span><h3>12초 동안 같은 문장</h3><table class="data-table"><tr><th>계정</th><th>시각</th></tr><tr><td>sky_2201</td><td>20:41:03</td></tr><tr><td>daily_school9</td><td>20:41:07</td></tr><tr><td>hot_issue_77</td><td>20:41:09</td></tr><tr><td>star_news_01</td><td>20:41:12</td></tr></table></article>`; }
function rumorCard(){ return `<article class="evidence-card"><span class="evidence-id">E06 · 익명 제보</span><h3>“친구의 형이 들었대”</h3><p>“정말 큰 사고래. 홈페이지는 숨기고 있는 것 같아. 나도 정확히는 모르지만 일단 퍼뜨려.”</p></article>`; }
function roleClue(){ const r=role(); return `<article class="evidence-card role-clue"><span class="evidence-id">${r.icon} ${r.name} 전용</span><h3>역할 단서</h3><p>${r.clue}</p></article>`; }

function calculateScore(){
  let score=0;
  if(state.finalVerdict==="거짓") score+=30;
  score+=Math.min(40, state.evidence.length*15);
  if(state.tactics.length>=2) score+=10;
  if(/공식|재전송|공유|가리|확인/.test(state.response)) score+=10;
  if(state.response.length>=25) score+=10;
  return Math.min(100, score);
}

function render(){
  const screens = {
    join:joinScreen, role:roleScreen, notice:noticeScreen, question:questionScreen,
    round1:()=>roundScreen(1), round2:()=>roundScreen(2), round3:()=>roundScreen(3),
    knit:knitScreen, final:finalScreen, reveal:revealScreen, reflection:reflectionScreen, finished:finishedScreen
  };
  app.innerHTML = (screens[state.screen] || joinScreen)();
  app.focus({preventScroll:true}); window.scrollTo({top:0,behavior:"smooth"});
}

function error(message){ const el=document.querySelector("#formError"); if(el) el.textContent=message; }
function value(id){ return document.querySelector(id)?.value.trim() || ""; }
function checked(name){ return [...document.querySelectorAll(`[name="${name}"]:checked`)].map(x=>x.value); }

document.addEventListener("input", e=>{
  if(e.target.id==="response") document.querySelector("#count").textContent=`${e.target.value.length}/80`;
});

document.addEventListener("click", e=>{
  const action=e.target.closest("[data-action]")?.dataset.action;
  if(!action) return;
  if(action==="reset"){ localStorage.removeItem(STORAGE_KEY); state={...defaultState}; render(); return; }
  if(action==="join"){
    const sessionCode=value("#sessionCode"), team=value("#team"), alias=value("#alias");
    if(sessionCode!=="2026") return error("시연용 세션 코드는 2026입니다.");
    if(!team || !alias) return error("팀 번호와 별칭을 입력하세요.");
    const roleId=roles[(Number(team.replace("팀",""))-1)%roles.length].id;
    return setState({sessionCode,team,alias,roleId,screen:"role",step:1});
  }
  if(action==="back"){ return goBack(); }
  if(action==="finish"){
    const reflection=value("#reflection"); if(reflection.length<12) return error("성찰을 12자 이상 작성하세요.");
    return setState({reflection,screen:"finished"});
  }
  if(action==="next") return goNext();
});

function goBack(){
  const order=["join","role","notice","question","round1","round2","round3","knit","final","reveal","reflection"];
  const i=order.indexOf(state.screen); if(i>1) setState({screen:order[i-1],step:Math.max(1,state.step-1)});
}
function goNext(){
  if(state.screen==="role") return setState({screen:"notice",step:2});
  if(state.screen==="notice"){
    const firstVerdict=checked("firstVerdict")[0], suspicion=value("#suspicion");
    if(!firstVerdict || suspicion.length<5) return error("첫 판단과 수상한 지점을 5자 이상 적으세요.");
    return setState({firstVerdict,suspicion,screen:"question",step:3});
  }
  if(state.screen==="question"){
    const question=value("#question"); if(question.length<12) return error("확인 가능한 질문을 12자 이상 작성하세요.");
    return setState({question,screen:"round1",step:4});
  }
  if(/^round[123]$/.test(state.screen)){
    const n=Number(state.screen.slice(-1)), note=value("#roundNote"); if(note.length<8) return error("팀 조사 메모를 8자 이상 작성하세요.");
    const notes={...state.notes,[`r${n}`]:note};
    return setState({notes,screen:n===3?"knit":`round${n+1}`,step:state.step+1});
  }
  if(state.screen==="knit"){
    const evidence=checked("evidence"); if(evidence.length<2) return error("서로 다른 단서를 두 개 이상 고르세요.");
    return setState({evidence,screen:"final",step:8});
  }
  if(state.screen==="final"){
    const finalVerdict=checked("finalVerdict")[0], tactics=checked("tactics"), response=value("#response");
    if(!finalVerdict) return error("최종 판정을 선택하세요.");
    if(tactics.length<1) return error("조작 수법을 한 개 이상 선택하세요.");
    if(response.length<25) return error("안전한 대응문을 25자 이상 작성하세요.");
    return setState({finalVerdict,tactics,response,screen:"reveal",step:9});
  }
  if(state.screen==="reveal") return setState({screen:"reflection",step:9});
}

render();

