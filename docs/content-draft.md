# MPH Meistrid OÜ — Website Copy (ET / RU)

Content draft for the public site and the admin area. Nothing here is invented beyond what is
explicitly marked as an assumption. Everything that must come from the client is a
`{{PLACEHOLDER}}` — see the full inventory in section 12.

---

## 0. How to read this document

### 0.1 Two kinds of braces

| Form | Meaning | Who fills it |
|---|---|---|
| `{{DOUBLE_BRACES}}` | A **fill-in-once client value**. Replace by find-and-replace when generating `et.json` / `ru.json`, or keep as a config constant. Never ship a `{{...}}` to production. | Client / developer, once |
| `{singleBraces}` | A **runtime interpolation** the code substitutes on every render (`{count}`, `{total}`, `{name}`, `{date}`, `{percent}`, `{done}`). | Code |

### 0.2 Catalogue structure

- Two files: `messages/et.json` and `messages/ru.json`.
- Keys are identical in both files **except** the `admin.*` namespace, which exists **only in `et.json`**
  (the admin is Estonian-only by decision — see section 10).
- Keys are dotted and flat-ish. Arrays are expressed as numeric segments: `services.items.0.name`.
- Plural keys use `.one` / `.other` suffixes (Estonian has two forms). Russian avoids plural
  branching wherever possible by using indeclinable nouns (`фото`) — this is deliberate.
- Empty-string values are legal for optional client text (`about.extra`); the component must
  skip rendering when the value is empty.

### 0.3 Assumptions flagged for the client

| # | Assumption | Why it matters |
|---|---|---|
| A1 | **Region = Tallinn and Harjumaa.** Used throughout as `{{REGION_ET}}` / `{{REGION_RU}}` / `{{CITY_ET}}` / `{{CITY_RU}}`. | Appears in H1, title, meta description, about, footer. Wrong region = wrong local SEO. |
| A2 | The company **quotes for free / without obligation**. Not stated anywhere in the copy because it is unconfirmed. | If confirmed, "tasuta pakkumine" / "бесплатное предложение" can be added to hero and form. |
| A3 | The company **visits the site before quoting**. Copy says "vaatame töö üle" (we look the work over) which implies this. | Remove or reword if they quote remotely only. |
| A4 | Bathroom renovation is quoted **per project**; everything else **per m²**. | See section 6 notes. |
| A5 | The 6 services in section 4 are a **proposal**, not confirmed. | The client must confirm/replace before build. |
| A6 | Electrical and plumbing work is **not** listed as an in-house service. | See the flag in section 4.3. |

---

## 1. Site metadata

`meta.*` — one set per language. Character counts below are measured **with the assumed
placeholder values filled in** (`{{CITY_ET}}` = "Tallinnas", `{{REGION_ET}}` = "Tallinnas ja Harjumaal").

| Key | ET | RU |
|---|---|---|
| `meta.title` | `Ehitus- ja remonditööd {{CITY_ET}} \| MPH Meistrid` | `Ремонт и отделочные работы в {{CITY_RU}} \| MPH Meistrid` |
| `meta.description` | `MPH Meistrid OÜ teeb korteri- ja majaremonti, siseviimistlust ja ehitustöid {{REGION_ET}}. Vaata tehtud töid ja küsi pakkumist.` | `MPH Meistrid OÜ — ремонт квартир и домов, отделочные и строительные работы в {{REGION_RU}}. Посмотрите наши работы и запросите цену.` |
| `meta.ogTitle` | `MPH Meistrid — ehitus- ja remonditööd {{CITY_ET}}` | `MPH Meistrid — ремонт и отделочные работы в {{CITY_RU}}` |
| `meta.ogDescription` | `Korteri- ja majaremont, siseviimistlus ja ehitustööd {{REGION_ET}}. Vaata tehtud töid ja küsi pakkumist.` | `Ремонт квартир и домов, отделочные и строительные работы в {{REGION_RU}}. Посмотрите наши работы и запросите цену.` |
| `meta.ogSiteName` | `MPH Meistrid OÜ` | `MPH Meistrid OÜ` |
| `meta.ogImageAlt` | `MPH Meistrid OÜ — ehitus- ja remonditööd` | `MPH Meistrid OÜ — строительные и ремонтные работы` |

**Length check (with assumed values):**

| String | ET | RU | Limit |
|---|---|---|---|
| `meta.title` | 47 chars | 52 chars | ≤ 60 |
| `meta.description` | 135 chars | 138 chars | ≤ 155 |

Both stay inside budget with a normal-length region value. If the client's region string is longer
than "Tallinnas ja Harjumaal", re-measure `meta.description`.

**Keyword coverage (natural, not stuffed):** *ehitustööd / ehitus- ja remonditööd + Tallinn*,
*remont Tallinn*, *siseviimistlus*, *korteriremont*, *majaremont*; RU: *ремонт квартир Таллинн*,
*отделочные работы*, *строительные работы*. Each term appears once, inside a normal sentence.

---

## 2. Navigation

`nav.*` and `header.*`.

| Key | ET | RU |
|---|---|---|
| `nav.services` | `Teenused` | `Услуги` |
| `nav.works` | `Tehtud tööd` | `Наши работы` |
| `nav.pricing` | `Hinnad` | `Цены` |
| `nav.about` | `Meist` | `О нас` |
| `nav.contact` | `Kontakt` | `Контакты` |
| `header.ctaQuote` | `Küsi pakkumist` | `Запросить цену` |
| `header.ctaPhone` | `Helista` | `Позвонить` |
| `header.menuOpen` | `Ava menüü` | `Открыть меню` |
| `header.menuClose` | `Sulge menüü` | `Закрыть меню` |
| `header.langSwitch` | `Rus` | `Est` |
| `header.skipToContent` | `Liigu sisu juurde` | `Перейти к содержимому` |

Note: `nav.works` is the short nav label ("Наши работы"), while the section heading in section 5 is
the fuller "Выполненные работы". This is intentional and normal in Russian.

---

## 3. Hero

`hero.*`

| Key | ET | RU |
|---|---|---|
| `hero.title` | `Ehitus-, remondi- ja siseviimistlustööd {{REGION_ET}}` | `Строительные, ремонтные и отделочные работы в {{REGION_RU}}` |
| `hero.subtitle` | `Teeme korteri- ja majaremonti, siseviimistlust ja ehitustöid {{REGION_ET}}. Kirjuta või helista — vaatame töö üle ja teeme pakkumise.` | `Делаем ремонт квартир и домов, отделочные и строительные работы в {{REGION_RU}}. Напишите или позвоните — посмотрим объём работ и подготовим предложение.` |
| `hero.ctaPrimary` | `Küsi pakkumist` | `Запросить цену` |
| `hero.ctaSecondary` | `Helista` | `Позвонить` |
| `hero.ctaSecondaryAria` | `Helista numbril {{PHONE}}` | `Позвонить по номеру {{PHONE}}` |

`hero.title` with assumed values: ET 62 chars, RU 65 chars — both ≤ 70.

### 3.1 Alternative H1 options for the client to pick

Only one of these ships. Whichever is chosen becomes `hero.title`; the others can be deleted.

**Estonian**

| Option | Text | Length (assumed values) | Character of it |
|---|---|---|---|
| ET-A (recommended) | `Ehitus-, remondi- ja siseviimistlustööd {{REGION_ET}}` | 62 | Covers all three keyword families at once. |
| ET-B | `Korterite ja majade remont {{REGION_ET}}` | 48 | Narrowest and clearest; best if apartments are the main business. |
| ET-C | `Siseviimistlus ja remonditööd {{REGION_ET}}` | 51 | Leads with finishing; best if that is the specialism. |

**Russian**

| Option | Text | Length (assumed values) | Character of it |
|---|---|---|---|
| RU-A (recommended) | `Строительные, ремонтные и отделочные работы в {{REGION_RU}}` | 65 | Mirrors ET-A. |
| RU-B | `Ремонт квартир и домов в {{REGION_RU}}` | 43 | Strongest match for how Russian speakers actually search ("ремонт квартир Таллинн"). |
| RU-C | `Отделочные и ремонтные работы в {{REGION_RU}}` | 51 | Mirrors ET-C. |

If the client picks ET-B, pick RU-B; if ET-C, pick RU-C. Keep the two languages saying the same thing.

---

## 4. Services

`services.*` — 6 services, `services.items.0` … `services.items.5`.

### 4.1 Section chrome

| Key | ET | RU |
|---|---|---|
| `services.heading` | `Teenused` | `Услуги` |
| `services.intro` | `Teeme ehitus-, remondi- ja siseviimistlustöid. Kui vajalikku tööd nimekirjas ei ole, küsi üle.` | `Выполняем строительные, ремонтные и отделочные работы. Если нужной работы в списке нет — спросите.` |
| `services.cta` | `Küsi pakkumist` | `Запросить цену` |

### 4.2 The six services

| Key | ET | RU |
|---|---|---|
| `services.items.0.name` | `Korteri üldremont` | `Общий ремонт квартиры` |
| `services.items.0.description` | `Teeme korteris kogu remondi ära: lammutus, seinad ja laed, põrandad ning viimistlus.` | `Делаем ремонт квартиры целиком: демонтаж, стены и потолки, полы и отделка.` |
| `services.items.1.name` | `Vannitoa remont` | `Ремонт ванной комнаты` |
| `services.items.1.description` | `Lammutame vana vannitoa ja teeme uue valmis: hüdroisolatsioon, plaatimine ja sanitaartehnika paigaldus.` | `Демонтируем старую ванную и делаем новую: гидроизоляция, плитка и установка сантехники.` |
| `services.items.2.name` | `Maalritööd` | `Малярные работы` |
| `services.items.2.description` | `Pahteldame ja värvime seinad ning laed, vajaduse korral paneme ka tapeedi.` | `Шпаклюем и красим стены и потолки, при необходимости клеим обои.` |
| `services.items.3.name` | `Plaatimistööd` | `Плиточные работы` |
| `services.items.3.description` | `Paigaldame seina- ja põrandaplaadid vannitoas, köögis ja mujal — koos aluspinna ettevalmistuse ja vuukimisega.` | `Укладываем настенную и напольную плитку в ванной, на кухне и в других помещениях — вместе с подготовкой основания и затиркой швов.` |
| `services.items.4.name` | `Põrandatööd` | `Напольные работы` |
| `services.items.4.description` | `Tasandame aluspõranda ja paigaldame laminaadi, vinüüli või parketi koos põrandaliistudega.` | `Выравниваем основание и укладываем ламинат, виниловое покрытие или паркет вместе с плинтусами.` |
| `services.items.5.name` | `Kipsplaaditööd ja vaheseinad` | `Гипсокартон и перегородки` |
| `services.items.5.description` | `Ehitame kipsplaadist vaheseinad, ripplaed ja niššid ning valmistame pinnad viimistluseks ette.` | `Строим перегородки из гипсокартона, подвесные потолки и ниши, готовим поверхности под отделку.` |

### 4.3 Notes and flags — the client must confirm this list

- **The list is a proposal.** It is built from what an Estonian renovation/finishing company
  normally sells, not from anything MPH Meistrid has told us. Confirm, reorder or replace before build.
- **"Siseviimistlus" is deliberately not one of the six cards.** It is an umbrella term that would
  overlap with items 2–5 and make the price list ambiguous. It is instead used as a keyword in the
  H1, page title, meta description, services intro and about text, where it does real SEO work
  without confusing the customer. If the client would rather sell "Siseviimistlustööd" as a single
  headline service, swap it in for items 2–5 and rebuild the price rows accordingly.
- **Item 1 (Vannitoa remont) mentions "sanitaartehnika paigaldus" / "установка сантехники".**
  Fitting a WC, basin and mixer is normal finishing work. Full plumbing rerouting is often not.
  Confirm the boundary; if fixtures are subcontracted, change the phrase to
  ET `plaatimine ja viimistlus` / RU `плитка и отделка`.
- **Electrical and plumbing works are not listed as a service.** Electrical installation work in
  Estonia is a regulated activity. Only add it if MPH Meistrid genuinely does it themselves or has a
  named partner — and even then, do not put any certification, licence or competence claim on the
  site unless the client supplies the document. Flagged as A6.

### 4.4 Alternative services the client may swap in

Ready-written, in case they prefer a different mix. Same key shape.

| ET name | RU name | ET description | RU description | Suggested price unit |
|---|---|---|---|---|
| `Siseviimistlustööd` | `Отделочные работы` | `Teeme ruumid viimistluseks valmis ja lõpuni: seinad, laed, põrandad.` | `Доводим помещения до готового вида: стены, потолки, полы.` | €/m² |
| `Elektri- ja santehnikatööd` | `Электрика и сантехника` | `Vahetame ja paigaldame valgustid, pistikud ja sanitaartehnika.` | `Меняем и устанавливаем светильники, розетки и сантехнику.` | €/h — **needs the A6 check first** |
| `Lammutustööd` | `Демонтажные работы` | `Lammutame vanad seinad, põrandad ja plaadid ning veame praht ära.` | `Сносим старые стены, полы и плитку, вывозим мусор.` | €/m² |
| `Siseuste ja liistude paigaldus` | `Установка дверей и плинтусов` | `Paigaldame siseuksed, lengid ja liistud.` | `Устанавливаем межкомнатные двери, коробки и плинтусы.` | €/tk |
| `Väiketööd tunnitasu alusel` | `Мелкие работы почасово` | `Väiksemad parandus- ja paigaldustööd, mille jaoks eraldi pakkumist teha ei ole mõtet.` | `Небольшие работы по ремонту и установке, для которых нет смысла составлять отдельное предложение.` | €/h |
| `Fassaadi- ja välitööd` | `Фасадные и наружные работы` | `Teeme fassaadi- ja välisviimistlustöid.` | `Выполняем фасадные и наружные отделочные работы.` | €/m² |

---

## 5. Completed work

`works.*`

### 5.1 Section chrome

| Key | ET | RU |
|---|---|---|
| `works.heading` | `Tehtud tööd` | `Выполненные работы` |
| `works.intro` | `Siin on osa meie tehtud töödest.` | `Здесь часть наших работ.` |
| `works.empty` | `Fotod tehtud töödest lisame siia peagi. Seni helista või kirjuta — räägime lähemalt, mida oleme teinud.` | `Фотографии работ появятся здесь в ближайшее время. А пока позвоните или напишите — расскажем о наших работах.` |
| `works.emptyCta` | `Küsi pakkumist` | `Запросить цену` |

The empty state deliberately does **not** say "no projects yet" in a way that reads as inexperience,
and it does not claim any number of completed projects.

### 5.2 Card and gallery labels

| Key | ET | RU |
|---|---|---|
| `works.card.view` | `Vaata pilte` | `Смотреть фото` |
| `works.card.viewAria` | `Ava töö „{name}“ pildid` | `Открыть фотографии работы «{name}»` |
| `works.card.locationAria` | `Asukoht: {location}` | `Место: {location}` |
| `works.card.photoCount.one` | `{count} pilt` | `{count} фото` |
| `works.card.photoCount.other` | `{count} pilti` | `{count} фото` |
| `works.gallery.close` | `Sulge` | `Закрыть` |
| `works.gallery.prev` | `Eelmine pilt` | `Предыдущее фото` |
| `works.gallery.next` | `Järgmine pilt` | `Следующее фото` |
| `works.gallery.counter` | `Pilt {index} / {total}` | `Фото {index} из {total}` |
| `works.gallery.loading` | `Laen pilti…` | `Загружаем фото…` |
| `works.gallery.imageAlt` | `{name} — pilt {index}` | `{name} — фото {index}` |

Russian uses the indeclinable `фото` on purpose, so `photoCount` needs no Russian plural branching
(`1 фото`, `2 фото`, `5 фото` are all correct). Estonian genuinely needs `.one` / `.other`.

---

## 6. Pricing

`pricing.*`

### 6.1 Section chrome

| Key | ET | RU |
|---|---|---|
| `pricing.heading` | `Hinnad` | `Цены` |
| `pricing.intro` | `Orienteeruvad hinnad, et saaksid mahust aimu. Konkreetse töö hinna ütleme pärast ülevaatamist.` | `Ориентировочные цены, чтобы вы понимали порядок сумм. Точную цену назовём после осмотра.` |
| `pricing.colService` | `Teenus` | `Услуга` |
| `pricing.colPrice` | `Hind` | `Цена` |
| `pricing.disclaimer` | `Hinnad on orienteeruvad. Täpne hind sõltub töö mahust ja ruumi seisukorrast ning lepitakse kokku lõplikus pakkumises.` | `Цены ориентировочные. Точная стоимость зависит от объёма работ и состояния помещения и подтверждается в окончательном предложении.` |
| `pricing.vatNote` | `{{VAT_NOTE_ET}}` | `{{VAT_NOTE_RU}}` |
| `pricing.cta` | `Küsi pakkumist` | `Запросить цену` |

### 6.2 The six price rows

`pricing.items.0` … `pricing.items.5`, matching the six services one-to-one.

| Key | ET service | ET price | RU service | RU price |
|---|---|---|---|---|
| `pricing.items.0` | `Korteri üldremont` | `alates {{PRICE_APARTMENT_RENOVATION}} €/m²` | `Общий ремонт квартиры` | `от {{PRICE_APARTMENT_RENOVATION}} €/м²` |
| `pricing.items.1` | `Vannitoa remont` | `alates {{PRICE_BATHROOM}} €/projekt` | `Ремонт ванной комнаты` | `от {{PRICE_BATHROOM}} € за проект` |
| `pricing.items.2` | `Maalritööd` | `alates {{PRICE_PAINTING}} €/m²` | `Малярные работы` | `от {{PRICE_PAINTING}} €/м²` |
| `pricing.items.3` | `Plaatimistööd` | `alates {{PRICE_TILING}} €/m²` | `Плиточные работы` | `от {{PRICE_TILING}} €/м²` |
| `pricing.items.4` | `Põrandatööd` | `alates {{PRICE_FLOORING}} €/m²` | `Напольные работы` | `от {{PRICE_FLOORING}} €/м²` |
| `pricing.items.5` | `Kipsplaaditööd ja vaheseinad` | `alates {{PRICE_DRYWALL}} €/m²` | `Гипсокартон и перегородки` | `от {{PRICE_DRYWALL}} €/м²` |

Key shape: `pricing.items.0.service`, `pricing.items.0.price`, and optional `pricing.items.0.note`
(empty string by default — the admin price editor writes into it).

### 6.3 Unit reasoning and flags

- **m²** for painting, tiling, flooring, drywall and whole-apartment renovation. This is how Estonian
  builders quote these trades, and it is what customers expect to compare.
- **€/projekt** for a bathroom. A bathroom is a small area with a very high work-per-m² ratio, so a
  per-m² figure misleads. Many Estonian companies also quote bathrooms per m² — if the client
  prefers that, change the row to `alates {{PRICE_BATHROOM}} €/m²` / `от {{PRICE_BATHROOM}} €/м²`
  and nothing else changes. Flagged as A4.
- **No numbers are invented anywhere.** Every figure is a placeholder.
- **VAT.** An Estonian OÜ must be clear about whether displayed prices include VAT. `pricing.vatNote`
  is a placeholder because we do not know whether MPH Meistrid is VAT-registered (KMKR). Two
  ready-made options — the client picks one, or the key is removed entirely:

| Case | ET | RU |
|---|---|---|
| VAT-registered, prices shown without VAT | `Hindadele lisandub käibemaks 24%.` | `К ценам добавляется налог с оборота 24%.` |
| VAT-registered, prices shown with VAT | `Hinnad sisaldavad käibemaksu.` | `Цены указаны с налогом с оборота.` |
| Not VAT-registered | remove `pricing.vatNote` | remove `pricing.vatNote` |

The 24% figure is the Estonian standard VAT rate as of 2025 — the developer should confirm the rate
in force at launch rather than trusting this line.

---

## 7. About

`about.*`

| Key | ET | RU |
|---|---|---|
| `about.heading` | `Meist` | `О нас` |
| `about.p1` | `MPH Meistrid OÜ on ehitusettevõte, mis teeb ehitus-, remondi- ja siseviimistlustöid {{REGION_ET}}.` | `MPH Meistrid OÜ — строительная фирма, которая выполняет строительные, ремонтные и отделочные работы в {{REGION_RU}}.` |
| `about.p2` | `Teeme nii üksikuid töid kui ka korteri või maja remonti tervikuna.` | `Берёмся как за отдельные работы, так и за ремонт квартиры или дома целиком.` |
| `about.p3` | `Vaata tehtud töid ja võta ühendust — räägime töö üle ja teeme pakkumise.` | `Посмотрите наши работы и свяжитесь с нами — обсудим объём и подготовим предложение.` |
| `about.extra` | `{{ABOUT_EXTRA_ET}}` | `{{ABOUT_EXTRA_RU}}` |
| `about.companyLabel` | `Ettevõte` | `Компания` |
| `about.companyName` | `MPH Meistrid OÜ` | `MPH Meistrid OÜ` |
| `about.regCodeLabel` | `Registrikood` | `Регистрационный код` |
| `about.regCode` | `17317439` | `17317439` |

**What this section is allowed to say and does say:** legal name, registry code, the kind of work,
the region. Nothing else. No years, no headcount, no certifications, no project counts, no
warranties, no superlatives.

`about.extra` is an optional free sentence or two from the client (for example, how they prefer to
work, or which materials they supply). If it is empty, the component must render nothing — do not
show an empty paragraph. `about.p2` is a factual statement about their business model that the
client should confirm before launch.

---

## 8. Contact

`contact.*`

| Key | ET | RU |
|---|---|---|
| `contact.heading` | `Kontakt` | `Контакты` |
| `contact.intro` | `Helista või kirjuta — räägime töö üle ja teeme pakkumise.` | `Позвоните или напишите — обсудим работу и подготовим предложение.` |
| `contact.phoneLabel` | `Telefon` | `Телефон` |
| `contact.phoneValue` | `{{PHONE}}` | `{{PHONE}}` |
| `contact.emailLabel` | `E-post` | `Эл. почта` |
| `contact.emailValue` | `{{EMAIL}}` | `{{EMAIL}}` |
| `contact.companyLabel` | `Ettevõte` | `Компания` |
| `contact.companyValue` | `MPH Meistrid OÜ` | `MPH Meistrid OÜ` |
| `contact.regCodeLabel` | `Registrikood` | `Регистрационный код` |
| `contact.regCodeValue` | `17317439` | `17317439` |
| `contact.regionLabel` | `Piirkond` | `Регион` |
| `contact.regionValue` | `{{REGION_NOMINATIVE_ET}}` | `{{REGION_NOMINATIVE_RU}}` |
| `contact.cta` | `Küsi pakkumist` | `Запросить цену` |
| `contact.callCta` | `Helista {{PHONE}}` | `Позвонить {{PHONE}}` |
| `contact.emailCta` | `Kirjuta {{EMAIL}}` | `Написать на {{EMAIL}}` |
| `contact.social` | `Sotsiaalmeedia` | `Соцсети` |
| `contact.facebook` | `Facebook` | `Facebook` |
| `contact.instagram` | `Instagram` | `Instagram` |

Social links are optional — if `{{FACEBOOK_URL}}` / `{{INSTAGRAM_URL}}` are empty, drop the whole
`contact.social` block rather than rendering dead links.

`contact.regionValue` uses the **nominative** region form ("Tallinn ja Harjumaa" /
"Таллинн и Харьюмаа") because it is a label value, not part of a sentence. This is a separate
placeholder from the inflected `{{REGION_ET}}` used inside sentences — see section 12.

---

## 9. Quote request form

`form.*`

### 9.1 Heading, fields, submit

| Key | ET | RU |
|---|---|---|
| `form.heading` | `Küsi pakkumist` | `Запросить цену` |
| `form.intro` | `Kirjuta lühidalt, mida on vaja teha. Kui sul on ruumist pilte, lisa need juurde — nii saame täpsema pakkumise teha.` | `Напишите коротко, что нужно сделать. Если есть фотографии помещения, приложите их — так мы сможем назвать цену точнее.` |
| `form.name.label` | `Nimi` | `Имя` |
| `form.name.placeholder` | `Sinu nimi` | `Ваше имя` |
| `form.phone.label` | `Telefon` | `Телефон` |
| `form.phone.placeholder` | `+372 5xxx xxxx` | `+372 5xxx xxxx` |
| `form.email.label` | `E-post` | `Эл. почта` |
| `form.email.placeholder` | `nimi@näide.ee` | `imya@primer.ee` |
| `form.email.optional` | `ei ole kohustuslik` | `не обязательно` |
| `form.message.label` | `Mida on vaja teha?` | `Что нужно сделать?` |
| `form.message.placeholder` | `Näiteks: vannitoa remont, umbes 4 m², maja on 1970ndatest.` | `Например: ремонт ванной, около 4 м², дом 1970-х годов.` |
| `form.photos.label` | `Fotod (kui sul on)` | `Фотографии (если есть)` |
| `form.photos.hint` | `Kuni {{MAX_UPLOAD_COUNT}} pilti, iga pilt kuni {{MAX_UPLOAD_MB}} MB.` | `До {{MAX_UPLOAD_COUNT}} фото, каждое до {{MAX_UPLOAD_MB}} МБ.` |
| `form.photos.button` | `Vali fotod` | `Выбрать фото` |
| `form.photos.remove` | `Eemalda` | `Убрать` |
| `form.submit` | `Saada päring` | `Отправить запрос` |
| `form.submitting` | `Saadan…` | `Отправляем…` |
| `form.required` | `kohustuslik` | `обязательно` |
| `form.privacyNote` | `Kasutame sinu andmeid ainult selleks, et pakkumise teha ja sinuga ühendust võtta.` | `Мы используем ваши данные только для того, чтобы подготовить предложение и связаться с вами.` |

At least one of phone or email must be filled — the copy assumes **phone is required, email optional**,
which matches how construction enquiries actually work in Estonia. Confirm with the client.

### 9.2 Success

| Key | ET | RU |
|---|---|---|
| `form.success.title` | `Aitäh! Päring on saadetud.` | `Спасибо! Запрос отправлен.` |
| `form.success.body` | `Võtame sinuga ühendust. Kui asi on kiire, helista {{PHONE}}.` | `Мы свяжемся с вами. Если дело срочное, позвоните: {{PHONE}}.` |

### 9.3 Errors — calm, human, non-technical

| Key | ET | RU |
|---|---|---|
| `form.errors.required` | `See väli on vaja täita.` | `Это поле нужно заполнить.` |
| `form.errors.requiredName` | `Kirjuta palun oma nimi.` | `Напишите, пожалуйста, ваше имя.` |
| `form.errors.requiredPhone` | `Kirjuta palun telefoninumber, et saaksime ühendust võtta.` | `Напишите, пожалуйста, номер телефона, чтобы мы могли связаться.` |
| `form.errors.requiredMessage` | `Kirjuta paari sõnaga, mida on vaja teha.` | `Напишите парой слов, что нужно сделать.` |
| `form.errors.email` | `E-posti aadress ei tundu õige. Kontrolli palun üle.` | `Похоже, в адресе почты ошибка. Проверьте, пожалуйста.` |
| `form.errors.phone` | `Telefoninumber ei tundu õige. Kontrolli palun üle.` | `Похоже, в номере телефона ошибка. Проверьте, пожалуйста.` |
| `form.errors.fileTooBig` | `See pilt on liiga suur. Sobivad kuni {{MAX_UPLOAD_MB}} MB pildid — proovi mõnda teist.` | `Это фото слишком большое. Подойдут файлы до {{MAX_UPLOAD_MB}} МБ — попробуйте другое.` |
| `form.errors.fileType` | `Seda faili ei saa lisada. Lisada saab ainult pilte: JPG, PNG, HEIC või WebP.` | `Такой файл добавить нельзя. Можно добавлять только фотографии: JPG, PNG, HEIC или WebP.` |
| `form.errors.tooManyFiles` | `Korraga saab lisada kuni {{MAX_UPLOAD_COUNT}} pilti.` | `За один раз можно добавить до {{MAX_UPLOAD_COUNT}} фото.` |
| `form.errors.network` | `Saatmine ei õnnestunud. Proovi natukese aja pärast uuesti või helista {{PHONE}}.` | `Отправить не получилось. Попробуйте чуть позже ещё раз или позвоните: {{PHONE}}.` |
| `form.errors.server` | `Midagi läks meie poolel viltu ja päring ei jõudnud kohale. Proovi uuesti või helista {{PHONE}}.` | `У нас что-то не сработало, и запрос не дошёл. Попробуйте ещё раз или позвоните: {{PHONE}}.` |

Every failure path offers the phone number as an escape hatch. No error blames the visitor, and none
mentions a status code, a field name in English, or a technical cause.

---

## 10. Admin UI — Estonian only

These keys live only in `et.json` under `admin.*`. The admin is used by one person, from a phone, on
a building site, in daylight, possibly with dusty hands. Rules applied throughout:

- No developer words. No "publitseeri", "olek", "üles laadimine ebaõnnestus (413)", "objekt", "kirje",
  "API", "server", "sessioon", "fail" where "foto" works.
- Every button says what will happen, not what it is called internally.
- Every destructive action names the thing being destroyed and says whether it can be undone.
- Every error says what to do next.

### 10.1 Login

| Key | Estonian |
|---|---|
| `admin.login.heading` | `Logi sisse` |
| `admin.login.intro` | `Siit saad lisada ja muuta kodulehel olevaid töid ja hindu.` |
| `admin.login.passwordLabel` | `Parool` |
| `admin.login.passwordPlaceholder` | `Kirjuta parool` |
| `admin.login.showPassword` | `Näita parooli` |
| `admin.login.hidePassword` | `Peida parool` |
| `admin.login.submit` | `Logi sisse` |
| `admin.login.working` | `Login sisse…` |
| `admin.login.help` | `Kui parool on kadunud, helista {{SUPPORT_CONTACT}}.` |
| `admin.logout` | `Logi välja` |
| `admin.logout.confirmTitle` | `Kas logid välja?` |
| `admin.logout.confirmBody` | `Saad hiljem parooliga uuesti sisse.` |
| `admin.logout.confirm` | `Jah, logi välja` |
| `admin.logout.cancel` | `Jää sisse` |

### 10.2 Dashboard

| Key | Estonian |
|---|---|
| `admin.dashboard.heading` | `Kodulehe haldus` |
| `admin.dashboard.intro` | `Mida soovid teha?` |
| `admin.dashboard.addWork` | `+ Lisa uus töö` |
| `admin.dashboard.addWorkHint` | `Pane üles uus tehtud töö koos fotodega.` |
| `admin.dashboard.editPrices` | `Muuda hindu` |
| `admin.dashboard.editPricesHint` | `Muuda kodulehel näidatavaid hindu.` |
| `admin.dashboard.viewSite` | `Vaata kodulehte` |
| `admin.dashboard.worksHeading` | `Tehtud tööd` |
| `admin.dashboard.worksCount.one` | `{count} töö` |
| `admin.dashboard.worksCount.other` | `{count} tööd` |
| `admin.dashboard.empty` | `Ühtegi tööd ei ole veel lisatud. Vajuta „+ Lisa uus töö“ ja alusta.` |

### 10.3 Project list

| Key | Estonian |
|---|---|
| `admin.works.heading` | `Tehtud tööd` |
| `admin.works.statusPublished` | `Kodulehel näha` |
| `admin.works.statusDraft` | `Mustand — kodulehel ei ole näha` |
| `admin.works.noPhoto` | `Fotot ei ole` |
| `admin.works.photoCount.one` | `{count} foto` |
| `admin.works.photoCount.other` | `{count} fotot` |
| `admin.works.updatedAt` | `Muudetud {date}` |
| `admin.works.edit` | `Muuda` |
| `admin.works.delete` | `Kustuta` |
| `admin.works.open` | `Ava` |
| `admin.works.reorderHint` | `Hoia tööd sõrme all ja lohista, et järjekorda muuta. Ülemine töö on kodulehel esimene.` |
| `admin.works.loading` | `Laen töid…` |

### 10.4 Add / edit a project

| Key | Estonian |
|---|---|
| `admin.work.newHeading` | `Uus töö` |
| `admin.work.editHeading` | `Muuda tööd` |
| `admin.work.name.label` | `Töö nimi` |
| `admin.work.name.placeholder` | `Kirjuta töö nimi` |
| `admin.work.name.hint` | `Näiteks „Vannitoa remont Mustamäel“.` |
| `admin.work.location.label` | `Asukoht` |
| `admin.work.location.placeholder` | `Näiteks Kristiine, Tallinn` |
| `admin.work.location.hint` | `Linnaosa või linn. Võid ka tühjaks jätta.` |
| `admin.work.description.label` | `Kirjeldus` |
| `admin.work.description.placeholder` | `Paar lauset sellest, mis tehtud sai` |
| `admin.work.description.hint` | `Võid ka tühjaks jätta.` |
| `admin.work.optional` | `ei ole kohustuslik` |
| `admin.work.photos.label` | `Fotod` |
| `admin.work.back` | `Tagasi` |

### 10.5 The Estonian / Russian field pairs

Every text field on a project has an Estonian box and a Russian box under it. The wording below is
written for someone who has never heard the word "translation key".

| Key | Estonian |
|---|---|
| `admin.lang.explain` | `Koduleht on kahes keeles. Kirjuta tekst eesti keeles. Vene keele võid täita, aga ei pea.` |
| `admin.lang.et` | `Eesti keeles` |
| `admin.lang.ru` | `Vene keeles` |
| `admin.lang.ruOptional` | `ei ole kohustuslik` |
| `admin.lang.ruHint` | `Kui jätad vene keele tühjaks, näidatakse venekeelsele külastajale eestikeelset teksti.` |
| `admin.lang.ruEmptyBadge` | `Vene keel tühi — näidatakse eestikeelset teksti` |
| `admin.lang.copyEtToRu` | `Kopeeri eestikeelne tekst siia` |
| `admin.lang.copied` | `Kopeeritud.` |

Field labels then read as: `Töö nimi — Eesti keeles`, `Töö nimi — Vene keeles`, and the same for
`Asukoht` and `Kirjeldus`. Photos have no language.

**Layout note for the developer:** put the Estonian box first and the Russian box directly under it,
visually grouped, with `admin.lang.ruHint` shown once per field group in small grey text. Do not use
tabs or a language switcher — on a phone, a hidden second tab will simply never be filled in.

### 10.6 Photo area

| Key | Estonian |
|---|---|
| `admin.photos.heading` | `Fotod` |
| `admin.photos.add` | `Lisa fotod` |
| `admin.photos.addHint` | `Vali telefonist pildid või tee kohe uus pilt.` |
| `admin.photos.dropHint` | `Lohista pildid siia või vajuta „Lisa fotod“.` |
| `admin.photos.empty` | `Ühtegi fotot ei ole veel lisatud.` |
| `admin.photos.reorderHint` | `Hoia fotot sõrme all ja lohista, et järjekorda muuta.` |
| `admin.photos.coverHint` | `Esimene foto on kaanepilt — seda näidatakse kodulehel kõige suuremalt.` |
| `admin.photos.setCover` | `Tee kaanepildiks` |
| `admin.photos.isCover` | `Kaanepilt` |
| `admin.photos.remove` | `Eemalda foto` |
| `admin.photos.moveUp` | `Liiguta ettepoole` |
| `admin.photos.moveDown` | `Liiguta tahapoole` |
| `admin.photos.count.one` | `{count} foto` |
| `admin.photos.count.other` | `{count} fotot` |

Removing a photo:

| Key | Estonian |
|---|---|
| `admin.confirm.removePhoto.title` | `Eemaldan selle foto?` |
| `admin.confirm.removePhoto.body` | `Foto kaob selle töö juurest ära ja seda ei saa tagasi tuua.` |
| `admin.confirm.removePhoto.confirm` | `Jah, eemalda` |
| `admin.confirm.removePhoto.cancel` | `Ei, jäta alles` |

### 10.7 Saving, publishing, deleting

| Key | Estonian |
|---|---|
| `admin.work.publish` | `Avalda töö` |
| `admin.work.publishHint` | `Töö läheb kodulehele kõigile näha.` |
| `admin.work.saveDraft` | `Salvesta mustandina` |
| `admin.work.saveDraftHint` | `Töö jääb ainult sinule alles. Kodulehel seda ei näidata.` |
| `admin.work.saveChanges` | `Salvesta muudatused` |
| `admin.work.unpublish` | `Võta kodulehelt maha` |
| `admin.work.delete` | `Kustuta töö` |
| `admin.work.cancel` | `Katkesta` |
| `admin.work.published` | `Valmis. Töö on nüüd kodulehel näha.` |
| `admin.work.draftSaved` | `Salvestatud. Kodulehel seda veel ei näidata.` |
| `admin.work.changesSaved` | `Muudatused on salvestatud.` |
| `admin.work.unpublished` | `Töö on kodulehelt maas. Sinu jaoks on ta siin alles.` |
| `admin.work.deleted` | `Töö on kustutatud.` |

### 10.8 Confirmation dialogs

**Deleting a project — the most dangerous action on the site.**

| Key | Estonian |
|---|---|
| `admin.confirm.deleteWork.title` | `Kustutan töö „{name}“?` |
| `admin.confirm.deleteWork.body.one` | `See töö ja selle 1 foto kustutatakse päriselt ära. Tagasi neid tuua ei saa.` |
| `admin.confirm.deleteWork.body.other` | `See töö ja kõik selle {count} fotot kustutatakse päriselt ära. Tagasi neid tuua ei saa.` |
| `admin.confirm.deleteWork.bodyNoPhotos` | `See töö kustutatakse päriselt ära. Tagasi seda tuua ei saa.` |
| `admin.confirm.deleteWork.alternative` | `Kui tahad töö ainult kodulehelt ära võtta, vajuta hoopis „Võta kodulehelt maha“.` |
| `admin.confirm.deleteWork.confirm` | `Jah, kustuta lõplikult` |
| `admin.confirm.deleteWork.cancel` | `Ei, jäta alles` |

Developer notes for this dialog: the confirm button must be red and must **not** be the button under
the thumb by default; the cancel button is the safe default and gets keyboard focus. The
`admin.confirm.deleteWork.alternative` line is what stops a builder from destroying a project when
all he wanted was to hide it — do not drop it.

**Taking a project off the site**

| Key | Estonian |
|---|---|
| `admin.confirm.unpublish.title` | `Võtan töö kodulehelt maha?` |
| `admin.confirm.unpublish.body` | `Töö kaob kodulehelt ära, aga jääb siin alles. Saad selle hiljem uuesti avaldada.` |
| `admin.confirm.unpublish.confirm` | `Jah, võta maha` |
| `admin.confirm.unpublish.cancel` | `Jäta kodulehele` |

**Leaving with unsaved changes**

| Key | Estonian |
|---|---|
| `admin.confirm.leave.title` | `Lähed ära ilma salvestamata?` |
| `admin.confirm.leave.body` | `Kõik, mis sa praegu kirjutasid ja lisasid, läheb kaotsi.` |
| `admin.confirm.leave.confirm` | `Lähen ära` |
| `admin.confirm.leave.cancel` | `Jään siia` |

**Removing a price row**

| Key | Estonian |
|---|---|
| `admin.confirm.removePrice.title` | `Eemaldan selle hinnarea?` |
| `admin.confirm.removePrice.body` | `Rida kaob kodulehelt ära, kui hinnad salvestad.` |
| `admin.confirm.removePrice.confirm` | `Jah, eemalda` |
| `admin.confirm.removePrice.cancel` | `Ei, jäta alles` |

### 10.9 Progress text

| Key | Estonian |
|---|---|
| `admin.progress.saving` | `Salvestan…` |
| `admin.progress.publishing` | `Avaldan tööd…` |
| `admin.progress.deleting` | `Kustutan…` |
| `admin.progress.uploading` | `Laadin fotosid üles… {done} / {total}` |
| `admin.progress.uploadingOne` | `Laadin fotot üles…` |
| `admin.progress.dontClose` | `Ära pane lehte kinni enne, kui fotod on üleval.` |
| `admin.progress.almostDone` | `Kohe valmis…` |
| `admin.progress.loading` | `Laen…` |

### 10.10 Price editor

| Key | Estonian |
|---|---|
| `admin.prices.heading` | `Hinnad` |
| `admin.prices.intro` | `Need hinnad on kodulehel „Hinnad“ all.` |
| `admin.prices.serviceLabel` | `Teenus` |
| `admin.prices.priceLabel` | `Hind` |
| `admin.prices.noteLabel` | `Märkus` |
| `admin.prices.noteHint` | `Lühike lisamärkus. Võid ka tühjaks jätta.` |
| `admin.prices.priceHint` | `Kirjuta hind nii, nagu see peab kodulehel välja nägema, näiteks „alates 12 €/m²“.` |
| `admin.prices.add` | `+ Lisa rida` |
| `admin.prices.remove` | `Eemalda rida` |
| `admin.prices.reorderHint` | `Hoia rida sõrme all ja lohista, et järjekorda muuta.` |
| `admin.prices.save` | `Salvesta hinnad` |
| `admin.prices.saved` | `Hinnad on salvestatud.` |
| `admin.prices.empty` | `Ühtegi hinnarida ei ole. Vajuta „+ Lisa rida“.` |
| `admin.prices.unsaved` | `Sul on salvestamata muudatused.` |

Price rows also have the Estonian / Russian pair from 10.5 on the service name and the note; the
price text itself is the same in both languages, so it needs no Russian box.

### 10.11 Errors

| Key | Estonian |
|---|---|
| `admin.errors.wrongPassword` | `Parool ei ole õige. Vaata suured ja väiksed tähed üle ja proovi uuesti.` |
| `admin.errors.sessionExpired` | `Sind logiti turvalisuse pärast välja. Logi uuesti sisse ja proovi uuesti.` |
| `admin.errors.notLoggedIn` | `Sa ei ole sisse logitud. Logi sisse, et edasi minna.` |
| `admin.errors.uploadFailed` | `See foto ei läinud üles. Proovi seda uuesti lisada.` |
| `admin.errors.uploadFailedSome.one` | `Üks foto ei läinud üles. Ülejäänud on alles — lisa see foto uuesti.` |
| `admin.errors.uploadFailedSome.other` | `{failed} fotot ei läinud üles. Ülejäänud on alles — lisa puuduvad fotod uuesti.` |
| `admin.errors.fileTooBig` | `See foto on liiga suur. Vali mõni teine foto või tee uus pilt.` |
| `admin.errors.unsupportedType` | `Siia saab panna ainult fotosid. Vali telefonist pilt (JPG, PNG, HEIC või WebP).` |
| `admin.errors.saveFailed` | `Salvestamine ei õnnestunud. Sinu kirjutatu on veel ekraanil — vajuta „Salvesta“ uuesti.` |
| `admin.errors.networkLost` | `Internetiühendust ei ole. Oota hetk ja proovi uuesti.` |
| `admin.errors.networkLostDuringUpload` | `Ühendus katkes ja kõik fotod ei jõudnud üles. Vaata, et internet oleks olemas, ja lisa puuduvad fotod uuesti. Kirjutatud tekst on alles.` |
| `admin.errors.workNotFound` | `Seda tööd ei leitud. Võib-olla on see juba kustutatud.` |
| `admin.errors.workNotFoundAction` | `Tagasi tööde juurde` |
| `admin.errors.deleteFailed` | `Kustutamine ei õnnestunud. Töö on alles. Proovi uuesti.` |
| `admin.errors.tooManyPhotos` | `Ühe töö juurde mahub kuni {{MAX_PHOTOS_PER_WORK}} fotot. Eemalda mõni foto ja proovi uuesti.` |
| `admin.errors.generic` | `Midagi läks viltu. Proovi uuesti. Kui see ei aita, helista {{SUPPORT_CONTACT}}.` |
| `admin.errors.retry` | `Proovi uuesti` |

Every one of these tells the builder what state his work is in ("Sinu kirjutatu on veel ekraanil",
"Töö on alles", "Kirjutatud tekst on alles"). That is the single most reassuring thing an error
message can do for someone who does not trust computers. Keep those clauses.

---

## 11. Footer

`footer.*`

| Key | ET | RU |
|---|---|---|
| `footer.company` | `MPH Meistrid OÜ` | `MPH Meistrid OÜ` |
| `footer.regCode` | `Registrikood 17317439` | `Регистрационный код 17317439` |
| `footer.vat` | `KMKR nr {{VAT_NUMBER}}` | `Номер НДС (KMKR) {{VAT_NUMBER}}` |
| `footer.tagline` | `Ehitus-, remondi- ja siseviimistlustööd {{REGION_ET}}` | `Строительные, ремонтные и отделочные работы в {{REGION_RU}}` |
| `footer.phone` | `{{PHONE}}` | `{{PHONE}}` |
| `footer.email` | `{{EMAIL}}` | `{{EMAIL}}` |
| `footer.privacy` | `Päringuvormis jagatud andmeid kasutame ainult pakkumise tegemiseks ja sinuga ühenduse võtmiseks. Kolmandatele isikutele me neid ei anna.` | `Данные, отправленные через форму запроса, мы используем только для подготовки предложения и связи с вами. Третьим лицам мы их не передаём.` |
| `footer.copyright` | `© {{YEAR}} MPH Meistrid OÜ` | `© {{YEAR}} MPH Meistrid OÜ` |
| `footer.navHeading` | `Lehed` | `Разделы` |
| `footer.contactHeading` | `Kontakt` | `Контакты` |
| `footer.backToTop` | `Üles` | `Наверх` |

### 11.1 What an Estonian OÜ should actually show

- **Business name and registry code** — required. Under the Estonian Commercial Code a company must
  identify itself with its business name and registry code on its business documents and website.
  `footer.company` + `footer.regCode` cover this. Do not remove them.
- **KMKR (VAT) number** — only if the company is VAT-registered. If not, delete `footer.vat`
  entirely rather than leaving a `{{VAT_NUMBER}}` in place.
- **Contact details** — phone and email in the footer, matching the contact section.
- **Privacy line** — the quote form collects a name, a phone number and possibly photos, which is
  personal data under the GDPR. A one-line statement of purpose in the footer is the minimum. If the
  client wants a full privacy policy page later, `footer.privacy` can become a link.
- **Not required and deliberately absent:** street address (we were told not to invent one), any
  licence or certification number, any claim about the company.

---

## 12. Placeholder inventory

The client's fill-in checklist. Nothing may ship with a `{{...}}` still in it.

### 12.1 Contact and company

| Placeholder | What it is | Example format |
|---|---|---|
| `{{PHONE}}` | Public phone number, formatted for reading | `+372 5123 4567` |
| `{{PHONE_HREF}}` | Same number with no spaces, for the `tel:` link | `+3725123456` |
| `{{EMAIL}}` | Public email address | `info@mphmeistrid.ee` |
| `{{VAT_NUMBER}}` | KMKR number — **only if VAT-registered**, otherwise delete the key | `EE102345678` |
| `{{FACEBOOK_URL}}` | Facebook page URL — optional, delete the block if none | `https://www.facebook.com/mphmeistrid` |
| `{{INSTAGRAM_URL}}` | Instagram profile URL — optional, delete the block if none | `https://www.instagram.com/mphmeistrid` |

### 12.2 Region — four forms, because Estonian and Russian inflect

| Placeholder | What it is | Assumed value (A1 — confirm) |
|---|---|---|
| `{{REGION_ET}}` | Region **inside an Estonian sentence**, already in the right case | `Tallinnas ja Harjumaal` |
| `{{CITY_ET}}` | Main city only, inflected, for short strings like the page title | `Tallinnas` |
| `{{REGION_NOMINATIVE_ET}}` | Region as a **label value** in the base form | `Tallinn ja Harjumaa` |
| `{{REGION_RU}}` | Region inside a Russian sentence, prepositional case | `Таллинне и Харьюмаа` |
| `{{CITY_RU}}` | Main city only, prepositional | `Таллинне` |
| `{{REGION_NOMINATIVE_RU}}` | Region as a label value, nominative | `Таллинн и Харьюмаа` |

The client only has to answer one question — "which areas do you work in?" — and the developer
derives all six forms. They are separate placeholders so that no code ever has to inflect Estonian.

### 12.3 Prices

| Placeholder | What it is | Example format |
|---|---|---|
| `{{PRICE_APARTMENT_RENOVATION}}` | Starting price, whole-apartment renovation, per m² | `250` |
| `{{PRICE_BATHROOM}}` | Starting price, bathroom renovation, per project | `3500` |
| `{{PRICE_PAINTING}}` | Starting price, painting walls and ceilings, per m² | `12` |
| `{{PRICE_TILING}}` | Starting price, tiling, per m² | `35` |
| `{{PRICE_FLOORING}}` | Starting price, flooring, per m² | `15` |
| `{{PRICE_DRYWALL}}` | Starting price, drywall and partitions, per m² | `30` |
| `{{VAT_NOTE_ET}}` | VAT sentence in Estonian — pick one from 6.3 or delete | `Hindadele lisandub käibemaks 24%.` |
| `{{VAT_NOTE_RU}}` | Same in Russian | `К ценам добавляется налог с оборота 24%.` |

The example numbers above are **format examples only**, shown so the client knows whether to write
"12" or "12 €/m²". They are not suggestions and must not be shipped.

### 12.4 Text the client writes

| Placeholder | What it is | Example format |
|---|---|---|
| `{{ABOUT_EXTRA_ET}}` | Optional extra sentence or two for the About section, Estonian. Empty string is fine. | `Töötame enamasti Tallinna vanemates kortermajades.` |
| `{{ABOUT_EXTRA_RU}}` | The same in Russian. Empty string is fine. | `Чаще всего работаем в старых многоквартирных домах Таллинна.` |

### 12.5 Technical values the developer sets

| Placeholder | What it is | Example format |
|---|---|---|
| `{{YEAR}}` | Copyright year — compute at build time, do not hard-code | `2026` |
| `{{MAX_UPLOAD_MB}}` | Per-photo size limit shown to users, in MB | `10` |
| `{{MAX_UPLOAD_COUNT}}` | How many photos the public form accepts at once | `5` |
| `{{MAX_PHOTOS_PER_WORK}}` | How many photos one project can hold | `20` |
| `{{SUPPORT_CONTACT}}` | Who the builder calls when the admin misbehaves — a phone number or name, **not** an email address, because he is on a roof | `+372 5xxx xxxx` |
| `{{SITE_URL}}` | Canonical site URL for metadata and OG tags | `https://mphmeistrid.ee` |

---

## 13. Open questions for the client

Ordered by how much they block the build.

1. **Which areas do you actually work in?** Tallinn and Harjumaa is our assumption (A1) and it is in
   the H1, the page title and the meta description. Getting this wrong wastes the local SEO.
2. **Confirm the six services** (4.2) — or tell us which of the alternatives (4.4) to swap in.
3. **Do you do electrical and plumbing work yourselves**, or is it subcontracted? (A6). We have left
   it off the site entirely until you answer.
4. **In the bathroom service, do you install the fixtures** (WC, basin, mixer) or only tile and finish?
5. **Six starting prices** (12.3), and **is the company VAT-registered** — and are the prices shown
   with or without VAT? (6.3)
6. **Phone number and email address** for the site (12.1).
7. **Is a quote free / without obligation?** (A2). If yes, we can say so in the hero and the form,
   which measurably increases enquiries. We have not claimed it.
8. **Do you visit the site before quoting?** (A3). The copy currently implies you do.
9. **Should the form require a phone number, an email, or either?** Current draft: phone required,
   email optional.
10. **Facebook / Instagram** — do they exist? Delete the block if not.
11. **Anything you want in the About section beyond the legal facts** (`{{ABOUT_EXTRA_ET}}` / `_RU`).
    Note that we cannot write years of experience, headcount, certifications, warranties or project
    counts unless you supply them as facts.
12. **Which H1 do you prefer** from the three options in 3.1?
13. **Who does the builder call when the admin breaks?** (`{{SUPPORT_CONTACT}}`).
