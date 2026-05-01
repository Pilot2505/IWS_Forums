import crypto from "crypto";

export const PASSWORD_RESET_TOKEN_EXPIRES_HOURS = 1;

export function createPasswordResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}