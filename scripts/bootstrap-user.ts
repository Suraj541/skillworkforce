import { randomUUID } from "node:crypto";
import { createUser, findUserByEmail } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

const email = process.env.SKILLFORGE_BOOTSTRAP_EMAIL?.trim().toLowerCase();
const password = process.env.SKILLFORGE_BOOTSTRAP_PASSWORD;
if (!email || !password || password.length < 12) throw new Error("Set SKILLFORGE_BOOTSTRAP_EMAIL and a SKILLFORGE_BOOTSTRAP_PASSWORD of at least 12 characters.");
if (findUserByEmail(email)) throw new Error("Bootstrap user already exists.");
createUser({ id: randomUUID(), email, createdAt: new Date().toISOString() }, hashPassword(password));
console.log(`Created bootstrap user ${email}.`);
