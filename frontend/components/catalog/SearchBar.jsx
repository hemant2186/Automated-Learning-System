"use client";

import { Search, X } from "lucide-react";

/**
 * Debounced search input for catalog and resource filters.
 */
export default function SearchBar({
  value = "",
  onChange,
  placeholder = "Search...",
  className = "",
}) {
  const handleChange = (event) => {
    onChange?.(event.target.value);
  };

  const handleClear = () => {
    onChange?.("");
  };

  return (
    <div className={`position-relative ${className}`.trim()}>
      <Search
        size={18}
        className="position-absolute text-muted"
        style={{ left: "0.85rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        aria-hidden="true"
      />
      <input
        type="search"
        className="form-control"
        style={{ paddingLeft: "2.5rem", paddingRight: value ? "2.5rem" : undefined }}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
      />
      {value ? (
        <button
          type="button"
          className="btn btn-link position-absolute text-muted p-0"
          style={{ right: "0.75rem", top: "50%", transform: "translateY(-50%)" }}
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}
