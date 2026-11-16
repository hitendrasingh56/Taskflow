const STORAGE_KEY = "taskflow_tasks_v1";
const $ = (id) => document.getElementById(id);
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const parseDate = (iso) => { const [y,m,d] = iso.split("-").map(Number); return new Date(y,m-1,d); };
const fmt = (iso, options={day:"numeric",month:"short"}) => parseDate(iso).toLocaleDateString("en-IN", options);
const sameMonth = (a,b) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth();
let tasks = loadTasks();
let currentView = "overview";
let activeFilter = "all";
let miniMonth = new Date(new Date().getFullYear(),new Date().getMonth(),1);
let calendarMonth = new Date(new Date().getFullYear(),new Date().getMonth(),1);
let selectedDate = todayISO();
let toastTimer;

function loadTasks(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function persist(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks)); }
function escapeHTML(s=""){ return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function statusOf(t){ if(t.completed)return "completed"; if(t.dueDate<todayISO())return "overdue"; if(t.dueDate===todayISO())return "today"; return "pending"; }
function dueText(t){ const s=statusOf(t); if(s==="completed")return `Completed · due ${fmt(t.dueDate)}`; if(s==="overdue")return `Overdue · ${fmt(t.dueDate)}`; if(s==="today")return "Due today"; return `Due ${fmt(t.dueDate,{day:"numeric",month:"short",year:"numeric"})}`; }
function showToast(msg){ const el=$("toast"); el.textContent=msg; el.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove("show"),2300); }
function updateStats(){
  const total=tasks.length, completed=tasks.filter(t=>t.completed).length, today=tasks.filter(t=>!t.completed&&t.dueDate===todayISO()).length, overdue=tasks.filter(t=>!t.completed&&t.dueDate<todayISO()).length, pending=tasks.filter(t=>!t.completed).length;
  const pct=total?Math.round(completed/total*100):0;
  $("totalStat").textContent=total; $("todayStat").textContent=today; $("overdueStat").textContent=overdue; $("completedStat").textContent=completed;
  $("completionCaption").textContent=`${pct}% completion rate`; $("progressPercent").textContent=`${pct}%`; $("progressFill").style.width=`${pct}%`;
  $("progressMessage").textContent=total===0?"Add your first task and start building momentum.":completed===total?"Wonderful work — you’ve completed everything!":`${pending} task${pending===1?"":"s"} still in progress. Keep going!`;
  $("allNavCount").textContent=total;
}
function renderTask(t){
  const s=statusOf(t);
  return `<div class="task-row" data-id="${t.id}">
    <button class="check-btn ${t.completed?"checked":""}" data-action="toggle" aria-label="${t.completed?"Mark incomplete":"Mark complete"}">${t.completed?"✓":""}</button>
    <div class="task-main"><div class="task-title ${t.completed?"done":""}">${escapeHTML(t.title)}</div>${t.description?`<div class="task-desc">${escapeHTML(t.description)}</div>`:""}
    <div class="task-meta"><span class="due-label ${s==="overdue"?"overdue":s==="today"?"today":""}">${dueText(t)}</span><span class="priority ${t.priority}">${t.priority} priority</span></div></div>
    <div class="task-actions"><button class="tiny-action" data-action="edit" title="Edit task" aria-label="Edit task">✎</button><button class="tiny-action" data-action="delete" title="Delete task" aria-label="Delete task">×</button></div>
  </div>`;
}
function getVisibleTasks(){
  let list=[...tasks];
  if(activeFilter==="pending")list=list.filter(t=>!t.completed);
  if(activeFilter==="today")list=list.filter(t=>!t.completed&&t.dueDate===todayISO());
  if(activeFilter==="overdue")list=list.filter(t=>!t.completed&&t.dueDate<todayISO());
  if(activeFilter==="completed")list=list.filter(t=>t.completed);
  const q=$("taskSearch").value.trim().toLowerCase();
  if(q)list=list.filter(t=>(t.title+" "+t.description).toLowerCase().includes(q));
  const sort=$("taskSort").value;
  list.sort((a,b)=>sort==="created"?b.createdAt-a.createdAt:sort==="priority"?({high:0,medium:1,low:2}[a.priority]-{high:0,medium:1,low:2}[b.priority]):a.dueDate.localeCompare(b.dueDate));
  if(currentView==="overview"&&activeFilter==="all")list=list.filter(t=>!t.completed).slice(0,7);
  return list;
}
function renderTasks(){
  const list=getVisibleTasks();
  $("taskList").innerHTML=list.map(renderTask).join("");
  $("emptyState").classList.toggle("hidden",list.length!==0);
  $("taskList").classList.toggle("hidden",list.length===0);
  $("taskListTitle").textContent=activeFilter==="all"?(currentView==="overview"?"Tasks to focus on":"All tasks"):({pending:"Pending tasks",today:"Tasks due today",overdue:"Overdue tasks",completed:"Completed tasks"}[activeFilter]);
  $("viewAllBtn").classList.toggle("hidden",currentView!=="overview"||activeFilter!=="all");
}
function renderMiniCalendar(){
  const y=miniMonth.getFullYear(),m=miniMonth.getMonth(); $("miniMonthLabel").textContent=miniMonth.toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  const first=new Date(y,m,1), start=(first.getDay()+6)%7, days=new Date(y,m+1,0).getDate(), prevDays=new Date(y,m,0).getDate();
  let html=["M","T","W","T","F","S","S"].map(x=>`<div class="calendar-day-name">${x}</div>`).join("");
  for(let i=0;i<42;i++){let day,dt,other=false;if(i<start){day=prevDays-start+i+1;dt=new Date(y,m-1,day);other=true}else if(i>=start+days){day=i-start-days+1;dt=new Date(y,m+1,day);other=true}else{day=i-start+1;dt=new Date(y,m,day)}
    const iso=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
    const has=tasks.some(t=>t.dueDate===iso&&!t.completed),today=iso===todayISO();
    html+=`<button class="calendar-cell ${other?"muted-day":""} ${today?"is-today":""} ${selectedDate===iso?"selected":""}" data-date="${iso}">${day}${has?'<i class="day-dot"></i>':""}</button>`;
  }
  $("miniCalendar").innerHTML=html;
}
function renderUpcoming(){
  const list=tasks.filter(t=>!t.completed&&t.dueDate>=todayISO()).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,3);
  $("upcomingList").innerHTML=list.length?list.map(t=>`<div class="upcoming-item"><div class="upcoming-date">${parseDate(t.dueDate).toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</div><div class="upcoming-info"><strong>${escapeHTML(t.title)}</strong><small>${t.dueDate===todayISO()?"Due today": "Upcoming task"}</small></div><i class="upcoming-priority" style="background:${t.priority==="high"?"#d95b62":t.priority==="medium"?"#d88a27":"#159b72"}"></i></div>`).join(""):'<div class="empty-day">No upcoming tasks. Enjoy the breathing room!</div>';
}
function renderFullCalendar(){
  const y=calendarMonth.getFullYear(),m=calendarMonth.getMonth(); $("fullMonthLabel").textContent=calendarMonth.toLocaleDateString("en-IN",{month:"long",year:"numeric"});
  const first=new Date(y,m,1),start=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate(),prevDays=new Date(y,m,0).getDate();
  let html=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(x=>`<div class="calendar-day-name">${x}</div>`).join("");
  for(let i=0;i<42;i++){let day,dt,other=false;if(i<start){day=prevDays-start+i+1;dt=new Date(y,m-1,day);other=true}else if(i>=start+days){day=i-start-days+1;dt=new Date(y,m+1,day);other=true}else{day=i-start+1;dt=new Date(y,m,day)}
    const iso=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")}`;
    const dayTasks=tasks.filter(t=>t.dueDate===iso).slice(0,3);
    html+=`<button class="calendar-cell ${other?"muted-day":""} ${iso===todayISO()?"is-today":""} ${selectedDate===iso?"selected":""}" data-date="${iso}"><span class="cell-number">${day}</span>${dayTasks.map(t=>`<span class="calendar-task-pill ${t.completed?"completed-pill":statusOf(t)==="overdue"?"overdue-pill":""}">${escapeHTML(t.title)}</span>`).join("")}${tasks.filter(t=>t.dueDate===iso).length>3?`<span class="cell-number">+${tasks.filter(t=>t.dueDate===iso).length-3} more</span>`:""}</button>`;
  }
  $("fullCalendar").innerHTML=html; renderSelectedDate();
}
function renderSelectedDate(){
  $("selectedDateLabel").textContent=parseDate(selectedDate).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const list=tasks.filter(t=>t.dueDate===selectedDate);
  $("selectedDateTasks").innerHTML=list.length?list.map(t=>`<span class="calendar-task-pill ${t.completed?"completed-pill":""}">${t.completed?"✓ ":""}${escapeHTML(t.title)}</span>`).join(""):'<span class="empty-day">No tasks scheduled for this date.</span>';
}
function renderAll(){updateStats();renderTasks();renderMiniCalendar();renderUpcoming();renderFullCalendar();}
function setView(view){
  currentView=view; activeFilter="all";
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $("overviewContent").classList.toggle("hidden",view==="calendar");
  $("statsGrid").classList.toggle("hidden",view==="calendar");
  $("statsGrid").classList.toggle("hidden",view==="all");
  $("progressPanel")?.classList.toggle("hidden",view==="calendar");
  $("calendarView").classList.toggle("hidden",view!=="calendar");
  $("pageTitle").textContent=view==="calendar"?"Your calendar":view==="all"?"All your tasks":greetingText();
  $("breadcrumbCurrent").textContent=view==="calendar"?"Calendar":view==="all"?"All tasks":"Overview";
  $("pageSubtitle").textContent=view==="calendar"?"A clear view of what’s coming up.":view==="all"?"Everything you’re tracking, all in one place.":"Here’s what’s happening with your tasks today.";
  $("taskSearch").value=""; renderAll();
}
function greetingText(){const h=new Date().getHours();return h<12?"Good morning.":h<17?"Good afternoon.":"Good evening."}
function openModal(task=null){
  $("taskForm").reset(); $("taskId").value=task?.id||""; $("taskTitle").value=task?.title||""; $("taskDescription").value=task?.description||""; $("taskDue").value=task?.dueDate||todayISO(); $("taskPriority").value=task?.priority||"medium";
  $("modalTitle").textContent=task?"Edit task":"Create a task"; $("saveTaskBtn").textContent=task?"Update task":"Save task";
  $("taskModal").classList.remove("hidden"); setTimeout(()=>$("taskTitle").focus(),50);
}
function closeModal(){$("taskModal").classList.add("hidden")}
function handleTaskSubmit(e){
  e.preventDefault();const title=$("taskTitle").value.trim(),dueDate=$("taskDue").value;if(!title||!dueDate)return;
  const id=$("taskId").value;
  if(id){const t=tasks.find(x=>x.id===id);Object.assign(t,{title,description:$("taskDescription").value.trim(),dueDate,priority:$("taskPriority").value});showToast("Task updated");}
  else{tasks.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),title,description:$("taskDescription").value.trim(),dueDate,priority:$("taskPriority").value,completed:false,createdAt:Date.now()});showToast("Task created");}
  persist();closeModal();renderAll();
}
function handleTaskAction(e){
  const btn=e.target.closest("[data-action]");if(!btn)return;const row=btn.closest("[data-id]");if(!row)return;const task=tasks.find(t=>t.id===row.dataset.id);if(!task)return;
  if(btn.dataset.action==="toggle"){task.completed=!task.completed;showToast(task.completed?"Task marked complete":"Task moved back to pending");}
  if(btn.dataset.action==="edit"){openModal(task);return;}
  if(btn.dataset.action==="delete"){if(!confirm(`Delete "${task.title}"?`))return;tasks=tasks.filter(t=>t.id!==task.id);showToast("Task deleted");}
  persist();renderAll();
}
function applyFilter(filter){
  activeFilter=filter;currentView="all";
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.filter===filter));
  $("overviewContent").classList.remove("hidden");$("statsGrid").classList.add("hidden");$("calendarView").classList.add("hidden");
  $("pageTitle").textContent=({pending:"Pending tasks",today:"Due today",overdue:"Overdue tasks",completed:"Completed tasks"}[filter]);
  $("breadcrumbCurrent").textContent=({pending:"Pending",today:"Due today",overdue:"Overdue",completed:"Completed"}[filter]);
  $("pageSubtitle").textContent="Stay on top of what needs your attention.";
  $("taskSearch").value="";renderTasks();
}
function init(){
  const date=new Date();$("topDate").textContent=date.toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"});$("headingDate").textContent=date.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});$("pageTitle").textContent=greetingText();
  document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>applyFilter(b.dataset.filter)));
  $("newTaskTop").addEventListener("click",()=>openModal());$("emptyNewTask").addEventListener("click",()=>openModal());
  $("closeModal").addEventListener("click",closeModal);$("cancelModal").addEventListener("click",closeModal);$("taskModal").addEventListener("click",e=>{if(e.target===$("taskModal"))closeModal()});
  $("taskForm").addEventListener("submit",handleTaskSubmit);$("taskList").addEventListener("click",handleTaskAction);
  $("taskSearch").addEventListener("input",renderTasks);$("taskSort").addEventListener("change",renderTasks);
  $("viewAllBtn").addEventListener("click",()=>setView("all"));$("upcomingAll").addEventListener("click",()=>applyFilter("pending"));
  $("openCalendar").addEventListener("click",()=>setView("calendar"));
  $("miniPrev").addEventListener("click",()=>{miniMonth.setMonth(miniMonth.getMonth()-1);renderMiniCalendar()});$("miniNext").addEventListener("click",()=>{miniMonth.setMonth(miniMonth.getMonth()+1);renderMiniCalendar()});
  $("miniCalendar").addEventListener("click",e=>{const b=e.target.closest("[data-date]");if(!b)return;selectedDate=b.dataset.date;calendarMonth=new Date(parseDate(selectedDate).getFullYear(),parseDate(selectedDate).getMonth(),1);setView("calendar")});
  $("calPrev").addEventListener("click",()=>{calendarMonth.setMonth(calendarMonth.getMonth()-1);renderFullCalendar()});$("calNext").addEventListener("click",()=>{calendarMonth.setMonth(calendarMonth.getMonth()+1);renderFullCalendar()});
  $("calendarToday").addEventListener("click",()=>{selectedDate=todayISO();calendarMonth=new Date();calendarMonth.setDate(1);renderFullCalendar()});
  $("fullCalendar").addEventListener("click",e=>{const b=e.target.closest("[data-date]");if(!b)return;selectedDate=b.dataset.date;renderFullCalendar()});
  $("taskDue").min="";renderAll();
}
init();
