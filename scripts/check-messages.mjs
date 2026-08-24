#!/usr/bin/env node
/**
 * Guards the two message catalogues.
 *
 *   npm run check-messages
 *
 * Two failure modes this catches, both of which are silent in the browser:
 *
 * 1. **A key present in one catalogue and missing from the other.** `src/i18n/request.ts`
 *    merges Estonian underneath Russian, so a missing Russian key renders Estonian text on
 *    the Russian page. That is the right fallback when it is deliberate and a bug when it is
 *    not, and nothing distinguishes the two at runtime.
 * 2. **A message that fails ICU parsing.** next-intl renders the key path — `hero.title` —
 *    instead of throwing. In particular a raw `{{PLACEHOLDER}}` is invalid ICU and must be
 *    apostrophe-quoted as `'{{PLACEHOLDER}}'`; when the client supplies the real value, the
 *    surrounding apostrophes have to go too.
 */
import { createTranslator } from 'use-intl/core';

import et from '../src/i18n/messages/et.json' with { type: 'json' };
import ru from '../src/i18n/messages/ru.json' with { type: 'json' };

const flat = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === 'object' ? flat(value, `${prefix}${key}.`) : [[`${prefix}${key}`, value]],
  );

let failed = false;

const etKeys = flat(et).map(([k]) => k).sort();
const ruKeys = flat(ru).map(([k]) => k).sort();

const onlyEt = etKeys.filter((k) => !ruKeys.includes(k));
const onlyRu = ruKeys.filter((k) => !etKeys.includes(k));

if (onlyEt.length || onlyRu.length) {
  failed = true;
  if (onlyEt.length) console.error(`Missing from ru.json:\n  ${onlyEt.join('\n  ')}`);
  if (onlyRu.length) console.error(`Missing from et.json:\n  ${onlyRu.join('\n  ')}`);
} else {
  console.log(`  ok    both catalogues define the same ${etKeys.length} keys`);
}

let rendered = 0;
for (const [locale, messages] of [['et', et], ['ru', ru]]) {
  const t = createTranslator({ locale, messages, onError: () => {} });

  for (const [key, value] of flat(messages)) {
    // Supply whatever arguments the message references so plurals and interpolation resolve.
    const args = {};
    for (const match of String(value).matchAll(/\{(\w+)[,}]/g)) {
      args[match[1]] = /count|total|current|index|failed|num/.test(match[1]) ? 2 : 'X';
    }

    // next-intl returns the key path when a message cannot be parsed.
    if (t(key, args) === key) {
      failed = true;
      console.error(`  FAIL  ${locale}.${key} does not parse: ${JSON.stringify(value)}`);
    }
    rendered++;
  }
}

if (!failed) console.log(`  ok    all ${rendered} messages parse`);

process.exit(failed ? 1 : 0);
