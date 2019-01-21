import moment from "moment";
import config from "../config.json";

function toMsgObj(obj: {[key: string]: string}) {
	const time = Object.keys(obj)[0];
	const userMsgObj = JSON.parse(obj[time]) as {user: string; message: string};

	const user = Object.keys(userMsgObj)[0];
	const message = userMsgObj[user];

	return {
		[config.msgObj.time]: moment(parseInt(time)).format(config.momentFormat),
		[config.msgObj.user]: user,
		[config.msgObj.message]: message
	};
}

function objToArr(obj: {[key: string]: any}) {
	const keys = Object.keys(obj);
	const arr = keys.map((key) => {
		const msgObj = {[key]: obj[key]};
		return toMsgObj(msgObj);
	});

	return arr;
}

export default {objToArr, toMsgObj};
