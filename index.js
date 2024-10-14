import {
  fetchResponseAsText,
  getStaticScriptsUrl,
  getEnvFromBundles,
} from "./utils.js";

const [, , url] = process.argv;

export default async function main() {
  const markupText = await fetchResponseAsText(url);
  const staticScriptsUrl = getStaticScriptsUrl(markupText, url);
  const result = await getEnvFromBundles(staticScriptsUrl);
  console.log(JSON.stringify(result, null, 2));
}

(async () => main())();
