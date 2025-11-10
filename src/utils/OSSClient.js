import request from "./request.js";
import {getAuthData} from "./secret.js";
import CryptoJS from "crypto-js";
import OSS from "ali-oss";

let ossRegion = "oss-cn-beijing";

export function useOSSRegion(region) {
    ossRegion = region;
}

let ossClient;

export function clearOSSClient() {
    if (ossClient) {
        ossClient.close();
        ossClient = null;
    }
}

export function getOSSClient(bucket) {
    if (ossClient) {
        ossClient.useBucket(bucket);
        return Promise.resolve(ossClient);
    } else {
        return request({
            url: "https://community-web.ccw.site/ccw-main/status",
            method: "POST"
        }).then(res => {
            const data = res?.body?.data;
            const userId = getAuthData().userId;
            const {accessKeyId, accessKeySecret, securityToken} = JSON.parse(decryptAES(data, userId));
            ossClient = new OSS({
                region: ossRegion,
                accessKeyId: accessKeyId,
                accessKeySecret: accessKeySecret,
                stsToken: securityToken,
                bucket: bucket
            });
            return ossClient;
        })
    }
}

function decryptAES(encryptedData, keyString) {
    const key = CryptoJS.enc.Utf8.parse(keyString.slice(-16));
    const iv  = CryptoJS.enc.Utf8.parse(keyString.slice(0, 16));
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, { iv });
    return decrypted.toString(CryptoJS.enc.Utf8);
}