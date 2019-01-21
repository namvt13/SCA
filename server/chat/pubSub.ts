import http from "http";
import amqp from "amqplib";
import socketIO from "socket.io";
// import redisIOAdapter from "socket.io-redis";

import config from "../config.json";
import toMomentTime from "../utils/toMomentTime";
import errorHandler from "../utils/errorHandler";

interface IMsg {
	type?: string;
	results?: {[key: string]: any};
	time: string;
	user: string;
	peer: string;
	message: string;
}

export default function pubSub(server: http.Server, port: string) {
	let channel: amqp.Channel, queue: string, exchange: string;

	amqp
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
					const msgObj = JSON.parse(content) as IMsg;

					switch (msgObj.type) {
						case "saved":
							msgObj.time = toMomentTime(msgObj.time);
							const msgObjJSON = JSON.stringify(msgObj);

							io.to(username + "_" + peerUsername).emit("message", msgObjJSON);
							// This is used in case when 2 user have the opposite recipient.
							io.to(
								username !== peerUsername ? peerUsername + "_" + username : ""
							).emit("message", msgObjJSON);
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
						default:
							break;
					}
				}
			});
		})
		.catch(errorHandler);

	// Multiple instances may have "mainAck" at different values, so we don't use this to validate channel.consume
	let mainAck: any;
	let username: string;
	let peerUsername: string;
	const io = socketIO.listen(server, {
		// adapter: redisIOAdapter({
		// 	auth_pass: "123"
		// })
	});

	function changeAndReloadUser(userObj: IMsg, loadType: string) {
		username = userObj.user;
		peerUsername = userObj.peer;
		const ackObj = Object.assign({type: loadType}, userObj);
		channel.sendToQueue(
			"chat_history_queue",
			Buffer.from(JSON.stringify(ackObj))
		);
	}

	let currId: string;
	const uniqueIdArr = [] as {
		uniqueId: string;
		to: string;
	}[];

	io.on("connection", (socket) => {
		const uniqueId = socket.handshake.query.uniqueId as string;
		currId = uniqueId;
		const to = socket.id;
		const toObj = {
			uniqueId,
			to
		};
		if (
			!uniqueIdArr.some((obj) => {
				return obj.uniqueId === currId;
			})
		) {
			uniqueIdArr.push(toObj);
		}
		console.log("Client connected!");
		socket.on(config.events.start, (userObjJSON, ack) => {
			// The username will be the person we are talking to, not us, so this is essentially peer-to-peer now, and peer-to-group
			// const userObj = JSON.parse(userObjJSON) as IMsg;
			mainAck = ack;
			// socket.join(userObj.peer);
			changeAndReloadUser({} as any, "list");
		});

		socket.on(config.events.roomChange, (userObjJSON, ack) => {
			const userObj = JSON.parse(userObjJSON) as IMsg;
			mainAck = ack;
			socket.leaveAll();
			socket.join(userObj.user + "_" + userObj.peer);
			changeAndReloadUser(userObj, "load");
		});

		socket.on(config.events.message, (msg) => {
			const msgObj = JSON.parse(msg) as IMsg;
			console.log(`Received message: ${msgObj.message}`);
			msgObj.time = Date.now().toString();
			msgObj.type = "save";
			changeAndReloadUser(msgObj, "save");
		});
	});
}
