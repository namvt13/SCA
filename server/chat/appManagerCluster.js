"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = __importDefault(require("cluster"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
if (cluster_1.default.isMaster) {
    const processLimit = parseInt(process.argv[2]) || 1;
    const CPUs = os_1.default.cpus().length;
    const maxLimit = processLimit < CPUs ? processLimit : CPUs;
    function createProc(idx) {
        if (idx >= maxLimit) {
            return;
        }
        const worker = cluster_1.default.fork();
        worker.on("online", () => {
            createProc(idx + 1);
        });
    }
    createProc(0);
    cluster_1.default.on("exit", (worker, code) => {
        if (code !== 0 || !worker.exitedAfterDisconnect) {
            cluster_1.default.fork();
        }
    });
    process.on("SIGUSR2", () => {
        const workerIdArr = Object.keys(cluster_1.default.workers);
        function restartWorker(idx) {
            if (idx >= workerIdArr.length) {
                return;
            }
            const worker = cluster_1.default.workers[workerIdArr[idx]];
            if (worker) {
                console.log(`Stopping worker #${worker.process.pid}`);
                worker.on("exit", () => {
                    if (!worker.exitedAfterDisconnect) {
                        return;
                    }
                    const newWorker = cluster_1.default.fork();
                    newWorker.on("online", () => {
                        restartWorker(idx + 1);
                    });
                });
                worker.disconnect();
            }
        }
        restartWorker(0);
    });
}
else if (cluster_1.default.isWorker) {
    require(path_1.default.join(__dirname, "appConsul.js"));
}
else {
    errorHandler_1.default(Error("Something wrong while clustering."));
}
