import streamDeck from "@elgato/streamdeck";
import { BatteryAction } from "./actions/battery-action";

streamDeck.actions.registerAction(new BatteryAction());
streamDeck.connect().catch((error: unknown) => {
  streamDeck.logger.error("Unable to connect the BatteryBuddy plugin to Stream Deck.", error);
});
