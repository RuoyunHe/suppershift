import {createSession,getPlan,proposeChange,commitProposal,completeTask,undoChange,formatTime} from './engine.mjs';
import {interpret} from './conversation.mjs';
import {auditPlan} from './audit.mjs';
import {saveExperience,restoreExperience,nextStepText,recoveryOptions} from './experience.mjs';

const $ = (id) => document.getElementById(id);
const key = 'suppershift-v1';
let session = createSession(), proposal = null, spoken = false, messages = [];
let sessionWarning = '';
let storageSnapshot = null, externalChange = false;
try {
  storageSnapshot = localStorage.getItem(key);
  const saved = JSON.parse(storageSnapshot || 'null');
  const restored=restoreExperience(saved);
  if (restored) { session=restored.session; messages=restored.messages; proposal=restored.proposal; sessionWarning=restored.warning; }
} catch { session = createSession(); sessionWarning = 'The saved demo could not be restored. I have started a fresh kitchen.'; }

function currentStorage() {
  try {
    if (localStorage.getItem(key) !== storageSnapshot) externalChange=true;
  } catch { /* Storage may be disabled; in-memory operation remains available. */ }
  if (externalChange) $('session-conflict').hidden=false;
  return !externalChange;
}
function save() {
  if (!currentStorage()) return;
  try {
    const serialized=JSON.stringify(saveExperience(session,messages,proposal));
    localStorage.setItem(key,serialized); storageSnapshot=serialized;
  }
  catch { $('plan-note').textContent = 'This browser cannot save your demo. The current plan still works until you close the page.'; }
}
function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function speak(text) {
  if (!spoken || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US'; utterance.rate = 1;
  speechSynthesis.speak(utterance);
}
function addMessage(role, text, persist = true) {
  messages.push({role,text}); messages = messages.slice(-40);
  renderMessages();
  if (role === 'assistant') speak(text);
  if (persist) save();
}
function renderMessages() {
  const fragment = document.createDocumentFragment();
  for (const msg of messages) {
    const item = element('article',`message ${msg.role}`);
    item.append(element('span','message-label',msg.role === 'user' ? 'You' : 'SupperShift'),element('p','message-text',msg.text));
    fragment.append(item);
  }
  $('transcript').replaceChildren(fragment);
  $('transcript').scrollTop = $('transcript').scrollHeight;
}
function finiteTime(value) { return Number.isFinite(value) ? formatTime(value) : 'Not feasible'; }
function timingText(plan) {
  if (!Number.isFinite(plan.finish)) return plan.reason || 'There are not enough available resources for this plan.';
  return plan.lateness > 0 ? `The best plan I found serves at ${formatTime(plan.finish)}, ${plan.lateness} minutes after your target.` : `The plan serves at ${formatTime(plan.finish)}, with ${Math.max(0, plan.metrics.slack)} minutes before your target.`;
}
function contextText() {
  const plan = getPlan(session), done = session.completed || [], current = session.inProgress || [];
  if (!Number.isFinite(plan.finish)) return `This plan cannot currently be scheduled. ${plan.reason || 'Please adjust the available resources.'} Your completed steps are preserved.`;
  const previous = done.length ? `You have finished ${done.length} ${done.length===1?'step':'steps'}; most recently, ${done.at(-1).title.toLowerCase()}. ` : 'We are at the start of dinner. ';
  const others = current.filter(t=>t.id!==plan.nextTask?.id);
  const running = others.length ? `${others.map(t=>`${t.title} (${t.end-session.now} minutes remaining)`).join(' and ')} ${others.length===1?'is':'are'} also in progress. ` : '';
  return previous + running + nextStepText(session,plan.nextTask).spoken;
}
function renderTimeline(plan) {
  const container = $('timeline');
  container.replaceChildren();
  if (!plan.tasks.length || !Number.isFinite(plan.finish)) {
    container.append(element('p','empty-state',plan.reason || 'This plan cannot be scheduled with the current resources.'));
    return;
  }
  const start = Math.min(1080,session.now,...plan.tasks.map(t=>t.start));
  const end = Math.max(session.target,plan.finish,start+60);
  const span = end-start;
  const axis = element('div','timeline-axis');
  [start,start+Math.round(span/2),end].forEach(time=>axis.append(element('span','',formatTime(time))));
  container.append(axis);
  for (const block of session.blocks) {
    const row = element('div','timeline-row');
    const label = element('div','timeline-label',`${block.resource[0].toUpperCase()+block.resource.slice(1)} busy`);
    label.append(element('small','',`${formatTime(block.start)}–${formatTime(block.end)}`));
    const track = element('div','timeline-track');
    const bar = element('div','timeline-bar wait','Unavailable');
    bar.style.left = `${Math.max(0,(block.start-start)/span*100)}%`;
    bar.style.width = `${Math.min(100,(block.end-block.start)/span*100)}%`;
    track.append(bar); row.append(label,track); container.append(row);
  }
  for (const task of [...plan.tasks].sort((a,b)=>a.start-b.start || a.end-b.end)) {
    const row = element('div','timeline-row');
    const label = element('div','timeline-label',task.title);
    label.append(element('small','',`${formatTime(task.start)}–${formatTime(task.end)} · ${task.completed?'Done':task.inProgress?`${task.end-session.now}m remaining`:Object.keys(task.resources).join(' + ')||'Rest'}`));
    const track = element('div','timeline-track');
    const bar = element('div',`timeline-bar ${task.completed?'done':task.resources.cook?'':'passive'}`,`${task.duration}m`);
    bar.style.left = `${(task.start-start)/span*100}%`; bar.style.width = `${Math.max(1,(task.end-task.start)/span*100)}%`;
    bar.title = `${task.title}: ${formatTime(task.start)} to ${formatTime(task.end)}. ${task.instructions}`;
    bar.setAttribute('aria-label',bar.title);
    track.append(bar); row.append(label,track); container.append(row);
  }
}
function render() {
  const plan = getPlan(session);
  const audit = auditPlan(session,plan);
  $('current-time').textContent = formatTime(session.now);
  $('target-time').value = formatTime(session.target).slice(0,5);
  $('cooks').value = String(session.cooks); $('side').value = session.variant;
  $('meal-name').textContent = 'Lemon chickpea supper';
  $('finish-time').textContent = finiteTime(plan.finish);
  $('slack-time').textContent = Number.isFinite(plan.finish) ? (plan.lateness>0?`−${plan.lateness} min`:`${Math.max(0,session.target-plan.finish)} min`) : '—';
  $('plan-status').textContent = !Number.isFinite(plan.finish) ? 'Needs a new plan' : plan.lateness>0?'Let’s adjust':'Room to breathe';
  $('plan-status').classList.toggle('is-late',plan.lateness>0);
  $('plan-note').textContent = plan.lateness>0 ? 'This plan misses the table time. Compare the calculated options below; you choose what changes.' : `${session.cooks} ${session.cooks===1?'cook':'cooks'}, ${session.burners} burners. Prep, cooking and waiting are scheduled together.`;
  const next = plan.nextTask;
  const nextCopy=nextStepText(session,next);
  $('next-action-title').textContent = !Number.isFinite(plan.finish) ? 'Let’s repair this plan.' : nextCopy.title;
  $('next-action-details').textContent = !Number.isFinite(plan.finish) ? (plan.reason || 'There are not enough available resources.') : nextCopy.details;
  $('complete-step').disabled = !next || !Number.isFinite(plan.finish);
  renderTimeline(plan); renderProposal(); renderRecovery();
  let auditNote = $('audit-note');
  if (!auditNote) { auditNote=element('p','audit-note');auditNote.id='audit-note';$('timeline').after(auditNote); }
  auditNote.textContent = audit.ok ? '✓ Plan checks passed: resource capacity, step order, and preserved progress.' : 'Plan checks need attention. Review the constraints before proceeding.';
  const log = $('event-log'); log.replaceChildren();
  const recent = (session.events || []).slice(-12).reverse();
  if (!recent.length) log.append(element('p','muted','A fresh start for tonight.'));
  else for (const event of recent) {
    const text = event.summary || event.message || event.description || event.type;
    log.append(element('p','',`${event.at !== undefined ? formatTime(event.at)+' · ' : ''}${text || 'Plan updated'}`));
  }
  save();
}
function renderRecovery() {
  const options=recoveryOptions(session);
  $('recovery-panel').hidden=!options.length;
  $('recovery-title').textContent=options.length>1?'Two ways back to dinner':'A way back to dinner';
  const cards=$('recovery-options'); cards.replaceChildren();
  for(const option of options) {
    const card=element('article','recovery-card');
    card.append(element('h3','',option.title),element('strong','recovery-time',finiteTime(option.proposal.after.finish)),
      element('p','',option.detail));
    const status=option.proposal.after.lateness>0?`${option.proposal.after.lateness} min past target`:'Meets the revised plan';
    card.append(element('small','',status));
    const button=element('button','button button-light',`Review ${option.id==='salad'?'salad option':'later dinner'}`);
    button.type='button';
    button.addEventListener('click',()=>{addMessage('user',option.title);preview(option.change);});
    card.append(button); cards.append(card);
  }
}
function renderProposal() {
  $('proposal-panel').hidden = !proposal;
  if (!proposal) return;
  $('proposal-summary').textContent = proposal.summary;
  const fragment = document.createDocumentFragment();
  const comparison = element('div','proposal-comparison');
  comparison.append(element('span','',`Now ${finiteTime(proposal.before.finish)}`),element('strong','',`→ ${finiteTime(proposal.after.finish)}`));
  fragment.append(comparison);
  const list = element('ul','');
  for (const change of proposal.changes) list.append(element('li','',change));
  fragment.append(list);
  if (proposal.after.lateness > 0) fragment.append(element('p','proposal-warning',`${proposal.after.lateness} minutes late. Confirming keeps this outcome visible; it does not make the deadline feasible.`));
  $('proposal-diff').replaceChildren(fragment);
  $('confirm-proposal').disabled = !Number.isFinite(proposal.after.finish);
}
function preview(change) {
  if (!currentStorage()) return;
  try {
    proposal = proposeChange(session,change);
    renderProposal();
    let text = `${proposal.summary} ${timingText(proposal.after)} Nothing has changed yet. Say “confirm” or choose Use this plan.`;
    if (change.type==='oven-delay' && proposal.after.lateness>0) text += ' Once this interruption is confirmed, I will calculate recovery options for you.';
    addMessage('assistant',text);
    $('proposal-panel').scrollIntoView({behavior:'smooth',block:'nearest'});
  } catch (error) { proposal=null; renderProposal(); addMessage('assistant',error.message); }
}
function confirm() {
  if (!currentStorage()) return;
  if (!proposal) { addMessage('assistant','There is no pending change. Tell me what changed in your kitchen first.'); return; }
  if (!Number.isFinite(proposal.after.finish)) { addMessage('assistant','This change cannot be scheduled, so I have kept your current plan. Please adjust the proposal first.'); return; }
  try {
    const summary = proposal.summary;
    const candidate = commitProposal(session,proposal);
    const audit=auditPlan(candidate,getPlan(candidate));
    if(!audit.ok) throw new Error(`The independent plan check found a conflict. I kept your current plan. ${audit.violations[0]?.message || ''}`);
    session = candidate; proposal=null; render();
    addMessage('assistant',`Confirmed. ${summary} ${timingText(getPlan(session))}${recoveryOptions(session).length?' I have compared recovery options above. Review one to see its effect; nothing else changes automatically.':''}`);
  } catch (error) { proposal=null; renderProposal(); addMessage('assistant',error.message); }
}
function finishStep() {
  if (!currentStorage()) return;
  const next = getPlan(session).nextTask;
  if (!next) return;
  try {
    const candidate=completeTask(session,next.id);
    if(!auditPlan(candidate,getPlan(candidate)).ok) throw new Error('This progress update failed the plan checks. The previous state is preserved.');
    session = candidate; proposal=null; render();
    addMessage('assistant',`Demo clock advanced to ${formatTime(session.now)}. ${next.title} is complete. ${contextText()}`);
  } catch(error) { addMessage('assistant',error.message); }
}
function command(raw) {
  if (!currentStorage()) return;
  const intent = interpret(raw);
  if (intent.kind === 'empty') return;
  addMessage('user',raw);
  if (intent.kind==='change') preview(intent.change);
  else if (intent.kind==='confirm') confirm();
  else if (intent.kind==='cancel') { proposal=null; render(); addMessage('assistant','Kept the current plan.'); }
  else if (intent.kind==='context') addMessage('assistant',contextText());
  else if (intent.kind==='complete') finishStep();
  else if (intent.kind==='undo') {
    try { session=undoChange(session); proposal=null; render(); addMessage('assistant',`Undid the last plan change. ${timingText(getPlan(session))}`); }
    catch(error) { addMessage('assistant',error.message); }
  } else if (intent.kind==='explain') {
    const plan=getPlan(session);
    const chain=plan.tasks.filter(t=>t.resources.oven).map(t=>`${t.title.toLowerCase()} (${t.duration} min)`).join(', ');
    addMessage('assistant',`${timingText(plan)} ${chain ? `The oven stages are ${chain}. `:'This side needs no oven. '}Each step waits for its ingredients and a free cook or appliance. Passive simmering can overlap preparation. Durations are estimates and the search is bounded. A possible schedule may still miss your target; this is not a promise about your real kitchen.`);
  } else if(intent.kind==='help') addMessage('assistant','Try an oven delay, a serving time, one or two cooks, or switching between roast carrots and salad. I can also tell you where you were, finish the next demo step, explain timing, and undo the last plan change.');
  else addMessage('assistant',intent.message);
}

$('command-form').addEventListener('submit',event=>{event.preventDefault();const input=$('command-input');const value=input.value;input.value='';command(value);});
document.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>command(button.dataset.command)));
$('confirm-proposal').addEventListener('click',confirm);
$('cancel-proposal').addEventListener('click',()=>{if(!currentStorage())return;proposal=null;render();addMessage('assistant','Kept the current plan.');});
$('complete-step').addEventListener('click',finishStep);
$('plan-dinner').addEventListener('click',()=>{
  if (!currentStorage()) return;
  const [h,m]=$('target-time').value.split(':').map(Number);
  if(!Number.isFinite(h)||!Number.isFinite(m)) { addMessage('assistant','Please choose a valid serving time.');return; }
  addMessage('user',`Plan dinner for ${$('target-time').value}, with ${$('cooks').value} cook(s) and ${$('side').value==='roast'?'roast carrots':'salad'}.`);
  preview({type:'setup',target:h*60+m,cooks:Number($('cooks').value),variant:$('side').value});
});
$('reset-demo').addEventListener('click',()=>{if(!currentStorage())return;session=createSession();proposal=null;messages=[];render();addMessage('assistant','A fresh kitchen at 18:00. Dinner for 19:00: lemon chickpeas, rice, and roast carrots. Try telling me the oven is busy for 20 minutes. I will show the tradeoff before changing your plan.');});
$('reload-session').addEventListener('click',()=>window.location.reload());
window.addEventListener('storage',event=>{if(event.key===key || event.key===null)currentStorage();});
$('download-plan').addEventListener('click',()=>{
  const plan=getPlan(session);
  const text=['SupperShift — demo kitchen plan',`Target: ${formatTime(session.target)}`,`Estimated finish: ${finiteTime(plan.finish)}`,'',...plan.tasks.map(t=>`${t.completed?'[done]':'[ ]'} ${finiteTime(t.start)}–${finiteTime(t.end)} ${t.title}\n    ${t.instructions}`),'','Simulation only. Authored estimates; inspect food and follow appliance instructions.'].join('\n');
  const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='suppershift-plan.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('sound-toggle').addEventListener('click',()=>{
  if (!('speechSynthesis' in window)) {addMessage('assistant','Spoken replies are unavailable in this browser. All responses remain visible here.');return;}
  spoken=!spoken;$('sound-toggle').setAttribute('aria-pressed',String(spoken));$('sound-toggle').setAttribute('aria-label',spoken?'Turn spoken replies off':'Turn spoken replies on');
  if(spoken)speak('Spoken replies are on.');else speechSynthesis.cancel();
});
const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
$('focus-mode')?.addEventListener('click',()=>{
  const focused=document.body.classList.toggle('focus-mode');
  $('focus-mode').textContent=focused?'Full view':'Focus on cooking';
  $('focus-mode').setAttribute('aria-pressed',String(focused));
  const next=$('next-action');
  if(focused) document.querySelector('.conversation-panel .section-top').after(next);
  else document.querySelector('.suggestions').after(next);
  if(focused)$('kitchen').scrollIntoView({block:'start',behavior:'smooth'});
});
$('mic-btn').addEventListener('click',()=>{
  if(!Recognition) {addMessage('assistant','Voice recognition is unavailable here. Type your update, or use one of the example phrases.');return;}
  // Microphone permission is requested only after the visitor chooses this control.
  const recognition=new Recognition();recognition.lang='en-US';recognition.interimResults=false;recognition.maxAlternatives=1;
  $('mic-btn').disabled=true;$('mic-btn').setAttribute('aria-label','Listening');
  recognition.onresult=event=>command(event.results[0][0].transcript);
  recognition.onerror=()=>addMessage('assistant','I could not hear that update. You can type it instead; your plan has not changed.');
  recognition.onend=()=>{$('mic-btn').disabled=false;$('mic-btn').setAttribute('aria-label','Speak your kitchen update');};
  try{recognition.start();}catch{recognition.onend();addMessage('assistant','Microphone access was unavailable. Please type your update.');}
});
render();renderMessages();
if(!messages.length)addMessage('assistant','Dinner at 19:00, with one cook and a shared oven. I have lined up lemon chickpeas, rice, and roast carrots. Tell me what changes; I will protect your progress and show the tradeoffs.');
if(sessionWarning)addMessage('assistant',sessionWarning);
