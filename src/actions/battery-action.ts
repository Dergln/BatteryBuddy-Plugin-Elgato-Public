import {
  action,
  SingletonAction,
  type KeyAction,
  type DidReceiveSettingsEvent,
  type PropertyInspectorDidAppearEvent,
  type WillAppearEvent,
  type WillDisappearEvent
} from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import streamDeck from "@elgato/streamdeck";
import { PipeClient, type PipeClientState } from "../pipe-client";
import { batteryDisplay } from "../battery-display";

interface BatteryActionSettings extends JsonObject {
  deviceId?: string;
}

interface DeviceListMessage extends JsonObject {
  type: "devices";
  status: PipeClientState["status"];
  devices: Array<{ id: string; name: string; category: string }>;
  error?: string;
}

@action({ UUID: "com.dergln.batterybuddy.streamdeck.battery" })
export class BatteryAction extends SingletonAction<BatteryActionSettings> {
  private readonly pipeClient = new PipeClient();
  private readonly visibleActions = new Map<string, {
    action: KeyAction<BatteryActionSettings>;
    settings: BatteryActionSettings;
  }>();
  private pipeState: PipeClientState = { status: "disconnected", snapshot: null };

  constructor() {
    super();
    this.pipeClient.subscribe((state) => {
      this.pipeState = state;
      this.refreshVisibleActions();
      this.sendDeviceList();
    });
  }

  async onWillAppear(ev: WillAppearEvent<BatteryActionSettings>): Promise<void> {
    if (!ev.action.isKey()) {
      return;
    }

    this.visibleActions.set(ev.action.id, { action: ev.action, settings: ev.payload.settings });
    this.pipeClient.start();
    await this.renderAction(ev.action, ev.payload.settings);
  }

  onWillDisappear(ev: WillDisappearEvent<BatteryActionSettings>): void {
    this.visibleActions.delete(ev.action.id);
    if (this.visibleActions.size === 0) {
      this.pipeClient.stop();
    }
  }

  async onDidReceiveSettings(ev: DidReceiveSettingsEvent<BatteryActionSettings>): Promise<void> {
    if (ev.action.isKey()) {
      if (this.visibleActions.has(ev.action.id)) {
        this.visibleActions.set(ev.action.id, { action: ev.action, settings: ev.payload.settings });
      }
      await this.renderAction(ev.action, ev.payload.settings);
    }
    await this.sendDeviceList();
  }

  async onPropertyInspectorDidAppear(_ev: PropertyInspectorDidAppearEvent<BatteryActionSettings>): Promise<void> {
    await this.sendDeviceList();
  }

  private refreshVisibleActions(): void {
    for (const { action, settings } of this.visibleActions.values()) {
      void this.renderAction(action, settings).catch((error: unknown) => {
        streamDeck.logger.error("Unable to update a BatteryBuddy key.", error);
      });
    }
  }

  private async renderAction(action: KeyAction<BatteryActionSettings>, settings: BatteryActionSettings): Promise<void> {
    const { title, image } = batteryDisplay(this.pipeState, settings.deviceId, (key) => streamDeck.i18n.translate(key));
    await Promise.all([action.setImage(image), action.setTitle(title)]);
  }

  private async sendDeviceList(): Promise<void> {
    const message: DeviceListMessage = {
      type: "devices",
      status: this.pipeState.status,
      devices: this.pipeState.snapshot?.devices.map(({ id, name, category }) => ({ id, name, category })) ?? [],
      ...(this.pipeState.error ? { error: this.pipeState.error } : {})
    };

    try {
      await streamDeck.ui.sendToPropertyInspector(message);
    } catch (error) {
      streamDeck.logger.error("Unable to update the BatteryBuddy property inspector.", error);
    }
  }
}
