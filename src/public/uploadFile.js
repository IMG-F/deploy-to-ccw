import {getOSSClient, useOSSRegion} from "../utils/OSSClient.js";

export function uploadFile(name, file, type = "normal") {
    return getOSSClient('zhishi')
        .then(client => {
            if (type === "normal") {
                return client.put(name, file);
            } else if (type === "stream") {
                return client.putStream(name, file);
            } else {
                throw new Error("Unsupported upload type: " + type);
            }
        });
}