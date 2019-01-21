"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const portfinder_1 = __importDefault(require("portfinder"));
const consul_1 = __importDefault(require("consul"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const appModule_1 = __importDefault(require("./appModule"));
const config_json_1 = __importDefault(require("../config.json"));
const consul = consul_1.default();
portfinder_1.default.getPort((err, port) => {
    errorHandler_1.default(err);
    const serviceId = config_json_1.default.consul.serviceName + "_" + port;
    const serviceName = config_json_1.default.consul.serviceName;
    consul.agent.service.register({
        id: serviceId,
        name: serviceName,
        address: "localhost",
        port,
        tags: [serviceName]
    }, (err) => {
        errorHandler_1.default(err);
        function unregisterService(err) {
            consul.agent.service.deregister(serviceId, (err) => {
                console.log(err && err.message);
                process.exit(err ? 1 : 0);
            });
        }
        process.on("exit", unregisterService);
        process.on("SIGINT", unregisterService);
        process.on("uncaughtException", unregisterService);
        appModule_1.default(port);
    });
});
