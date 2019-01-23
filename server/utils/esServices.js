"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const elasticsearch_1 = __importDefault(require("elasticsearch"));
const errorHandler_1 = __importDefault(require("./errorHandler"));
const config_json_1 = __importDefault(require("../config.json"));
const esClient = new elasticsearch_1.default.Client({
    host: "localhost:9200"
});
function assertIndex(index, cb) {
    esClient.indices.create({
        index
    }, (err, resp, status) => {
        if (err) {
            if (typeof err.response === "string") {
                const errObj = JSON.parse(err.response);
                const errType = errObj.error.type;
                if ((errType && errType !== "resource_already_exists_exception") ||
                    Object.keys(errObj).length === 0) {
                    return console.error(JSON.stringify(errObj, undefined, 2));
                }
            }
            else {
                return console.log(err);
            }
            cb && cb();
        }
    });
}
function saveOne(type, name, cb) {
    assertIndex(config_json_1.default.es.index, () => {
        esClient.index({
            index: config_json_1.default.es.index,
            type: config_json_1.default.es.types.list,
            body: {
                [name]: config_json_1.default.es.fields[type]
            }
        }, (err, resp) => {
            errorHandler_1.default(err);
            cb && cb();
        });
    });
}
function deleteAll() {
    esClient.deleteByQuery({
        index: config_json_1.default.es.index,
        type: config_json_1.default.es.types.list,
        body: {
            query: {
                match_all: {}
            }
        }
    });
}
function saveBulk(userObj, cb) {
    deleteAll();
    assertIndex(config_json_1.default.es.index, () => {
        const userkeys = Object.keys(userObj);
        const bulkBody = [];
        userkeys.forEach((name, idx) => {
            bulkBody.push({
                index: {
                    _index: config_json_1.default.es.index,
                    _type: config_json_1.default.es.types.list
                }
            });
            bulkBody.push({
                [userObj[name] + "::" + idx]: name
            });
        });
        if (bulkBody.length === 0) {
            return cb && cb();
        }
        esClient.bulk({
            body: bulkBody
        }, (err, resp) => {
            errorHandler_1.default(err);
            let errCnt = 0;
            resp.items.forEach((item) => {
                if (item.index && item.index.error) {
                    console.error(`Error #${++errCnt}: ${item.index.error}`);
                }
            });
            console.log(`${userkeys.length - errCnt} out of ${userkeys.length} items indexed without error...`);
            cb && cb();
        });
    });
}
function searchES(searchTerm, cb) {
    esClient.search({
        index: config_json_1.default.es.index,
        type: config_json_1.default.es.types.list,
        body: {
            query: {
                multi_match: {
                    query: searchTerm,
                    fuzziness: "auto:0,0"
                }
            }
        }
    }, (err, resp) => {
        errorHandler_1.default(err);
        const results = resp.hits.hits.map((result) => {
            const key = Object.keys(result._source)[0];
            return result._source[key];
        });
        cb && cb(results);
    });
}
exports.default = { saveOne, saveBulk, searchES };
