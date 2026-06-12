"use client";

/**
 * Multi or single-select filter chips for catalog and resource views.
 */
export default function FilterChips({
  options = [],
  value,
  values = [],
  onChange,
  multiple = false,
  label,
  className = "",
}) {
  const selectedSet = multiple ? new Set(values) : new Set(value ? [value] : []);

  const toggleOption = (optionId) => {
    if (!onChange) {
      return;
    }

    if (multiple) {
      const next = new Set(selectedSet);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        next.add(optionId);
      }
      onChange(Array.from(next));
      return;
    }

    onChange(selectedSet.has(optionId) ? null : optionId);
  };

  return (
    <div className={className}>
      {label ? <div className="small fw-semibold mb-2">{label}</div> : null}
      <div className="d-flex flex-wrap gap-2" role="group" aria-label={label || "Filters"}>
        {options.map((option) => {
          const optionId = typeof option === "string" ? option : option.id;
          const optionLabel = typeof option === "string" ? option : option.label;
          const isActive = selectedSet.has(optionId);

          return (
            <button
              key={optionId}
              type="button"
              className="soft-chip border-0"
              style={
                isActive
                  ? {
                      background: "rgba(13, 110, 253, 0.18)",
                      boxShadow: "inset 0 0 0 1px rgba(13, 110, 253, 0.35)",
                    }
                  : undefined
              }
              onClick={() => toggleOption(optionId)}
              aria-pressed={isActive}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
