// A deliberately bounded conversational adapter. This is not an LLM.
// All plan changes are computed by the scheduler and require confirmation.
export function parseTime(text) {
  // Do not silently truncate a signed, decimal, malformed, or ambiguous time.
  const matches = [...text.matchAll(/(?<![\w.:+\-−])(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?(?![\w:]|\.\d)/gi)];
  if (matches.length !== 1) return null;
  const match = matches[0];
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = (match[3] || '').replaceAll('.', '').toLowerCase();
  if (minute > 59 || hour > 23 || (meridiem && (hour < 1 || hour > 12))) return null;
  if (meridiem) hour = hour % 12 + (meridiem === 'pm' ? 12 : 0);
  else if (hour >= 1 && hour <= 11) hour += 12; // Dinner-only shorthand, shown in preview.
  return hour * 60 + minute;
}

const clarification = (message) => ({ kind: 'clarify', message });
// Read the entire numeric token before interpreting its unit. Word boundaries
// alone would turn "1.2 cooks" into "2 cooks", or "1/2 minutes" into 2 minutes.
const numericTokens = (text) => text.match(/[+\-−]?\s*(?:\d+(?:[.,/]\d+)*|\.\d+)(?:e[+\-]?\d+)?/gi) || [];
function ambiguousQuantity(text) {
  const tokens = numericTokens(text).map(token => token.trim());
  return tokens.length > 1 || tokens.some(token => !/^\d+$/.test(token)) ||
    /[\u00bc-\u00be\u2150-\u215f]/.test(text) ||
    /\b(?:minus|negative)\s+(?:one|two|\d+)\b/.test(text) ||
    /\b(?:one|two|\d+)\s*(?:or|to|[-–—/])\s*(?:one|two|\d+)\b/.test(text) ||
    /\bbetween\s+(?:one|two|\d+)\s+and\s+(?:one|two|\d+)\b/.test(text);
}

function hasServingTimeContext(text) {
  // "Dinner for 2" could mean two diners. A clock, meridiem, explicit
  // preposition, or the target field distinguishes a serving-time request.
  return /\d:\d|\d\s*(?:a\.?m\.?|p\.?m\.?)\b/i.test(text) ||
    /\b(?:at|by|until)\s+\d|\btarget\b/.test(text);
}

export function interpret(raw) {
  const text = raw.trim().toLowerCase().replace(/[’]/g, "'");
  if (!text) return { kind: 'empty' };
  if (/^(yes|confirm|apply|do it|go ahead|confirm plan|confirm change)[.!]?$/.test(text)) return { kind: 'confirm' };
  if (/^(no|cancel|never mind|keep it)[.!]?$/.test(text)) return { kind: 'cancel' };
  // This bounded parser cannot safely resolve negations or conditional requests.
  // In particular, "not done" must never advance the demo clock.
  if (/\b(?:not|never|without|avoid|except|if|cant|wont|cannot)\b|\b\w+n't\b|\bdo not\b|\bno\s+(?!oven\b)/.test(text))
    return clarification('I will leave the plan and demo clock unchanged. Please give one direct request, such as “Use the salad instead”, or say “cancel” to dismiss a proposal.');
  if (/^(?:please\s+)?undo(?:\s+(?:that|the last|my last))?(?:\s+change)?[.!]?$/.test(text)) return { kind: 'undo' };
  if (/^(?:(?:i'm|i am)\s+)?(?:done|finished|complete)(?:\s+with\s+(?:this|the)(?:\s+demo)?\s+step)?[.!]?$/.test(text) ||
      /^(?:finish|complete)(?:\s+the)?(?:\s+next|\s+current)?(?:\s+demo)?\s+step[.!]?$/.test(text)) return { kind: 'complete' };
  if (/where was i|what('?s| is) next|catch me up|what am i doing|next step/.test(text)) return { kind: 'context' };
  if (/\b(?:done|finished|complete)\b/.test(text))
    return clarification('I cannot detect whether food is done. To advance the next scheduled step in this simulation, say “done” or choose “Finish next step · demo”.');
  if (/\bwhy\b|explain|bottleneck|reason/.test(text)) return { kind: 'explain' };

  const requests = [];
  if (/\bsalad\b|no[- ]oven/.test(text)) requests.push({ type: 'swap-side', variant: 'salad' });
  if (/\broast\b|\bcarrots\b/.test(text) && /\b(?:use|switch|instead|back|side)\b/.test(text)) requests.push({ type: 'swap-side', variant: 'roast' });
  if (/\boven\b/.test(text) && /\b(?:busy|occupied|delay|unavailable|blocked)\b/.test(text)) {
    if (ambiguousQuantity(text))
      return clarification('Please give one unambiguous whole-minute oven delay, such as “The oven is busy for 20 minutes.”');
    const matches = [...text.matchAll(/(?<![\w.+\-−])(\d+)\s*(?:minutes?|mins?)\b/g)];
    if (matches.length !== 1) return clarification('How long will the oven be busy? Use one whole-minute delay, such as “The oven is busy for 20 minutes.”');
    const minutes = Number(matches[0][1]);
    if (!Number.isSafeInteger(minutes) || minutes < 1 || minutes > 180)
      return clarification('Please give an oven delay between 1 and 180 whole minutes.');
    requests.push({ type: 'oven-delay', minutes });
  }
  if (/\b(?:cooks?|helpers?|helping)\b|\bonly me\b|\balone\b/.test(text)) {
    if (ambiguousQuantity(text))
      return clarification('Please choose one unambiguous whole number of cooks: “One cook” or “Two cooks”.');
    const two = /\b(?:two|2|second|another)\s+(?:cooks?|helpers?)\b|\b(?:cooks?|helpers?)\s*:?\s*(?:two|2)\b/.test(text);
    const one = /\b(?:one|1)\s+(?:cooks?|helpers?)\b|\b(?:cooks?|helpers?)\s*:?\s*(?:one|1)\b|\bonly me\b|\balone\b/.test(text);
    if (two === one) return clarification('This demo supports one or two cooks. Try “Two cooks” or “Only me”.');
    requests.push({ type: 'cooks', value: two ? 2 : 1 });
  }
  if (/\b(?:dinner|serve|eat|ready|target)\b/.test(text)) {
    if (/\b(?:tomorrow|yesterday)\b|\bnext\s+(?:day|week)\b|\b(?:in|after)\s+\d+\s*(?:minutes?|mins?|hours?|hrs?)\b/.test(text))
      return clarification('This demo uses one evening. Please give an absolute serving time for the demo day, such as “Dinner at 7 pm”.');
    const hasTimeContext = hasServingTimeContext(text);
    const time = hasTimeContext ? parseTime(text) : null;
    if (time !== null) requests.push({ type: 'target', value: time });
    else if (requests.length === 0 || hasTimeContext) {
      if (/\b(?:plan|start)\b/.test(text) && !/\d/.test(text)) return { kind: 'context' };
      return clarification('What serving time do you have in mind? Give one valid time, such as “Can we eat at 6:20 pm?”');
    }
  }
  if (requests.length > 1) return clarification('Please make one change at a time so I can show its effect before you confirm it. The dinner setup controls can change the time, cooks and side together.');
  if (requests.length === 1) return { kind: 'change', change: requests[0] };
  if (/help|can you|commands/.test(text)) return { kind: 'help' };
  return clarification('I can replan this dinner, remember your place, and explain timing. Try “The oven is busy for 20 minutes”, “Use the salad instead”, or “Where was I?” I will ask before changing anything.');
}
