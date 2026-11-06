export interface BatteryDevice {
  id: string;
  name: string;
  category: string;
  level: number | null;
  isCharging: boolean;
  lastContactUtc: string;
  color?: string;
}

export interface BatterySnapshot {
  version: 1;
  type: "snapshot";
  snapshotTimeUtc: string;
  isComplete: boolean;
  devices: BatteryDevice[];
}

export interface HeartbeatFrame {
  version: 1;
  type: "heartbeat";
}

export type PipeFrame = BatterySnapshot | HeartbeatFrame;

export class PipeProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PipeProtocolError";
  }
}

export const maxFrameBytes = 64 * 1024;
const maxDevices = 128;
const maxIdLength = 200;
const maxNameLength = 200;
const maxCategoryLength = 32;

export function parsePipeFrame(line: string): PipeFrame {
  if (Buffer.byteLength(line, "utf8") + 1 > maxFrameBytes) {
    throw new PipeProtocolError("Frame exceeds the size limit.");
  }

  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    throw new PipeProtocolError("Frame is not valid JSON.");
  }

  if (!isRecord(value) || value.version !== 1) {
    throw new PipeProtocolError("Unsupported frame version.");
  }

  if (value.type === "heartbeat") {
    return { version: 1, type: "heartbeat" };
  }

  if (value.type !== "snapshot" || typeof value.snapshotTimeUtc !== "string"
      || !isTimestamp(value.snapshotTimeUtc) || typeof value.isComplete !== "boolean"
      || !Array.isArray(value.devices) || value.devices.length > maxDevices) {
    throw new PipeProtocolError("Snapshot fields are invalid.");
  }

  const devices = value.devices.map(parseDevice);
  const ids = new Set(devices.map((device) => device.id));
  if (ids.size !== devices.length) {
    throw new PipeProtocolError("Snapshot contains duplicate device IDs.");
  }

  return {
    version: 1,
    type: "snapshot",
    snapshotTimeUtc: value.snapshotTimeUtc,
    isComplete: value.isComplete,
    devices
  };
}

function parseDevice(value: unknown): BatteryDevice {
  if (!isRecord(value)) {
    throw new PipeProtocolError("Device fields are invalid.");
  }

  const { id, name, category, level, isCharging, lastContactUtc, color } = value;
  if (!isBoundedString(id, maxIdLength)
      || !isBoundedString(name, maxNameLength)
      || !isBoundedString(category, maxCategoryLength)
      || !isBatteryLevel(level)
      || typeof isCharging !== "boolean"
      || typeof lastContactUtc !== "string"
      || !isTimestamp(lastContactUtc)
      || (color !== undefined && !isBatteryColor(color))) {
    throw new PipeProtocolError("Device fields are invalid.");
  }

  return {
    id,
    name,
    category,
    level,
    isCharging,
    lastContactUtc,
    ...(color !== undefined ? { color } : {})
  };
}

export function isBatteryColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/u.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength
    && !/[\u0000-\u001f\u007f]/u.test(value);
}

function isBatteryLevel(value: unknown): value is number | null {
  return value === null
    || (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 100);
}

function isTimestamp(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,7})?Z$/u.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return month >= 1 && month <= 12
    && day >= 1 && day <= daysInMonth[month - 1]
    && hour <= 23 && minute <= 59 && second <= 59;
}
