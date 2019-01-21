import redis from "redis";
import amqp from "amqplib";

import config from "../config.json";
import objToArrMoment from "../utils/objToArrMoment";
import getRedisKey from "../utils/getRedisKey";
import errorHandler from "../utils/errorHandler";

interface IMsg {
	type?: string;
	group?: boolean;
	time: string;
	user: string;
	peer: string;
	message: string;
}

export default function historyService() {
	const db = redis.createClient({
		auth_pass: "123"
	});

	// db.del(config.key.mainKey + "_" + "Cruise");

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
					const msgObj = JSON.parse(content) as IMsg;

					switch (msgObj.type) {
						case "save":
							saveMsg(msgObj, msg);
							break;
						case "load":
							const keyObj = keyMaker(msgObj.user, msgObj.peer);
							getRedisKey
								.getKey(db, keyObj.userKey, msgObj.peer)
								.then((userPeerKey) => {
									getRedisKey.getAllKey(db, userPeerKey).then((results) => {
										// We get the shared key back. We don't use the created shared key, in case we want to hash the key in the future.
										const resultsArr = objToArrMoment.objToArr(results);
										publish(msgObj.peer, resultsArr, "loaded");
										channel.ack(msg);
									});
								});
							// getRedisKey(db, keyObj.userKey, msgObj.peer)
							// 	.then((results) => {
							// 		// We get the shared key back. We don't use the created shared key, in case we want to hash the key in the future.
							// 		publishPrevMsgs(msgObj.peer, results);
							// 	})
							break;
						case "list":
							getRedisKey
								.getAllKey(db, config.key.mainKey + "_" + config.key.listKey)
								.then((results) => {
									publish(msgObj.peer, results, "listed");
									channel.ack(msg);
								});
							break;
						default:
							break;
					}
				}
			});
		})
		.catch(errorHandler);

	function publish(
		peer: string,
		results: {[key: string]: any} | {[key: string]: any}[],
		type: string
	) {
		const resultsJSON = JSON.stringify({
			type,
			peer,
			results
		});
		channel.publish(exchange, "", Buffer.from(resultsJSON));
	}

	function saveMsg(msgObj: IMsg, msg: amqp.Message) {
		const keyObj = keyMaker(msgObj.user, msgObj.peer, msgObj.group);

		console.log(`Saving message: ${msgObj.message}`);
		console.log("Saving key:", JSON.stringify(keyObj));

		// When a group talk, it talks to all its member (as Admin)
		db.hset(keyObj.userKey, msgObj.peer, keyObj.userPeerKey, (err) => {
			errorHandler(err);
			db.expire(keyObj.userKey, parseInt(config.timeoutLimit));
			const updatedMsgObj = Object.assign({}, msgObj);
			updatedMsgObj.type = "saved";
			channel.publish(exchange, "", Buffer.from(JSON.stringify(updatedMsgObj)));
			db.hset(
				keyObj.userPeerKey,
				msgObj.time,
				JSON.stringify({
					[msgObj.user]: msgObj.message
				}),
				(err) => {
					db.expire(keyObj.userPeerKey, parseInt(config.timeoutLimit));
					errorHandler(err);
					if (msgObj.group) {
						return channel.ack(msg);
					}
					db.hset(keyObj.peerKey, msgObj.user, keyObj.userPeerKey, (err) => {
						db.expire(keyObj.peerKey, parseInt(config.timeoutLimit));
						errorHandler(err);
						channel.ack(msg);
					});
				}
			);
		});

		// db.hset(config.key.mainKey + "_" + peer, time, message, (err) => {
		// 	if (!err) {
		// 		channel.ack(msg);
		// 	}
		// });
		db.expire(
			config.key.mainKey + "_" + msgObj.peer,
			parseInt(config.timeoutLimit)
		);
	}
}

function keyMaker(user: string, peer: string, group?: boolean) {
	const userKey = config.key.mainKey + "_" + user;
	const peerKey = config.key.mainKey + "_" + peer;
	const userPeerKey = config.key.mainKey + "_" + [user, peer].sort().join("_");
	return {
		userKey,
		peerKey,
		userPeerKey: !group ? userPeerKey : peerKey
	};
}
