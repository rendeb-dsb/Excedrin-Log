const KEY="excedrinData", DB_NAME="ExcedrinDB", DB_VERSION=1, STORE_NAME="records", VERSION=14;
let data={version:VERSION,records:[]},editMode=null,editIndex=-1;
const $=id=>document.getElementById(id);
const fileButton=$("fileButton"),fileMenu=$("fileMenu"),listScreen=$("listScreen"),editScreen=$("editScreen");
const dateInput=$("dateInput"),timeInput=$("timeInput"),validation=$("validation");

function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME,{keyPath:"id",autoIncrement:true})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error("Unable to open the Excedrin database."))})}
function dbGetAll(db){return new Promise((resolve,reject)=>{const req=db.transaction(STORE_NAME,"readonly").objectStore(STORE_NAME).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error||new Error("Unable to read the Excedrin database."))})}
function dbReplaceAll(db,records){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE_NAME,"readwrite"),store=tx.objectStore(STORE_NAME);store.clear();records.forEach(r=>store.add({date:r.date,time:r.time}));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("Unable to save Excedrin data."));tx.onabort=()=>reject(tx.error||new Error("Unable to save Excedrin data."))})}
async function migrateLegacy(db,records){if(records.length)return;try{const raw=localStorage.getItem(KEY);if(!raw)return;const old=JSON.parse(raw);if(old&&Array.isArray(old.records)&&old.records.length){await dbReplaceAll(db,old.records);}}catch(e){throw new Error("The existing Excedrin data could not be safely migrated. No data was discarded.")}}
async function initializeStorage(){if(!window.indexedDB)throw new Error("Persistent storage is unavailable. Excedrin will not start without persistent storage.");const db=await openDB();let records=await dbGetAll(db);await migrateLegacy(db,records);records=await dbGetAll(db);data={version:VERSION,records:records.map(r=>({date:r.date,time:r.time}))};return db}
let dbPromise=initializeStorage();
async function persist(){const db=await dbPromise;await dbReplaceAll(db,data.records);try{localStorage.setItem(KEY,JSON.stringify({version:VERSION,records:data.records}))}catch(e){/* IndexedDB is the authoritative store. */}}

function closeMenu(){fileMenu.classList.add("hidden");fileButton.setAttribute("aria-expanded","false")}
fileButton.onclick=e=>{e.stopPropagation();const closed=fileMenu.classList.contains("hidden");if(closed){fileMenu.classList.remove("hidden");fileButton.setAttribute("aria-expanded","true")}else closeMenu()};
document.addEventListener("click",e=>{if(!fileMenu.contains(e.target)&&e.target!==fileButton)closeMenu()});

function dateObj(s){const m=/^(\d\d)\/(\d\d)\/(\d{4})$/.exec(s);if(!m)return null;const mo=+m[1],d=+m[2],y=+m[3],x=new Date(y,mo-1,d);return x.getFullYear()===y&&x.getMonth()===mo-1&&x.getDate()===d?{y,mo,d}:null}
function timeObj(s){const m=/^(\d\d):(\d\d)$/.exec(s);if(!m)return null;const h=+m[1],n=+m[2];return h<24&&n<60?{h,n}:null}
function stamp(r){const d=dateObj(r.date),t=timeObj(r.time);return d?[d.y,d.mo,d.d,t?t.h:0,t?t.n:0]:[-1,-1,-1,-1,-1]}
function recordsSorted(){return data.records.map((r,i)=>({r,i})).sort((a,b)=>{const A=stamp(a.r),B=stamp(b.r);for(let j=0;j<5;j++)if(A[j]!==B[j])return B[j]-A[j];return b.i-a.i})}

function updateTimeSince(){
 const el=$("timeSince");
 if(!data.records.length){el.textContent="Time since last use: 00:00:00";return}
 const rows=recordsSorted();
 const latest=rows[0]?.r;
 if(!latest){el.textContent="Time since last use: 00:00:00";return}
 const d=dateObj(latest.date),t=timeObj(latest.time);
 if(!d||!t){el.textContent="Time since last use: 00:00:00";return}
 const last=new Date(d.y,d.mo-1,d.d,t.h,t.n,0,0);
 const now=new Date();
 let diff=now-last;
 if(diff<0)diff=0;
 const totalMinutes=Math.floor(diff/60000);
 const days=Math.floor(totalMinutes/1440);
 const hours=Math.floor((totalMinutes%1440)/60);
 const minutes=totalMinutes%60;
 el.textContent=`Time since last use: ${String(days).padStart(2,"0")}:${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}`;
}

function render(selected=-1){
 const rows=recordsSorted(), body=$("recordBody");body.innerHTML="";
 const counts=new Map();rows.forEach(x=>counts.set(x.r.date,(counts.get(x.r.date)||0)+1));
 const colors=new Map();let c=0;rows.forEach(x=>{if(counts.get(x.r.date)>=2&&!colors.has(x.r.date))colors.set(x.r.date,c++%6)});
 $("emptyMessage").classList.toggle("hidden",rows.length>0);
 rows.forEach(x=>{const tr=document.createElement("tr");if(colors.has(x.r.date))tr.className="date-group-"+colors.get(x.r.date);
 const a=document.createElement("td"),r=document.createElement("input");r.type="radio";r.name="selected";r.value=x.i;r.checked=x.i===selected;a.append(r);
 const day=document.createElement("td");
 const parsed=dateObj(x.r.date);
 const dayNames=["Su","Mo","Tu","We","Th","Fr","Sa"];
 day.textContent=parsed?dayNames[new Date(parsed.y,parsed.mo-1,parsed.d).getDay()]:"";
 const d=document.createElement("td");d.textContent=x.r.date;
 const t=document.createElement("td");t.textContent=x.r.time;
 tr.append(a,day,d,t);body.append(tr)})
 updateTimeSince();
}
function selected(){const r=document.querySelector('input[name="selected"]:checked');return r?+r.value:-1}
function list(){closeMenu();editScreen.classList.add("hidden");listScreen.classList.remove("hidden");render()}
function showEdit(mode,i=-1){closeMenu();editMode=mode;editIndex=i;listScreen.classList.add("hidden");editScreen.classList.remove("hidden");validation.textContent="";
 $("editTitle").textContent=mode==="add"?"Add":"Change";
 if(mode==="add"){const n=new Date();dateInput.value=String(n.getMonth()+1).padStart(2,"0")+"/"+String(n.getDate()).padStart(2,"0")+"/"+n.getFullYear();timeInput.value=String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0")}
 else{dateInput.value=data.records[i].date;timeInput.value=data.records[i].time} setTimeout(()=>dateInput.focus(),50)}
function maskDate(){let d=dateInput.value.replace(/\D/g,"").slice(0,8);dateInput.value=d.slice(0,2)+(d.length>2?"/"+d.slice(2,4):"")+(d.length>4?"/"+d.slice(4,8):"")}
function maskTime(){let d=timeInput.value.replace(/\D/g,"").slice(0,4);timeInput.value=d.slice(0,2)+(d.length>2?":"+d.slice(2):"")}

// Masked editing: slashes/colon are fixed, while digits can be replaced directly.
// Backspace/Delete clear a digit instead of deleting a separator.
function protectSeparator(input,separators){
  input.addEventListener("keydown",e=>{
    const start=input.selectionStart??0,end=input.selectionEnd??0;

    if(/^\d$/.test(e.key)&&start===end){
      let pos=start;
      if(pos<input.value.length&&separators.includes(input.value[pos]))pos++;
      if(pos<input.value.length){
        e.preventDefault();
        input.value=input.value.slice(0,pos)+e.key+input.value.slice(pos+1);
        let next=pos+1;
        while(next<input.value.length&&separators.includes(input.value[next]))next++;
        input.setSelectionRange(next,next);
      }
      return;
    }

    if(e.key!=="Backspace"&&e.key!=="Delete")return;
    let value=input.value;
    if(start!==end){
      e.preventDefault();
      const chars=value.split("");
      for(let i=start;i<end&&i<chars.length;i++)if(!separators.includes(chars[i]))chars[i]="_";
      input.value=chars.join("");
      input.setSelectionRange(start,start);
      return;
    }

    let pos=-1;
    if(e.key==="Backspace"){
      pos=start-1;
      if(pos>=0&&separators.includes(value[pos]))pos--;
    }else{
      pos=start;
      if(pos<value.length&&separators.includes(value[pos]))pos++;
    }
    if(pos>=0&&pos<value.length&&!separators.includes(value[pos])){
      e.preventDefault();
      input.value=value.slice(0,pos)+"_"+value.slice(pos+1);
      const caret=e.key==="Backspace"?pos:Math.min(pos+1,input.value.length);
      input.setSelectionRange(caret,caret);
    }else{
      e.preventDefault();
    }
  });
}
protectSeparator(dateInput,["/"]);
protectSeparator(timeInput,[":"]);
dateInput.oninput=maskDate;timeInput.oninput=maskTime;
$("saveBtn").onclick=()=>{maskDate();maskTime();if(!dateObj(dateInput.value)){validation.textContent="Please enter a valid date (mm/dd/yyyy).";return}if(!timeObj(timeInput.value)){validation.textContent="Please enter a valid time (hh:mm).";return}
 const r={date:dateInput.value,time:timeInput.value};
 if(editMode==="add"){
   data.records.push(r);const i=data.records.length-1;
   persist().then(()=>{closeMenu();listScreen.classList.remove("hidden");editScreen.classList.add("hidden");render(i)}).catch(e=>{data.records.pop();validation.textContent=e.message||"Unable to save the record."});
 }else{
   const old=data.records[editIndex];data.records[editIndex]=r;
   persist().then(()=>list()).catch(e=>{data.records[editIndex]=old;validation.textContent=e.message||"Unable to save the record."});
 }
};
$("cancelBtn").onclick=list;

function dialog(message,buttons,html=""){closeMenu();$("dialogMessage").textContent=message;$("dialogContent").innerHTML=html;const a=document.createElement("div");a.className="dialog-actions";buttons.forEach(x=>{const b=document.createElement("button");b.textContent=x.label;b.onclick=()=>{hideDialog();x.fn&&x.fn()};a.append(b)});$("dialogContent").append(a);$("dialog").classList.remove("hidden")}
function hideDialog(){$("dialog").classList.add("hidden");$("dialogContent").innerHTML=""}

function doChange(){const i=selected();if(i<0)return dialog("Please select a record.",[{label:"OK"}]);showEdit("change",i)}
function doDelete(){
 const i=selected();
 if(i<0)return dialog("Please select a record.",[{label:"OK"}]);
 dialog("Are you sure?",[
   {label:"Yes",fn:()=>{
     const old=data.records.slice();data.records.splice(i,1);
     persist().then(()=>render()).catch(e=>{data.records=old;dialog(e.message||"Unable to delete the record.",[{label:"OK"}])});
   }},
   {label:"Cancel"}
 ]);
}
const fileInput=$("fileInput");
function doImport(){dialog("",[{label:"Import",fn:()=>fileInput.click()},{label:"Cancel"}],'<label>Select CSV file</label>')}
fileInput.onchange=async()=>{const f=fileInput.files[0];fileInput.value="";if(!f)return;try{let lines=(await f.text()).replace(/^\uFEFF/,"").split(/\r?\n/).filter(x=>x.trim());if(lines[0]?.trim().toLowerCase()==="date,time")lines.shift();if(!lines.length)throw Error("Import failed. No data records were found in the CSV file.");const rec=[];for(let n=0;n<lines.length;n++){const line=lines[n],p=line.split(","),date=p[0]?.trim()||"",time=p[1]?.trim()||"";let reason="";if(p.length!==2){reason="The record must contain exactly two comma-separated fields: Date and Time."}else if(!dateObj(date)&&!timeObj(time)){reason="The Date and Time values are both invalid."}else if(!dateObj(date)){reason="The Date value is invalid; expected mm/dd/yyyy."}else if(!timeObj(time)){reason="The Time value is invalid; expected hh:mm in 24-hour format."}if(reason){throw Error(`Import error — Record ${n+1}:\n${line}\nReason: ${reason}`)}rec.push({date,time})}const old=data.records.slice();data.records=rec;await persist();render()}catch(e){dialog(e.message||"Import failed.",[{label:"OK"}])}}
function doExport(){const text="Date,Time\r\n"+data.records.map(r=>r.date+","+r.time).join("\r\n")+"\r\n";const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/csv"}));a.download="Excedrin.csv";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function doQuit(){dialog("The supporting page can be manually closed.",[{label:"OK"}])}

fileMenu.querySelectorAll("button").forEach(b=>b.onclick=e=>{e.stopPropagation();closeMenu();const a=b.dataset.action;if(a==="add")showEdit("add");if(a==="change")doChange();if(a==="delete")doDelete();if(a==="import")doImport();if(a==="export")doExport();if(a==="quit")doQuit()});
const versionLabel=$("versionLabel"); if(versionLabel) versionLabel.textContent="v"+VERSION;
dbPromise.then(()=>render()).catch(e=>{document.body.innerHTML="<div style=\"padding:24px;font:18px Arial,sans-serif\"><h2>Excedrin could not start safely</h2><p>"+String(e.message||e)+"</p><p>No records were deleted.</p></div>"});
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("sw.js").then(reg=>{
    try { reg.update(); } catch(e) {}
  }).catch(()=>{});
}
