import request from "../utils/request.js";

/**
 * 发布作品
 * @param oid 作品id
 * @param title 作品标题
 * @param description 作品介绍
 * @param operatingInstruction 操作说明
 * @param releaseDescription 更新说明
 * @param customVersion 自定义版本号
 * @param releaseTag 版本类型
 * @param requireLogin 是否允许未登录用户游玩
 * @param type 作品类型(原创, 改编, 转载)
 * @param isOpenSource 是否开源(与改编权限无关, 未知)
 * @param hasCloudVariables 是否包含云变量
 * @param extensions 使用的扩展
 * @param projectSize 项目大小
 * @param audioSize 音频大小
 * @param costumeSize 造型大小
 * @param publishedFeedSwitch 是否通知粉丝
 * @param tags tags
 * @param featuredCoverLink 封面链接(其他用户看到的)
 * @param coverLink 最新封面链接
 * @param projectLink 项目链接(文件链接)
 * @param sourceOpenLevel 改编权限
 * @returns {Promise | Promise<unknown> | *}
 */
export function submitWork({
                               oid,
                               title,
                               description = "",
                               operatingInstruction = "",
                               releaseDescription = "",
                               customVersion,
                               releaseTag = "Release",
                               requireLogin = false,
                               type = "ORIGINAL",
                               isOpenSource = true,
                               hasCloudVariables = false,
                               extensions = [],
                               projectSize = 0,
                               audioSize = 0,
                               costumeSize = 0,
                               publishedFeedSwitch = true,
                               tags = [],
                               featuredCoverLink,
                               coverLink,
                               projectLink,
                               sourceOpenLevel = "PRIVATE"
                           }) {
    return request({
        url: "https://community-web.ccw.site/creation/submit",
        method: "POST",
        data: {
            tags: tags,
            title: title,
            isOpenSource: isOpenSource,
            isContribute: true,
            type: type,
            publishedFeedSwitch: publishedFeedSwitch,
            keyboardLayout: "TOUCH",
            hashTags: [],
            featuredCoverLink: featuredCoverLink,
            sourceOpenLevel: sourceOpenLevel,
            requireLogin: requireLogin,
            operatingInstruction: operatingInstruction,
            description: description,
            releaseDescription: releaseDescription,
            releaseTags: [releaseTag],
            customVersion: customVersion,
            repostedSource: "",
            projectLink: projectLink,
            remixCreationOid: null,
            oid: oid,
            hasCloudVariables: hasCloudVariables,
            extensions: extensions,
            projectSize: projectSize,
            audioSize: audioSize,
            costumeSize: costumeSize,
            coverLink: coverLink
        },
        needAB: true
    })
}