import request from "../utils/request.js";

export function getWorkDetail(oid) {
    return request({
        url: "https://community-web.ccw.site/creation/detail",
        method: "POST",
        data: {
            oid: oid,
            accessKey: ""
        }
    });
}