import request from "./request.js";

export function getCurrentDateTime() {
    return request({
        url: "https://community-web.ccw.site/base/dateTime",
        method: "POST",
        needAuth: false
    }).then(res => {
        return res?.body;
    })
}