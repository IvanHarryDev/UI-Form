import { world } from "@minecraft/server";
import { CONFIG, SHOP, KITS, BUFFS, QUESTS, HOME_ICONS, DAILY } from "../config";
import { Menu } from "../lib/ui";
import { getData, saveData, getCoins, setCoins, addCoins, spendCoins, remaining, startCooldown } from "../lib/db";
import {
    fmtDuration, fmtPos, bar, clean, notify, sfx, bigTitle, accent,
    isAdmin, otherPlayers, healthOf, teleport, countItem, removeItem, giveItem,
} from "../lib/utils";
import { LANGS, useLang, itemName, dimName } from "../lib/i18n";
import { confirm, notice, askTeleportRequest } from "./message_forms";
import {
    askSettings, askHomeName, askTrade, askBuffs, askTransfer, askWhisper,
    askAnnouncement, askWorldControl, askEconomy,
} from "./modal_forms";

// ============================================================

const BACK = () => "back";
const CLOSE = () => "close";

const sub = (fn, ...args) => async () => ((await fn(...args)) === "close" ? "close" : "stay");

async function loop(player, build) {
    while (player.isValid) {
        const result = await build().show(player);
        if (result !== "stay") return result;
    }
    return "close";
}

const opened = new Set();

async function guarded(player, fn) {
    if (opened.has(player.id)) return;
    opened.add(player.id);
    try {
        sfx(player, "random.pop", 1.2);
        await fn(player);
    } catch (e) {
        console.warn(`[NEXUS] Error in ${player.name}'s menu: ${e}\n${e?.stack ?? ""}`);
    } finally {
        opened.delete(player.id);
    }
}

export const openHub = (player) => guarded(player, (p) => loop(p, () => buildHub(p)));
export const openQuickTeleports = (player) => guarded(player, openTeleports);

const dailyInfo = (d) => {
    const since = Date.now() - d.daily.last;
    const left = Math.max(0, DAILY.cooldownMs - since);
    const alive = d.daily.last > 0 && since < DAILY.cooldownMs * 2;
    const streak = alive ? d.daily.streak : 0;
    return { ready: left === 0, left, streak, nextDay: (streak % 7) + 1 };
};

export async function pickLanguage(player) {
    let chosen = null;
    const menu = new Menu(`${CONFIG.brand} §8» §7Language / Idioma`).label("§7Choose your language\n§7Elige tu idioma");
    for (const lang of LANGS) {
        menu.button(`§l${lang.name}`, undefined, () => {
            chosen = lang.code;
            return "close";
        });
    }
    await menu.show(player);
    return chosen;
}

function buildHub(player) {
    const { T, N } = useLang(player);
    const a = accent(player);
    const d = getData(player);
    const hp = healthOf(player);
    const pending = QUESTS.filter((q) => !d.claimed.includes(q.id) && (d.stats[q.stat] ?? 0) >= q.goal).length;
    const daily = dailyInfo(d);

    const menu = new Menu(T("hub.title", { brand: CONFIG.brand }))
        .header(T("hub.welcome", { accent: a, name: player.name }))
        .label(
            T("hub.status", {
                coins: N(getCoins(player)),
                hp: hp.cur,
                max: hp.max,
                dim: dimName(player, player.dimension.id),
                pos: fmtPos(player.location),
            })
        )
        .divider()
        .button(
            T("hub.profile", { accent: a, ready: pending ? T("hub.profileReady", { n: pending }) : "" }),
            "textures/items/book_enchanted",
            sub(openProfile, player)
        )
        .button(T("hub.teleports"), "textures/items/ender_pearl", sub(openTeleports, player))
        .button(T("hub.shop"), "textures/items/emerald", sub(openShop, player))
        .button(T("hub.rewards", { daily: daily.ready ? T("hub.dailyReady") : "" }), "textures/items/gold_ingot", sub(openRewards, player))
        .button(T("hub.boosts"), "textures/items/nether_star", sub(buyBuffs, player))
        .button(T("hub.players"), "textures/ui/FriendsIcon", sub(openPlayers, player))
        .button(T("hub.settings"), "textures/items/name_tag", sub(changeSettings, player));

    if (isAdmin(player)) {
        menu.divider().button(T("hub.admin"), "textures/ui/op", sub(openAdmin, player));
    }

    return menu.divider().button(T("close"), undefined, CLOSE);
}

const openProfile = (player) =>
    loop(player, () => {
        const { T, N } = useLang(player);
        const d = getData(player);
        const st = d.stats;
        const stats = [
            T("profile.time", { v: fmtDuration(st.minutes * 60000) }),
            T("profile.mobs", { v: N(st.mobKills) }),
            T("profile.pvp", { v: N(st.pvpKills) }),
            T("profile.deaths", { v: N(st.deaths) }),
            T("profile.purchases", { v: N(st.purchases) }),
            T("profile.spent", { v: N(st.spent) }),
            T("profile.homes", { v: Object.keys(d.homes).length, max: CONFIG.maxHomes }),
        ].join("\n");

        return new Menu(T("profile.title", { name: player.name }))
            .header(T("profile.header"))
            .label(stats)
            .divider()
            .button(T("profile.quests"), "textures/items/experience_bottle", sub(openQuests, player))
            .button(T("back"), undefined, BACK);
    });

const openQuests = (player) =>
    loop(player, () => {
        const { T, N } = useLang(player);
        const d = getData(player);
        const menu = new Menu(T("quests.title")).label(T("quests.intro"));

        for (const q of QUESTS) {
            const cur = Math.min(d.stats[q.stat] ?? 0, q.goal);
            const claimed = d.claimed.includes(q.id);
            const done = cur >= q.goal;
            const state = claimed ? T("quests.claimed") : done ? T("quests.claim") : `§7${N(cur)}/${N(q.goal)}`;
            menu.button(`§l${T(`quest.${q.id}.name`)} §r${state}\n§r${bar(cur, q.goal)}`, q.icon, sub(questAction, player, q));
        }
        return menu.divider().button(T("back"), undefined, BACK);
    });

async function questAction(player, quest) {
    const { T, N } = useLang(player);
    const d = getData(player);
    const cur = Math.min(d.stats[quest.stat] ?? 0, quest.goal);
    const name = T(`quest.${quest.id}.name`);

    if (d.claimed.includes(quest.id)) return notify(player, "info", T("quests.already"));

    if (cur < quest.goal) {
        return notice(
            player,
            name,
            T("quests.detail", {
                desc: T(`quest.${quest.id}.desc`),
                bar: bar(cur, quest.goal),
                cur: N(cur),
                goal: N(quest.goal),
                reward: N(quest.reward),
            })
        );
    }

    d.claimed.push(quest.id);
    addCoins(player, quest.reward);
    saveData(player);
    sfx(player, "random.levelup");
    bigTitle(player, T("quests.doneTitle"), T("quests.doneSub", { name, reward: N(quest.reward) }));
    notify(player, "ok", T("quests.doneMsg", { name, reward: N(quest.reward) }));
}

function chargeTeleport(player) {
    if (CONFIG.teleportCost <= 0) return true;
    if (spendCoins(player, CONFIG.teleportCost)) return true;
    notify(player, "err", useLang(player).T("tp.noCoins", { cost: CONFIG.teleportCost }));
    sfx(player, "mob.villager.no");
    return false;
}

const openTeleports = (player) =>
    loop(player, () => {
        const { T, N } = useLang(player);
        const d = getData(player);
        const homes = Object.entries(d.homes);

        const menu = new Menu(T("tp.title"))
            .label(T("tp.cost", { cost: CONFIG.teleportCost, coins: N(getCoins(player)) }))
            .header(T("tp.quick"))
            .button(T("tp.spawn"), "textures/items/compass_item", sub(goWorldSpawn, player))
            .button(T("tp.bed"), "textures/items/bed_red", sub(goBed, player))
            .button(T("tp.death", { note: d.lastDeath ? "" : T("tp.noData") }), "textures/items/totem", sub(goLastDeath, player))
            .divider()
            .header(T("tp.homesHeader", { n: homes.length, max: CONFIG.maxHomes }));

        for (const [name, h] of homes) {
            const icon = HOME_ICONS[h.icon]?.tex ?? HOME_ICONS[0].tex;
            menu.button(`§l${name}\n§r§8${fmtPos(h)} • ${dimName(player, h.dim)}`, icon, sub(openHome, player, name));
        }

        return menu
            .button(T("tp.create"), "textures/items/name_tag", sub(createHome, player))
            .divider()
            .button(T("tp.toPlayer"), "textures/ui/FriendsIcon", sub(openPlayers, player))
            .button(T("back"), undefined, BACK);
    });

function goWorldSpawn(player) {
    if (!chargeTeleport(player)) return;
    const spawn = world.getDefaultSpawnLocation();
    const overworld = world.getDimension("overworld");
    let y = spawn.y;
    try {
        const top = overworld.getTopmostBlock({ x: spawn.x, z: spawn.z });
        if (top) y = top.location.y + 1;
    } catch { }
    if (y > 320 || y < -64) y = 100;
    teleport(player, { x: spawn.x + 0.5, y, z: spawn.z + 0.5 }, "minecraft:overworld", useLang(player).T("tp.labelSpawn"));
    try {
        player.addEffect("slow_falling", 100, { showParticles: false });
    } catch { }
    return "close";
}

function goBed(player) {
    const { T } = useLang(player);
    const sp = player.getSpawnPoint();
    if (!sp) return notify(player, "err", T("tp.noBed"));
    if (!chargeTeleport(player)) return;
    teleport(player, { x: sp.x + 0.5, y: sp.y, z: sp.z + 0.5 }, sp.dimension.id, T("tp.labelBed"));
    return "close";
}

function goLastDeath(player) {
    const { T } = useLang(player);
    const p = getData(player).lastDeath;
    if (!p) return notify(player, "err", T("tp.noDeath"));
    if (!chargeTeleport(player)) return;
    teleport(player, { x: p.x, y: p.y, z: p.z }, p.dim, T("tp.labelDeath"));
    return "close";
}

async function createHome(player) {
    const { T } = useLang(player);
    const d = getData(player);
    if (Object.keys(d.homes).length >= CONFIG.maxHomes) {
        return notify(player, "err", T("home.max", { max: CONFIG.maxHomes }));
    }
    const r = await askHomeName(player);
    if (!r) return;

    const name = clean(r.name).slice(0, 16);
    if (!name) return notify(player, "err", T("home.noName"));
    if (d.homes[name]) return notify(player, "err", T("home.exists", { name }));

    const { x, y, z } = player.location;
    d.homes[name] = { x, y, z, dim: player.dimension.id, icon: r.icon };
    saveData(player);
    sfx(player, "random.levelup");
    notify(player, "ok", T("home.saved", { name, pos: fmtPos(player.location) }));
}

async function openHome(player, name) {
    const { T } = useLang(player);
    const h = getData(player).homes[name];
    if (!h) return "back";
    const icon = HOME_ICONS[h.icon]?.tex ?? HOME_ICONS[0].tex;

    return new Menu(`§l${name}`)
        .label(T("home.info", { pos: fmtPos(h), dim: dimName(player, h.dim) }))
        .button(T("home.go"), icon, () => {
            if (!chargeTeleport(player)) return "stay";
            teleport(player, { x: h.x, y: h.y, z: h.z }, h.dim, name);
            return "close";
        })
        .button(T("home.delete"), "textures/items/redstone_dust", async () => {
            const ok = await confirm(player, {
                title: T("home.delTitle"),
                body: T("home.delBody", { name }),
                yes: T("home.delYes"),
                no: T("home.delNo"),
            });
            if (!ok) return "stay";
            delete getData(player).homes[name];
            saveData(player);
            notify(player, "info", T("home.deleted", { name }));
            return "back";
        })
        .button(T("back"), undefined, BACK)
        .show(player);
}

const openPlayers = (player) =>
    loop(player, () => {
        const { T } = useLang(player);
        const others = otherPlayers(player);
        const menu = new Menu(T("pl.title")).label(others.length ? T("pl.some", { n: others.length }) : T("pl.none"));

        for (const p of others) {
            const hp = healthOf(p);
            menu.button(
                T("pl.btn", { name: p.name, dim: dimName(player, p.dimension.id), hp: hp.cur, max: hp.max }),
                "textures/ui/icon_steve",
                sub(openPlayerCard, player, p)
            );
        }
        return menu.divider().button(T("back"), undefined, BACK);
    });

async function openPlayerCard(player, target) {
    const { T } = useLang(player);
    if (!target.isValid) return "back";
    const hp = healthOf(target);

    return new Menu(`§l${target.name}`)
        .label(T("pl.card", { dim: dimName(player, target.dimension.id), hp: hp.cur, max: hp.max }))
        .button(T("pl.reqTp"), "textures/items/ender_pearl", () => requestTeleport(player, target))
        .button(T("pl.sendCoins"), "textures/items/gold_nugget", () => sendCoins(player, target))
        .button(T("pl.whisper"), "textures/items/book_writable", () => whisper(player, target))
        .button(T("back"), undefined, BACK)
        .show(player);
}

async function requestTeleport(player, target) {
    const { T } = useLang(player);
    if (!target.isValid) return notify(player, "err", T("pl.gone"));

    const wait = remaining(player, "tpa");
    if (wait > 0) return notify(player, "info", T("pl.wait", { t: fmtDuration(wait) }));
    if (!getData(target).settings.acceptTp) return notify(player, "err", T("pl.noAccept", { name: target.name }));
    if (getCoins(player) < CONFIG.teleportCost) return notify(player, "err", T("pl.needCoins", { cost: CONFIG.teleportCost }));

    startCooldown(player, "tpa", CONFIG.tpaCooldownMs);
    notify(player, "info", T("pl.sent", { name: target.name }));
    sfx(target, "note.pling", 1.5);

    const accepted = await askTeleportRequest(target, player);
    if (!accepted) return notify(player, "err", T("pl.declined", { name: target.name }));
    if (!player.isValid || !target.isValid) return;
    if (!chargeTeleport(player)) return;

    teleport(player, target.location, target.dimension.id, T("tp.labelPlayer", { name: target.name }));
    notify(target, "ok", useLang(target).T("pl.arrived", { name: player.name }));
    return "close";
}

async function sendCoins(player, target) {
    const { T, N } = useLang(player);
    const r = await askTransfer(player, target);
    if (!r) return;

    const amount = Math.floor(Number(String(r.amount).replace(/[.,\s]/g, "")));
    if (!Number.isFinite(amount) || amount <= 0) return notify(player, "err", T("tx.invalid"));
    if (amount > getCoins(player)) return notify(player, "err", T("tx.noFunds"));
    if (!target.isValid) return notify(player, "err", T("pl.gone"));

    const ok = await confirm(player, {
        title: T("tx.title"),
        body: T("tx.body", { amount: N(amount), name: target.name }),
        yes: T("tx.yes"),
    });
    if (!ok) return;

    setCoins(player, getCoins(player) - amount);
    addCoins(target, amount);
    sfx(player, "random.orb");
    sfx(target, "random.levelup");
    notify(player, "ok", T("tx.sent", { amount: N(amount), name: target.name }));
    notify(target, "ok", useLang(target).T("tx.received", { name: player.name, amount: useLang(target).N(amount) }));
}

async function whisper(player, target) {
    const r = await askWhisper(player, target);
    const text = clean(r?.text);
    if (!text) return;
    if (!target.isValid) return notify(player, "err", useLang(player).T("pl.gone"));
    target.sendMessage(useLang(target).T("ws.from", { from: player.name, text }));
    player.sendMessage(useLang(player).T("ws.to", { to: target.name, text }));
    sfx(target, "random.orb");
}

const openShop = (player) =>
    loop(player, () => {
        const { T, N } = useLang(player);
        const menu = new Menu(T("shop.title")).label(T("shop.intro", { coins: N(getCoins(player)) })).divider();

        for (const cat of SHOP) {
            menu.button(T("shop.cat", { name: T(`shopcat.${cat.key}`), n: cat.items.length }), cat.icon, sub(openCategory, player, cat));
        }
        return menu.divider().button(T("back"), undefined, BACK);
    });

const openCategory = (player, cat) =>
    loop(player, () => {
        const { T, N } = useLang(player);
        const menu = new Menu(`§l§a${T(`shopcat.${cat.key}`)}`).label(T("shop.balance", { coins: N(getCoins(player)) }));

        for (const item of cat.items) {
            const sell = item.sell > 0 ? T("shop.sellPrice", { price: N(item.sell) }) : T("shop.noSale");
            menu.button(T("shop.item", { name: itemName(player, item.id), buy: N(item.buy), sell }), item.icon, sub(trade, player, item));
        }
        return menu.divider().button(T("back"), undefined, BACK);
    });

async function trade(player, item) {
    const { T, N } = useLang(player);
    const label = itemName(player, item.id);
    const owned = countItem(player, item.id);
    const r = await askTrade(player, item, label, owned, getCoins(player));
    if (!r) return;

    const selling = r.mode === 1;
    const qty = selling && r.all ? owned : r.qty;

    if (selling) {
        if (qty <= 0 || owned < qty) return notify(player, "err", T("shop.notEnough", { item: label }));
        const total = qty * item.sell;
        const ok = await confirm(player, {
            title: T("shop.sellTitle"),
            body: T("shop.sellBody", { qty, item: label, total: N(total) }),
            yes: T("shop.sellYes"),
        });
        if (!ok) return;
        if (!removeItem(player, item.id, qty)) return notify(player, "err", T("shop.sellFail"));
        addCoins(player, total);
        sfx(player, "random.orb");
        return notify(player, "ok", T("shop.sold", { qty, item: label, total: N(total) }));
    }

    const total = qty * item.buy;
    const coins = getCoins(player);
    if (coins < total) {
        sfx(player, "mob.villager.no");
        return notify(player, "err", T("shop.missing", { missing: N(total - coins), qty, item: label }));
    }
    const ok = await confirm(player, {
        title: T("shop.buyTitle"),
        body: T("shop.buyBody", { qty, item: label, total: N(total), left: N(coins - total) }),
        yes: T("shop.buyYes"),
    });
    if (!ok) return;
    if (!spendCoins(player, total)) return notify(player, "err", T("tx.noFunds"));
    giveItem(player, item.id, qty);
    getData(player).stats.purchases++;
    saveData(player);
    sfx(player, "random.levelup");
    notify(player, "ok", T("shop.bought", { qty, item: label, total: N(total) }));
}

const openRewards = (player) =>
    loop(player, () => {
        const { T, N } = useLang(player);
        const d = getData(player);
        const info = dailyInfo(d);
        const doneUpTo = info.ready ? info.streak % 7 : ((d.daily.streak - 1) % 7) + 1;

        const calendar = [];
        for (let day = 1; day <= 7; day++) {
            const reward = DAILY.base + DAILY.step * (day - 1);
            const mark = day <= doneUpTo ? "§a[x]" : day === info.nextDay && info.ready ? "§e[>]" : "§8[ ]";
            calendar.push(T("rw.calDay", { mark, day, reward: N(reward), extra: day === 7 ? T("rw.day7") : "" }));
        }

        const menu = new Menu(T("rw.title"))
            .header(T("rw.dailyHeader"))
            .label(calendar.join("\n"))
            .button(
                info.ready ? T("rw.claimBtn", { day: info.nextDay }) : T("rw.waitBtn", { t: fmtDuration(info.left) }),
                "textures/items/gold_ingot",
                sub(claimDaily, player)
            )
            .divider()
            .header(T("rw.kitsHeader"));

        for (const kit of KITS) {
            const left = remaining(player, `kit:${kit.id}`);
            const state = left > 0 ? T("rw.kitWait", { t: fmtDuration(left) }) : kit.cost ? T("rw.kitCost", { cost: N(kit.cost) }) : T("rw.free");
            menu.button(T("rw.kitBtn", { name: T(`kit.${kit.id}`), state }), kit.icon, sub(claimKit, player, kit));
        }
        return menu.divider().button(T("back"), undefined, BACK);
    });

function claimDaily(player) {
    const { T, N } = useLang(player);
    const d = getData(player);
    const info = dailyInfo(d);
    if (!info.ready) {
        sfx(player, "mob.villager.no");
        return notify(player, "info", T("rw.notReady", { t: fmtDuration(info.left) }));
    }

    const day = info.nextDay;
    const reward = DAILY.base + DAILY.step * (day - 1);
    d.daily.streak = info.streak + 1;
    d.daily.last = Date.now();
    addCoins(player, reward);

    let extra = "";
    if (day === 7) {
        giveItem(player, "minecraft:diamond", 2);
        player.addLevels(5);
        extra = T("rw.extra7");
    }
    saveData(player);
    sfx(player, "random.levelup");
    bigTitle(player, T("rw.dailyTitle"), T("rw.dailySub", { day, reward: N(reward), extra }));
    notify(player, "ok", T("rw.dailyMsg", { day, reward: N(reward), extra }));
}

async function claimKit(player, kit) {
    const { T, N } = useLang(player);
    const name = T(`kit.${kit.id}`);
    const left = remaining(player, `kit:${kit.id}`);
    if (left > 0) {
        sfx(player, "mob.villager.no");
        return notify(player, "info", T("rw.kitLeft", { name, t: fmtDuration(left) }));
    }

    const contents = kit.items.map(([id, n]) => `§f- ${n}x ${itemName(player, id)}`).join("\n");
    const ok = await confirm(player, {
        title: `§6${name}`,
        body: T("rw.kitBody", { contents, cost: kit.cost ? T("rw.kitCostValue", { cost: N(kit.cost) }) : T("rw.free") }),
        yes: T("rw.kitClaim"),
    });
    if (!ok) return;
    if (kit.cost && !spendCoins(player, kit.cost)) return notify(player, "err", T("rw.kitNeed", { cost: kit.cost }));

    for (const [id, n] of kit.items) giveItem(player, id, n);
    startCooldown(player, `kit:${kit.id}`, kit.cooldownMs);
    sfx(player, "random.levelup");
    notify(player, "ok", T("rw.kitGot", { name }));
}

const ROMAN = ["I", "II", "III"];

async function buyBuffs(player) {
    const { T, N } = useLang(player);
    const r = await askBuffs(player);
    if (!r) return;

    const chosen = BUFFS.filter((b) => r[b.id]);
    if (!chosen.length) return notify(player, "err", T("bf.none"));

    const minutes = r.minutes;
    const level = r.level + 1;
    const cost = chosen.reduce((sum, b) => sum + b.price, 0) * minutes * level;

    const ok = await confirm(player, {
        title: T("bf.title"),
        body: T("bf.body", {
            list: chosen.map((b) => `§f- ${T(`buff.${b.id}`)}`).join("\n"),
            level: ROMAN[level - 1],
            min: minutes,
            cost: N(cost),
            coins: N(getCoins(player)),
        }),
        yes: T("bf.buy"),
    });
    if (!ok) return;
    if (!spendCoins(player, cost)) {
        sfx(player, "mob.villager.no");
        return notify(player, "err", T("bf.noFunds", { cost: N(cost) }));
    }

    for (const b of chosen) {
        try {
            player.addEffect(b.id, minutes * 1200, { amplifier: level - 1, showParticles: true });
        } catch (e) {
            console.warn(`[NEXUS] Could not apply ${b.id}: ${e}`);
        }
    }
    sfx(player, "random.levelup");
    bigTitle(player, T("bf.activeTitle"), T("bf.activeSub", { n: chosen.length, min: minutes }));
}

async function changeSettings(player) {
    const r = await askSettings(player);
    if (!r) return notify(player, "info", useLang(player).T("set.discarded"));

    const d = getData(player);
    const nick = clean(r.nick).slice(0, 16);
    Object.assign(d.settings, {
        hud: r.hud,
        hudStyle: r.hudStyle,
        hudCoords: r.hudCoords,
        hudInterval: r.hudInterval,
        lang: LANGS[r.lang]?.code ?? d.settings.lang,
        accent: r.accent,
        nick,
        sounds: r.sounds,
        acceptTp: r.acceptTp,
    });
    player.nameTag = nick || player.name;
    if (!r.hud) player.onScreenDisplay.setActionBar("");
    saveData(player);
    sfx(player, "random.levelup");
    notify(player, "ok", useLang(player).T("set.saved"));
}

function openAdmin(player) {
    if (!isAdmin(player)) {
        notify(player, "err", useLang(player).T("ad.noPerm"));
        return "back";
    }
    return loop(player, () => {
        const { T } = useLang(player);
        return new Menu(T("ad.title"))
            .label(T("ad.note", { tag: CONFIG.adminTag }))
            .header(T("ad.tools"))
            .button(T("ad.announce"), "textures/items/name_tag", sub(adminAnnounce, player))
            .button(T("ad.world"), "textures/items/clock_item", sub(adminWorld, player))
            .button(T("ad.economy"), "textures/items/emerald", sub(adminEconomy, player))
            .divider()
            .header(T("ad.gm"))
            .button(T("ad.survival"), "textures/items/iron_sword", sub(setGameMode, player, "survival"))
            .button(T("ad.creative"), "textures/items/diamond", sub(setGameMode, player, "creative"))
            .button(T("ad.spectator"), "textures/items/ender_eye", sub(setGameMode, player, "spectator"))
            .divider()
            .button(T("back"), undefined, BACK);
    });
}

function setGameMode(player, mode) {
    if (!isAdmin(player)) return;
    player.runCommand(`gamemode ${mode}`);
    notify(player, "ok", useLang(player).T("ad.gmSet", { mode }));
}

async function adminAnnounce(player) {
    if (!isAdmin(player)) return;
    const r = await askAnnouncement(player);
    const text = clean(r?.text);
    if (!text) return;

    for (const p of world.getAllPlayers()) {
        if (r.type === 0) p.sendMessage(`${CONFIG.prefix}§e${text}`);
        else if (r.type === 1) bigTitle(p, CONFIG.brand, `§e${text}`);
        else p.onScreenDisplay.setActionBar(`§e${text}`);
        if (r.sound) sfx(p, "random.toast");
    }
    notify(player, "ok", useLang(player).T("ad.sent"));
}

async function adminWorld(player) {
    if (!isAdmin(player)) return;
    const { T } = useLang(player);
    const r = await askWorldControl(player);
    if (!r) return;

    const dim = world.getDimension("overworld");
    const times = [null, "sunrise", "noon", "sunset", "night"];
    const weathers = [null, "clear", "rain", "thunder"];
    const done = [];

    if (times[r.time]) {
        dim.runCommand(`time set ${times[r.time]}`);
        done.push(T("ad.doneTime"));
    }
    if (weathers[r.weather]) {
        dim.runCommand(`weather ${weathers[r.weather]}`);
        done.push(T("ad.doneWeather"));
    }
    if (r.keepInv > 0) {
        dim.runCommand(`gamerule keepinventory ${r.keepInv === 1}`);
        done.push("keepInventory");
    }
    if (r.clearItems) {
        dim.runCommand("kill @e[type=item]");
        done.push(T("ad.doneItems"));
    }
    notify(player, "ok", done.length ? T("ad.applied", { list: done.join(", ") }) : T("ad.nothing"));
}

async function adminEconomy(player) {
    if (!isAdmin(player)) return;
    const { T, N } = useLang(player);
    const r = await askEconomy(player);
    if (!r) return;

    const target = world.getAllPlayers().find((p) => p.name === r.targetName);
    const amount = Math.floor(Number(String(r.amount).replace(/[.,\s]/g, "")));
    if (!target) return notify(player, "err", T("pl.gone"));
    if (!Number.isFinite(amount) || amount < 0) return notify(player, "err", T("ad.invalid"));

    if (r.op === 0) addCoins(target, amount);
    else if (r.op === 1) setCoins(target, getCoins(target) - amount);
    else setCoins(target, amount);

    notify(player, "ok", T("ad.balanceOf", { name: target.name, coins: N(getCoins(target)) }));
    notify(target, "info", useLang(target).T("ad.balanceUpd", { coins: useLang(target).N(getCoins(target)) }));
}

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
    if (source.typeId !== "minecraft:player") return;
    if (!CONFIG.menuItems.includes(itemStack.typeId)) return;

    if (source.isSneaking) openQuickTeleports(source);
    else openHub(source);
});