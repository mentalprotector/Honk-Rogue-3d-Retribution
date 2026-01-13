export class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, callback) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }

    emit(event, ...args) {
        if (!this.events[event]) return;
        this.events[event].forEach(cb => cb(...args));
    }
}

export const events = new EventEmitter();
