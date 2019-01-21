"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const config_json_1 = __importDefault(require("../config.json"));
const pubSub_1 = __importDefault(require("./pubSub"));
const redis_1 = __importDefault(require("redis"));
function app(port) {
    const db = redis_1.default.createClient({
        auth_pass: "123"
    });
    const listKey = config_json_1.default.key.mainKey + "_" + config_json_1.default.key.listKey;
    const app = express_1.default();
    app.use(express_1.default.static(path_1.default.join(__dirname, "..", "www")));
    app.use(express_1.default.urlencoded({
        extended: true
    }));
    app.use(express_1.default.json());
    function createAndResponse(value, req, res) {
        db.hset(listKey, req.body.name, value, (err) => {
            db.expire(listKey, parseInt(config_json_1.default.timeoutLimit));
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
    const server = http_1.default.createServer(app);
    server.listen(port, console.log.bind(console, `Pub-Sub client server is listening @ http://localhost:${port}`));
    pubSub_1.default(server, port.toString());
}
exports.default = app;
