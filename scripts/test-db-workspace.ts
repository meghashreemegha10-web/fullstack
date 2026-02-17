import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔌 Connecting to database...');
    // specific user email to test with
    const userEmail = 'test@test.com';
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      console.log('⚠️ Test user not found. Checking for any user...');
      user = await prisma.user.findFirst();
    }

    if (!user) {
      console.error('❌ No users found in the database. Cannot test workspace creation.');
      return;
    }

    console.log(`👤 Found user: ${user.email} (${user.id})`);

    console.log('🛠️ Attempting to create workspace...');
    const workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace ' + Date.now(),
        description: 'Created via test script',
        userId: user.id,
      },
    });

    console.log(`✅ Workspace created successfully: ${workspace.name} (${workspace.id})`);
  } catch (error) {
    console.error('❌ Error creating workspace:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
