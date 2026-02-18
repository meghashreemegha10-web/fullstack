
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

import { db } from "../lib/db"
import bcrypt from "bcryptjs"

async function main() {
    const password = process.env.ADMIN_PASSWORD || "password123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const emailsToFix = [
        "test@example.com",
        process.env.ADMIN_EMAIL || "test@test.com"
    ];

    for (const email of emailsToFix) {
        if (!email) continue;

        console.log(`Processing ${email}...`);

        const user = await db.user.findUnique({ where: { email } });

        if (user) {
            await db.user.update({
                where: { email },
                data: { password: hashedPassword }
            });
            console.log(`Updated password for existing user ${email}.`);
        } else {
            await db.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: "Admin User",
                    role: "ADMIN",
                    approved: true
                }
            });
            console.log(`Created new admin user ${email}.`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => process.exit())
