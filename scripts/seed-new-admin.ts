const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function main() {
    const password = "Test123@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await db.user.upsert({
        where: { email: "test@test.com" },
        update: {
            password: hashedPassword,
            role: "ADMIN",
            approved: true,
            name: "Test Admin",
        },
        create: {
            email: "test@test.com",
            name: "Test Admin",
            password: hashedPassword,
            role: "ADMIN",
            approved: true,
        },
    });

    console.log("Created/Updated Admin:", admin);
}

main()
    .then(async () => {
        await db.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await db.$disconnect();
        process.exit(1);
    });
