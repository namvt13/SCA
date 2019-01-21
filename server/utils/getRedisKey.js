"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getKey(db, key, field) {
    return new Promise((resolve, reject) => {
        if (key) {
            db.exists(key, (err, exists) => {
                if (err) {
                    return reject(err);
                }
                if (exists === 1) {
                    db.hget(key, field, (err, results) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(results);
                    });
                }
                else {
                    resolve("");
                }
            });
        }
        else {
            resolve("");
        }
    });
}
function getAllKey(db, key) {
    return new Promise((resolve, reject) => {
        if (key) {
            db.exists(key, (err, exists) => {
                if (err) {
                    return reject(err);
                }
                if (exists === 1) {
                    db.hgetall(key, (err, results) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(results);
                    });
                }
                else {
                    resolve({});
                }
            });
        }
        else {
            resolve({});
        }
    });
}
exports.default = { getKey, getAllKey };
