import crypto from "crypto";

export const DELETE_TOKEN_EXPIRES_HOURS = 24;
export const DELETE_AFTER_DAYS = 7;

export function createDeleteToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashDeleteToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}