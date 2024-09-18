class EventEmitter extends EventTarget {
    public emit(eventName: string, detail: any): void {
        this.dispatchEvent(new CustomEvent(eventName, {detail}));
    };
}

export {
    EventEmitter,
}
