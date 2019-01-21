"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function errorHandler(err) {
    if (err) {
        console.error(err);
        process.exit(2);
    }
}
exports.default = errorHandler;
