"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_1 = __importDefault(require("moment"));
const config_json_1 = __importDefault(require("../config.json"));
function toMomentTime(time) {
    return moment_1.default(parseInt(time)).format(config_json_1.default.momentFormat);
}
exports.default = toMomentTime;
