import type { Localized } from '@/lib/types';

/**
 * The six services shown on the landing page.
 *
 * Developer-edited, NOT admin-editable. Projects and prices live in R2 and are changed by
 * the client at /admin; this list is not, because it is the shape of the offer rather than
 * day-to-day content — changing it means changing the price table, the SEO copy and the
 * quote form's expectations at the same time. Editing it is a code change and a deploy.
 *
 * They are typed data rather than message keys because the landing page maps over them and
 * each one needs a stable `id` for the React key and the price row it pairs with. Order here
 * is the order on the page, and the mono index on each card is that order, not a stored
 * field — renumbering is a reorder, never an edit.
 *
 * ── PROVENANCE: THE DESIGNER'S LIST, NOT THE CLIENT'S ───────────────────────
 * These six are lifted verbatim from the delivered prototype's ET/RU dictionary
 * (docs/design/MPH Website Prototype.dc.html). They are approved *as design copy* and are
 * the copy that ships, but nothing MPH Meistrid has stated backs them, so they are on the
 * client's confirmation list — see the "Not corrected, but flagged" section of
 * docs/design/copy-corrections.md and question 2 of docs/CONTENT.md.
 *
 * The specific flag from copy-corrections.md: the register lists one activity for
 * 17317439 — EMTAK 43351 "Ehitiste viimistlus", i.e. building *finishing*. `uldehitus`
 * ("uued hooned ja juurdeehitused" — new buildings and extensions) and `fassaaditood` are a
 * different trade from finishing work. A company may sell whatever it chooses to sell, so
 * unlike a warranty claim this is not a falsifiable fact and it ships as designed; but if
 * MPH does not actually take on new-build or facade work, those two cards are swapped for
 * finishing services before launch. Nothing else on the site depends on the wording.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type Service = {
  /** Stable kebab-case slug. Used as the React key — do not renumber. */
  id: string;
  name: Localized;
  description: Localized;
};

export const services: Service[] = [
  {
    id: 'uldehitus',
    name: {
      et: 'Üldehitus',
      ru: 'Общее строительство',
    },
    description: {
      et: 'Ehitustööd vundamendist katuseni — uued hooned ja juurdeehitused.',
      ru: 'Строительные работы от фундамента до крыши — новые здания и пристройки.',
    },
  },
  {
    id: 'renoveerimine',
    name: {
      et: 'Renoveerimine',
      ru: 'Реновация',
    },
    description: {
      et: 'Korterite, majade ja äripindade täielik uuendamine.',
      ru: 'Полное обновление квартир, домов и коммерческих помещений.',
    },
  },
  {
    id: 'siseviimistlus',
    name: {
      et: 'Siseviimistlus',
      ru: 'Внутренняя отделка',
    },
    description: {
      et: 'Seinad, põrandad, laed — viimistlus, mis peab vastu.',
      ru: 'Стены, полы, потолки — отделка, которая служит долго.',
    },
  },
  {
    id: 'vannitoad-ja-margruumid',
    name: {
      et: 'Vannitoad ja märgruumid',
      ru: 'Ванные и влажные зоны',
    },
    description: {
      et: 'Hüdroisolatsioon, plaatimine ja santehnika ühe tööna.',
      ru: 'Гидроизоляция, плитка и сантехника одной работой.',
    },
  },
  {
    id: 'krohvi-ja-maalritood',
    name: {
      et: 'Krohvi- ja maalritööd',
      ru: 'Штукатурка и покраска',
    },
    description: {
      et: 'Sirged seinad ja puhas lõpptulemus, ka vanades majades.',
      ru: 'Ровные стены и чистый результат, в том числе в старых домах.',
    },
  },
  {
    id: 'fassaaditood',
    name: {
      et: 'Fassaaditööd',
      ru: 'Фасадные работы',
    },
    description: {
      et: 'Soojustus, krohv ja fassaadikate — maja välimus korda.',
      ru: 'Утепление, штукатурка и фасадное покрытие — дом снаружи в порядке.',
    },
  },
];
