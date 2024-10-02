const mangayomiSources = [{
    "name": "玩偶哥哥",
    "lang": "zh",
    "baseUrl": "https://www.wogg.net",
    "apiUrl": "",
    "iconUrl": "https://imgsrc.baidu.com/forum/pic/item/4b90f603738da977d5da660af651f8198618e31f.jpg",
    "typeSource": "single",
    "isManga": false,
    "isNsfw": false,
    "version": "0.0.1",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "anime/src/zh/wogg.js"
}];
class DefaultExtension extends MProvider {
    patternAli = /(https:\/\/www\.aliyundrive\.com\/s\/[^"]+|https:\/\/www\.alipan\.com\/s\/[^"]+)/;
    patternQuark = /(https:\/\/pan\.quark\.cn\/s\/[^"]+)/;
    patternUc = /(https:\/\/drive\.uc\.cn\/s\/[^"]+)/;
    getHeaders(url) {
        throw new Error("getHeaders not implemented");
    }
    async getPopular(page) {
        const baseUrl = new SharedPreferences().get("url");
        const response = await new Client({ 'useDartHttpClient': true }).get(baseUrl, { "Referer": baseUrl });
        const elements = new Document(response.body).select("div.module-item");
        const list = [];
        for (const element of elements) {
            let oneA = element.selectFirst('.module-item-cover .module-item-pic a');
            const name = oneA.attr("title");
            const imageUrl = element.selectFirst(".module-item-cover .module-item-pic img").attr("data-src");
            const link = oneA.attr("href");
            list.push({ name, imageUrl, link });
        }
        return {
            list: list,
            hasNextPage: false
        }
    }
    async getLatestUpdates(page) {
        const baseUrl = new SharedPreferences().get("url");
        const response = await new Client({ 'useDartHttpClient': true }).get(baseUrl + `/vodshow/1--------${page}---.html`, { "Referer": baseUrl });
        const elements = new Document(response.body).select("div.module-item");
        const list = [];
        for (const element of elements) {
            let oneA = element.selectFirst('.module-item-cover .module-item-pic a');
            const name = oneA.attr("title");
            const imageUrl = element.selectFirst(".module-item-cover .module-item-pic img").attr("data-src");
            const link = oneA.attr("href");
            list.push({ name, imageUrl, link });
        }
        return {
            list: list,
            hasNextPage: true
        }
    }
    async search(query, page, filters) {
        const baseUrl = new SharedPreferences().get("url");
        if (query == "") {
            var categories;
            for (const filter of filters) {
                if (filter["type"] == "categories") {
                    categories = filter["values"][filter["state"]]["value"];
                }
            }
            const response = await new Client({ 'useDartHttpClient': true }).get(baseUrl + `/vodshow/${categories}--------${page}---.html`, { "Referer": baseUrl });
            const elements = new Document(response.body).select("div.module-item");
            const list = [];
            for (const element of elements) {
                let oneA = element.selectFirst('.module-item-cover .module-item-pic a');
                const name = oneA.attr("title");
                const imageUrl = element.selectFirst(".module-item-cover .module-item-pic img").attr("data-src");
                const link = oneA.attr("href");
                list.push({ name, imageUrl, link });
            }
            return {
                list: list,
                hasNextPage: true
            }
        } else {
            const response = await new Client({ 'useDartHttpClient': true }).get(baseUrl + `/vodsearch/${query}----------${page}---.html`, { "Referer": baseUrl });
            const elements = new Document(response.body).select(".module-search-item");
            const list = [];
            for (const element of elements) {
                let oneA = element.selectFirst('.video-info .video-info-header a');
                const name = oneA.attr("title");
                const imageUrl = element.selectFirst(".video-cover .module-item-cover .module-item-pic img").attr("data-src");
                const link = oneA.attr("href");
                list.push({ name, imageUrl, link });
            }
            return {
                list: list,
                hasNextPage: true
            }
        }
    }
    async getDetail(url) {
        const baseUrl = new SharedPreferences().get("url");
        const response = await new Client({ 'useDartHttpClient': true }).get(baseUrl + url, { "Referer": baseUrl });
        const document = new Document(response.body);
        const imageUrl = document.selectFirst("div.video-cover .module-item-cover .module-item-pic img").attr("data-src");
        const name = document.selectFirst("div.video-info .video-info-header h1").text;
        const description = document.selectFirst("div.video-info .video-info-content").text.replace("[收起部分]", "").replace("[展开全部]", "");
        const type_name = "电影";
        const quark_share_url_list = document.select("div.module-row-one .module-row-info")
            .map(e => {
                const url = e.selectFirst(".module-row-title p").text;
                const quarkMatches = url.match(this.patternQuark);

                if (quarkMatches && quarkMatches[1]) {
                    return quarkMatches[1];
                }
                return null;
            })
            .filter(url => url !== null);
        let episodes = await quarkFilesExtractor(quark_share_url_list, new SharedPreferences().get("quarkCookie"));
        return {
            name, imageUrl, description, episodes
        };
    }
    // For anime episode video list
    async getVideoList(url) {
        const videos = [];
        const vids = await quarkVideosExtractor(url, new SharedPreferences().get("quarkCookie"));
        for (const vid of vids) {
            videos.push(vid);
        }
        return videos;
    }
    getFilterList() {
        return [{
            type: "categories",
            name: "影片類型",
            type_name: "SelectFilter",
            values: [
                { type_name: "SelectOption", value: "1", name: "电影" },
                { type_name: "SelectOption", value: "2", name: "剧集" },
                { type_name: "SelectOption", value: "3", name: "动漫" },
                { type_name: "SelectOption", value: "4", name: "综艺" },
                { type_name: "SelectOption", value: "5", name: "音乐" },
                { type_name: "SelectOption", value: "6", name: "短剧" },
                { type_name: "SelectOption", value: "44", name: "臻彩视界" }
            ]
        }];
    }
    getSourcePreferences() {
        return [
            {
                "key": "quarkCookie",
                "editTextPreference": {
                    "title": "夸克Cookies",
                    "summary": "填写获取到的夸克Cookies",
                    "value": "",
                    "dialogTitle": "Cookies",
                    "dialogMessage": "",
                }
            },
            {
                "key": "url",
                "listPreference": {
                    "title": "Website Url",
                    "summary": "",
                    "valueIndex": 0,
                    "entries": [
                        "wogg.net",
                        "wogg.xxooo.cf",
                        "wogg.888484.xyz",
                        "wogg.bf",
                        "wogg.333232.xyz"
                    ],
                    "entryValues": [
                        "https://www.wogg.net",
                        "https://wogg.xxooo.cf",
                        "https://wogg.888484.xyz",
                        "https://www.wogg.bf",
                        "https://wogg.333232.xyz"
                    ],
                }
            }
        ];
    }
}
