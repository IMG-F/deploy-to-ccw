import axios from "axios";
import {getAuthData} from "./secret.js";
import {getAB} from "./key.js";

export default function ({
                                url,
                                method,
                                data,
                                headers = {},
                                params = {},
                                needAB = false,
                                needAuth = true
}) {
    return new Promise(async (resolve, reject) => {
        let {token, userId} = getAuthData();
        if (needAuth) {
            if (!token || !userId) {
                reject("no auth data!");
            }
            headers["Cookie"] = `token=${token}; cookie-user-id=${userId}`;
        }

        if (needAB) {
            const {A, B} = await getAB(data);
            headers["A"] = A;
            headers["B"] = B;
        }

        headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

        axios({
            url: url,
            method: method,
            data: data,
            headers: headers,
            params: params,
        }).then(response => {
            const data = response?.data;
            if (data?.code !== "200") {
                reject(data?.message || "request error");
            }
            resolve(data);
        }).catch(error => {
            let message;
            if (error.response) {
                message = error.response.data.message || "request error";
            } else {
                message = error.message;
            }
            console.error("Request error:", message);
            reject(message);
        });
    });
}