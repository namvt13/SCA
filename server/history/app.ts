import express from "express";
import portfinder from "portfinder";
import historyService from "./historyService";
import errorHandler from "../utils/errorHandler";

// const port = process.argv[2] || config.historySrv.port;

const app = express();

portfinder.getPort((err, port) => {
	errorHandler(err);
	app.listen(
		port,
		console.log.bind(
			console,
			`History-Service server is listening @ http://localhost:${port}`
		)
	);
});

historyService();
