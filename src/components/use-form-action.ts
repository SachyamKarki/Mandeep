"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import type { FormState } from "@/app/actions";

/**
 * Runs a server action from a form but only clears the form when the action
 * succeeds. React's default clears it every time, which wipes what the user
 * typed when there is a validation error.
 *
 * The server action stays on the form's `action`, so before the page's
 * JavaScript loads the browser still sends a POST to the server action.
 * Fields never end up in the URL.
 */
export function useFormAction(action: (prev: FormState, formData: FormData) => Promise<FormState>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, dispatch, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    // Once hydrated, submit by hand so React does not auto-reset the form.
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => dispatch(formData));
  };

  return { state, pending, formProps: { ref: formRef, action: dispatch, onSubmit } };
}
