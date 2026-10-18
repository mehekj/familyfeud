export var subscribeSocketEvents = (socket, handlers) => {
    for (const [eventName, handler] of Object.entries(handlers)) {
        socket.on(eventName, handler);
    }

    return () => {
        for (const [eventName, handler] of Object.entries(handlers)) {
            socket.off(eventName, handler);
        }
    };
};