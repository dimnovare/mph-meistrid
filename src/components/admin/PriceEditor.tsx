'use client';

import { useActionState, useState } from 'react';

import { savePricingAction, type FormState } from '@/app/admin/actions';
import {
  AdminNotice,
  ConfirmDialog,
  adminControl,
  adminControlDanger,
  adminFields,
} from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { adminText } from '@/content/admin-text';
import type { PriceItem } from '@/lib/types';

/**
 * The price list.
 *
 * Every row is edited in place — no "edit" mode, no dialog, no expanding panel. Whatever is
 * on screen is what will be saved, and one button at the bottom saves all of it. That is the
 * one model that does not require him to remember which of several rows he has "opened".
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

const hintClass = 'text-body text-fg-muted';

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
      className="flex flex-col gap-6"
    >
      <input type="hidden" name="items" value={payload} readOnly />

      {state.error ? <AdminNotice tone="error">{state.error}</AdminNotice> : null}
      {state.ok && !dirty ? (
        <AdminNotice tone="success">{adminText.pricing.saved}</AdminNotice>
      ) : null}
      {dirty ? (
        <p className="rounded-panel border-2 border-line-strong bg-page p-4 text-body text-fg-strong">
          {adminText.pricing.unsaved}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="rounded-panel border-2 border-line-strong bg-page p-5 text-body text-fg-strong">
          {adminText.pricing.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((row, index) => (
            <li
              key={row.id}
              className={`flex flex-col gap-4 rounded-panel border-2 border-line-strong bg-page p-4 ${adminFields}`}
            >
              <Field id={`${row.id}-teenus-et`} label={`${adminText.pricing.serviceLabel} — ${adminText.project.lang.et}`}>
                <Input
                  id={`${row.id}-teenus-et`}
                  value={row.serviceEt}
                  onChange={(event) => edit(row.id, { serviceEt: event.target.value })}
                />
              </Field>

              <Field
                id={`${row.id}-teenus-ru`}
                label={`${adminText.pricing.serviceLabel} — ${adminText.project.lang.ru}`}
                hint={adminText.project.lang.ruOptional}
              >
                <Input
                  id={`${row.id}-teenus-ru`}
                  value={row.serviceRu}
                  onChange={(event) => edit(row.id, { serviceRu: event.target.value })}
                />
              </Field>

              <div className="flex flex-col gap-2">
                <Field id={`${row.id}-hind`} label={adminText.pricing.priceLabel}>
                  <Input
                    id={`${row.id}-hind`}
                    value={row.priceEt}
                    onChange={(event) => edit(row.id, { priceEt: event.target.value })}
                  />
                </Field>
                <p className={hintClass}>{adminText.pricing.priceHint}</p>
              </div>

              <div className="flex flex-col gap-2">
                <Field
                  id={`${row.id}-markus-et`}
                  label={`${adminText.pricing.noteLabel} — ${adminText.project.lang.et}`}
                >
                  <Input
                    id={`${row.id}-markus-et`}
                    value={row.noteEt}
                    onChange={(event) => edit(row.id, { noteEt: event.target.value })}
                  />
                </Field>
                <p className={hintClass}>{adminText.pricing.noteHint}</p>
              </div>

              <Field
                id={`${row.id}-markus-ru`}
                label={`${adminText.pricing.noteLabel} — ${adminText.project.lang.ru}`}
                hint={adminText.project.lang.ruOptional}
              >
                <Input
                  id={`${row.id}-markus-ru`}
                  value={row.noteRu}
                  onChange={(event) => edit(row.id, { noteRu: event.target.value })}
                />
              </Field>

              <div className="flex gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={adminText.photos.moveUp}
                  title={adminText.photos.moveUp}
                  className={`${adminControl} w-12 shrink-0 px-0`}
                >
                  <Arrow />
                </button>

                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                  aria-label={adminText.photos.moveDown}
                  title={adminText.photos.moveDown}
                  className={`${adminControl} w-12 shrink-0 px-0`}
                >
                  <Arrow down />
                </button>

                <button
                  type="button"
                  onClick={() => setPendingRemove(row)}
                  className={`${adminControlDanger} ml-auto px-3`}
                >
                  {adminText.pricing.remove}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => {
          setDirty(true);
          setRows((current) => [
            ...current,
            { id: newRowId(), serviceEt: '', serviceRu: '', priceEt: '', noteEt: '', noteRu: '' },
          ]);
        }}
        className={`${adminControl} w-full`}
      >
        {adminText.pricing.add}
      </button>

      {/* The one action, kept inside the reachable bottom third of the screen (§9). */}
      <div
        className="sticky bottom-0 z-10 -mx-gutter border-t border-ink-line bg-ink px-gutter pt-3 shadow-bar"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Button type="submit" size="admin" disabled={saving} className="rounded-panel">
          {saving ? adminText.project.progress.saving : adminText.pricing.save}
        </Button>
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

function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      fill="currentColor"
      className={`size-5 ${down ? 'rotate-180' : ''}`}
    >
      <path d="M10 3.6 18.4 14.4a1 1 0 0 1-.8 1.6H2.4a1 1 0 0 1-.8-1.6L10 3.6Z" />
    </svg>
  );
}
