import redis from "redis";

function getKey(db: redis.RedisClient, key: string, field: string) {
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
				} else {
					resolve("");
				}
			});
		} else {
			resolve("");
		}
	}) as Promise<string>;
}

function getAllKey(db: redis.RedisClient, key: string) {
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
				} else {
					resolve({});
				}
			});
		} else {
			resolve({});
		}
	}) as Promise<{[key: string]: any}>;
}

export default {getKey, getAllKey};
