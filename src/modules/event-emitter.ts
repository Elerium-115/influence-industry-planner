class EventEmitter extends EventTarget {
    public emit(eventName: string, detail: any = null): void {
        this.dispatchEvent(new CustomEvent(eventName, {detail}));
    };
}

export {
    EventEmitter,
}
