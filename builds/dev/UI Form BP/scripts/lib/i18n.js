import { CONFIG } from "../config";
import { getData } from "./db";
import en from "../lang/en";
import es from "../lang/es";

// ============================================================

export const LANGS = [
    { code: "en", name: "English", thousands: ",", dict: en },
    { code: "es", name: "Español", thousands: ".", dict: es },
];

const byCode = Object.fromEntries(LANGS.map((l) => [l.code, l]));
const fallback = () => byCode[CONFIG.defaultLang] ?? LANGS[0];

export function langOf(player) {
    const code = getData(player).settings.lang;
    return byCode[code] ? code : fallback().code;
}

const codeOf = (who) => (typeof who === "string" ? who : langOf(who));

export function t(who, key, params = {}) {
    const raw = byCode[codeOf(who)]?.dict[key] ?? fallback().dict[key] ?? key;
    return raw.replace(/\{(\w+)\}/g, (match, name) => (params[name] !== undefined ? String(params[name]) : match));
}

export function num(who, n) {
    const sep = (byCode[codeOf(who)] ?? fallback()).thousands;
    return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

export const useLang = (who) => ({
    T: (key, params) => t(who, key, params),
    N: (n) => num(who, n),
});

export function itemName(who, typeId) {
    const short = typeId.replace("minecraft:", "");
    const key = `item.${short}`;
    return byCode[codeOf(who)]?.dict[key] ?? fallback().dict[key] ?? short.replace(/_/g, " ");
}

export function dimName(who, dimensionId) {
    const short = dimensionId.replace("minecraft:", "");
    const key = `dim.${short}`;
    return byCode[codeOf(who)]?.dict[key] ?? fallback().dict[key] ?? dimensionId;
}