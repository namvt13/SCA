"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_proxy_1 = __importDefault(require("http-proxy"));
const consul_1 = __importDefault(require("consul"));
const querystring_1 = __importDefault(require("querystring"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const config_json_1 = __importDefault(require("../config.json"));
const port = process.argv[2] || 8080;
const consul = consul_1.default();
const app = express_1.default();
const clientIdArr = [];
let serverIdx = 0;
const proxy = http_proxy_1.default.createProxyServer();
app
    .use("/", (req, res) => {
    const uniqueId = querystring_1.default.parse(req.url)["/socket.io/?uniqueId"];
    if (uniqueId && clientIdArr.indexOf(uniqueId) === -1) {
        clientIdArr.push(uniqueId);
    }
    consul.agent.service.list((err, services) => {
        errorHandler_1.default(err);
        if (services) {
            const serviceName = config_json_1.default.consul.serviceName;
            const servers = [];
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
    .listen(port, console.log.bind(console, `(Proxy) Chat app server is listening @ http://localhost:${port}`));
