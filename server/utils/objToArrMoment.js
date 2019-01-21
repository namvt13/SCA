"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const config_json_1 = __importDefault(require("../config.json"));
function toMsgObj(obj) {
    const time = Object.keys(obj)[0];
    const userMsgObj = JSON.parse(obj[time]);
    const user = Object.keys(userMsgObj)[0];
    const message = userMsgObj[user];
    return {
        [config_json_1.default.msgObj.time]: moment_1.default(parseInt(time)).format(config_json_1.default.momentFormat),
        [config_json_1.default.msgObj.user]: user,
        [config_json_1.default.msgObj.message]: message
    };
}
function objToArr(obj) {
    const keys = Object.keys(obj);
    const arr = keys.map((key) => {
        const msgObj = { [key]: obj[key] };
        return toMsgObj(msgObj);
    });
    return arr;
}
exports.default = { objToArr, toMsgObj };
