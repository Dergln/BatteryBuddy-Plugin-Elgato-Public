import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { PipeClientState } from "./pipe-client";
import { isBatteryColor } from "./pipe-protocol";

const inactiveSegmentColor = "#4B505A";
const segments = ["top-right", "bottom-right", "bottom-left", "top-left"] as const;
type RingSegment = typeof segments[number];
const categoryIcons = new Map([
  ["Other", "device-unknown.png"],
  ["Headset", "headphones.png"],
  ["Mouse", "mouse.png"],
  ["Keyboard", "keyboard.png"],
  ["Gamepad", "gamepad.png"],
  ["Phone", "smartphone.png"],
  ["Speaker", "speaker.png"],
  ["InternalBattery", "battery-charge.png"],
  ["Pen", "pen-tip.png"],
  ["Earbuds", "earbuds.png"]
]);

const batteryStyles: Record<string, { color: string; activeSegments: readonly RingSegment[] }> = {
  "#6CE06C": { color: "#4F9B47", activeSegments: segments },
  "#FFD140": { color: "#FFD140", activeSegments: ["top-right", "bottom-right", "bottom-left"] },
  "#FF6358": { color: "#E6594F", activeSegments: ["top-right", "bottom-right"] },
  "#EC466E": { color: "#8F1238", activeSegments: ["top-right"] }
};

const segmentPaths: Record<RingSegment, string> = {
  "top-right": "M 81.38 18.81 A 54 54 0 0 1 125.19 62.62",
  "bottom-right": "M 125.19 81.38 A 54 54 0 0 1 81.38 125.19",
  "bottom-left": "M 62.62 125.19 A 54 54 0 0 1 18.81 81.38",
  "top-left": "M 18.81 62.62 A 54 54 0 0 1 62.62 18.81"
};

const categoryImageDirectories = [
  join(__dirname, "..", "imgs", "device-categories"),
  join(__dirname, "..", "com.dergln.batterybuddy.streamdeck.sdPlugin", "imgs", "device-categories")
];
const categoryImageCache = new Map<string, string>();

function categoryImage(category: string | undefined): string {
  const fileName = categoryIcons.get(category ?? "") ?? "device-unknown.png";
  const cachedImage = categoryImageCache.get(fileName);
  if (cachedImage) {
    return cachedImage;
  }

  const imagePath = categoryImageDirectories
    .map((directory) => join(directory, fileName))
    .find(existsSync);
  if (!imagePath) {
    throw new Error(`Missing bundled device category image: ${fileName}`);
  }
  const image = `data:image/png;base64,${readFileSync(imagePath).toString("base64")}`;
  categoryImageCache.set(fileName, image);
  return image;
}

export function batteryDisplay(state: PipeClientState, deviceId?: string): { title: string; image: string } {
  const { status, snapshot } = state;
  let activeColor: string | undefined;
  let activeSegments: readonly RingSegment[] = [];
  const device = snapshot?.devices.find((item) => item.id === deviceId);

  if (status === "connected" && device && device.level !== null && isBatteryColor(device.color)) {
    const style = batteryStyles[device.color.toUpperCase()];
    if (style) {
      activeColor = style.color;
      activeSegments = style.activeSegments;
    }
  }

  const ring = segments.map((segment) => {
    const segmentColor = activeSegments.includes(segment) && activeColor
      ? activeColor
      : inactiveSegmentColor;
    return `<path data-segment="${segment}" d="${segmentPaths[segment]}" fill="none" stroke="${segmentColor}" stroke-width="9" stroke-linecap="round"/>`;
  }).join("");
  const icon = categoryImage(device?.category);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect width="144" height="144" rx="28" fill="#171B24"/>${ring}<image x="39" y="39" width="66" height="66" preserveAspectRatio="xMidYMid meet" href="${icon}"/></svg>`;
  return { title: "", image: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}` };
}
