import {createSession, getPlan, proposeChange, commitProposal, formatTime} from './engine.mjs';
import {auditPlan} from './audit.mjs';

// Only store the review identity and requested change; recompute all estimates
// when restoring, rather than trusting a serialized proposed schedule.
export function saveExperience(session, messages, proposal) {
  const pending = proposal ? {id:proposal.id, baseRevision:proposal.baseRevision,
    baseFingerprint:proposal.baseFingerprint, change:proposal.change} : null;
  return {version:2, session, messages:messages.slice(-40), pending};
}

export function restoreExperience(saved) {
  if (!saved || ![1,2].includes(saved.version)) return null;
  const session = createSession(saved.session);
  if (!auditPlan(session,getPlan(session)).ok) throw new Error('The saved plan failed its independent checks.');
  const messages = Array.isArray(saved.messages) ? saved.messages.filter(m =>
    ['user','assistant'].includes(m.role) && typeof m.text === 'string').slice(-40) : [];
  let proposal = null, warning = '';
  if (saved.pending) {
    try {
      const fresh = proposeChange(session,saved.pending.change);
      if (fresh.id !== saved.pending.id || fresh.baseRevision !== saved.pending.baseRevision ||
          fresh.baseFingerprint !== saved.pending.baseFingerprint) throw new Error('Stale review');
      proposal = fresh;
      warning = 'Your saved plan and unconfirmed change are restored. Review the change before using it.';
    } catch {
      warning = 'Your saved plan is restored, but its pending change could not be verified and was cancelled. Please propose it again.';
    }
  } else if (saved.version === 1 && messages.some(m => m.text.includes('Nothing has changed yet.'))) {
    warning = 'Your saved plan is restored. This older save has no pending change; please propose any unconfirmed update again.';
  }
  return {session, messages, proposal, warning};
}

export function nextStepText(session, task) {
  if (!task) return {title:'You made it to the table.', details:'All steps in this demo are complete. Reset to try another evening.', spoken:'Dinner is ready to bring together.'};
  if (task.inProgress) {
    const remaining = Math.max(0,task.end-session.now);
    const action = task.resources.cook ? 'Continue' : 'Waiting for';
    return {title:`${action}: ${task.title.toLowerCase()}`,
      details:`${remaining} minutes remaining · Already started; estimated finish ${formatTime(task.end)}.`,
      spoken:`${task.title} is already in progress, with ${remaining} minutes remaining. Its estimated finish is ${formatTime(task.end)}; do not start it again.`};
  }
  return {title:task.title, details:`${formatTime(task.start)}–${formatTime(task.end)} · ${task.instructions}`,
    spoken:`Next: ${task.title.toLowerCase()}, ${task.duration} minutes. ${task.instructions}`};
}

// These are suggestions, never state changes. Every candidate is recomputed
// from the actual kitchen, independently audited, then reviewed by the user.
export function recoveryOptions(session) {
  const current = getPlan(session);
  if (!Number.isFinite(current.finish) || current.lateness <= 0 || !current.nextTask) return [];
  const options = [];
  const add = (id, title, detail, change) => {
    try {
      const proposal = proposeChange(session,change);
      const candidate = commitProposal(session,proposal);
      if (!Number.isFinite(proposal.after.finish) || !auditPlan(candidate,proposal.after).ok) return;
      options.push({id,title,detail,change,proposal});
    } catch { /* An unavailable option must never be offered as a safe repair. */ }
  };
  add('later',session.variant === 'roast' ? 'Keep the roast carrots' : 'Keep the fresh salad',
    `Keep every dish. Move the table time from ${formatTime(session.target)} to ${formatTime(current.finish)}.`,
    {type:'target',value:current.finish});
  if (session.variant === 'roast') {
    const alternative = proposeChange(session,{type:'swap-side',variant:'salad'});
    if (Number.isFinite(alternative.after.finish) && alternative.after.finish < current.finish) {
      add('salad','Switch to fresh salad',
        `Keep the ${formatTime(session.target)} target. Finish ${current.finish-alternative.after.finish} minutes earlier than the current plan.`,
        {type:'swap-side',variant:'salad'});
    }
  }
  return options;
}
