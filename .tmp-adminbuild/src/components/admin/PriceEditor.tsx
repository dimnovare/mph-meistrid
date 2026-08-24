'use client';

import { useActionState, useState } from 'react';

import { savePricingAction, type FormState } from '@/app/admin/actions';
import { AdminField, AdminInput } from '@/components/admin/AdminField';
import { AdminNotice, ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Arrow, BrickGlyph, Spinner } from '@/components/admin/icons';
import {
  adminBarPrimary,
  adminControl,
  adminControlDangerQuiet,
  adminDivider,
  adminEmptyPanel,
  adminHint,
  adminNoticeQuiet,
  adminPanel,
  adminStickyBar,
  adminStickyBarPadding,
} from '@/components/admin/styles';
import { adminText } from '@/content/admin-text';
import type { PriceItem } from '@/lib/types';

/**
 * The price list.
 *
 * Every row is edited in place — no "edit" mode, no dialog, no expanding panel. Whatever is
 * on screen is what will be saved, and one button at the bottom saves all of it. That is the
 * one model that does not require him to remember which of several rows he has "opened".
 *
 * The price is free text and is drawn as free text: one 56px box with a hint showing the
 * shapes it can take. It is never a number with a currency beside it — „alates 12 €/m²“ and
 * „kokkuleppel“ are both correct answers and the client owns the wording.
 *
 * Each row is one panel with the Estonian box above its Russian counterpart under a single
 * label, the Russian one on the quieter `line-strong` border. Two labels per pair would
 * double the height of a row on a 360px screen to say something the border already says.
 *
 * The whole table travels as JSON in a single hidden field, because `savePricingAction`
 * rewrites the list wholesale: sending it row by row would mean thinking about which rows
 * changed, which is work for no benefit on a table with a handful of lines.
 *
 * Rows are added here rather than through `addPriceRowAction`, which would write an empty
 * row to R2 on a round trip and then disagree with whatever is on screen. A row that has
 * never been given a service name is dropped by the action on save, so an abandoned one
 * costs nothing.
 */

type Row = {
  id: string;
  serviceEt: string;
  serviceRu: string;
  priceEt: string;
  noteEt: string;
  noteRu: string;
};

const initialState: FormState = {};

const ruSuffix = `— ${adminText.project.lang.ru.toLocaleLowerCase('et-EE')}`;

function toRow(item: PriceItem): Row {
  return {
    id: item.id,
    serviceEt: item.service.et,
    serviceRu: item.service.ru ?? '',
    priceEt: item.price.et,
    noteEt: item.note?.et ?? '',
    noteRu: item.note?.ru ?? '',
  };
}

/**
 * The server's `newId()` is `node:crypto` and cannot run here. The action only requires an
 * id of 1–40 characters, and it only has to be unique within this page.
 */
function newRowId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function PriceEditor({ items }: { items: PriceItem[] }) {
  const [rows, setRows] = useState<Row[]>(() => items.map(toRow));
  const [dirty, setDirty] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<Row | null>(null);

  const [state, formAction, saving] = useActionState(savePricingAction, initialState);

  function edit(id: string, patch: Partial<Row>) {
    setDirty(true);
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;

    setDirty(true);
    setRows((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  // The action stores the rows in the order they arrive, so screen order is stored order.
  const payload = JSON.stringify(
    rows.map((row) => ({
      id: row.id,
      service: { et: row.serviceEt, ru: row.serviceRu },
      // Prices read the same in both languages, so there is no Russian box for them.
      price: { et: row.priceEt },
      note: { et: row.noteEt, ru: row.noteRu },
    })),
  );

  return (
    <form
      action={formAction}
      // Cleared on submit rather than when the result comes back: "you have unsaved changes"
      // stops being true the moment the table is on its way, and if the save fails its own
      // message already says the prices are still on screen. An event handler, so no effect
      // has to chase the action's result.
      onSubmit={() => setDirty(false)}
      className="flex flex-col gap-5"
    >
      <input type="hidden" name="items" value={payload} readOnly />

      {state.error ? <AdminNotice tone="error">{state.error}</AdminNotice> : null}
      {state.ok && !dirty ? (
        <AdminNotice tone="success">{adminText.pricing.saved}</AdminNotice>
      ) : null}
      {dirty ? <p className={adminNoticeQuiet}>{adminText.pricing.unsaved}</p> : null}

      {rows.length === 0 ? (
        <div className={`${adminEmptyPanel} flex flex-col items-start gap-3`}>
          <BrickGlyph className="w-11 text-line-strong" />
          <p className="text-[1.125rem] leading-[1.4] font-semibold text-fg-strong">
            {adminText.pricing.emptyTitle}
          </p>
          <p className="text-[1rem] leading-[1.5] text-fg-strong">
            {adminText.pricing.emptyBody}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((row, index) => (
            <li key={row.id} className={`${adminPanel} flex flex-col gap-3 p-3.5`}>
              <AdminField id={`${row.id}-teenus-et`} label={adminText.pricing.serviceLabel}>
                <div className="flex flex-col gap-2">
                  <AdminInput
                    id={`${row.id}-teenus-et`}
                    value={row.serviceEt}
                    onChange={(event) => edit(row.id, { serviceEt: event.target.value })}
                  />
                  <AdminInput
                    id={`${row.id}-teenus-ru`}
                    tone="quiet"
                    aria-label={`${adminText.pricing.serviceLabel} ${ruSuffix}`}
                    value={row.serviceRu}
                    onChange={(event) => edit(row.id, { serviceRu: event.target.value })}
                  />
                </div>
              </AdminField>

              <AdminField
                id={`${row.id}-hind`}
                label={adminText.pricing.priceLabel}
                hint={adminText.pricing.priceHint}
              >
                <AdminInput
                  id={`${row.id}-hind`}
                  value={row.priceEt}
                  onChange={(event) => edit(row.id, { priceEt: event.target.value })}
                />
              </AdminField>

              <AdminField
                id={`${row.id}-markus-et`}
                label={adminText.pricing.noteLabel}
                suffix={`— ${adminText.project.optional}`}
              >
                <div className="flex flex-col gap-2">
                  <AdminInput
                    id={`${row.id}-markus-et`}
                    value={row.noteEt}
                    onChange={(event) => edit(row.id, { noteEt: event.target.value })}
                  />
                  <AdminInput
                    id={`${row.id}-markus-ru`}
                    tone="quiet"
                    aria-label={`${adminText.pricing.noteLabel} ${ruSuffix}`}
                    value={row.noteRu}
                    onChange={(event) => edit(row.id, { noteRu: event.target.value })}
                  />
                </div>
              </AdminField>

              {/*
                Inside a padded panel the ↑ / ↓ pair keeps its own borders — there is no panel
                edge here for a divided strip to run into, the way there is on a photo row.
              */}
              <div className={`flex gap-2.5 border-t pt-2.5 ${adminDivider}`}>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={adminText.photos.moveUp}
                  title={adminText.photos.moveUp}
                  className={`${adminControl} w-16 shrink-0 px-0`}
                >
                  <Arrow />
                </button>

                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                  aria-label={adminText.photos.moveDown}
                  title={adminText.photos.moveDown}
                  className={`${adminControl} w-16 shrink-0 px-0`}
                >
                  <Arrow down />
                </button>

                <button
                  type="button"
                  onClick={() => setPendingRemove(row)}
                  className={`${adminControlDangerQuiet} flex-1`}
                >
                  {adminText.pricing.remove}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Dashed, like every other "there could be more here" surface in the admin. */}
      <button
        type="button"
        onClick={() => {
          setDirty(true);
          setRows((current) => [
            ...current,
            { id: newRowId(), serviceEt: '', serviceRu: '', priceEt: '', noteEt: '', noteRu: '' },
          ]);
        }}
        className="inline-flex min-h-14 w-full items-center justify-center rounded-panel border-2 border-dashed border-fg bg-surface px-5 py-2 text-[1.0625rem] leading-tight font-semibold text-fg-strong transition-colors hover:bg-surface-2"
      >
        {adminText.pricing.add}
      </button>

      {rows.length > 1 ? <p className={adminHint}>{adminText.pricing.reorderHint}</p> : null}

      {/* The one action, kept inside the reachable bottom third of the screen. */}
      <div className={adminStickyBar} style={{ paddingBottom: adminStickyBarPadding }}>
        <button type="submit" disabled={saving} className={adminBarPrimary}>
          {saving ? <Spinner /> : null}
          {saving ? adminText.project.progress.saving : adminText.pricing.save}
        </button>
      </div>

      <ConfirmDialog
        open={pendingRemove !== null}
        title={adminText.confirm.removePrice.title}
        body={adminText.confirm.removePrice.body}
        confirmLabel={adminText.confirm.removePrice.confirm}
        cancelLabel={adminText.confirm.removePrice.cancel}
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          const row = pendingRemove;
          setPendingRemove(null);
          if (!row) return;
          setDirty(true);
          setRows((current) => current.filter((entry) => entry.id !== row.id));
        }}
      />
    </form>
  );
}
