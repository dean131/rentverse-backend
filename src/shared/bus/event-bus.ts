import EventEmitter from "events";
import logger from "../../config/logger.js";
import { EventMap, EventKey } from "./events.js";

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
  }

  /**
   * Publish an event to the bus.
   */
  public publish<K extends EventKey>(event: K, payload: EventMap[K]): void {
    logger.debug(`[EventBus] Publishing: ${event}`, { payload });
    this.emit(event, payload);
  }

  /**
   * Subscribe to an event safely.
   */
  public subscribe<K extends EventKey>(
    event: K,
    handler: (payload: EventMap[K]) => void | Promise<void>
  ): void {
    logger.info(`[EventBus] Subscriber registered for: ${event}`);

    this.on(event, async (payload) => {
      try {
        await handler(payload);
      } catch (error) {
        logger.error(`[EventBus] Error handling ${event}:`, error);
      }
    });
  }
}

export default new EventBus();
