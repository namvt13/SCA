import http from "http";
import path from "path";
import express from "express";

import config from "../config.json";
import pubSub from "./pubSub";
import redis from "redis";
// import saveUserES from "../utils/saveUserES";
import errorHandler from "../utils/errorHandler";

const port = process.argv[2] || config.mainApp.port;
const db = redis.createClient({
	auth_pass: "123"
});
const listKey = config.key.mainKey + "_" + config.key.listKey;

const app = express();
app.use(express.static(path.join(__dirname, "..", "www")));
app.use(
	express.urlencoded({
		extended: true
	})
);
app.use(express.json());

function createAndResponse(
	value: string,
	req: express.Request,
	res: express.Response
) {
	db.hset(listKey, req.body.name, value, (err) => {
		errorHandler(err);
		db.expire(listKey, parseInt(config.timeoutLimit));

		// saveUserES.saveOne(value, req.body.name);

		res.status(200).send({
			status: "SUCCESS"
		});
		db.hgetall(listKey, (err, results) => {
			errorHandler(err);
			// console.log(JSON.stringify(results));
		});
	});
}

app.post("/regUser", createAndResponse.bind(null, "user"));
app.post("/regGroup", createAndResponse.bind(null, "group"));

const server = http.createServer(app);
server.listen(
	port,
	console.log.bind(
		console,
		`Pub-Sub client server is listening @ http://localhost:${port}`
	)
);

pubSub(server, port.toString());
