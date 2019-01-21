import pm2 from "pm2";
import path from "path";
import os from "os";

import errorHandler from "../utils/errorHandler";

pm2.connect((err) => {
	errorHandler(err);

	const processLimit = parseInt(process.argv[2]) || 1;
	const CPUs = os.cpus().length;
	const maxLimit = processLimit < CPUs ? processLimit : CPUs;

	function createProc(idx: number) {
		pm2.start(
			{
				script: path.join(__dirname, "appConsul.js"),
				exec_mode: "fork",
				instances: maxLimit,
				watch: true
			},
			(err, apps) => {
				errorHandler(err);
				if (idx + 1 >= maxLimit) {
					pm2.disconnect();
				} else {
					createProc(idx + 1);
				}
			}
		);
	}
	createProc(0);
});
