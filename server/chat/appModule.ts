import http from "http";
import path from "path";
import express from "express";
import config from "../config.json";
import pubSub from "./pubSub";
import redis from "redis";

function app(port: number) {
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
			db.expire(listKey, parseInt(config.timeoutLimit));
			if (!err) {
				res.status(200).send({
					status: "SUCCESS"
				});
				db.hgetall(listKey, (err, results) => {
					if (!err) {
						console.log(JSON.stringify(results));
					}
				});
			}
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
}

export default app;
