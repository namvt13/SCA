"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const portfinder_1 = __importDefault(require("portfinder"));
const historyService_1 = __importDefault(require("./historyService"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const app = express_1.default();
portfinder_1.default.getPort((err, port) => {
    errorHandler_1.default(err);
    app.listen(port, console.log.bind(console, `History-Service server is listening @ http://localhost:${port}`));
});
historyService_1.default();
