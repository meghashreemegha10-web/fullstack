import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    console.log('🔌 Testing Database Connection...');
    try {
        const userCount = await prisma.user.count();
        console.log(`✅ Successfully connected! Found ${userCount} users.`);

        // Also try to list one workspace to be sure
        const workspace = await prisma.workspace.findFirst();
        console.log(`✅ Workspace query success: ${workspace ? 'Found workspace' : 'No workspaces found'}`);

    } catch (error) {
        console.error('❌ Database Connection Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
