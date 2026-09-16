import fs from "fs";

const config = JSON.parse(
  fs.readFileSync(new URL("../config.json", import.meta.url), "utf8")
);

async function verificarZoneAPI(responseData = null) {
  const site = config.site_zone;
  const apikey = config.apikey_zone;

  if (responseData) {
    if (responseData?.error === "Limite diário atingido") {
      return "⚠️ Limite da API atingido.";
    }

    if (responseData?.error) {
      return `⚠️ ${responseData.error}`;
    }

    return true;
  }

  if (!site || !apikey) {
    return "⚠️ Zone API não configurada.";
  }

  try {
    const url = `${site}/api/check-key?apikey=${encodeURIComponent(apikey)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data || data.status !== true) {
      return "⚠️ API Zone inválida ou indisponível.";
    }

    const result = data.result || {};

    if (result.active === false || result.expired === true) {
      return "⚠️ API Zone expirada ou inativa.";
    }

    if (
      result.limit !== "infinity" &&
      Number(result.usage) >= Number(result.limit)
    ) {
      return "⚠️ Limite da API Zone atingido.";
    }

    return true;
  } catch (err) {
    return "⚠️ Não foi possível verificar a Zone API.";
  }
}

export default verificarZoneAPI;
