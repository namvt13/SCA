import program from "commander";
import childProcess from "child_process";

program
	.version("0.7.0")
	.usage("node mainApp [options]")
	.option("-m, --pm2", "Use PM2 to create processes (Default to using cluster)")
	.option(
		"--history-proc [number]",
		"Number of history server (For saving messages) processes to run (Default to 2, watching enabled)",
		"2"
	)
	.option(
		"--chat-proc [number]",
		"Number of chat server (For interacting with clients) processes to run (Default to 2, watching enabled)",
		"2"
	)
	.option(
		"--custom-port [port]",
		"Add a custom port for the proxy server, main interface for interacting with clients. (Default to 8080)",
		"8080"
	)
	.parse(process.argv);

console.log("\nYou have chosen to use:\n");
console.log((program.pm2 ? "- PM2" : "- Cluster") + " to create processes");
console.log(`- ${program.historyProc} process(es) for history server`);
console.log(`- ${program.chatProc} process(es) for chat server`);
console.log(`- Port ${program.customPort} for the proxy server\n`);

function createProc(
	command: string,
	path: string,
	value: string,
	cb?: () => void
) {
	const spawn = childProcess.spawn(command, [path, value]);
	if (cb) {
		return cb();
	}
	spawn.stdout.pipe(process.stdout);
	spawn.stderr.pipe(process.stderr);
	spawn.on("exit", (code) => {
		console.log(`${path} exited with code -- ${code}...`);
	});
}

createProc("consul", "agent", "-dev", initialize);
function initialize() {
	if (program.pm2) {
		createProc("node", "history/appManagerPM2.js", program.historyProc);
		createProc("node", "chat/appManagerPM2.js", program.chatProc);
	} else {
		createProc("node", "history/appManagerCluster.js", program.historyProc);
		createProc("node", "chat/appManagerCluster.js", program.chatProc);
	}
	createProc("node", "chat/appProxy.js", program.customPort);
}
