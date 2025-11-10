import request from "./request.js";
import {getCurrentDateTime} from "./dateTime.js";
import CryptoJS from "crypto-js";

let key;

export function clearKeyCache() {
    key = null;
}

function getKeyFromCache() {
    if (key) {
        return Promise.resolve(key);
    } else {
        return getKey();
    }
}

export function getKey() {
    return request({
        url: "https://community-web.ccw.site/health/check",
        method: "POST"
    }).then(res => {
        return res?.body;
    }).then(body => {
        return body.map(function (item) {
            const traceId = item.traceId;
            return traceId[parseInt(traceId[0], 16) + 1]
        }).reverse().join("");
    });
}

export function getAB(data) {
    return Promise.all([getKeyFromCache(), getCurrentDateTime()])
        .then(values => {
            const key = String(values[0]);
            const dateTime = String(values[1]);
            const s = "ccw".concat(JSON.stringify(data)).concat(dateTime);
            const A = CryptoJS.HmacMD5(s, key).toString();
            return {A: A, B: dateTime};
        });
}