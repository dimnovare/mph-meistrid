'use client';

import { useActionState, useState } from 'react';

import { loginAction, type FormState } from '@/app/admin/actions';
import { AdminNotice, adminControl } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
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
 * There is deliberately no "forgot password" link: there is no reset flow to link to. The
 * rate-limit message says to phone for help instead, which is the truth.
 */

const initialState: FormState = {};

const inputClass =
  'h-14 w-full rounded-panel border-2 border-line-strong bg-page px-4 text-body ' +
  'text-fg-strong placeholder:text-fg-muted transition-colors hover:border-fg-muted';

const labelClass = 'text-[1rem] font-semibold text-fg-strong';

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [visible, setVisible] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? <AdminNotice tone="error">{state.error}</AdminNotice> : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="kasutajanimi" className={labelClass}>
          {adminText.login.usernameLabel}
        </label>
        <input
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
          aria-invalid={state.error ? true : undefined}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="parool" className={labelClass}>
          {adminText.login.passwordLabel}
        </label>
        <input
          id="parool"
          name="password"
          type={visible ? 'text' : 'password'}
          required
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={adminText.login.passwordPlaceholder}
          aria-invalid={state.error ? true : undefined}
          className={inputClass}
        />

        {/*
          Below the field rather than tucked inside it: a 56px target inside a 56px input
          leaves no room for a text label, and §9 forbids icon-only controls. The label
          states the next action, so no `aria-pressed` is needed to explain the state.
        */}
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className={`${adminControl} mt-1 self-start px-4`}
        >
          {visible ? adminText.login.hidePassword : adminText.login.showPassword}
        </button>
      </div>

      <Button type="submit" size="admin" disabled={pending} className="rounded-panel">
        {pending ? adminText.login.working : adminText.login.submit}
      </Button>

      <p className="text-body text-fg-muted">{adminText.login.help}</p>
    </form>
  );
}
