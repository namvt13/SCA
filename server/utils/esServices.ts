import elasticsearch from "elasticsearch";

import errorHandler from "./errorHandler";
import config from "../config.json";

const esClient = new elasticsearch.Client({
	host: "localhost:9200"
});

function assertIndex(index: string, cb: () => void) {
	esClient.indices.create(
		{
			index
		},
		(err, resp, status) => {
			if (err) {
				if (typeof err.response !== "string") {
					return console.log(err);
				}
				const errObj = JSON.parse(err.response);
				const errType = errObj.error.type;
				if (
					(errType && errType !== "resource_already_exists_exception") ||
					Object.keys(errObj).length === 0
				) {
					return console.error(JSON.stringify(errObj, undefined, 2));
				}

				cb && cb();
			}
		}
	);
}

function saveOne(type: string, name: string, cb?: () => void) {
	assertIndex(config.es.index, () => {
		esClient.index(
			{
				index: config.es.index,
				type: config.es.types.list,
				body: {
					[name]: config.es.fields[type]
				}
			},
			(err, resp) => {
				errorHandler(err);
				cb && cb();
			}
		);
	});
}

function deleteAll() {
	esClient.deleteByQuery({
		index: config.es.index,
		type: config.es.types.list,
		body: {
			query: {
				match_all: {}
			}
		}
	});
}

function saveBulk(userObj: {[key: string]: string}, cb?: () => void) {
	deleteAll();

	assertIndex(config.es.index, () => {
		const userkeys = Object.keys(userObj);
		const bulkBody = [] as {}[];

		userkeys.forEach((name, idx) => {
			bulkBody.push({
				index: {
					_index: config.es.index,
					_type: config.es.types.list
				}
			});

			bulkBody.push({
				[userObj[name] + "::" + idx]: name
			});
		});

		if (bulkBody.length === 0) {
			return cb && cb();
		}
		esClient.bulk(
			{
				body: bulkBody
			},
			(err, resp) => {
				errorHandler(err);
				let errCnt = 0;
				resp.items.forEach((item: any) => {
					if (item.index && item.index.error) {
						console.error(`Error #${++errCnt}: ${item.index.error}`);
					}
				});

				console.log(
					`${userkeys.length - errCnt} out of ${
						userkeys.length
					} items indexed without error...`
				);
				cb && cb();
			}
		);
	});
}

function searchES(searchTerm: string, cb: (resultArr: string[]) => void) {
	esClient.search(
		{
			index: config.es.index,
			type: config.es.types.list,
			body: {
				query: {
					multi_match: {
						query: searchTerm,
						fuzziness: "auto:0,0"
					}
				}
			}
		},
		(err, resp) => {
			errorHandler(err);
			const results = resp.hits.hits.map((result) => {
				const key = Object.keys(result._source)[0];
				return result._source[key];
			});
			cb && cb(results);
		}
	);
}

export default {saveOne, saveBulk, searchES};
