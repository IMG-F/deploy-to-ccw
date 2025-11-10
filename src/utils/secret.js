import {clearKeyCache} from "./key.js";

let token = "";
let userId = "";

export function setAuthData(newToken, newUserId) {
    token = newToken;
    userId = newUserId;
    clearKeyCache();
}

export function getAuthData() {
    return { token, userId };
}