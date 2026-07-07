"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import type { Post } from "@/types/calendar";

const NICE_NAMES: Record<string, string> = {
  linkedin: "LinkedIn",
  facebook: "Facebook",
  whatsapp_status: "WA Status",
  whatsapp_broadcast: "WA Broadcast",
};

const nice = (channel: string) => NICE_NAMES[channel] || channel;
const chipClass = (channel: string) => (channel.startsWith("whatsapp") ? "chip wa" : "chip");

interface PostCardProps {
  post: Post;
  withTime: boolean;
  initialDone: boolean;
}

export default function PostCard({ post, withTime, initialDone }: PostCardProps) {
  const [done, setDone] = useState(initialDone);
  const toast = useToast();
  const key = `${post.date}|${post.channel}`;

  const copyPost = () => {
    navigator.clipboard.writeText(post.body);
    toast("Post copied");
  };

  const copyWithTags = () => {
    navigator.clipboard.writeText(post.body + "\n\n" + (post.hashtags || []).join(" "));
    toast("Post + hashtags copied");
  };

  const togglePosted = async (checked: boolean) => {
    setDone(checked);
    await api("/api/posted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, done: checked }),
    });
  };

  return (
    <div className={`slot${done ? " done" : ""}`}>
      {withTime && <div className="time">{post.posting_time || ""}</div>}
      <div className="card">
        <div className="top">
          <span className={chipClass(post.channel)}>{nice(post.channel)}</span>
          <span className="chip fmt">{post.format || "text"}</span>
          {!withTime && (
            <span className="chip fmt">
              {post.date} · {post.posting_time || ""}
            </span>
          )}
        </div>
        <div className="body-text">{post.body}</div>
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="meta">{post.hashtags.join(" ")}</div>
        )}
        {post.graphic_brief && <div className="meta">🎨 Graphic: {post.graphic_brief}</div>}
        <div className="row-actions">
          <button className="btn primary" onClick={copyPost}>
            Copy post
          </button>
          {post.hashtags && post.hashtags.length > 0 && (
            <button className="btn" onClick={copyWithTags}>
              Copy + hashtags
            </button>
          )}
          <label className="posted">
            <input
              type="checkbox"
              checked={done}
              onChange={(e) => togglePosted(e.target.checked)}
            />
            Posted
          </label>
        </div>
      </div>
    </div>
  );
}
