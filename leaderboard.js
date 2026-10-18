"use strict";
(() => {
  // Public TEST endpoint only. Different difficulties have separate score rankings.
  const API = "https://one-more-pixel-online-staging.games-tinychaos.workers.dev/api/v1/test/leaderboard";
  const list = document.getElementById("ranking-entries");
  const status = document.getElementById("ranking-status");
  const refresh = document.getElementById("ranking-refresh");
  const updated = document.getElementById("ranking-updated");
  const expand = document.getElementById("ranking-expand");
  const tabs = [...document.querySelectorAll("[data-ranking-difficulty]")];
  if (!list || !status || !refresh || !updated || !expand || tabs.length !== 4) return;

  const text = {
    pl:{loading:"ŁADOWANIE",loadingTitle:"Ładowanie rankingu…",loadingBody:"Pobieranie wyników testowych.",
      emptyTitle:"Brak wyników testowych.",emptyBody:"Nie ma jeszcze aktywnych wyników w tej kategorii.",
      badTitle:"Brak poprawnych wyników.",badBody:"Spróbuj ponownie później.",
      unavailable:"NIEDOSTĘPNY",unavailableTitle:"Ranking chwilowo niedostępny.",
      unavailableBody:"Spróbuj ponownie później. To nie są oficjalne wyniki.",
      retry:"Nie udało się odświeżyć",live:"TEST NA ŻYWO",updated:"Aktualizacja",
      anonymous:"TEST PLAYER #",full:"ZOBACZ PEŁNY RANKING",collapse:"ZWIŃ RANKING",
      mixed:"Wyniki według poziomu — bez wspólnej klasyfikacji"},
    en:{loading:"LOADING",loadingTitle:"Loading leaderboard…",loadingBody:"Fetching public test scores.",
      emptyTitle:"No test scores yet.",emptyBody:"No active scores in this category.",
      badTitle:"No displayable scores.",badBody:"Please try again later.",
      unavailable:"UNAVAILABLE",unavailableTitle:"Leaderboard temporarily unavailable.",
      unavailableBody:"Please try again later. These are not official scores.",
      retry:"Could not refresh",live:"LIVE TEST",updated:"Updated",
      anonymous:"TEST PLAYER #",full:"SEE FULL LEADERBOARD",collapse:"COLLAPSE LEADERBOARD",
      mixed:"Results by difficulty — no combined ranking"}
  };
  let lang = document.documentElement.lang === "en" ? "en" : "pl";
  let difficulty = "all", controller = null, requestId = 0;
  let state = "loading", records = {}, updatedAt = null, expanded = false;
  const modes = ["easy","normal","hard"];
  const number = new Intl.NumberFormat("en-US");
  const t = key => text[lang][key];

  function placeholder(title,description){
    list.replaceChildren();
    const wrap=document.createElement("div");wrap.className="ranking-placeholder";
    const h=document.createElement("h3");h.textContent=title;
    const p=document.createElement("p");p.textContent=description;
    wrap.append(h,p);list.append(wrap);
  }
  function entriesFrom(payload){
    if(Array.isArray(payload?.entries))return payload.entries;
    if(Array.isArray(payload?.leaderboard?.entries))return payload.leaderboard.entries;
    if(Array.isArray(payload?.data?.entries))return payload.data.entries;
    return null;
  }
  function appendRow(target,entry,index){
    if(!entry||typeof entry!=="object")return;
    const score=Number(entry.score);
    if(!Number.isSafeInteger(score)||score<0)return;
    const position=Number(entry.position);
    const row=document.createElement("div");row.className="ranking-entry";
    const rank=document.createElement("span");rank.className="ranking-entry-rank";
    rank.textContent="#"+(Number.isSafeInteger(position)&&position>0?position:index+1);
    const player=document.createElement("span");player.className="ranking-entry-player";
    const alias=entry.pixel_id;
    player.textContent=typeof alias==="string"&&alias.trim()?alias.trim().slice(0,64):t("anonymous")+(index+1);
    const points=document.createElement("span");points.className="ranking-entry-score";points.textContent=number.format(score);
    row.append(rank,player,points);target.append(row);
  }
  function render(){
    list.replaceChildren();
    const fragment=document.createDocumentFragment();
    if(difficulty==="all"){
      const info=document.createElement("div");info.className="ranking-group-note";info.textContent=t("mixed");fragment.append(info);
      for(const mode of modes){
        const rows=records[mode]||[];
        const label=document.createElement("div");label.className="ranking-group-label";label.textContent=mode.toUpperCase();fragment.append(label);
        const shown=expanded?100:2;
        rows.slice(0,shown).forEach((entry,index)=>appendRow(fragment,entry,index));
        if(!rows.length){
          const p=document.createElement("div");p.className="ranking-group-empty";p.textContent=t("emptyTitle");fragment.append(p);
        }
      }
    } else {
      (records[difficulty]||[]).slice(0,expanded?100:5).forEach((entry,index)=>appendRow(fragment,entry,index));
    }
    if(fragment.childNodes.length)list.append(fragment);
    else placeholder(t("emptyTitle"),t("emptyBody"));
  }
  function paint(){
    expand.textContent=expanded?t("collapse"):t("full");
    expand.setAttribute("aria-expanded",String(expanded));
    expand.dataset.i18n=expanded?"collapseRanking":"fullRanking";
    if(state==="loading"){
      status.textContent=t("loading");updated.textContent=t("loadingTitle");
      placeholder(t("loadingTitle"),t("loadingBody"));
    }else if(state==="error"){
      status.textContent=t("unavailable");updated.textContent=t("retry");
      placeholder(t("unavailableTitle"),t("unavailableBody"));
    }else{
      status.textContent=t("live");
      updated.textContent=t("updated")+" "+(updatedAt||new Date()).toLocaleTimeString(lang==="pl"?"pl-PL":"en-US",{hour:"2-digit",minute:"2-digit"});
      render();
    }
  }
  async function fetchMode(mode,signal){
    const url=new URL(API);url.searchParams.set("difficulty",mode);url.searchParams.set("limit","100");
    const response=await fetch(url.toString(),{method:"GET",mode:"cors",credentials:"omit",cache:"no-store",signal,headers:{"Accept":"application/json"}});
    if(!response.ok)throw new Error("HTTP "+response.status);
    const payload=await response.json();
    const entries=entriesFrom(payload);
    if(!entries)throw new Error("Unexpected response format");
    return entries;
  }
  async function load(){
    controller?.abort();
    const own=new AbortController();controller=own;
    const id=++requestId;state="loading";refresh.disabled=true;paint();
    const timeout=setTimeout(()=>own.abort(),10000);
    try{
      const requested=difficulty==="all"?modes:[difficulty];
      const values=await Promise.all(requested.map(mode=>fetchMode(mode,own.signal)));
      if(id!==requestId)return;
      requested.forEach((mode,index)=>{records[mode]=values[index]});
      state="ready";updatedAt=new Date();paint();
    }catch(error){
      if(id!==requestId)return;
      state="error";paint();
      if(!own.signal.aborted)console.warn("Public test leaderboard:",error instanceof Error?error.message:"Request failed");
    }finally{
      clearTimeout(timeout);
      if(id===requestId){controller=null;refresh.disabled=false}
    }
  }
  function selectDifficulty(next){
    if(next!=="all"&&!modes.includes(next))return;
    difficulty=next;expanded=false;
    for(const tab of tabs){
      const selected=tab.dataset.rankingDifficulty===next;
      tab.setAttribute("aria-selected",String(selected));tab.tabIndex=selected?0:-1;
    }
    load();
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener("click",()=>selectDifficulty(tab.dataset.rankingDifficulty));
    tab.addEventListener("keydown",event=>{
      if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
      event.preventDefault();
      const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:(index+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;
      tabs[next].focus();selectDifficulty(tabs[next].dataset.rankingDifficulty);
    });
  });
  refresh.addEventListener("click",load);
  expand.addEventListener("click",()=>{expanded=!expanded;paint();if(expanded)list.scrollTop=0});
  document.addEventListener("tinychaos:language",event=>{
    lang=event.detail?.language==="en"?"en":"pl";
    paint();
  });
  load();
  window.setInterval(()=>{if(!document.hidden&&!controller)load()},60000);
})();
