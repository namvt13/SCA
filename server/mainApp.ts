import path from "path";
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
console.log(`Default interface: http://localhost:${program.customPort}\n`);

function createProc(
	command: string,
	link: string,
	value: string,
	cb?: () => void
) {
	const spawn = childProcess.spawn(command, [link, value]);
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

function currPath(link: string) {
	const currentPath = path.basename(__dirname) === "server" ? "" : "server";
	return path.join(__dirname, currentPath, link);
}

function initialize() {
	if (program.pm2) {
		createProc(
			"node",
			currPath("history/appManagerPM2.js"),
			program.historyProc
		);
		createProc("node", currPath("chat/appManagerPM2.js"), program.chatProc);
	} else {
		createProc(
			"node",
			currPath("history/appManagerCluster.js"),
			program.historyProc
		);
		createProc("node", currPath("chat/appManagerCluster.js"), program.chatProc);
	}
	createProc("node", currPath("chat/appProxy.js"), program.customPort);
}
