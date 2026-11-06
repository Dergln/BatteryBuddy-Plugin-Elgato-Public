import { createReadStream, type ReadStream } from "node:fs";
import {
  maxFrameBytes,
  parsePipeFrame,
  PipeProtocolError,
  type BatterySnapshot,
  type PipeFrame
} from "./pipe-protocol";

export type PipeConnectionState = "connecting" | "connected" | "disconnected" | "invalid";

export interface PipeClientState {
  status: PipeConnectionState;
  snapshot: BatterySnapshot | null;
  error?: string;
}

const pipePath = String.raw`\\.\pipe\BatteryBuddy.StreamDeck.v1`;
const initialRetryDelayMs = 1000;
const maxRetryDelayMs = 30000;

export class PipeClient {
  private readonly listeners = new Set<(state: PipeClientState) => void>();
  private started = false;
  private currentStream: ReadStream | undefined;
  private reconnectTimer: NodeJS.Timeout | undefined;
  private retryDelayMs = initialRetryDelayMs;
  private inputBuffer = "";
  private lastSnapshot: BatterySnapshot | null = null;
  private state: PipeClientState = { status: "disconnected", snapshot: null };

  subscribe(listener: (state: PipeClientState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.connect();
  }

  stop(): void {
    this.started = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    const stream = this.currentStream;
    this.currentStream = undefined;
    this.inputBuffer = "";
    stream?.destroy();
    this.setState({ status: "disconnected", snapshot: this.lastSnapshot });
  }

  private connect(): void {
    if (!this.started) {
      return;
    }

    this.inputBuffer = "";
    this.setState({ status: "connecting", snapshot: this.lastSnapshot });

    const stream = createReadStream(pipePath);
    stream.setEncoding("utf8");
    this.currentStream = stream;
    stream.once("open", () => {
      if (this.currentStream === stream) {
        this.setState({ status: "connected", snapshot: this.lastSnapshot });
      }
    });
    stream.on("data", (chunk: string | Buffer) => this.handleData(stream, chunk.toString()));
    stream.on("error", () => this.handleDisconnect(stream));
    stream.on("close", () => this.handleDisconnect(stream));
  }

  private handleData(stream: ReadStream, chunk: string): void {
    if (this.currentStream !== stream) {
      return;
    }

    this.inputBuffer += chunk;
    let newlineIndex = this.inputBuffer.indexOf("\n");
    while (newlineIndex >= 0) {
      const line = this.inputBuffer.slice(0, newlineIndex);
      this.inputBuffer = this.inputBuffer.slice(newlineIndex + 1);
      if (!this.handleLine(stream, line)) {
        return;
      }
      newlineIndex = this.inputBuffer.indexOf("\n");
    }

    if (Buffer.byteLength(this.inputBuffer, "utf8") > maxFrameBytes) {
      this.invalidateStream(stream, "Frame exceeds the size limit.");
    }
  }

  private handleLine(stream: ReadStream, line: string): boolean {
    if (line.length === 0) {
      this.invalidateStream(stream, "Empty frame received.");
      return false;
    }

    let frame: PipeFrame;
    try {
      frame = parsePipeFrame(line);
    } catch (error) {
      const message = error instanceof PipeProtocolError ? error.message : "Frame could not be parsed.";
      this.invalidateStream(stream, message);
      return false;
    }

    if (frame.type === "snapshot") {
      this.lastSnapshot = frame;
      this.retryDelayMs = initialRetryDelayMs;
      this.setState({ status: "connected", snapshot: frame });
    }
    return true;
  }

  private invalidateStream(stream: ReadStream, message: string): void {
    if (this.currentStream !== stream) {
      return;
    }

    this.setState({ status: "invalid", snapshot: this.lastSnapshot, error: message });
    stream.destroy();
  }

  private handleDisconnect(stream: ReadStream): void {
    if (this.currentStream !== stream) {
      return;
    }

    this.currentStream = undefined;
    this.inputBuffer = "";
    if (this.state.status !== "invalid") {
      this.setState({ status: "disconnected", snapshot: this.lastSnapshot });
    }
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (!this.started || this.reconnectTimer) {
      return;
    }

    const delay = this.retryDelayMs;
    this.retryDelayMs = Math.min(this.retryDelayMs * 2, maxRetryDelayMs);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, delay);
  }

  private setState(state: PipeClientState): void {
    this.state = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}
