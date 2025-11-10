import request from "../utils/request.js";

export function updateWork({
    oid,
    latestProjectLink,
    screenMode = "LANDSCAPE",
    title,
    latestCoverLink
}) {

    const data = {
        oid: oid,
        latestProjectLink: latestProjectLink,
        screenMode: screenMode,
        title: title,
        latestCoverLink: latestCoverLink
    };

    return request({
        url: "https://community-web.ccw.site/creation/update",
        method: "POST",
        data: data,
        needAB: true
    });
}