import { inputClass, labelClass } from "@/components/ui";
import type { DirectoryField } from "@/lib/directory";

/** One insurer / client / surveyor input with the same rules the server checks. */
export function DirectoryInput({ field, id, defaultValue }: { field: DirectoryField; id: string; defaultValue?: string }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {field.label}
      </label>
      <input
        id={id}
        name={field.name}
        required
        minLength={field.min}
        maxLength={field.max}
        pattern={field.pattern}
        title={field.hint ?? `Enter a valid ${field.label.toLowerCase()}`}
        placeholder={field.placeholder}
        defaultValue={defaultValue}
        className={inputClass}
      />
      {field.hint && <p className="mt-1 text-xs text-muted">{field.hint}</p>}
    </div>
  );
}
