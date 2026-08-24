# CONTENT.md — mida on vaja täita / what still needs filling in

**Eesti keeles.** See dokument on nimekiri kohtadest, kus kodulehel on praegu ajutine
märgend `{{NII}}` päris teksti asemel. Iga selline märgend ootab ühte konkreetset asja —
telefoninumbrit, e-posti aadressi, piirkonna nime. Käi tabel läbi ja ütle meile iga rea
kohta, mis sinna kirjutada; meie paneme need õigetesse failidesse. Ühtegi märgendit ei tohi
jääda kodulehele, kui see avalikuks läheb. Dokumendi lõpus on veel 13 küsimust, millele
vastuseid ootame, ja kolm valikut kodulehe suure pealkirja jaoks.

**In English.** This document lists every spot where the site currently shows a temporary
`{{MARKER}}` instead of real text. Each marker is waiting for one specific thing — a phone
number, an email address, a region name. Work down the table and tell us what goes in each
row; we put the values into the right files. Nothing may go live with a `{{...}}` still in
it. At the end there are the 13 open questions we need answered and the three headline
options to choose from.

---

## 1. Märgendid / Placeholders

Kolm asja, mida enne tabeli lugemist teada tasub:

- **Failid.** `messages/et.json` on eestikeelse kodulehe tekst, `messages/ru.json`
  venekeelse oma, `site.ts` on ettevõtte kontaktandmed. Millise faili rida puudutab, on
  viimases veerus.
- **Hinnad ja tööd ei ole siin.** Neid muudad ise aadressil `/admin` — vt osa 5.
- **Sama väärtus, kaks nime.** Telefoninumber esineb kahe eri nimega, sest üht kasutatakse
  tekstis ja teist lingis. Vastad ikkagi ainult ühe korra.

### 1.1 Kontakt ja ettevõte / Contact and company

| Märgend | Mis see on | What it is | Kus kodulehel / Where it appears | Näide / Example | Fail |
|---|---|---|---|---|---|
| `{{PHONE}}` | Telefoninumber nii, nagu see peab ekraanil välja nägema | Phone number as displayed to the reader | Kontakt, jalus, „Helista“ nupp, vormi tänu- ja veateated | `+372 5123 4567` | `et.json`, `ru.json` |
| `{{PHONE_DISPLAY}}` | Seesama number — teine nimi teises failis | The same number, under its name in the constants file | Nupu- ja lingitekstid | `+372 5123 4567` | `site.ts` |
| `{{PHONE_E164}}` | Seesama number ilma tühikuteta, et helistamisnupp töötaks | The same number with no spaces, so the tap-to-call link works | „Helista“ nupu link | `+3725123456` | `site.ts` |
| `{{EMAIL}}` | Avalik e-posti aadress | Public email address | Kontakt, jalus | `info@mphmeistrid.ee` | `et.json`, `ru.json`, `site.ts` |
| `{{VAT_NUMBER}}` | KMKR number — **ainult siis, kui ettevõte on käibemaksukohustuslane**. Kui ei ole, ütle seda ja me võtame rea üldse ära | VAT (KMKR) number — only if the company is VAT-registered; otherwise the whole line is removed | Jalus | `EE102345678` | `et.json`, `ru.json` |

**Facebook ja Instagram.** Neid ei ole märgendina kirjas — `site.ts` failis on nende koht
praegu tühi ja tühja lingi korral ei näidata sotsiaalmeedia plokki üldse. Kui lehed on
olemas, saada aadressid (`https://www.facebook.com/...`) ja me paneme need sisse.

### 1.2 Piirkond / Region

Sina vastad **ühele küsimusele — „mis piirkonnas te töötate?“**. Ülejäänud vormid tuletame
ise, sest eesti ja vene keeles käändub piirkonna nimi lauses teistmoodi kui sildi järel.
Meie oletus on praegu Tallinn ja Harjumaa; kui see on vale, on vale ka kogu kohalik
Google'i otsing, nii et see on kõige tähtsam rida terves dokumendis.

| Märgend | Mis see on | What it is | Kus kodulehel / Where it appears | Näide / Example | Fail |
|---|---|---|---|---|---|
| `{{REGION_ET}}` | Piirkond eestikeelse lause sees, õiges käändes | Region inside an Estonian sentence, already inflected | Suur pealkiri, Google'i kirjeldus, „Meist“, jalus | `Tallinnas ja Harjumaal` | `et.json` |
| `{{CITY_ET}}` | Ainult peamine linn, käänatud | Main city only, inflected | Lehe pealkiri brauseri sakis ja Google'i tulemuses | `Tallinnas` | `et.json` |
| `{{REGION_NOMINATIVE_ET}}` | Piirkond sildi väärtusena, algvormis | Region as a label value, base form | Kontakt → „Piirkond“ | `Tallinn ja Harjumaa` | `et.json` |
| `{{REGION_RU}}` | Piirkond venekeelse lause sees | Region inside a Russian sentence | Sama, venekeelsel lehel | `Таллинне и Харьюмаа` | `ru.json` |
| `{{CITY_RU}}` | Ainult linn, venekeelses lauses | Main city only, Russian | Venekeelse lehe pealkiri | `Таллинне` | `ru.json` |
| `{{REGION_NOMINATIVE_RU}}` | Piirkond sildi väärtusena, vene keeles | Region as a label value, Russian | Kontakt → „Регион“ | `Таллинн и Харьюмаа` | `ru.json` |
| `{{REGION}}` | Piirkond ettevõtte andmetes, mida Google loeb | Service area in the machine-readable company data | Ei ole ekraanil näha; Google loeb seda | `Tallinn ja Harjumaa` | `site.ts` |

### 1.3 Tekst, mille kirjutad sina / Text you write

| Märgend | Mis see on | What it is | Kus kodulehel / Where it appears | Näide / Example | Fail |
|---|---|---|---|---|---|
| `{{ABOUT_EXTRA_ET}}` | Vabatahtlik lisalause „Meist“ juurde. Võib jääda tühjaks — siis lihtsalt ei näidata midagi | Optional extra sentence for the About section. May be left empty | „Meist“ | `Töötame enamasti Tallinna vanemates kortermajades.` | `et.json` |
| `{{ABOUT_EXTRA_RU}}` | Seesama vene keeles. Võib jääda tühjaks | The same in Russian. May be left empty | „О нас“ | `Чаще всего работаем в старых многоквартирных домах Таллинна.` | `ru.json` |
| `{{VAT_NOTE_ET}}` | Üks lause käibemaksu kohta — vali variant osast 4 või ütle, et rida ära võtta | One sentence about VAT — pick an option in section 4 or have the line removed | „Hinnad“, tabeli all | `Hindadele lisandub käibemaks 24%.` | `et.json` |
| `{{VAT_NOTE_RU}}` | Seesama vene keeles | The same in Russian | „Цены“ | `К ценам добавляется налог с оборота 24%.` | `ru.json` |

Käibemaksulause kolm võimalust:

| Olukord | Eesti | Vene |
|---|---|---|
| Käibemaksukohustuslane, hinnad ilma käibemaksuta | `Hindadele lisandub käibemaks 24%.` | `К ценам добавляется налог с оборота 24%.` |
| Käibemaksukohustuslane, hinnad koos käibemaksuga | `Hinnad sisaldavad käibemaksu.` | `Цены указаны с налогом с оборота.` |
| Ei ole käibemaksukohustuslane | rida võetakse ära | rida võetakse ära |

24% on Eesti käibemaksumäär 2025. aasta seisuga — arendaja kontrollib avaldamise hetkel
kehtiva määra üle.

### 1.4 Hinnad — need täidad ise `/admin` all / Prices — you fill these in at /admin

Need kuus arvu ei ole üheski failis. Kirjutad need ise kodulehe halduses, nii et hindu saab
hiljem muuta ilma meid tülitamata. Tabel on siin ainult selleks, et sa teaksid, mida
küsitakse ja mis kujul.

| Rida | Mis see on | What it is | Näide / Example |
|---|---|---|---|
| Korteri üldremont | Algushind ruutmeetri kohta | Starting price per m² | `alates 250 €/m²` |
| Vannitoa remont | Algushind projekti kohta (vt küsimus 5) | Starting price per project | `alates 3500 €/projekt` |
| Maalritööd | Algushind ruutmeetri kohta | Starting price per m² | `alates 12 €/m²` |
| Plaatimistööd | Algushind ruutmeetri kohta | Starting price per m² | `alates 35 €/m²` |
| Põrandatööd | Algushind ruutmeetri kohta | Starting price per m² | `alates 15 €/m²` |
| Kipsplaaditööd ja vaheseinad | Algushind ruutmeetri kohta | Starting price per m² | `alates 30 €/m²` |

Ülaltoodud arvud on **ainult näited vormistuse kohta**, mitte soovitused. Ükski number ei
ole meie välja mõeldud ja ükski neist ei tohi kodulehele jõuda.

### 1.5 Tehnilised väärtused — need paneb paika arendaja / Technical values, set by the developer

Nendega sina midagi tegema ei pea, välja arvatud viimane rida.

| Märgend | Mis see on | What it is | Kus / Where | Näide / Example | Fail |
|---|---|---|---|---|---|
| `{{MAX_UPLOAD_COUNT}}` | Mitu fotot saab vormiga korraga saata | How many photos the quote form accepts | Vormi vihje ja veateated | `3` | `et.json`, `ru.json` |
| `{{MAX_PHOTOS_PER_WORK}}` | Mitu fotot mahub ühe töö juurde | How many photos one project can hold | Admini veateade | `30` | `admin-text.ts` |
| `{{SUPPORT_CONTACT}}` | **Sinu vastust vajav rida:** kellele ehitaja helistab, kui koduleha haldus ei tööta. Telefoninumber või nimi, mitte e-post — ta on katusel | Who the builder calls when the admin misbehaves. A phone number or a name, not an email | Admini sisselogimine ja veateated | `+372 5xxx xxxx` | `admin-text.ts` |

Neid kahte ei pea sina täitma — kood asendab need ise õigete numbritega
(`MAX_QUOTE_PHOTOS` failis `src/lib/quote-limits.ts` ja `MAX_PHOTOS_PER_PROJECT` failis
`src/lib/images.ts`), nii et need ei saa dokumendist lahku minna. Praegu: vormiga kuni
**3 fotot**, ühe töö juurde kuni **30 fotot**.

`{{YEAR}}` ei ole enam märgend — jaluse aastaarvu paneb kood ise.

Fotode megabaite kodulehel enam ei mainita: brauser vähendab iga foto enne saatmist
automaatselt, nii et külastaja ei saa failisuurusega midagi peale hakata ja number ainult
ajaks segadusse.

Kodulehe aadress (`{{SITE_URL}}` mustandis) ei ole märgend, vaid keskkonnamuutuja
`NEXT_PUBLIC_SITE_URL`, mille vaikeväärtus on juba `https://mphmeistrid.ee`.

---

## 2. Kolmteist lahtist küsimust / The 13 open questions

Järjestatud selle järgi, kui palju need tööd kinni hoiavad.

- [ ] **1. Mis piirkonnas te tegelikult töötate?** Meie oletus on Tallinn ja Harjumaa. See on
      suures pealkirjas, lehe pealkirjas ja Google'i kirjelduses — vale piirkond tähendab,
      et kohalik otsing läheb raisku.
- [ ] **2. Kinnita kuus teenust.** Nimekiri on meie ettepanek, mitte teie öeldu. Ütle, kas
      see sobib, mida ümber järjestada või mida välja vahetada. Valmis kirjutatud alternatiivid
      on olemas: siseviimistlustööd, elektri- ja santehnikatööd, lammutustööd, siseuste ja
      liistude paigaldus, väiketööd tunnitasu alusel, fassaadi- ja välitööd.
- [ ] **3. Kas teete elektri- ja santehnikatöid ise** või ostate need sisse? Elektritööd on
      Eestis reguleeritud tegevus. Oleme need kodulehelt praegu täiesti välja jätnud, kuni
      vastate.
- [ ] **4. Kas vannitoa teenuse sees paigaldate ka sanitaartehnika** (WC, valamu, segisti) või
      teete ainult plaatimise ja viimistluse?
- [ ] **5. Kuus algushinda** (osa 1.4) ja **kas ettevõte on käibemaksukohustuslane** — kas
      hinnad on käibemaksuga või ilma?
- [ ] **6. Telefoninumber ja e-posti aadress** kodulehe jaoks.
- [ ] **7. Kas pakkumine on tasuta ja mittesiduv?** Kui jah, saame seda öelda suures
      pealkirjas ja vormi juures, mis toob mõõdetavalt rohkem päringuid. Praegu me seda ei
      väida, sest me ei tea.
- [ ] **8. Kas käite enne pakkumise tegemist objekti vaatamas?** Praegune tekst („vaatame töö
      üle“) eeldab, et käite.
- [ ] **9. Kas vorm peab nõudma telefoninumbrit, e-posti või ükskõik kumba?** Praegu:
      telefon kohustuslik, e-post vabatahtlik.
- [ ] **10. Facebook ja Instagram** — kas need on olemas? Kui ei, võtame ploki ära.
- [ ] **11. Kas tahate „Meist“ juurde midagi lisaks juriidilistele faktidele?**
      (`{{ABOUT_EXTRA_ET}}` / `{{ABOUT_EXTRA_RU}}`.) Pane tähele: tööaastaid, töötajate arvu,
      sertifikaate, garantiisid ega tehtud tööde arvu ei saa me kirjutada enne, kui annate
      need faktidena.
- [ ] **12. Milline suur pealkiri (H1) meeldib** kolmest variandist osas 3?
- [ ] **13. Kellele ehitaja helistab, kui haldus ei tööta?** (`{{SUPPORT_CONTACT}}`.)

---

## 3. Suur pealkiri — vali üks / The H1 — pick one

Kodulehe kõige suurem lause. Praegu on kasutusel **variant A**; kui valid mõne teise, ütle
ja me vahetame. Vali eesti ja vene keeles sama variant, et mõlemad lehed ütleksid sama asja
(A ja A, B ja B, C ja C).

**Eesti keeles**

| Variant | Tekst | Pikkus | Iseloom |
|---|---|---|---|
| **A — praegu kasutusel, soovitatud** | `Ehitus-, remondi- ja siseviimistlustööd {{REGION_ET}}` | 62 tähemärki | Katab korraga kõik kolm otsingusõnade peret. |
| B | `Korterite ja majade remont {{REGION_ET}}` | 48 | Kõige kitsam ja selgem; parim, kui korterid on põhiäri. |
| C | `Siseviimistlus ja remonditööd {{REGION_ET}}` | 51 | Alustab viimistlusest; parim, kui see on teie eriala. |

**Vene keeles**

| Variant | Tekst | Pikkus | Iseloom |
|---|---|---|---|
| **A — praegu kasutusel, soovitatud** | `Строительные, ремонтные и отделочные работы в {{REGION_RU}}` | 65 tähemärki | Peegeldab varianti A. |
| B | `Ремонт квартир и домов в {{REGION_RU}}` | 43 | Kõige lähedasem sellele, kuidas vene keeles päriselt otsitakse („ремонт квартир Таллинн“). |
| C | `Отделочные и ремонтные работы в {{REGION_RU}}` | 51 | Peegeldab varianti C. |

Pikkused on mõõdetud oletatud piirkonnaväärtusega. Kui teie piirkonna nimi on tunduvalt
pikem kui „Tallinnas ja Harjumaal“, mõõdame uuesti.

---

## 4. Kuidas seda täidetakse / How this gets filled in

**Sina** vastad küsimustele ja saadad väärtused. **Arendaja** paneb need failidesse. Kolm
faili, kus märgendid elavad:

| Fail | Mis seal on |
|---|---|
| `src/i18n/messages/et.json` | Kogu eestikeelse kodulehe tekst |
| `src/i18n/messages/ru.json` | Kogu venekeelse kodulehe tekst |
| `src/content/site.ts` | Ettevõtte kontaktandmed ja piirkond |
| `src/content/admin-text.ts` | Halduse tekstid — ainult `{{SUPPORT_CONTACT}}` ja `{{MAX_PHOTOS_PER_WORK}}` |

### Arendajale: jutumärgid `.json` failides

`et.json` ja `ru.json` failides on iga märgend **ülakomade vahel**:

```json
"phoneValue": "'{{PHONE}}'",
"ctaSecondaryAria": "Helista numbril '{{PHONE}}'"
```

Ülakomad on kohustuslikud. next-intl loeb neid faile ICU-sõnumitena ja looksulg on seal
erimärk: ilma ülakomadeta ei suuda `{{PHONE}}` üldse laadida ja ekraanile ilmub võtme nimi
(`hero.ctaSecondaryAria`) päris teksti asemel. Ülakomadega renderdub `{{PHONE}}` täpselt nii,
nagu ta kirjas on.

Asendamisel **kustuta ka ülakomad**, mitte ainult looksulud:

- õige: `"phoneValue": "+372 5123 4567"`
- vale: `"phoneValue": "'+372 5123 4567'"` — ülakomad jäävad ekraanile näha

Kontroll enne avaldamist: `grep -rn "{{" src/` ei tohi anda ühtegi vastet peale kommentaaride.

### Mida siin **ei** ole

**Tehtud tööd ja hinnad ei ole selles dokumendis ega üheski failis.** Neid muudad ise
aadressil **`/admin`**: „+ Lisa uus töö“ paneb üles uue töö koos fotodega, „Muuda hindu“
avab hinnatabeli. Muudatus on kodulehel näha kohe pärast salvestamist ja selleks ei ole vaja
arendajat. Just seepärast ei ole hinnanumbrid siin märgenditena — need on sinu oma, alati
muudetavad.
