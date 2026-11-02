import { MessageFormData } from "@minecraft/server-ui";
import { CONFIG } from "../config";
import { showForm } from "../lib/ui";
import { t } from "../lib/i18n";

// ============================================================

const BUTTON1 = 0;

export async function confirm(player, { title, body, yes, no, retries } = {}) {
    const form = new MessageFormData()
        .title(`${CONFIG.brand} §8» §r${title}`)
        .body(body)
        .button1(yes ?? t(player, "confirm"))
        .button2(no ?? t(player, "cancel"));

    const res = await showForm(player, form, retries ? { retries } : undefined);
    return !res.canceled && res.selection === BUTTON1;
}

export async function notice(player, title, body) {
    const form = new MessageFormData()
        .title(`${CONFIG.brand} §8» §r${title}`)
        .body(body)
        .button1(t(player, "gotIt"))
        .button2(t(player, "close"));
    await showForm(player, form);
}

export function askTeleportRequest(target, from) {
    return confirm(target, {
        title: t(target, "tpr.title"),
        body: t(target, "tpr.body", { name: from.name }),
        yes: t(target, "tpr.accept"),
        no: t(target, "tpr.decline"),
        retries: 40,
    });
}