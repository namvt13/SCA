"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pm2_1 = __importDefault(require("pm2"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
pm2_1.default.connect((err) => {
    errorHandler_1.default(err);
    const processLimit = parseInt(process.argv[2]) || 1;
    const CPUs = os_1.default.cpus().length;
    const maxLimit = processLimit < CPUs ? processLimit : CPUs;
    function createProc(idx) {
        pm2_1.default.start({
            script: path_1.default.join(__dirname, "app.js"),
            exec_mode: "fork",
            instances: maxLimit,
            watch: true
        }, (err, apps) => {
            errorHandler_1.default(err);
            if (idx + 1 >= maxLimit) {
                pm2_1.default.disconnect();
            }
            else {
                createProc(idx + 1);
            }
        });
    }
    createProc(0);
});
