import cluster from "cluster";
import os from "os";
import path from "path";
import errorHandler from "../utils/errorHandler";

if (cluster.isMaster) {
	const processLimit = parseInt(process.argv[2]) || 1;
	const CPUs = os.cpus().length;
	const maxLimit = processLimit < CPUs ? processLimit : CPUs;

	// for (let i = 0; i < maxLimit; i++) {
	// 	cluster.fork();
	// }

	function createProc(idx: number) {
		if (idx >= maxLimit) {
			return;
		}
		const worker = cluster.fork();
		worker.on("online", () => {
			createProc(idx + 1);
		});
	}
	createProc(0);

	cluster.on("exit", (worker, code) => {
		if (code !== 0 || !worker.exitedAfterDisconnect) {
			cluster.fork();
		}
	});

	process.on("SIGUSR2", () => {
		const workerIdArr = Object.keys(cluster.workers);

		function restartWorker(idx: number) {
			if (idx >= workerIdArr.length) {
				return;
			}

			const worker = cluster.workers[workerIdArr[idx]];
			if (worker) {
				console.log(`Stopping worker ${worker.process.pid}`);
				worker.on("exit", () => {
					if (!worker.exitedAfterDisconnect) {
						return;
					}
					const newWorker = cluster.fork();
					newWorker.on("online", () => {
						restartWorker(idx + 1);
					});
				});

				worker.disconnect();
			}
		}

		restartWorker(0);
	});
} else if (cluster.isWorker) {
	require(path.join(__dirname, "app.js"));
} else {
	errorHandler(Error("Somthing wrong while clustering..."));
}
