"use client";

import { useState } from "react";
import { PREDEFINED_TAGS } from "@/lib/journal";

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function TagPicker({ selected, onChange }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [customInput, setCustomInput] = useState("");

  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  function addCustom() {
    const tag = customInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || selected.includes(tag)) {
      setCustomInput("");
      setShowInput(false);
      return;
    }
    onChange([...selected, tag]);
    setCustomInput("");
    setShowInput(false);
  }

  // tags a afficher : predefinis + custom deja selectionnes
  const allTags = Array.from(new Set([...PREDEFINED_TAGS, ...selected.filter((t) => !PREDEFINED_TAGS.includes(t))]));

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {allTags.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            style={{ minHeight: "44px" }}
            className={`px-3 py-1.5 text-xs border transition-colors duration-[0.15s] ${
              active
                ? "bg-or/10 border-or text-or"
                : "text-gris-c border-creme-f hover:border-or/50 hover:text-brun"
            }`}
          >
            #{tag}
          </button>
        );
      })}

      {/* bouton ajout tag custom */}
      {!showInput ? (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          style={{ minHeight: "44px" }}
          className="px-2.5 py-1.5 text-xs text-gris-c border border-dashed border-creme-f hover:border-or/50 hover:text-or transition-colors duration-[0.15s]"
          aria-label="Ajouter un tag"
        >
          +
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } if (e.key === "Escape") { setShowInput(false); setCustomInput(""); } }}
            placeholder="tag..."
            className="text-xs bg-parchemin border border-or/25 px-2 py-1.5 focus:outline-none focus:border-or w-24"
          />
          <button
            type="button"
            onClick={addCustom}
            className="text-xs text-or hover:opacity-70 transition-opacity duration-[0.15s]"
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
