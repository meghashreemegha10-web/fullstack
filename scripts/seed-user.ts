import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const email = process.env.ADMIN_EMAIL || 'test@test.com';
    const password = process.env.ADMIN_PASSWORD || 'Test123@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`🌱 Seeding user: ${email}`);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: 'ADMIN',
                approved: true,
            },
            create: {
                email,
                name: 'Admin User',
                password: hashedPassword,
                role: 'ADMIN',
                approved: true,
            },
        });

        console.log(`✅ User seeded successfully: ${user.email} (${user.id})`);
    } catch (error) {
        console.error('❌ Error seeding user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
