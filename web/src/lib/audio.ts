// File audio chỉ giữ trong bộ nhớ trình duyệt của phiên hiện tại (blob URL).
// Khi có backend, file sẽ nằm ở kho riêng tư và tải qua link có thời hạn.
const urls = new Map<string, string>();

export function setAudio(meetingId: string, blob: Blob) {
  const old = urls.get(meetingId);
  if (old) URL.revokeObjectURL(old);
  urls.set(meetingId, URL.createObjectURL(blob));
}

export function getAudio(meetingId: string): string | undefined {
  return urls.get(meetingId);
}

export function dropAudio(meetingId: string) {
  const u = urls.get(meetingId);
  if (u) URL.revokeObjectURL(u);
  urls.delete(meetingId);
}

export function readDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const a = document.createElement("audio");
    const url = URL.createObjectURL(blob);
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      const d = isFinite(a.duration) ? a.duration : 0;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    a.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    a.src = url;
  });
}
