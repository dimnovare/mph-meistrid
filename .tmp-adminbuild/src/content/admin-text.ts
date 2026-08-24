/**
 * Every string in the admin area.
 *
 * The admin sits outside the `[locale]` segment and is Estonian-only by decision: it has
 * exactly one user, he is Estonian-speaking, and a language switcher there would be a
 * second thing to maintain for nobody's benefit. So this is a plain object rather than a
 * next-intl catalogue — no ICU, no message parsing, no `useTranslations`. Import it and
 * read the property.
 *
 * Because there is no ICU here:
 *
 * - `{{SUPPORT_CONTACT}}` and `{{MAX_PHOTOS_PER_WORK}}` are plain text and need no escaping
 *   (unlike `src/i18n/messages/*.json`, where a literal brace has to be quoted). They are
 *   still fill-in-before-launch values — see docs/CONTENT.md.
 * - Runtime tokens — `{name}`, `{count}`, `{date}`, `{done}`, `{total}`, `{failed}` — are
 *   substituted by the component with a plain `.replace()`. They are not ICU arguments.
 * - Estonian plurals are `{ one, other }` pairs; the component picks (`n === 1 ? one : other`).
 *   Estonian has exactly these two forms, so nothing cleverer is needed.
 *
 * Tone rules applied throughout, from section 10 of docs/content-draft.md. The reader is a
 * builder, on a phone, on site, in daylight, possibly with dusty hands:
 *
 * - No developer words. No "publitseeri", "olek", "objekt", "kirje", "API", "server",
 *   "sessioon", and no "fail" where "foto" works.
 * - Every button says what will happen, not what it is called internally.
 * - Every destructive action names the thing being destroyed and says whether it can be undone.
 * - Every error says what to do next, and says what state his work is in — "Sinu kirjutatu on
 *   veel ekraanil", "Töö on alles", "Ülejäänud on alles". Do not edit those clauses out; for
 *   someone who does not trust computers they are the most reassuring part of the message.
 */

export const adminText = {
  login: {
    heading: 'Logi sisse',
    intro: 'Siit saad lisada ja muuta kodulehel olevaid töid ja hindu.',
    usernameLabel: 'Kasutajanimi',
    usernamePlaceholder: 'Kirjuta kasutajanimi',
    passwordLabel: 'Parool',
    passwordPlaceholder: 'Kirjuta parool',
    showPassword: 'Näita parooli',
    hidePassword: 'Peida parool',
    submit: 'Logi sisse',
    working: 'Login sisse…',
    help: 'Kui parool on kadunud, helista {{SUPPORT_CONTACT}}.',

    logout: {
      label: 'Logi välja',
      confirmTitle: 'Kas logid välja?',
      confirmBody: 'Saad hiljem parooliga uuesti sisse.',
      confirm: 'Jah, logi välja',
      cancel: 'Jää sisse',
    },
  },

  dashboard: {
    heading: 'Kodulehe haldus',
    intro: 'Mida soovid teha?',
    addWork: '+ Lisa uus töö',
    addWorkHint: 'Pane üles uus tehtud töö koos fotodega.',
    editPrices: 'Muuda hindu',
    editPricesHint: 'Muuda kodulehel näidatavaid hindu.',
    viewSite: 'Vaata kodulehte',
    worksHeading: 'Tehtud tööd',
    worksCount: {
      one: '{count} töö',
      other: '{count} tööd',
    },
    empty: 'Ühtegi tööd ei ole veel lisatud. Vajuta „+ Lisa uus töö“ ja alusta.',

    /**
     * Day one, and the first thing the client and anyone reviewing the site ever sees. The
     * design board (1e) splits the single `empty` sentence above into a promise and a next
     * step, and puts a time on the first job so it does not look like an afternoon's work.
     */
    emptyTitle: 'Siia tekivad sinu tehtud tööd.',
    emptyBody:
      'Vajuta „+ Lisa uus töö“. Esimene töö võtab umbes viis minutit: nimi, mõned fotod, avalda.',

    /** The list of projects on the dashboard. */
    works: {
      heading: 'Tehtud tööd',
      statusPublished: 'Kodulehel näha',
      statusDraft: 'Mustand — kodulehel ei ole näha',
      /**
       * The same state in the one place where the full sentence does not fit: the edit
       * screen's top bar, where it sits opposite „← Tagasi“ on a 360px line (board 1g). The
       * full wording is still what the sticky bar and the dashboard rows say.
       */
      statusDraftShort: 'Mustand',
      noPhoto: 'Fotot ei ole',
      photoCount: {
        one: '{count} foto',
        other: '{count} fotot',
      },
      updatedAt: 'Muudetud {date}',
      edit: 'Muuda',
      delete: 'Kustuta',
      open: 'Ava',
      reorderHint:
        'Järjekorda muudad nooltega ↑ ja ↓. Ülemine töö on kodulehel esimene.',
      loading: 'Laen töid…',
    },
  },

  project: {
    newHeading: 'Uus töö',
    editHeading: 'Muuda tööd',

    name: {
      label: 'Töö nimi',
      placeholder: 'Kirjuta töö nimi',
      hint: 'Näiteks „Vannitoa remont Mustamäel“.',
    },
    location: {
      label: 'Asukoht',
      placeholder: 'Näiteks Kristiine, Tallinn',
      hint: 'Linnaosa või linn. Võid ka tühjaks jätta.',
    },
    description: {
      label: 'Kirjeldus',
      placeholder: 'Paar lauset sellest, mis tehtud sai',
      hint: 'Võid ka tühjaks jätta.',
    },
    optional: 'ei ole kohustuslik',
    photosLabel: 'Fotod',
    back: 'Tagasi',

    /**
     * Every text field on a project has an Estonian box and a Russian box directly under it.
     * Estonian first, Russian below, visually grouped, `ruHint` once per group in small grey
     * text. Do not use tabs or a language switcher — on a phone a hidden second tab will
     * simply never be filled in. Labels read `Töö nimi — Eesti keeles`, `Töö nimi — Vene
     * keeles`. Photos have no language.
     */
    lang: {
      explain:
        'Koduleht on kahes keeles. Kirjuta tekst eesti keeles. Vene keele võid täita, aga ei pea.',
      et: 'Eesti keeles',
      ru: 'Vene keeles',
      ruOptional: 'ei ole kohustuslik',
      ruHint:
        'Kui jätad vene keele tühjaks, näidatakse venekeelsele külastajale eestikeelset teksti.',
      ruEmptyBadge: 'Vene keel tühi — näidatakse eestikeelset teksti',
      copyEtToRu: 'Kopeeri eestikeelne tekst siia',
      copied: 'Kopeeritud.',
    },

    publish: 'Avalda töö',
    publishHint: 'Töö läheb kodulehele kõigile näha.',
    saveDraft: 'Salvesta mustandina',
    saveDraftHint: 'Töö jääb ainult sinule alles. Kodulehel seda ei näidata.',
    saveChanges: 'Salvesta muudatused',
    unpublish: 'Võta kodulehelt maha',
    delete: 'Kustuta töö',
    /** The line under the resting delete button, so the consequence is read before the tap. */
    deleteHint: 'Kustutamine eemaldab töö ja kõik fotod jäädavalt.',
    cancel: 'Katkesta',

    published: 'Valmis. Töö on nüüd kodulehel näha.',
    draftSaved: 'Salvestatud. Kodulehel seda veel ei näidata.',
    changesSaved: 'Muudatused on salvestatud.',
    unpublished: 'Töö on kodulehelt maas. Sinu jaoks on ta siin alles.',
    deleted: 'Töö on kustutatud.',

    progress: {
      saving: 'Salvestan…',
      publishing: 'Avaldan tööd…',
      deleting: 'Kustutan…',
      uploading: 'Laadin fotosid üles… {done} / {total}',
      /**
       * The same count, short enough to stay on one line at 22px on a 360px screen — the
       * aggregate upload block (board 1j) is meant to be read at arm's length, and the long
       * form above wraps to two lines there.
       */
      uploadingCount: 'Laadin üles {done} / {total}',
      uploadingOne: 'Laadin fotot üles…',
      dontClose: 'Ära pane lehte kinni enne, kui fotod on üleval.',
      almostDone: 'Kohe valmis…',
      loading: 'Laen…',
    },
  },

  photos: {
    heading: 'Fotod',
    add: 'Lisa fotod',
    addHint: 'Vali telefonist pildid või tee kohe uus pilt.',
    dropHint: 'Lohista pildid siia või vajuta „Lisa fotod“.',
    /**
     * The camera. A *second* control beside the library picker, never a replacement for it:
     * he is standing in the room he has just finished, but the usual case is still that he
     * photographed it an hour ago and the pictures are in the phone's gallery.
     */
    takePhoto: 'Tee foto',
    empty: 'Ühtegi fotot ei ole veel lisatud.',
    reorderHint: 'Järjekorda muudad iga foto kõrval olevate nooltega ↑ ja ↓.',
    coverHint: 'Esimene foto on kaanepilt — seda näidatakse kodulehel kõige suuremalt.',
    /** The same fact, said inside the cover row itself, where the badge already is. */
    coverRowHint: 'Koduleht näitab seda esimesena.',
    setCover: 'Tee kaanepildiks',
    isCover: 'Kaanepilt',
    remove: 'Eemalda foto',
    moveUp: 'Liiguta ettepoole',
    moveDown: 'Liiguta tahapoole',
    count: {
      one: '{count} foto',
      other: '{count} fotot',
    },
  },

  pricing: {
    heading: 'Hinnad',
    intro: 'Need hinnad on kodulehel „Hinnad“ all.',
    serviceLabel: 'Teenus',
    priceLabel: 'Hind',
    noteLabel: 'Märkus',
    noteHint: 'Lühike lisamärkus. Võid ka tühjaks jätta.',
    priceHint:
      'Kirjuta hind nii, nagu see peab kodulehel välja nägema, näiteks „alates 12 €/m²“.',
    add: '+ Lisa rida',
    remove: 'Eemalda rida',
    reorderHint: 'Järjekorda muudad iga rea kõrval olevate nooltega ↑ ja ↓.',
    save: 'Salvesta hinnad',
    saved: 'Hinnad on salvestatud.',
    empty: 'Ühtegi hinnarida ei ole. Vajuta „+ Lisa rida“.',
    /** Board 1u: the same empty state as the dashboard's — a promise, then the next step. */
    emptyTitle: 'Hinnakirja ridu veel ei ole.',
    emptyBody: 'Vajuta „+ Lisa rida“ — teenus, hind ja soovi korral märkus.',
    unsaved: 'Sul on salvestamata muudatused.',
    // Price rows carry the same Estonian / Russian pair as project fields on the service name
    // and the note. The price text itself is identical in both languages, so it has no
    // Russian box.
  },

  confirm: {
    /**
     * Deleting a project is the most dangerous action on the site. The confirm button must be
     * red and must NOT be the button under the thumb by default; cancel is the safe default
     * and takes keyboard focus. `alternative` is the line that stops a builder from
     * destroying a project when all he wanted was to hide it — do not drop it.
     */
    deleteWork: {
      title: 'Kustutan töö „{name}“?',
      body: {
        one: 'See töö ja selle 1 foto kustutatakse päriselt ära. Tagasi neid tuua ei saa.',
        other:
          'See töö ja kõik selle {count} fotot kustutatakse päriselt ära. Tagasi neid tuua ei saa.',
      },
      bodyNoPhotos: 'See töö kustutatakse päriselt ära. Tagasi seda tuua ei saa.',
      alternative:
        'Kui tahad töö ainult kodulehelt ära võtta, vajuta hoopis „Võta kodulehelt maha“.',
      confirm: 'Jah, kustuta lõplikult',
      cancel: 'Ei, jäta alles',
    },

    unpublish: {
      title: 'Võtan töö kodulehelt maha?',
      body: 'Töö kaob kodulehelt ära, aga jääb siin alles. Saad selle hiljem uuesti avaldada.',
      confirm: 'Jah, võta maha',
      cancel: 'Jäta kodulehele',
    },

    removePhoto: {
      title: 'Eemaldan selle foto?',
      body: 'Foto kaob selle töö juurest ära ja seda ei saa tagasi tuua.',
      confirm: 'Jah, eemalda',
      cancel: 'Ei, jäta alles',
    },

    removePrice: {
      title: 'Eemaldan selle hinnarea?',
      body: 'Rida kaob kodulehelt ära, kui hinnad salvestad.',
      confirm: 'Jah, eemalda',
      cancel: 'Ei, jäta alles',
    },

    leave: {
      title: 'Lähed ära ilma salvestamata?',
      body: 'Kõik, mis sa praegu kirjutasid ja lisasid, läheb kaotsi.',
      confirm: 'Lähen ära',
      cancel: 'Jään siia',
    },
  },

  /**
   * One entry per failure path that `src/app/admin/actions.ts` and
   * `src/app/api/admin/upload/route.ts` can actually reach. Both files currently carry these
   * strings inline; they should read from here instead.
   */
  errors: {
    /* ---------------------------------------------------------------- signing in */

    /** Both login fields empty. */
    loginFieldsEmpty: 'Täida mõlemad väljad ja proovi uuesti.',
    /** Wrong username or password. Deliberately does not say which one was wrong. */
    wrongCredentials:
      'Kasutajanimi või parool ei ole õige. Vaata suured ja väiksed tähed üle ja proovi uuesti.',
    /** Kept for a password-only login screen. */
    wrongPassword: 'Parool ei ole õige. Vaata suured ja väiksed tähed üle ja proovi uuesti.',
    /** Rate limiter tripped — 8 failed attempts in 15 minutes. */
    tooManyAttempts:
      'Liiga palju katseid. Oota 15 minutit ja proovi uuesti. Kui parool on kadunud, helista {{SUPPORT_CONTACT}}.',
    sessionExpired: 'Sind logiti turvalisuse pärast välja. Logi uuesti sisse ja proovi uuesti.',
    notLoggedIn: 'Sa ei ole sisse logitud. Logi sisse, et edasi minna.',
    /** The Origin check rejected the request — usually a stale tab. */
    requestRejected: 'Seda päringut ei lubatud läbi. Värskenda lehte ja proovi uuesti.',

    /* ------------------------------------------------------------------- photos */

    uploadFailed: 'See foto ei läinud üles. Proovi seda uuesti lisada.',
    uploadFailedSome: {
      one: 'Üks foto ei läinud üles. Ülejäänud on alles — lisa see foto uuesti.',
      other: '{failed} fotot ei läinud üles. Ülejäänud on alles — lisa puuduvad fotod uuesti.',
    },
    /** The upload was cut off before the photo arrived. */
    uploadInterrupted: 'Foto lisamine katkes poole pealt. Proovi seda uuesti lisada.',
    /** Photos were dropped on a project that has not been created yet. */
    saveWorkFirst:
      'Salvesta töö enne fotode lisamist. Kirjuta töö nimi ja vajuta „Salvesta mustandina“.',
    noFileChosen: 'Fotot ei valitud. Vali telefonist pilt ja proovi uuesti.',
    emptyFile: 'See fail on tühi. Vali mõni teine foto või tee uus pilt.',
    fileTooBig: 'See foto on liiga suur. Vali mõni teine foto või tee uus pilt.',
    unsupportedType:
      'Siia saab panna ainult fotosid. Vali telefonist pilt (JPG, PNG, HEIC või WebP).',
    /** Pixel dimensions are too large, even though the file itself may be small. */
    photoTooLarge: 'See foto on liiga suurte mõõtudega. Vali mõni teine foto või tee uus pilt.',
    /** The file could not be opened as an image at all. */
    photoUnreadable: 'Seda fotot ei õnnestunud avada. Vali mõni teine foto või tee uus pilt.',
    /** The photo was readable but resizing it failed on our side. */
    photoProcessingFailed:
      'Selle fotoga läks meie poolel midagi viltu. Proovi seda uuesti lisada või vali mõni teine foto.',
    /** The photo, or the note that it exists, did not get stored. */
    photoStorageFailed:
      'See foto ei jõudnud kohale. Ülejäänud töö on alles — proovi foto uuesti lisada.',
    tooManyPhotos:
      'Ühe töö juurde mahub kuni {{MAX_PHOTOS_PER_WORK}} fotot. Eemalda mõni foto ja proovi uuesti.',

    /* ------------------------------------------------------------------- saving */

    /** The project has no name, which is the only required field. */
    titleRequired: 'Töö nimi on puudu. Kirjuta, mis töö see oli, ja salvesta uuesti.',
    saveFailed:
      'Salvestamine ei õnnestunud. Sinu kirjutatu on veel ekraanil — vajuta „Salvesta“ uuesti.',
    deleteFailed: 'Kustutamine ei õnnestunud. Töö on alles. Proovi uuesti.',
    workNotFound: 'Seda tööd ei leitud. Võib-olla on see juba kustutatud.',
    workNotFoundAction: 'Tagasi tööde juurde',

    /**
     * The error and not-found screens are the same shape (board 1n, 1w): one heading, one
     * sentence, one control. The headings below are what the sentences already in this file
     * are the *body* of — `generic` and the pair beneath.
     */
    genericTitle: 'Midagi läks valesti.',
    notFoundTitle: 'Seda lehte ei ole olemas.',
    notFoundBody: 'Võib-olla on töö vahepeal kustutatud.',

    /* ------------------------------------------------------------------ pricing */

    priceSaveFailed: 'Hindade salvestamine ei õnnestunud. Hinnad on ekraanil alles — proovi uuesti.',
    priceRowTooLong: 'Mõni rida on liiga pikk. Lühenda teksti ja proovi uuesti.',

    /* ------------------------------------------------------------------ network */

    networkLost: 'Internetiühendust ei ole. Oota hetk ja proovi uuesti.',
    networkLostDuringUpload:
      'Ühendus katkes ja kõik fotod ei jõudnud üles. Vaata, et internet oleks olemas, ja lisa puuduvad fotod uuesti. Kirjutatud tekst on alles.',

    /* ------------------------------------------------------------------ fallback */

    generic: 'Midagi läks viltu. Proovi uuesti. Kui see ei aita, helista {{SUPPORT_CONTACT}}.',
    retry: 'Proovi uuesti',
  },
} as const;
