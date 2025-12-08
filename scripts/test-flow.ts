
import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Starting API Flow Test...');

  try {
    // 1. Create User
    console.log('👤 Creating Test User...');
    const userEmail = `test-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        passwordHash: 'hashed_secret_password',
        name: 'Test Setup User'
      }
    });
    console.log(`   ✅ User created: ${user.id} (${user.email})`);

    // 2. Create Appointment
    console.log('📅 Scheduling Appointment...');
    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        serviceType: 'Visa_Turista',
        scheduledDate: new Date(Date.now() + 86400000), // Tomorrow
        notes: 'Testing flow via script'
      }
    });
    console.log(`   ✅ Appointment created: ${appointment.id}`);

    // 3. Verify
    console.log('🔍 Verifying Data...');
    const fetchedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { appointments: true }
    });

    if (fetchedUser && fetchedUser.appointments.length > 0) {
      console.log('   🎉 SUCCESS! User and Appointment linked correctly.');
      console.log('   Appointment Data:', fetchedUser.appointments[0]);
    } else {
      console.error('   ❌ FAILURE: Could not verify data linkage.');
    }

  } catch (error) {
    console.error('❌ Test Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
