
import { prisma } from '../src/server/db/prisma-singleton';

async function main() {
    console.log('🌱 Starting Prisma Seed (Retry)...');

    const users = Array.from({ length: 10 }).map((_, i) => ({
        email: `standard_user${i + 1}_${Date.now()}@example.com`,
        name: `Standard User ${i + 1}`,
        passwordHash: 'hashed_placeholder',
    }));

    for (const user of users) {
        const created = await prisma.user.create({
            data: user,
        });
        console.log(`✅ Created user: ${created.email}`);
    }

    console.log('✨ Seed completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
