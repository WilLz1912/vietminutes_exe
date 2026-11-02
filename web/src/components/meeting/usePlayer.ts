"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAudio } from "@/lib/audio";

// Phát audio thật nếu file còn trong phiên; nếu không (cuộc họp mẫu, đã tải lại trang) thì giả lập đồng hồ phát
export function usePlayer(meetingId: string, duration: number) {
  const [src] = useState(() => getAudio(meetingId));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (src || !playing) return;
    const t = setInterval(() => {
      setTime((x) => {
        if (x + 0.25 >= duration) {
          setPlaying(false);
          return duration;
        }
        return x + 0.25;
      });
    }, 250);
    return () => clearInterval(t);
  }, [src, playing, duration]);

  const seek = useCallback((t: number) => {
    setTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      if (a.paused) a.play();
      else a.pause();
      return;
    }
    setPlaying((p) => !p);
  }, []);

  const playFrom = useCallback(
    (t: number) => {
      seek(t);
      if (audioRef.current) audioRef.current.play();
      else setPlaying(true);
    },
    [seek],
  );

  return { player: { src, time, setTime, playing, setPlaying, seek, toggle, playFrom }, audioRef };
}

export type Player = ReturnType<typeof usePlayer>["player"];
