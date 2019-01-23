"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = __importDefault(require("amqplib"));
const socket_io_1 = __importDefault(require("socket.io"));
const config_json_1 = __importDefault(require("../config.json"));
const toMomentTime_1 = __importDefault(require("../utils/toMomentTime"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
function pubSub(server, port) {
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
        return channel.assertQueue(`chat_client_queue_${port}`, {
            exclusive: true
        });
    })
        .then((q) => {
        queue = q.queue;
        return channel.bindQueue(queue, exchange, "");
    })
        .then(() => {
        channel.consume(queue, (msg) => {
            if (msg) {
                const content = msg.content.toString();
                const msgObj = JSON.parse(content);
                switch (msgObj.type) {
                    case "saved":
                        msgObj.time = toMomentTime_1.default(msgObj.time);
                        emitMsg(msgObj, "message");
                        break;
                    case "loaded":
                        if (msgObj.peer === peerUsername && mainAck) {
                            mainAck(msgObj.results);
                            mainAck = undefined;
                        }
                        break;
                    case "listed":
                        if (mainAck) {
                            mainAck(msgObj.results);
                        }
                        break;
                    case "searched":
                        emitMsg(msgObj, "search");
                        break;
                    default:
                        break;
                }
            }
        });
    })
        .catch(errorHandler_1.default);
    let mainAck;
    let username;
    let peerUsername;
    const io = socket_io_1.default.listen(server, {});
    function changeAndReloadUser(userObj, loadType) {
        username = userObj.user;
        peerUsername = userObj.peer;
        const ackObj = Object.assign({ type: loadType }, userObj);
        channel.sendToQueue("chat_history_queue", Buffer.from(JSON.stringify(ackObj)));
    }
    let currId;
    const uniqueIdArr = [];
    io.on("connection", (socket) => {
        const uniqueId = socket.handshake.query.uniqueId;
        currId = uniqueId;
        const to = socket.id;
        const toObj = {
            uniqueId,
            to
        };
        if (!uniqueIdArr.some((obj) => {
            return obj.uniqueId === currId;
        })) {
            uniqueIdArr.push(toObj);
        }
        console.log("Client connected!");
        socket.on(config_json_1.default.events.start, (userObjJSON, ack) => {
            mainAck = ack;
            changeAndReloadUser({}, config_json_1.default.events.list);
        });
        socket.on(config_json_1.default.events.roomChange, (userObjJSON, ack) => {
            const userObj = JSON.parse(userObjJSON);
            mainAck = ack;
            socket.leaveAll();
            console.log("JOINED...");
            socket.join(userObj.user + "_" + userObj.peer);
            changeAndReloadUser(userObj, config_json_1.default.events.load);
        });
        socket.on(config_json_1.default.events.message, (msg) => {
            const msgObj = JSON.parse(msg);
            console.log(`Received message: ${msgObj.message}`);
            msgObj.time = Date.now().toString();
            socket.join(msgObj.user + "_" + msgObj.peer);
            changeAndReloadUser(msgObj, config_json_1.default.events.save);
        });
        socket.on(config_json_1.default.events.search, (msgObj) => {
            socket.join(msgObj.user + "_" + msgObj.peer);
            msgObj.user.length > 0 &&
                changeAndReloadUser(msgObj, config_json_1.default.events.search);
        });
    });
    function emitMsg(msgObj, type) {
        const msgObjJSON = JSON.stringify(msgObj);
        io.to(username + "_" + peerUsername).emit(type, msgObjJSON);
        io.to(username !== peerUsername ? peerUsername + "_" + username : "").emit(type, msgObjJSON);
    }
}
exports.default = pubSub;
