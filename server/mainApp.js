"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const commander_1 = __importDefault(require("commander"));
const child_process_1 = __importDefault(require("child_process"));
commander_1.default
    .version("0.7.0")
    .usage("node mainApp [options]")
    .option("-m, --pm2", "Use PM2 to create processes (Default to using cluster)")
    .option("--history-proc [number]", "Number of history server (For saving messages) processes to run (Default to 2, watching enabled)", "2")
    .option("--chat-proc [number]", "Number of chat server (For interacting with clients) processes to run (Default to 2, watching enabled)", "2")
    .option("--custom-port [port]", "Add a custom port for the proxy server, main interface for interacting with clients. (Default to 8080)", "8080")
    .parse(process.argv);
console.log("\nYou have chosen to use:\n");
console.log((commander_1.default.pm2 ? "- PM2" : "- Cluster") + " to create processes");
console.log(`- ${commander_1.default.historyProc} process(es) for history server`);
console.log(`- ${commander_1.default.chatProc} process(es) for chat server`);
console.log(`- Port ${commander_1.default.customPort} for the proxy server\n`);
console.log(`Default interface: http://localhost:${commander_1.default.customPort}\n`);
function createProc(command, link, value, cb) {
    const spawn = child_process_1.default.spawn(command, [link, value]);
    if (cb) {
        return cb();
    }
    spawn.stdout.pipe(process.stdout);
    spawn.stderr.pipe(process.stderr);
    spawn.on("exit", (code) => {
        console.log(`${path_1.default} exited with code -- ${code}...`);
    });
}
createProc("consul", "agent", "-dev", initialize);
function currPath(link) {
    const currentPath = path_1.default.basename(__dirname) === "server" ? "" : "server";
    return path_1.default.join(__dirname, currentPath, link);
}
function initialize() {
    if (commander_1.default.pm2) {
        createProc("node", currPath("history/appManagerPM2.js"), commander_1.default.historyProc);
        createProc("node", currPath("chat/appManagerPM2.js"), commander_1.default.chatProc);
    }
    else {
        createProc("node", currPath("history/appManagerCluster.js"), commander_1.default.historyProc);
        createProc("node", currPath("chat/appManagerCluster.js"), commander_1.default.chatProc);
    }
    createProc("node", currPath("chat/appProxy.js"), commander_1.default.customPort);
}
