export default function RoomStatus({ roomCode, watcherCount = 0 }) {
	return (
		<section className="room-status">
			<p>game code: {roomCode}</p>
			<p>viewers: {watcherCount}</p>
		</section>
	);
}
