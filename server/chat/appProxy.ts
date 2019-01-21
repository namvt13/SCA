import express from "express";
import httpProxy from "http-proxy";
import Consul from "consul";
import querystring from "querystring";

import errorHandler from "../utils/errorHandler";
import config from "../config.json";

const port = process.argv[2] || 8080;
const consul = Consul();
const app = express();
const clientIdArr = [] as string[];
let serverIdx = 0;

const proxy = httpProxy.createProxyServer();
app
	.use("/", (req, res) => {
		const uniqueId = querystring.parse(req.url)[
			"/socket.io/?uniqueId"
		] as string;
		if (uniqueId && clientIdArr.indexOf(uniqueId) === -1) {
			clientIdArr.push(uniqueId);
		}

		consul.agent.service.list((err, services) => {
			errorHandler(err);

			if (services) {
				const serviceName = config.consul.serviceName;
				const servers = [] as string[];

				Object.keys(services).forEach((id) => {
					if (services[id].Tags.indexOf(serviceName) > -1) {
						servers.push(`http://${services[id].Address}:${services[id].Port}`);
					}
				});

				if (!servers.length) {
					res.status(502).send("Bad gateway!\n");
				}

				const uniqueIdIdx = clientIdArr.indexOf(uniqueId);
				serverIdx = (uniqueIdIdx > 0 ? uniqueIdIdx : 0) % servers.length;

				proxy.web(req, res, {
					target: servers[0]
				});
			}
		});
	})
	.listen(
		port,
		console.log.bind(
			console,
			`(Proxy) Chat app server is listening @ http://localhost:${port}`
		)
	);
