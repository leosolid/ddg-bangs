const DUCK_DUCK_GO_URL = "https://duckduckgo.com/?q=";

// TODO: create an options page to get and set these from chrome storage
const userDefinedBangs = {
  "!y": {
    url: "https://youtube.com/results?search_query=",
  },
  "!g": {
    url: "https://google.com/search?q=",
  },
};

function getBang(query) {
  const regex = /(![a-zA-Z]+)/g;
  const found = query.match(regex);
  if (!found || found.length == 0) return;

  return found[found.length - 1];
}

function genericSearchEngineHandler(params, key = "q") {
  const query = params.get(key);
  if (query == null) return;

  const bang = getBang(query);
  if (bang == null) return;

  if (bang in userDefinedBangs) {
    const bangURL = userDefinedBangs[bang].url;
    const newQuery = encodeURIComponent(query.replace(bang, "").trim());
    return bangURL + newQuery;
  } else {
    // fallback to duckduckgo's bangs if there is no matching user defined bang
    const newQuery = encodeURIComponent(query);
    return DUCK_DUCK_GO_URL + newQuery;
  }
}

function duckDuckGoHandler(params) {
  const query = params.get("q");
  if (query == null) return;

  const bang = getBang(query);
  if (bang == null) return;

  if (bang in userDefinedBangs) {
    const bangURL = userDefinedBangs[bang].url;
    const newQuery = encodeURIComponent(query.replace(bang, "").trim());
    return bangURL + newQuery;
  }
}

// TODO: add ability to specify custom search engines to the options page
// searchEngineHandlers might have to include the query parameter key, although it seems to always be "q"

// bangs (ddg and user defined ones) will work on the search engines defined here
const searchEngineHandlers = {
  "www.google.com": genericSearchEngineHandler,
  "google.com": genericSearchEngineHandler,
  "www.bing.com": genericSearchEngineHandler,
  "bing.com": genericSearchEngineHandler,
  "duckduckgo.com": duckDuckGoHandler,
};

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  const { host, searchParams } = new URL(details.url);
  if (host in searchEngineHandlers) {
    const searchEngineHandler = searchEngineHandlers[host];
    const newURL = searchEngineHandler(searchParams);
    if (newURL) chrome.tabs.update({ url: newURL });
  }
});