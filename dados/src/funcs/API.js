import fs from "fs";

const config = JSON.parse(
  fs.readFileSync(new URL("../config.json", import.meta.url))
);

async function verificarAPI(responseData = null) {
  const site = config.site_zone;
  const apikey = config.apikey_zone;
  const prefix = config.prefixo || ".";

  if (responseData) {
    if (responseData?.error) {
      return `⚠️ ${responseData.error}`;
    }

    return true;
  }

  if (!site || site.trim() === "") {
    console.log("[API] ERRO: site_zone não configurado");
    return "⚠️ `site_zone` não configurado no config.json";
  }

  if (!apikey || apikey.trim() === "") {
    console.log("[API] ERRO: apikey_zone não configurada");
    return `⚠️ Apikey da Zone não configurada. Use ${prefix}apikey para configurar.`;
  }

  try {
    const url = `${site}/api/check-key?apikey=${encodeURIComponent(apikey)}`;
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));

    if (data === true || data?.status === true || data?.valid === true) {
      return true;
    }

    if (data?.error) {
      return `⚠️ ${data.error}`;
    }

    return true;
  } catch (err) {
    console.log("[API] ERRO na requisição:", err);
    return "⚠️ Não foi possível verificar a API no momento.";
  }
}

export default verificarAPI;
