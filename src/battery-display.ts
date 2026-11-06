import type { PipeClientState } from "./pipe-client";
import { isBatteryColor } from "./pipe-protocol";

const neutralColor = "#B4B4B4";

export function batteryDisplay(state: PipeClientState, deviceId?: string): { title: string; image: string } {
  const { status, snapshot } = state;
  let title: string;
  let color = neutralColor;

  if (status === "connecting") {
    title = "Connecting...";
  } else if (status === "disconnected") {
    title = "BatteryBuddy\noffline";
  } else if (status === "invalid") {
    title = "Invalid pipe\ndata";
  } else if (!snapshot) {
    title = "Waiting for\ndata";
  } else if (!deviceId) {
    title = "Select a\ndevice";
  } else {
    const device = snapshot.devices.find((item) => item.id === deviceId);
    if (!device) {
      title = "Device\nunavailable";
    } else if (device.level === null) {
      title = `${device.name}\nUnknown`;
    } else {
      title = `${device.name}\n${device.level}%${device.isCharging ? " \u26a1" : ""}`;
      if (isBatteryColor(device.color)) {
        color = device.color;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144"><rect x="17" y="35" width="101" height="74" rx="12" fill="#222831" stroke="${color}" stroke-width="8"/><path d="M118 57h11v30h-11" fill="${color}"/><path d="M69 45 47 76h19l-7 25 36-39H74l9-17z" fill="${color}"/></svg>`;
  return { title, image: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}` };
}
