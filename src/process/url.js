const DOUBLE_SLASH = "//";
const QUESTION = "?";

function paramsToObject(entries) {
    let result = {};
    for (let entry of entries) {
        const [key, value] = entry;
        result[key] = value;
    }
    return result;
}

module.exports = {
    addParams: function (url, params) {
        return url + QUESTION + params;
    },

    build: function (protocol, host, url) {
        return protocol + DOUBLE_SLASH + host + url;
    },

    urlToJSON: function (str) {
        const urlParams = new URLSearchParams(str);
        const entries = urlParams.entries();
        const params = paramsToObject(entries);
        return params
    },

    JSONToUrl: function (obj) {
        const url = new URLSearchParams(obj).toString();
        return url;
    }
};
