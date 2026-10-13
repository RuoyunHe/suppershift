import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,getPlan,proposeChange,commitProposal,completeTask} from '../dist/engine.mjs';
import {saveExperience,restoreExperience,nextStepText,recoveryOptions} from '../dist/experience.mjs';

test('pending review survives a JSON round trip without applying the change',()=>{
  const session=createSession(), pending=proposeChange(session,{type:'oven-delay',minutes:20});
  const restored=restoreExperience(JSON.parse(JSON.stringify(saveExperience(session,[{role:'user',text:'oven busy'}],pending))));
  assert.equal(restored.session.blocks.length,0);
  assert.equal(restored.proposal.after.finish,1144);
  assert.equal(restored.proposal.id,pending.id);
  assert.equal(commitProposal(restored.session,restored.proposal).blocks[0].end,1100);
});

test('changed or stale persisted proposals are cancelled without losing committed progress',()=>{
  const session=completeTask(createSession(),'carrots-prep');
  const proposal=proposeChange(session,{type:'target',value:1160});
  for(const mutate of [s=>s.pending.change.value=1120,s=>s.pending.baseRevision++,s=>s.pending.id='tampered']) {
    const saved=structuredClone(saveExperience(session,[],proposal)); mutate(saved);
    const restored=restoreExperience(saved);
    assert.equal(restored.proposal,null);
    assert.deepEqual(restored.session.completed,session.completed);
    assert.match(restored.warning,/cancelled/);
  }
});

test('saved estimates are recomputed and cancelling leaves no pending review after reload',()=>{
  const session=createSession(), proposal=proposeChange(session,{type:'target',value:1150});
  const saved=saveExperience(session,[],proposal);
  saved.pending.after={finish:1};
  assert.equal(restoreExperience(saved).proposal.after.finish,1124);
  assert.equal(restoreExperience(saveExperience(session,[],null)).proposal,null);
});

test('next-event wording distinguishes ongoing waiting from a new eight-minute task',()=>{
  const session=completeTask(createSession(),'carrots-prep');
  const next=getPlan(session).nextTask;
  const text=nextStepText(session,next);
  assert.equal(next.duration,8);
  assert.match(text.spoken,/2 minutes remaining/);
  assert.match(text.title,/Waiting for/);
  assert.doesNotMatch(text.spoken,/Next:.*8 minutes/);
});

test('late dinner offers two audited choices calculated without mutating current state',()=>{
  const session=commitProposal(createSession(),proposeChange(createSession(),{type:'oven-delay',minutes:20}));
  const before=JSON.stringify(session), options=recoveryOptions(session);
  assert.deepEqual(options.map(o=>[o.id,o.proposal.after.finish]),[['later',1144],['salad',1112]]);
  assert.equal(options[0].change.value,1144);
  assert.equal(options[1].proposal.after.lateness,0);
  assert.equal(commitProposal(session,options[1].proposal).target,1140);
  assert.equal(JSON.stringify(session),before);
});

test('recovery suggestions adapt to actual delay and do not invent an improvement',()=>{
  assert.deepEqual(recoveryOptions(createSession()),[]);
  const s=createSession({target:1100,variant:'salad'}), choices=recoveryOptions(s);
  assert.deepEqual(choices.map(c=>c.id),['later']);
  assert.equal(choices[0].change.value,getPlan(s).finish);
  let progressed=completeTask(createSession(),'carrots-prep');
  progressed=commitProposal(progressed,proposeChange(progressed,{type:'oven-delay',minutes:20}));
  assert.deepEqual(recoveryOptions(progressed),[]);
});
