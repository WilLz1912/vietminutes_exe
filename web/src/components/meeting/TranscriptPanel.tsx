"use client";

import { Pause, Play } from "lucide-react";
import { useState, type RefObject } from "react";
import type { Meeting } from "@/lib/types";
import { cn, fmtTime, speakerColor, speakerName } from "@/lib/utils";
import type { Player } from "./usePlayer";

function SpeakerChip({
  meeting,
  speakerId,
  readOnly,
  onRename,
}: {
  meeting: Meeting;
  speakerId: string;
  readOnly: boolean;
  onRename: (id: string, name: string) => void;
}) {
  const s = meeting.speakers.find((x) => x.id === speakerId)!;
  const [val, setVal] = useState(s.name);
  const [editing, setEditing] = useState(false);

  const commit = () => {
    setEditing(false);
    if (val.trim() !== s.name) onRename(s.id, val.trim());
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs shadow-sm">
      <span className={cn("h-2 w-2 rounded-full", speakerColor(meeting, s.id))} />
      {editing ? (
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          placeholder={s.label}
          className="w-24 outline-none"
        />
      ) : (
        <button
          disabled={readOnly}
          onClick={() => setEditing(true)}
          title={readOnly ? s.label : `${s.label} – bấm để đặt tên thật`}
          className={cn("disabled:cursor-default", !s.name && "text-gray-500")}
        >
          {s.name || s.label}
        </button>
      )}
    </span>
  );
}

export function TranscriptPanel({
  meeting,
  player,
  audioRef,
  highlight,
  readOnly,
  onRename,
}: {
  meeting: Meeting;
  player: Player;
  audioRef: RefObject<HTMLAudioElement | null>;
  highlight: string[];
  readOnly: boolean;
  onRename: (id: string, name: string) => void;
}) {
  const total = Math.max(meeting.duration, meeting.segments.at(-1)?.end ?? 0);
  const active = meeting.segments.find((g) => player.time >= g.start && player.time < g.end)?.id;
  const unnamed = meeting.speakers.some((s) => !s.name);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-5 py-3">
        {player.src && (
          <audio
            ref={audioRef}
            src={player.src}
            onTimeUpdate={(e) => player.setTime(e.currentTarget.currentTime)}
            onPlay={() => player.setPlaying(true)}
            onPause={() => player.setPlaying(false)}
            className="hidden"
          />
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={player.toggle}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
            title={player.playing ? "Tạm dừng" : "Phát"}
          >
            {player.playing ? <Pause className="h-3.5 w-3.5 fill-white" /> : <Play className="h-3.5 w-3.5 fill-white" />}
          </button>
          <input
            type="range"
            min={0}
            max={total}
            step={0.5}
            value={Math.min(player.time, total)}
            onChange={(e) => player.seek(Number(e.target.value))}
            className="flex-1 accent-brand-600"
          />
          <span className="font-mono text-xs tabular-nums text-gray-500">
            {fmtTime(player.time)} / {fmtTime(total)}
          </span>
        </div>
        {!player.src && <p className="mt-1.5 text-[11px] text-gray-400">Không có file audio trong phiên này – trình phát chạy theo mốc thời gian.</p>}
      </div>

      <div className="border-b border-gray-200 px-5 py-3">
        <div className="mb-2 text-xs text-gray-500">
          Người nói{unnamed && !readOnly && " – bấm vào tên để đổi, áp dụng cho toàn bộ transcript và biên bản"}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {meeting.speakers.map((s) => (
            <SpeakerChip key={`${s.id}:${s.name}`} meeting={meeting} speakerId={s.id} readOnly={readOnly} onRename={onRename} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {meeting.segments.map((g) => (
          <div
            key={g.id}
            id={`seg-${g.id}`}
            onClick={() => player.playFrom(g.start)}
            className={cn(
              "mx-2 cursor-pointer rounded-md px-3 py-2 text-[14px] leading-relaxed hover:bg-white",
              highlight.includes(g.id) ? "bg-amber-50 ring-1 ring-amber-200" : active === g.id && "bg-white ring-1 ring-gray-200",
            )}
          >
            <div className="flex items-baseline gap-2 text-xs">
              <span className={cn("h-2 w-2 self-center rounded-full", speakerColor(meeting, g.speakerId))} />
              <span className="font-semibold text-gray-700">{speakerName(meeting, g.speakerId)}</span>
              <span className="font-mono text-gray-400">{fmtTime(g.start)}</span>
            </div>
            <p className="mt-0.5 text-gray-800">{g.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
