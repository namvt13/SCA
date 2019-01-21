import portfinder from "portfinder";
import Consul from "consul";

import errorHandler from "../utils/errorHandler";
import appModule from "./appModule";
import config from "../config.json";

const consul = Consul();

portfinder.getPort((err, port) => {
	errorHandler(err);

	const serviceId = config.consul.serviceName + "_" + port;
	const serviceName = config.consul.serviceName;
	consul.agent.service.register(
		{
			id: serviceId,
			name: serviceName,
			address: "localhost",
			port,
			tags: [serviceName]
		},
		(err) => {
			errorHandler(err);

			function unregisterService(err?: any) {
				consul.agent.service.deregister(serviceId, (err) => {
					console.log(err && err.message);
					process.exit(err ? 1 : 0);
				});
			}

			process.on("exit", unregisterService);
			process.on("SIGINT", unregisterService);
			process.on("uncaughtException", unregisterService);

			appModule(port);
		}
	);
});
