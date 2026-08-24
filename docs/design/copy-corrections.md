# Copy corrections to the delivered prototype

The prototype's `const T = {et, ru}` dictionary is approved **except** for the strings below.

Each one asserts something the Estonian business register contradicts or cannot support.
Checked against inforegister.ee for registry code 17317439 on 2026-08-24:

- registered **02.09.2025** — the company is under a year old
- **no registered employees**
- EMTAK activity **43351 "Ehitiste viimistlus"** — building *finishing*
- **not VAT-registered**

A warranty stated on a website is a binding term under VÕS, so "garantii" is not marketing
language — it is a contract the client would be held to. None of these may ship unverified.

Use the replacements verbatim. Everything else in the dictionary is unchanged.

---

## 1. `kicker` — invented founding year

The company was registered in 2025, not 2014, so the year cannot stay. Replacing it with
"ALATES 2025" would be true but actively unhelpful — it advertises that the company is new,
which is the one thing a homeowner handing over their flat is nervous about.

The third slot instead carries the registry code. It is unarguably true, it is the strongest
credential a young company actually has, and Estonian customers do look companies up before
letting them into their home. It also suits the mono spec-label treatment better than a date
did — the eyebrow now reads like a stamp on a drawing, which is the whole idea behind the
identity's mono voice.

| | before | after |
|---|---|---|
| et | `TALLINN · HARJUMAA · ALATES 2014` | `TALLINN · HARJUMAA · REG 17317439` |
| ru | `ТАЛЛИНН · ХАРЬЮМАА · С 2014 ГОДА` | `ТАЛЛИНН · ХАРЬЮМАА · РЕГ. 17317439` |

If the client would rather lead with a promise than a credential, the alternative third
segment is `FIKSEERITUD HIND` / `ФИКСИРОВАННАЯ ЦЕНА` — cost overruns are the most common
complaint in Estonian renovation, and a fixed price is something they control and can honour.

## 2. `heroP` — warranty + turnkey general construction

Drops "vundamendist võtmeni" (foundation to turnkey) and "garantiiga". Keeps the fixed-quote
promise, which is a process the company controls and can honour.

**et**
> Üldehitus, renoveerimine ja siseviimistlus. Selge pakkumine enne tööde algust ja kokku
> lepitud tähtaeg.

**ru**
> Общестроительные работы, реновация и внутренняя отделка. Понятная смета до начала работ и
> согласованный срок.

## 3. `bandP` — in-house crew, no subcontractors, warranty on every job

A company with no registered employees cannot claim it never uses subcontractors. Keeps the
two claims that are true and checkable: the site is kept tidy, and the price is agreed before
work starts.

**et**
> MPH Meistrid OÜ on Eesti ehitus- ja viimistlusettevõte. Teeme tööd korralikult ja lõpuni:
> objekt on iga päev korras ning hind lepitakse kokku enne alustamist, ilma hilisemate
> üllatusteta.

**ru**
> MPH Meistrid OÜ — эстонская строительно-отделочная компания. Работаем аккуратно и доводим
> до конца: объект в порядке каждый день, а цена согласовывается до начала работ, без
> неожиданностей.

## 4. `steps[3]` — warranty again

**et** — name: `Üleandmine` · desc: `Anname töö üle puhtana ja vaatame tulemuse koos üle.`

**ru** — name: `Сдача работы` · desc: `Сдаём работу чистой и осматриваем результат вместе.`

## 5. `hoursText` — invented working hours

Nothing establishes these. Make it a placeholder so it is visibly unfinished until the client
supplies them, and add `{{HOURS}}` to `docs/CONTENT.md`.

| | before | after |
|---|---|---|
| et | `E–R 8.00–17.00` | `{{HOURS}}` |
| ru | `Пн–Пт 8.00–17.00` | `{{HOURS}}` |

Remember the ICU escaping rule: written into a next-intl catalogue this must be
`'{{HOURS}}'`, apostrophes included, or the message fails to parse. See
`scripts/check-messages.mjs`.

---

## Not corrected, but flagged for the client

**The six services.** The prototype's list — Üldehitus, Renoveerimine, Siseviimistlus,
Vannitoad ja märgruumid, Krohvi- ja maalritööd, Fassaaditööd — goes well beyond the
registered activity of building finishing. "Üldehitus … uued hooned ja juurdeehitused" (new
buildings and extensions) and "Fassaaditööd" in particular are a different trade from
finishing work.

Unlike the items above these are not falsifiable facts — a company may sell whatever it
chooses to sell. They ship as designed, but they must be on the client's confirmation list,
and if MPH does not actually take on new-build or facade work the two cards should be swapped
for finishing services before launch.

**The four projects** in the prototype (`Kadriorg 2026`, `Viimsi 2025`, …) are prototype
filler and must **not** reach the message catalogue. Real projects come from the admin and
live in R2. Presenting invented work as completed jobs is exactly what the client brief
forbids.

**VAT.** The company is not VAT-registered, so no price may carry a VAT line and the footer's
VAT row stays hidden. `site.vatRegistered` is already `false`.
