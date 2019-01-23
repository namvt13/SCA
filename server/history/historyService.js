"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = __importDefault(require("redis"));
const amqplib_1 = __importDefault(require("amqplib"));
const config_json_1 = __importDefault(require("../config.json"));
const objToArrMoment_1 = __importDefault(require("../utils/objToArrMoment"));
const getRedisKey_1 = __importDefault(require("../utils/getRedisKey"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const esServices_1 = __importDefault(require("../utils/esServices"));
function historyService() {
    const db = redis_1.default.createClient({
        auth_pass: "123"
    });
    let channel, queue, exchange;
    amqplib_1.default
        .connect("amqp://localhost")
        .then((conn) => {
        return conn.createChannel();
    })
        .then((ch) => {
        channel = ch;
        return channel.assertExchange("chat", "fanout");
    })
        .then((ex) => {
        exchange = ex.exchange;
        return channel.assertQueue("chat_history_queue");
    })
        .then((q) => {
        queue = q.queue;
        return channel.bindQueue(queue, exchange, "");
    })
        .then(() => {
        return channel.consume(queue, (msg) => {
            if (msg) {
                const content = msg.content.toString();
                const msgObj = JSON.parse(content);
                switch (msgObj.type) {
                    case "save":
                        saveMsg(msgObj, msg);
                        break;
                    case "load":
                        const keyObj = keyMaker(msgObj);
                        getRedisKey_1.default
                            .getKey(db, keyObj.userKey, msgObj.peer)
                            .then((userPeerKey) => {
                            getRedisKey_1.default.getAllKey(db, userPeerKey).then((results) => {
                                const resultsArr = objToArrMoment_1.default.objToArr(results);
                                publish(msgObj.peer, resultsArr, "loaded");
                                channel.ack(msg);
                            });
                        });
                        break;
                    case "list":
                        getRedisKey_1.default
                            .getAllKey(db, config_json_1.default.key.mainKey + "_" + config_json_1.default.key.listKey)
                            .then((results) => {
                            esServices_1.default.saveBulk(results, () => {
                                publish(msgObj.peer, results, "listed");
                                channel.ack(msg);
                            });
                        });
                        break;
                    case "search":
                        esServices_1.default.searchES(msgObj.searchTerm, (resultArr) => {
                            publish(msgObj.user, resultArr, "searched");
                            channel.ack(msg);
                        });
                    default:
                        break;
                }
            }
        });
    })
        .catch(errorHandler_1.default);
    function publish(peer, results, type) {
        const resultsJSON = JSON.stringify({
            type,
            peer,
            results
        });
        channel.publish(exchange, "", Buffer.from(resultsJSON));
    }
    function saveMsg(msgObj, msg) {
        const keyObj = keyMaker(msgObj);
        console.log(`Saving message: ${msgObj.message}`);
        console.log("Saving key:", JSON.stringify(keyObj));
        db.hset(keyObj.userKey, msgObj.peer, keyObj.userPeerKey, (err) => {
            errorHandler_1.default(err);
            db.expire(keyObj.userKey, parseInt(config_json_1.default.timeoutLimit));
            const updatedMsgObj = Object.assign({}, msgObj);
            updatedMsgObj.type = "saved";
            channel.publish(exchange, "", Buffer.from(JSON.stringify(updatedMsgObj)));
            db.hset(keyObj.userPeerKey, msgObj.time, JSON.stringify({
                [msgObj.user]: msgObj.message
            }), (err) => {
                db.expire(keyObj.userPeerKey, parseInt(config_json_1.default.timeoutLimit));
                errorHandler_1.default(err);
                if (msgObj.group) {
                    return channel.ack(msg);
                }
                db.hset(keyObj.peerKey, msgObj.user, keyObj.userPeerKey, (err) => {
                    db.expire(keyObj.peerKey, parseInt(config_json_1.default.timeoutLimit));
                    errorHandler_1.default(err);
                    channel.ack(msg);
                });
            });
        });
        db.expire(config_json_1.default.key.mainKey + "_" + msgObj.peer, parseInt(config_json_1.default.timeoutLimit));
    }
}
exports.default = historyService;
function keyMaker(msgObj) {
    const userKey = config_json_1.default.key.mainKey + "_" + msgObj.user;
    const peerKey = config_json_1.default.key.mainKey + "_" + msgObj.peer;
    const userPeerKey = config_json_1.default.key.mainKey + "_" + [msgObj.user, msgObj.peer].sort().join("_");
    return {
        userKey,
        peerKey,
        userPeerKey: !msgObj.group ? userPeerKey : peerKey
    };
}
