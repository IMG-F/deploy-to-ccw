import * as path from "path";
import unzipper from "unzipper";
import {uploadFile} from "./public/uploadFile.js";
import {getWorkDetail} from "./public/getWorkDetail.js";
import archiver from "archiver";
import {setAuthData} from "./utils/secret.js";
import {submitWork} from "./public/submitWork.js";
import axios from "axios";
import {updateWork} from "./public/updateWork.js";
import * as core from "@actions/core";

const assetsBaseUrl = "https://m.ccw.site/";

export function run() {
    return main({
        oid: core.getInput("oid"),
        sb3FilePath: core.getInput("sb3FilePath"),
        coverFilePath: core.getInput("coverFilePath"),
        title: core.getInput("title"),
        description: core.getInput("description"),
        operatingInstruction: core.getInput("operatingInstruction"),
        releaseDescription: core.getInput("releaseDescription"),
        customVersion: core.getInput("customVersion"),
        publishedFeedSwitch: core.getInput("publishedFeedSwitch") === "true",
        token: core.getInput("token"),
        userId: core.getInput("userId")
    });
}

export function main({
                         oid,
                         sb3FilePath,
                         coverFilePath,
                         title,
                         description,
                         operatingInstruction,
                         releaseDescription,
                         customVersion,
                         publishedFeedSwitch,
                         token,
                         userId
                     }) {
    setAuthData(token, userId);
    return uploadSb3File({oid, sb3FilePath})
        .then(() => {
            return Promise.all([uploadCover(coverFilePath), getWorkDetail(oid)]);
        })
        .then(async ([coverFileName, res]) => {
            const {latestProjectLink, screenMode} = res?.body;
            const match = latestProjectLink.toString().match(/user_projects_sb3\/(\d+)\//);
            const userId = match ? match[1] : null;
            const newSb3FileUrl = `user_projects_sb3/${userId}/${crypto.randomUUID().replaceAll("-", "")}.sb3`;
            await copySb3File(latestProjectLink, newSb3FileUrl)
                .catch(err => {
                    console.error("copy sb3 file error :", err);
                    throw err;
                });

            await updateWork({
                oid: oid,
                latestProjectLink: latestProjectLink,
                screenMode: screenMode,
                title: title,
                latestCoverLink: assetsBaseUrl + coverFileName
            }).catch(err => {
                console.error("update work error :", err);
                throw err;
            });

            // 发布作品
            return submitWork({
                oid: oid,
                title: title,
                description: description,
                operatingInstruction: operatingInstruction,
                releaseDescription: releaseDescription,
                customVersion: customVersion,
                publishedFeedSwitch: publishedFeedSwitch,
                screenMode: screenMode,
                featuredCoverLink: assetsBaseUrl + coverFileName,
                coverLink: assetsBaseUrl + coverFileName,
                projectLink: assetsBaseUrl + newSb3FileUrl
            });
        });
}

run().then(res => {
    console.log(res);
}).catch(err => {
    console.error(err);
});

function copySb3File(fileUrl, destinationUrl) {
    return axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'stream'
    }).then(response => {
        return uploadFile(destinationUrl, response.data, "stream");
    })
}

function uploadCover(coverPath) {
    const extname = path.extname(coverPath);
    const coverFileName = `works-covers/${crypto.randomUUID()}${extname}`;
    return uploadFile(coverFileName, coverPath).then((() => {
        return coverFileName
    }));
}

export async function uploadSb3File
({
     oid,
     sb3FilePath,
 }) {
    const {latestProjectLink} = await getWorkDetail(oid)
        .then(res => {
            return res?.body;
        });

    const directory = await unzipper.Open.file(sb3FilePath);

    let projectJsonBuffer;
    let assetsUploadPromises = [];
    for (const entry of directory.files) {
        if (entry.type === "Directory") continue;

        const filePath = entry.path;
        if (filePath.endsWith("project.json")) {
            projectJsonBuffer = await entry.buffer();
            const archive = archiver("zip");
            console.log("Uploading project.json.zip ...");
            const projectLink = latestProjectLink.split("https://m.ccw.site/")[1];
            assetsUploadPromises.push(uploadFile(projectLink, archive, "stream"));
            archive.append(projectJsonBuffer, {name: "project.json"});
            archive.finalize();
        } else {
            console.log("Uploading asset:", path.basename(filePath));
            const content = await entry.stream();
            assetsUploadPromises.push(uploadFile(getAssetPath(path.basename(filePath)), content));
        }
    }

    return Promise.all(assetsUploadPromises);
}

function getAssetPath(assetName) {
    return `user_projects_assets/${assetName}`;
}