function getListenerArray(eventSource, eventType) {
  let listeners = eventSource._listeners[eventType];
  if (!listeners) {
    listeners = [];
    eventSource._listeners[eventType] = listeners;
  }
  return listeners;
}

export default class EventSource {
  constructor() {
    this._listeners = {};
    this._anyListeners = [];
  }

  once(eventType, fn) {
    const handlers = getListenerArray(this, eventType);
    handlers.push({ fn, once: true });
    return this;
  }

  on(eventType, fn) {
    const handlers = getListenerArray(this, eventType);
    handlers.push({ fn });
    return this;
  }

  off(eventType, fn) {
    const handlers = this._listeners[eventType];

    if (handlers) {
      const updatedHandlers = handlers.filter(h => h.fn && h.fn !== fn);
      if (updatedHandlers.length === 0) {
        delete this._listeners[eventType];
      } else if (updatedHandlers.length !== handlers.length) {
        this._listeners[eventType] = updatedHandlers;
      }
    }

    return this;
  }

  emit(eventType, data = undefined) {
    const handlers = this._listeners[eventType];

    if (handlers) {
      let includesOnce = false;
      handlers.forEach((handler) => {
        if (handler.once) {
          includesOnce = true;
        }

        try {
          handler.fn(data);
        } catch (e) {
          console.error(`error occurred while executing event ${eventType}`);
          console.error(e);
        }
      });

      if (includesOnce) {
        // Only reassign this value if we've encountered a handler that's run once
        this._listeners[eventType] = this._listeners[eventType].filter(h => !h.once);
      }
    }

    this._anyListeners.forEach(eventSource => eventSource.emit(eventType, data));

    return this;
  }

  // Pipe events from EventSource A to EventSource B. If `eventTypes` are
  // provided, bind only those types. Otherwise, pipe any event.
  pipe(eventSource, ...eventTypes) {
    if (eventTypes.length) {
      eventTypes.forEach(type => eventSource.on(type, data => this.emit(data)));
      return this;
    }

    eventSource.any(this);
    return this;
  }

  // Bind `eventSource` to recieve any event sent from `this`.
  any(eventSource) {
    this._anyListeners.push(eventSource);
    return this;
  }
}
