import { world } from "@minecraft/server";
import { ACCENTS, HUD_STYLES, HOME_ICONS, BUFFS } from "../config";
import { Modal } from "../lib/ui";
import { getData, getCoins } from "../lib/db";
import { fmtPos } from "../lib/utils";
import { LANGS, langOf, useLang } from "../lib/i18n";

// ============================================================

export function askSettings(player) {
    const { T } = useLang(player);
    const s = getData(player).settings;
    const current = langOf(player);

    return new Modal(T("set.title"))
        .header(T("set.hudHeader"))
        .label(T("set.hudNote"))
        .toggle("hud", T("set.hud"), s.hud, T("set.hudTip"))
        .dropdown("hudStyle", T("set.hudStyle"), HUD_STYLES.map((k) => T(`hudstyle.${k}`)), s.hudStyle, T("set.hudStyleTip"))
        .toggle("hudCoords", T("set.hudCoords"), s.hudCoords)
        .slider("hudInterval", T("set.hudInterval"), 5, 40, 5, s.hudInterval, T("set.hudIntervalTip"))
        .divider()
        .header(T("set.persHeader"))
        .dropdown("lang", T("set.lang"), LANGS.map((l) => l.name), Math.max(0, LANGS.findIndex((l) => l.code === current)))
        .dropdown("accent", T("set.accent"), ACCENTS.map(([key, code]) => `${code}${T(`accent.${key}`)}`), s.accent)
        .textField("nick", T("set.nick"), T("set.nickPh"), s.nick, T("set.nickTip"))
        .divider()
        .header(T("set.socialHeader"))
        .toggle("sounds", T("set.sounds"), s.sounds)
        .toggle("acceptTp", T("set.acceptTp"), s.acceptTp, T("set.acceptTpTip"))
        .submit(T("set.submit"))
        .show(player);
}

export function askHomeName(player) {
    const { T } = useLang(player);
    return new Modal(T("mh.title"))
        .label(T("mh.pos", { pos: fmtPos(player.location) }))
        .textField("name", T("mh.name"), T("mh.namePh"), "", T("mh.nameTip"))
        .dropdown("icon", T("mh.icon"), HOME_ICONS.map((i) => T(`homeicon.${i.key}`)), 0)
        .submit(T("mh.submit"))
        .show(player);
}

export function askTrade(player, item, itemLabel, owned, coins) {
    const { T, N } = useLang(player);
    const canSell = item.sell > 0;
    return new Modal(`§l${itemLabel}`)
        .label(
            T("mt.info", {
                buy: N(item.buy),
                sell: canSell ? `§a${N(item.sell)}` : T("mt.notSold"),
                owned,
                coins: N(coins),
            })
        )
        .dropdown("mode", T("mt.op"), canSell ? [T("mt.buy"), T("mt.sell")] : [T("mt.buy")], 0)
        .slider("qty", T("mt.qty"), 1, Math.max(2, item.max ?? 16), 1, 1)
        .toggle("all", T("mt.all"), false, T("mt.allTip"))
        .submit(T("mt.submit"))
        .show(player);
}

export function askBuffs(player) {
    const { T, N } = useLang(player);
    const m = new Modal(T("mb.title")).label(T("mb.info", { coins: N(getCoins(player)) })).header(T("mb.effects"));

    for (const buff of BUFFS) {
        m.toggle(buff.id, `${T(`buff.${buff.id}`)} §8- §e${buff.price}§7/min`, false, T(`buff.${buff.id}.tip`));
    }

    return m
        .divider()
        .slider("minutes", T("mb.duration"), 1, 10, 1, 3)
        .dropdown("level", T("mb.power"), [T("mb.l1"), T("mb.l2"), T("mb.l3")], 0, T("mb.powerTip"))
        .submit(T("mb.submit"))
        .show(player);
}

export function askTransfer(player, target) {
    const { T, N } = useLang(player);
    return new Modal(T("mx.title"))
        .label(T("mx.info", { name: target.name, coins: N(getCoins(player)) }))
        .textField("amount", T("mx.amount"), T("mx.ph"), "")
        .submit(T("mx.submit"))
        .show(player);
}

export function askWhisper(player, target) {
    const { T } = useLang(player);
    return new Modal(T("mw.title", { name: target.name }))
        .textField("text", T("mw.msg"), T("mw.ph"), "")
        .submit(T("mw.submit"))
        .show(player);
}

export function askAnnouncement(player) {
    const { T } = useLang(player);
    return new Modal(T("ma.annTitle"))
        .textField("text", T("ma.annText"), T("ma.annPh"), "")
        .dropdown("type", T("ma.annType"), [T("opt.chat"), T("opt.title"), T("opt.actionbar")], 1)
        .toggle("sound", T("ma.annSound"), true)
        .submit(T("ma.annSubmit"))
        .show(player);
}

export function askWorldControl(player) {
    const { T } = useLang(player);
    return new Modal(T("ma.worldTitle"))
        .header(T("ma.timeWeather"))
        .dropdown("time", T("ma.time"), [T("opt.nochange"), T("opt.sunrise"), T("opt.noon"), T("opt.sunset"), T("opt.night")], 0)
        .dropdown("weather", T("ma.weather"), [T("opt.nochange"), T("opt.clear"), T("opt.rain"), T("opt.thunder")], 0)
        .divider()
        .header(T("ma.rules"))
        .dropdown("keepInv", T("ma.keepInv"), [T("opt.nochange"), T("opt.enable"), T("opt.disable")], 0)
        .toggle("clearItems", T("ma.clearItems"), false, T("ma.clearItemsTip"))
        .submit(T("ma.apply"))
        .show(player);
}

export function askEconomy(player) {
    const { T } = useLang(player);
    const names = world.getAllPlayers().map((p) => p.name);
    return new Modal(T("ma.ecoTitle"))
        .dropdown("target", T("ma.ecoPlayer"), names, 0)
        .dropdown("op", T("ma.ecoOp"), [T("opt.give"), T("opt.take"), T("opt.set")], 0)
        .textField("amount", T("ma.ecoAmount"), T("ma.ecoPh"), "")
        .submit(T("ma.apply"))
        .show(player)
        .then((r) => (r ? { ...r, targetName: names[r.target] } : null));
}