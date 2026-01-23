export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on<T>(eventName: string, handler: EventHandler<T>) {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)?.add(handler as EventHandler);
  }

  off<T>(eventName: string, handler: EventHandler<T>) {
    this.handlers.get(eventName)?.delete(handler as EventHandler);
  }

  async emit<T>(eventName: string, payload: T) {
    const listeners = this.handlers.get(eventName);
    if (!listeners || listeners.size === 0) {
      return;
    }

    await Promise.all(
      Array.from(listeners).map(async (listener) => {
        try {
          await listener(payload);
        } catch (error) {
          console.error(`[event-bus] handler error for ${eventName}`, error);
        }
      })
    );
  }
}

export const eventBus = new EventBus();
