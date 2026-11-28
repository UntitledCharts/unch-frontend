import type { Attachment } from "svelte/attachments";
import { fetchAccountById, type Account } from "$lib/data/index.js";

export const AUTHOR_CARD_ID = "author-card";
const OPEN_DELAY = 350;
const CLOSE_DELAY = 150;

// one request per account for the whole visit; a failed one is tried again next time
const accounts = new Map<string, Promise<Account | null>>();
function loadAccount(id: string): Promise<Account | null> {
  let request = accounts.get(id);
  if (!request) {
    request = fetchAccountById(fetch, id);
    accounts.set(id, request);
    request.then((account) => {
      if (!account) accounts.delete(id);
    });
  }
  return request;
}

class AuthorCard {
  id = $state<string | null>(null);
  anchor = $state<DOMRect | null>(null);
  account = $state<Account | null>(null);

  private trigger: HTMLElement | null = null;
  private openTimer: ReturnType<typeof setTimeout> | undefined;
  private closeTimer: ReturnType<typeof setTimeout> | undefined;

  show(id: string, el: HTMLElement) {
    clearTimeout(this.openTimer);
    if (this.id === id) {
      clearTimeout(this.closeTimer);
      this.describe(el);
      return;
    }
    this.openTimer = setTimeout(() => this.open(id, el), OPEN_DELAY);
  }

  hide() {
    clearTimeout(this.openTimer);
    clearTimeout(this.closeTimer);
    this.closeTimer = setTimeout(() => this.close(), CLOSE_DELAY);
  }

  keep() {
    clearTimeout(this.closeTimer);
  }

  owns(el: HTMLElement): boolean {
    return this.trigger === el;
  }

  close() {
    clearTimeout(this.openTimer);
    clearTimeout(this.closeTimer);
    this.trigger?.removeAttribute("aria-describedby");
    this.trigger = null;
    this.id = null;
    this.anchor = null;
    this.account = null;
  }

  private describe(el: HTMLElement) {
    if (this.trigger === el) return;
    this.trigger?.removeAttribute("aria-describedby");
    this.trigger = el;
    el.setAttribute("aria-describedby", AUTHOR_CARD_ID);
  }

  private open(id: string, el: HTMLElement) {
    if (!el.isConnected) return;
    this.describe(el);
    this.anchor = el.getBoundingClientRect();
    this.account = null;
    this.id = id;
    loadAccount(id).then((account) => {
      if (this.id !== id) return;
      if (account) this.account = account;
      else this.close();
    });
  }
}

export const authorCard = new AuthorCard();

// Hovering (or keyboard-focusing) the element shows the account's card after a short wait. Touch is
// left alone, so a tap just follows the link.
export function hoverCard(accountId: string): Attachment<HTMLElement> {
  return (el) => {
    if (!accountId) return;
    const enter = (e: PointerEvent) => {
      if (e.pointerType !== "touch") authorCard.show(accountId, el);
    };
    const leave = (e: PointerEvent) => {
      if (e.pointerType !== "touch") authorCard.hide();
    };
    const focus = () => {
      if (el.matches(":focus-visible")) authorCard.show(accountId, el);
    };
    const blur = () => authorCard.hide();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") authorCard.close();
    };
    const press = () => authorCard.close();

    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("focus", focus);
    el.addEventListener("blur", blur);
    el.addEventListener("keydown", key);
    el.addEventListener("pointerdown", press);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("focus", focus);
      el.removeEventListener("blur", blur);
      el.removeEventListener("keydown", key);
      el.removeEventListener("pointerdown", press);
      if (authorCard.owns(el)) authorCard.close();
    };
  };
}
