import { EventEmitter } from "events";

const notificationEmitter = new EventEmitter();
notificationEmitter.setMaxListeners(20);

export const NOTIFY_USER    = "notify:user";
export const NOTIFY_ADMINS  = "notify:admins";
export const NOTIFY_CHARITY = "notify:charity";

export default notificationEmitter;
