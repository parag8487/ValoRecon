/**
 * Golden-dataset regression eval for the ValoRecon AI coach.
 *
 * Runs curated prompts through the real coach pipeline and asserts the response
 * is grounded (mentions real maps/agents/keywords or honestly says data is
 * unavailable). Run with `npm run eval`. Requires GEMINI_API_KEY (env or the
 * app's ai_config.json) — without a key it exits 0 and reports "skipped".
 *
 * Gate: exits 1 if fewer than 70% of assertions pass, so it can be wired into CI.
 */
import { streamCoachChat, getUsageStats } from '../services/gemini';

interface GoldenCase {
  prompt: string;
  must: RegExp[];       // any of these must appear (case-insensitive)
  mustNotFabricate?: RegExp[]; // if matched, the answer invented data
}

const MAPS = /ascent|bind|haven|split|lotus|icebox|breeze|pearl|sunset|abyss|fracture/i;
const AGENTS = /jett|sova|viper|brimstone|omen|killjoy|cypher|reyna|raze|phoenix|sage/i;
const ECONOMY = /force|save|eco|buy|credits|full buy|bonus/i;
const TREND = /improv|declin|trend|streak|stable|win rate|k\/d|acs|hs%/i;
const HONEST_MISSING = /no (recent )?(games|data|matches) found|not (available|in recent data)|unavailable|unknown|no data/i;

const GOLDEN: GoldenCase[] = [
  { prompt: 'What is my weakest map?', must: [MAPS, /weakest|lowest|struggling|win rate/i] },
  { prompt: 'How am I doing on Bind?', must: [MAPS, /bind/i] },
  { prompt: 'Should I main Jett?', must: [AGENTS] },
  { prompt: 'Should we force buy or save?', must: [ECONOMY] },
  { prompt: 'Am I improving?', must: [TREND] },
  { prompt: 'How do I raise my K/D?', must: [/k\/d|kd|deaths|trades?|surviv/i] },
  { prompt: 'Give me a Sova lineup on Ascent', must: [MAPS, AGENTS, /lineup|recon|bolt/i] },
  { prompt: 'How is my crosshair placement?', must: [/crosshair|headshot|hs|aim|spray/i] },
  { prompt: 'What is my recent form?', must: [TREND, /wins?|losses?|form|last/i] },
  { prompt: 'hello', must: [/valorecon|coach|hello|hey/i] },
];

async function runCase(c: GoldenCase): Promise<{ pass: boolean; note: string }> {
  const parts: string[] = [];
  for await (const chunk of streamCoachChat([{ role: 'user', content: c.prompt }])) {
    parts.push(chunk);
  }
  const text = parts.join('').toLowerCase();
  const mustHit = c.must.some((r) => r.test(text));
  const fabricated = c.mustNotFabricate ? c.mustNotFabricate.some((r) => r.test(text)) : false;
  const honestMissing = HONEST_MISSING.test(text);

  // A miss is OK if the model honestly said the data isn't available.
  const pass = mustHit || honestMissing;
  return {
    pass: pass && !fabricated,
    note: pass
      ? (mustHit ? 'grounded' : 'honest-missing')
      : `no match for ${c.must.map((r) => r.source).join(' | ')}`,
  };
}

async function main() {
  const needsKey =
    process.env.GEMINI_API_KEY?.trim() ||
    (() => { try { return require('fs').existsSync(require('path').join(__dirname, '..', '..', 'data', 'ai_config.json')); } catch { return false; } })();

  if (!needsKey && !process.env.GEMINI_API_KEY?.trim()) {
    // Check the persisted ai_config for a real key.
    const fs = await import('fs');
    const path = await import('path');
    const cfgFile = path.join(__dirname, '..', '..', 'data', 'ai_config.json');
    if (!fs.existsSync(cfgFile) || !(JSON.parse(fs.readFileSync(cfgFile, 'utf8')).apiKey || '').trim()) {
      console.log('SKIPPED: no Gemini API key configured. Set GEMINI_API_KEY or add a key in Settings.');
      process.exit(0);
    }
  }

  let passed = 0;
  console.log(`Running ${GOLDEN.length} golden cases…`);
  for (const c of GOLDEN) {
    try {
      const { pass, note } = await runCase(c);
      console.log(`${pass ? '✅' : '❌'} "${c.prompt}" → ${note}`);
      if (pass) passed++;
    } catch (e: any) {
      console.log(`❌ "${c.prompt}" → error: ${e?.message?.slice(0, 120)}`);
    }
  }

  const usage = getUsageStats();
  console.log(`\nPassed ${passed}/${GOLDEN.length}`);
  console.log(`Usage: ${usage.calls} calls · ${usage.totalTokens} tokens · ~$${usage.estimatedCostUSD.toFixed(4)}`);
  process.exit(passed / GOLDEN.length >= 0.7 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
