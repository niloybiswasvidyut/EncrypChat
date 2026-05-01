"use client";

import { useRef, useState } from "react";
import { FiPaperclip, FiSend } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MessageInput({ onSend }) {
  const [value, setValue] = useState("");
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!value.trim() && !file) {
      return;
    }

    await onSend({ body: value.trim(), file });
    setValue("");
    setFile(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-slate bg-carbon p-4"
    >
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Type an encrypted message..."
        />
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate p-3 text-silver/85 hover:bg-slate/40">
          <FiPaperclip />
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
        </label>
        <Button type="submit" className="h-11 w-11 rounded-xl p-0">
          <FiSend />
        </Button>
      </div>
      {file && <p className="mt-2 text-xs text-silver/65">Attachment: {file.name}</p>}
    </form>
  );
}
