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
 * each one needs a stable `id` for the anchor, the React key and the price row it pairs
 * with. Order here is the order on the page.
 *
 * THE CLIENT MUST CONFIRM THIS LIST BEFORE LAUNCH (assumption A5 in docs/content-draft.md).
 * It is written from what an Estonian renovation and finishing company normally sells, not
 * from anything MPH Meistrid has stated. See docs/CONTENT.md question 2.
 *
 * Open flags on this list, from section 4.3 of the draft:
 *
 * - "Siseviimistlus" is deliberately not one of the six. It is an umbrella term that would
 *   overlap items 2–5 and make the price table ambiguous, so it is used as a keyword in the
 *   H1, page title, meta description and services intro instead. If the client would rather
 *   sell `Siseviimistlustööd` / `Отделочные работы` as one headline service, it replaces
 *   items 2–5 and the price rows are rebuilt to match.
 * - `vannitoa-remont` promises `sanitaartehnika paigaldus` / `установка сантехники`.
 *   Fitting a WC, basin and mixer is normal finishing work; full plumbing rerouting often is
 *   not. If fixtures are subcontracted, change the phrase to `plaatimine ja viimistlus` /
 *   `плитка и отделка` (draft question 4).
 * - Electrical and plumbing work is deliberately absent. Electrical installation is a
 *   regulated activity in Estonia — add it only if MPH Meistrid genuinely does it in house,
 *   and put no licence, certificate or competence claim on the site without the document
 *   (assumption A6, draft question 3).
 *
 * Alternates the draft offers ready-written, in case the client wants a different mix
 * (section 4.4 of the draft — full ET/RU text is there, not duplicated here):
 * Siseviimistlustööd / Отделочные работы (€/m²) · Elektri- ja santehnikatööd /
 * Электрика и сантехника (€/h, needs the A6 check first) · Lammutustööd /
 * Демонтажные работы (€/m²) · Siseuste ja liistude paigaldus /
 * Установка дверей и плинтусов (€/tk) · Väiketööd tunnitasu alusel /
 * Мелкие работы почасово (€/h) · Fassaadi- ja välitööd /
 * Фасадные и наружные работы (€/m²).
 *
 * Swapping one in means editing this array and adding the matching price row at
 * /admin → Hinnad. Keep the count at six unless the layout is revisited.
 */

export type Service = {
  /** Stable kebab-case slug. Used for the anchor and the React key — do not renumber. */
  id: string;
  name: Localized;
  description: Localized;
};

export const services: Service[] = [
  {
    id: 'korteri-uldremont',
    name: {
      et: 'Korteri üldremont',
      ru: 'Общий ремонт квартиры',
    },
    description: {
      et: 'Teeme korteris kogu remondi ära: lammutus, seinad ja laed, põrandad ning viimistlus.',
      ru: 'Делаем ремонт квартиры целиком: демонтаж, стены и потолки, полы и отделка.',
    },
  },
  {
    id: 'vannitoa-remont',
    name: {
      et: 'Vannitoa remont',
      ru: 'Ремонт ванной комнаты',
    },
    description: {
      et: 'Lammutame vana vannitoa ja teeme uue valmis: hüdroisolatsioon, plaatimine ja sanitaartehnika paigaldus.',
      ru: 'Демонтируем старую ванную и делаем новую: гидроизоляция, плитка и установка сантехники.',
    },
  },
  {
    id: 'maalritood',
    name: {
      et: 'Maalritööd',
      ru: 'Малярные работы',
    },
    description: {
      et: 'Pahteldame ja värvime seinad ning laed, vajaduse korral paneme ka tapeedi.',
      ru: 'Шпаклюем и красим стены и потолки, при необходимости клеим обои.',
    },
  },
  {
    id: 'plaatimistood',
    name: {
      et: 'Plaatimistööd',
      ru: 'Плиточные работы',
    },
    description: {
      et: 'Paigaldame seina- ja põrandaplaadid vannitoas, köögis ja mujal — koos aluspinna ettevalmistuse ja vuukimisega.',
      ru: 'Укладываем настенную и напольную плитку в ванной, на кухне и в других помещениях — вместе с подготовкой основания и затиркой швов.',
    },
  },
  {
    id: 'porandatood',
    name: {
      et: 'Põrandatööd',
      ru: 'Напольные работы',
    },
    description: {
      et: 'Tasandame aluspõranda ja paigaldame laminaadi, vinüüli või parketi koos põrandaliistudega.',
      ru: 'Выравниваем основание и укладываем ламинат, виниловое покрытие или паркет вместе с плинтусами.',
    },
  },
  {
    id: 'kipsplaaditood-ja-vaheseinad',
    name: {
      et: 'Kipsplaaditööd ja vaheseinad',
      ru: 'Гипсокартон и перегородки',
    },
    description: {
      et: 'Ehitame kipsplaadist vaheseinad, ripplaed ja niššid ning valmistame pinnad viimistluseks ette.',
      ru: 'Строим перегородки из гипсокартона, подвесные потолки и ниши, готовим поверхности под отделку.',
    },
  },
];
