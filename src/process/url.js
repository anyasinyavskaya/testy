
function paramsToObject(entries) {
	let result = {};
	for(let entry of entries) {
		const [key, value] = entry;
		result[key] = value;
	}
	return result;
}

module.exports = {
	addParams: function(url, params) {
		return url + '?' + params;
	},

	build: function (protocol, host, url) {
		return `${protocol}//${host}` + url;
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
