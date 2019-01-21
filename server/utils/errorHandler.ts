export default function errorHandler(err?: Error | null) {
	if (err) {
		console.error(err);
		process.exit(2);
	}
}
