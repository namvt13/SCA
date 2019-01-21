import childProcess from "child_process";

function createProc(
	command: string,
	path: string,
	value: string,
	cb?: () => void
) {
	childProcess.execFile(command, [path, value], (err, stdout, stderr) => {
		if (err) {
			throw err;
		}
		console.error(stderr);
		console.log(stdout);
		cb && cb();
	});
}

// createProc("consul", "agent", "-dev");

childProcess.exec("consul agent -dev", (err, stdout, stderr) => {
	if (err) {
		throw err;
	}
	console.log(stdout);
	console.error(stderr);
});
