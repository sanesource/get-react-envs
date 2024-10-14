import fetch from "node-fetch";
import { load } from "cheerio";

/**
 * Fetchs text response for a url
 *
 * @param {String} url Url to be fetched
 * @returns {Promise<String>} Text Response
 */
export async function fetchResponseAsText(url) {
  const response = await fetch(url);
  const text = await response.text();
  return text;
}

/**
 * Gets an array of all static script urls
 *
 * @param {String} markup MarkupString
 * @returns {Array<string>} Array of static script urls
 */
export function getStaticScriptsUrl(markup, url) {
  const $ = load(markup);
  const bundleUrls = $("script")
    .map((_, el) => {
      if (!el.attribs.src) return undefined;
      const _url = url.endsWith("/") ? url.slice(0, url.length - 1) : url;
      const _src = el.attribs.src.startsWith(".")
        ? el.attribs.src.slice(1)
        : el.attribs.src;
      return _src.startsWith("http") ? _src : _url + _src;
    })
    .filter(Boolean)
    .toArray();
  return bundleUrls;
}

/**
 * Searches for React environment variables and
 * returns array of env. objects
 *
 * @param {Array<string>} urls Script Urls
 * @returns {Promise<Array<Record<string, string>>>} Array of founded enviroment objects
 */
export async function getEnvFromBundles(urls) {
  const results = await Promise.all(
    urls.map(async (url) => {
      const jsText = await fetchResponseAsText(url);

      const codeUrls = [];
      const urlWordMatchers = ["sentry", "mixpanel", "clevertap"];

      for (const word of urlWordMatchers) {
        const urlWordMatch = jsText.match(
          new RegExp(`https?:\/\/[^"\\s]*${word}[^"\\s]*`)
        );
        if (urlWordMatch) {
          codeUrls.push({
            [word]: urlWordMatch,
            url,
          });
        }
      }

      const envs = []
        .concat(jsText.match(/REACT_APP[\w]+:[\S]+?('|"|$)/g))
        .filter(Boolean);
      let envsData = {};
      if (envs) {
        envsData = Object.fromEntries(
          envs
            .map((envStr) => envStr.split(/:(.*)/s).slice(0, 2))
            .map(([k, v]) => [k, v.replace(/"/g, "")])
        );
      }

      if (Object.keys(envsData).length || codeUrls.length) {
        return {
          envsData,
          codeUrls,
        };
      }
    })
  );
  return results.filter(Boolean);
}
