"use client";

import { useEffect, useState } from "react";

export default function DateChip() {
  const [text, setText] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setText(
      new Date(today + "T12:00:00").toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  return <div className="date-chip">{text}</div>;
}
