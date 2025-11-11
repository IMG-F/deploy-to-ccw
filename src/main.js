import * as path from "path";
import unzipper from "unzipper";
import {uploadFile} from "./public/uploadFile.js";
import {getWorkDetail} from "./public/getWorkDetail.js";
import archiver from "archiver";
import {setAuthData} from "./utils/secret.js";
import {submitWork} from "./public/submitWork.js";
import {updateWork} from "./public/updateWork.js";
import * as core from "@actions/core";
import {encryptSb3} from "./utils/encrypt.js";
import {PassThrough} from "stream";
import {Buffer} from "buffer";

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
    const newSb3FileName = crypto.randomUUID().replaceAll("-", "");
    return uploadSb3File({oid, sb3FilePath, newSb3FileName})
        .then(() => {
            return Promise.all([uploadCover(coverFilePath), getWorkDetail(oid)]);
        })
        .then(async ([coverFileName, res]) => {
            const {latestProjectLink, screenMode} = res?.body;
            const match = latestProjectLink.toString().match(/user_projects_sb3\/(\d+)\//);
            const userId = match ? match[1] : null;

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
                projectLink: assetsBaseUrl + `user_projects_sb3/${userId}/${newSb3FileName}.sb3`,
            });
        });
}

run().then(res => {
    console.log(res);
}).catch(err => {
    console.error(err);
});

function uploadCover(coverPath) {
    const extname = path.extname(coverPath);
    const coverFileName = `works-covers/${crypto.randomUUID()}${extname}`;
    return uploadFile(coverFileName, coverPath).then((() => {
        return coverFileName
    }));
}

export async function uploadSb3File({oid, sb3FilePath, newSb3FileName}) {
    const {latestProjectLink} = await getWorkDetail(oid)
        .then(res => {
            return res?.body;
        });
    const match = latestProjectLink.match(/user_projects_sb3\/(\d+)\/([a-f0-9]{32})\.sb3/);
    const userId = match ? match[1] : null;
    const baseNameNoExt = match ? match[2] : null;

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
            archive.append(projectJsonBuffer, {name: "project.json"});

            const buffer = archiveToBuffer(archive);
            assetsUploadPromises.push(uploadProjectJsonZip({
                buffer: await buffer,
                userId: userId,
                baseNameNoExt: baseNameNoExt
            }));
            if (newSb3FileName) {
                assetsUploadPromises.push(uploadProjectJsonZip({
                    buffer: await buffer,
                    userId: userId,
                    baseNameNoExt: newSb3FileName
                }));
            }
        } else {
            console.log("Uploading asset:", path.basename(filePath));
            const content = await entry.stream();
            assetsUploadPromises.push(uploadFile(getAssetPath(path.basename(filePath)), content));
        }
    }

    return Promise.all(assetsUploadPromises);
}

export async function archiveToBuffer(archive) {
    return new Promise((resolve, reject) => {
        const passThrough = new PassThrough();
        const chunks = [];

        passThrough.on('data', chunk => chunks.push(chunk));
        passThrough.on('end', () => {
            resolve(Buffer.concat(chunks));
        });

        archive.on('error', err => reject(err));

        archive.pipe(passThrough);

        archive.finalize();
    });
}

export function uploadProjectJsonZip({buffer, userId, baseNameNoExt}) {
    const projectJsonZipPath = `user_projects_sb3/${userId}/${baseNameNoExt}.sb3`;
    return uploadFile(projectJsonZipPath, encryptSb3(buffer, baseNameNoExt));
}

function getAssetPath(assetName) {
    return `user_projects_assets/${assetName}`;
}