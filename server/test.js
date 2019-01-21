"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = __importDefault(require("child_process"));
function createProc(command, path, value, cb) {
    child_process_1.default.execFile(command, [path, value], (err, stdout, stderr) => {
        if (err) {
            throw err;
        }
        console.error(stderr);
        console.log(stdout);
        cb && cb();
    });
}
child_process_1.default.exec("consul agent -dev", (err, stdout, stderr) => {
    if (err) {
        throw err;
    }
    console.log(stdout);
    console.error(stderr);
});
