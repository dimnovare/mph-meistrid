'use client';

import { useActionState, useState } from 'react';

import { loginAction, type FormState } from '@/app/admin/actions';
import { AdminNotice } from '@/components/admin/ConfirmDialog';
import { AdminInput } from '@/components/admin/AdminField';
import { Spinner } from '@/components/admin/icons';
import {
  adminControlPrimary,
  adminHint,
  adminLabel,
  adminTextLink,
} from '@/components/admin/styles';
import { adminText } from '@/content/admin-text';

/**
 * Two fields and one button.
 *
 * The `autoComplete` values are the load-bearing part: with `username` and
 * `current-password` the phone's own password manager offers to fill both, which for
 * someone who does not enjoy typing a long password one-handed on a building site is the
 * difference between logging in and giving up. `autoCapitalize="none"` and
 * `inputMode="text"` stop iOS capitalising the first letter of the user name, which is the
 * most common reason a correct password is rejected.
 *
 * The password toggle sits on the label's own line, right-aligned, as a real text button —
 * §9 forbids an icon-only control, and a 56px target inside a 56px input leaves no room for
 * a word. Its label states the next action, so no `aria-pressed` is needed to explain it.
 *
 * There is deliberately no "forgot password" link: there is no reset flow to link to. The
 * rate-limit message says to phone for help instead, which is the truth.
 */

const initialState: FormState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [visible, setVisible] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/*
        Never says which of the two fields was wrong — that is a decision, not an oversight.
      */}
      {state.error ? <AdminNotice tone="error">{state.error}</AdminNotice> : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="kasutajanimi" className={adminLabel}>
          {adminText.login.usernameLabel}
        </label>
        <AdminInput
          id="kasutajanimi"
          name="username"
          type="text"
          required
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          placeholder={adminText.login.usernamePlaceholder}
          invalid={Boolean(state.error)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <label htmlFor="parool" className={adminLabel}>
            {adminText.login.passwordLabel}
          </label>

          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className={`${adminTextLink} -my-2 -mr-3 text-[1rem]`}
          >
            {visible ? adminText.login.hidePassword : adminText.login.showPassword}
          </button>
        </div>

        <AdminInput
          id="parool"
          name="password"
          type={visible ? 'text' : 'password'}
          required
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={adminText.login.passwordPlaceholder}
          invalid={Boolean(state.error)}
        />
      </div>

      <button type="submit" disabled={pending} className={`${adminControlPrimary} w-full`}>
        {pending ? <Spinner /> : null}
        {pending ? adminText.login.working : adminText.login.submit}
      </button>

      {/* Who to phone if he is locked out. There is no other way back in, by design. */}
      <p className={`${adminHint} text-center`}>{adminText.login.help}</p>
    </form>
  );
}
