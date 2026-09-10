const STORAGE_KEY = "excedrinData";
const CURRENT_VERSION = 1;

let data = loadData();
let editMode = null;
let editIndex = -1;

const $ = id => document.getElementById(id);
const listScreen = $("listScreen");
const editScreen = $("editScreen");
const body = $("recordBody");
const emptyMessage = $("emptyMessage");
const dateInput = $("dateInput");
const timeInput = $("timeInput");
const validation = $("validation");

function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return {version: CURRENT_VERSION, records: []};
    const parsed = JSON.parse(raw);
    if(!parsed || !Array.isArray(parsed.records)) return {version: CURRENT_VERSION, records: []};
    return {version: Number(parsed.version)||CURRENT_VERSION, records: parsed.records.map(r=>({
      date: String(r.date||""),
      time: String(r.time||"")
    }))};
  }catch(e){ return {version: CURRENT_VERSION, records: []}; }
}

function saveData(){ 
  data.version = CURRENT_VERSION;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function parseDate(s){
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if(!m) return null;
  const mo=+m[1], d=+m[2], y=+m[3];
  const dt=new Date(y,mo-1,d);
  return dt.getFullYear()===y && dt.getMonth()===mo-1 && dt.getDate()===d ? {y,mo,d} : null;
}
function parseTime(s){
  const m=/^(\d{2}):(\d{2})$/.exec(s);
  if(!m) return null;
  const h=+m[1], min=+m[2];
  return h>=0&&h<=23&&min>=0&&min<=59 ? {h,min} : null;
}
function key(r){
  const d=parseDate(r.date), t=parseTime(r.time);
  return d ? [d.y,d.mo,d.d,t?t.h:0,t?t.min:0] : [-1,-1,-1,-1,-1];
}
function sortedRecords(){
  return data.records.map((r,i)=>({r,i})).sort((a,b)=>{
    const A=key(a.r),B=key(b.r);
    for(let n=0;n<A.length;n++) if(A[n]!==B[n]) return B[n]-A[n];
    return b.i-a.i;
  });
}
function renderList(selectedOriginalIndex=-1){
  body.innerHTML="";
  const sorted=sortedRecords();
  emptyMessage.classList.toggle("hidden", sorted.length!==0);

  const dateCounts = new Map();
  sorted.forEach(({r}) => dateCounts.set(r.date, (dateCounts.get(r.date) || 0) + 1));
  const duplicateDates = new Set(
    [...dateCounts.entries()].filter(([, count]) => count >= 2).map(([date]) => date)
  );
  const dateColors = new Map();
  let colorNumber = 0;
  sorted.forEach(({r}) => {
    if (duplicateDates.has(r.date) && !dateColors.has(r.date)) {
      dateColors.set(r.date, colorNumber % 6);
      colorNumber++;
    }
  });

  sorted.forEach(({r,i})=>{
    const tr=document.createElement("tr");
    if (dateColors.has(r.date)) tr.classList.add("date-group-" + dateColors.get(r.date));
    const td0=document.createElement("td"); td0.className="select-col";
    const radio=document.createElement("input");
    radio.type="radio"; radio.name="selectedRecord"; radio.value=i;
    radio.checked=i===selectedOriginalIndex;
    td0.appendChild(radio);
    const td1=document.createElement("td"); td1.textContent=r.date;
    const td2=document.createElement("td"); td2.textContent=r.time;
    tr.append(td0,td1,td2); body.appendChild(tr);
  });
}
function selectedIndex(){
  const x=document.querySelector('input[name="selectedRecord"]:checked');
  return x ? Number(x.value) : -1;
}
function showList(selected=-1){
  editScreen.classList.add("hidden"); editScreen.setAttribute("aria-hidden","true");
  listScreen.classList.remove("hidden"); renderList(selected);
  document.querySelector("details").open=false;
}
function showEdit(mode,index=-1){
  editMode=mode; editIndex=index;
  listScreen.classList.add("hidden");
  editScreen.classList.remove("hidden"); editScreen.setAttribute("aria-hidden","false");
  $("editTitle").textContent=mode==="add"?"Add":"Change";
  validation.textContent="";
  if(mode==="add"){
    const now=new Date();
    dateInput.value=fmtDate(now);
    timeInput.value=fmtTime(now);
  }else{
    dateInput.value=data.records[index].date;
    timeInput.value=data.records[index].time;
  }
  setTimeout(()=>dateInput.focus(),0);
}
function fmtDate(d){return String(d.getMonth()+1).padStart(2,"0")+"/"+String(d.getDate()).padStart(2,"0")+"/"+d.getFullYear()}
function fmtTime(d){return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")}

function maskDate(el){
  const old=el.value, pos=el.selectionStart||0;
  let digits=old.replace(/\D/g,"").slice(0,8);
  let out="";
  if(digits.length>0) out=digits.slice(0,2);
  if(digits.length>2) out+="/"+digits.slice(2,4);
  if(digits.length>4) out+="/"+digits.slice(4,8);
  el.value=out;
  const target=Math.min(out.length, pos + ((pos===2||pos===5)?1:0));
  try{el.setSelectionRange(target,target)}catch(_){}
}
function maskTime(el){
  const old=el.value, pos=el.selectionStart||0;
  let digits=old.replace(/\D/g,"").slice(0,4);
  let out=digits.slice(0,2)+(digits.length>2?":"+digits.slice(2):"");
  el.value=out;
  const target=Math.min(out.length,pos+(pos===2?1:0));
  try{el.setSelectionRange(target,target)}catch(_){}
}
dateInput.addEventListener("input",()=>maskDate(dateInput));
timeInput.addEventListener("input",()=>maskTime(timeInput));
dateInput.addEventListener("keydown",e=>{if(e.key==="Enter")$("saveBtn").click()});
timeInput.addEventListener("keydown",e=>{if(e.key==="Enter")$("saveBtn").click()});

$("saveBtn").onclick=()=>{
  maskDate(dateInput); maskTime(timeInput);
  const d=parseDate(dateInput.value), t=parseTime(timeInput.value);
  if(!d){validation.textContent="Please enter a valid date (mm/dd/yyyy).";return}
  if(!t){validation.textContent="Please enter a valid time (hh:mm).";return}
  const record={date:dateInput.value,time:timeInput.value};
  if(editMode==="add"){
    data.records.push(record); saveData();
    const newIndex=data.records.length-1; showList(newIndex);
  }else{
    data.records[editIndex]=record; saveData(); showList(editIndex);
  }
};
$("cancelBtn").onclick=()=>showList();

function appDialog(message, actions, content=""){
  $("dialogMessage").textContent=message;
  $("dialogContent").innerHTML=content;
  const wrap=document.createElement("div"); wrap.className="dialog-actions";
  actions.forEach(a=>{
    const b=document.createElement("button"); b.textContent=a.label;
    if(a.primary)b.className="primary";
    b.onclick=()=>{hideDialog(); a.onClick&&a.onClick()};
    wrap.appendChild(b);
  });
  $("dialogContent").appendChild(wrap);
  $("dialog").classList.remove("hidden");
}
function hideDialog(){$("dialog").classList.add("hidden");$("dialogContent").innerHTML=""}

function doChange(){
  const i=selectedIndex();
  if(i<0){appDialog("Please select a record.",[{label:"OK",primary:true}]);return}
  showEdit("change",i);
}
function doDelete(){
  const i=selectedIndex();
  if(i<0){appDialog("Please select a record.",[{label:"OK",primary:true}]);return}
  appDialog("Are you sure?",[
    {label:"Yes",primary:true,onClick:()=>{data.records.splice(i,1);saveData();showList()}},
    {label:"Cancel"}
  ]);
}
function doImport(){
  appDialog("",[
    {label:"Import",primary:true,onClick:()=>fileInput.click()},
    {label:"Cancel"}
  ],'<label class="import-label" for="fileInput">CSV file</label>');
}
const fileInput=$("fileInput");
fileInput.onchange=async()=>{
  const file=fileInput.files[0]; fileInput.value="";
  if(!file)return;
  try{
    const text=await file.text();
    const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/).filter(x=>x.trim()!=="");
    if(!lines.length) throw new Error("The CSV file is empty.");
    let start=0;
    const first=lines[0].trim().toLowerCase();
    if(first==="date,time") start=1;
    const records=[];
    for(let n=start;n<lines.length;n++){
      const parts=splitCSVLine(lines[n]);
      if(parts.length!==2) throw new Error("Invalid CSV format.");
      const date=parts[0].trim(),time=parts[1].trim();
      if(!parseDate(date)||!parseTime(time)) throw new Error("Invalid Date or Time in CSV.");
      records.push({date,time});
    }
    data={version:CURRENT_VERSION,records}; saveData(); renderList();
  }catch(e){
    appDialog(e.message||"Import failed.",[{label:"OK",primary:true}]);
  }
};
function splitCSVLine(line){
  // Handles the simple two-column CSV required by this app, including quoted values.
  const m=line.match(/^\s*(?:"([^"]*)"|([^,]*))\s*,\s*(?:"([^"]*)"|([^,]*))\s*$/);
  return m ? [m[1]??m[2]??"",m[3]??m[4]??""] : [];
}
function csvEscape(s){return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function doExport(){
  const lines=["Date,Time"];
  data.records.forEach(r=>lines.push(csvEscape(r.date)+","+csvEscape(r.time)));
  const blob=new Blob([lines.join("\r\n")+"\r\n"],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="Excedrin.csv";
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function doQuit(){
  appDialog("The supporting page can be manually closed.",[{label:"OK",primary:true}]);
}

document.querySelectorAll(".menu button").forEach(btn=>{
  btn.onclick=()=>{
    // Close the File menu before displaying another screen or dialog.
    document.querySelector("details").open=false;
    const action=btn.dataset.action;
    if(action==="add")showEdit("add");
    if(action==="change")doChange();
    if(action==="delete")doDelete();
    if(action==="import")doImport();
    if(action==="export")doExport();
    if(action==="quit")doQuit();
  };
});
renderList();
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
