/**
 * Usage:
 * - extend this class from e.g. `ExampleService`
 * - define + emit events from `ExampleService` via `exampleService.emit(EVENT_NAME, detail...)`
 * - listen for events in other modules, via `exampleService.addEventListener(EVENT_NAME, handler...)`
 */
abstract class EventEmitter extends EventTarget {
    public emit(eventName: string, detail: any = null): void {
        this.dispatchEvent(new CustomEvent(eventName, {detail}));
    };
}

export {
    EventEmitter,
}
