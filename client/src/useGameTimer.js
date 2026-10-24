import { useCallback, useEffect, useState } from "react";

export function useGameTimer(socket, roomCode) {
    const [timerStartedAt, setTimerStartedAt] = useState(null);
    const [timerLengthSeconds, setTimerLengthSeconds] = useState(null);
    const [remainingTimeSeconds, setRemainingTimeSeconds] = useState(null);

    useEffect(() => {
        const handleTimerStarted = ({
            roomCode: eventRoomCode,
            timerLengthSeconds,
        }) => {
            if (
                eventRoomCode !== roomCode ||
                !Number.isFinite(timerLengthSeconds) ||
                timerLengthSeconds <= 0
            ) {
                return;
            }

            setTimerStartedAt(Date.now());
            setTimerLengthSeconds(timerLengthSeconds);
            setRemainingTimeSeconds(timerLengthSeconds);
        };

        const handleTimerStopped = ({ roomCode: eventRoomCode }) => {
            if (eventRoomCode !== roomCode) return;

            setTimerStartedAt(null);
            setTimerLengthSeconds(null);
            setRemainingTimeSeconds(null);
        };

        socket.on("game:timer:started", handleTimerStarted);
        socket.on("game:timer:stopped", handleTimerStopped);

        return () => {
            socket.off("game:timer:started", handleTimerStarted);
            socket.off("game:timer:stopped", handleTimerStopped);
        };
    }, [roomCode, socket]);

    useEffect(() => {
        if (timerStartedAt === null || timerLengthSeconds === null) return undefined;

        const updateRemainingTime = () => {
            const nextRemainingTimeSeconds = Math.max(
                0,
                Math.ceil(
                    (timerStartedAt + timerLengthSeconds * 1000 - Date.now()) / 1000,
                ),
            );
            setRemainingTimeSeconds(nextRemainingTimeSeconds);
            return nextRemainingTimeSeconds;
        };

        const intervalId = setInterval(() => {
            if (updateRemainingTime() === 0) clearInterval(intervalId);
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timerLengthSeconds, timerStartedAt]);

    const startTimer = useCallback(
        (requestedTimerLengthSeconds) => {
            if (
                Number.isFinite(requestedTimerLengthSeconds) &&
                requestedTimerLengthSeconds > 0
            ) {
                socket.emit("game:timer:start", {
                    roomCode,
                    timerLengthSeconds: requestedTimerLengthSeconds,
                });
            }
        },
        [roomCode, socket],
    );

    const stopTimer = useCallback(() => {
        socket.emit("game:timer:stop", { roomCode });
    }, [roomCode, socket]);

    return { remainingTimeSeconds, startTimer, stopTimer };
}
