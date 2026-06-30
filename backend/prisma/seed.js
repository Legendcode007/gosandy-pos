const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Gosandy database...\n');

  // ── Default Services ───────────────────────────────────────
  const services = [
    // Printing
    { name: 'A4 Black & White Print', category: 'Printing', unitPrice: 0.50, description: 'Per page' },
    { name: 'A4 Color Print', category: 'Printing', unitPrice: 2.00, description: 'Per page' },
    { name: 'A3 Black & White Print', category: 'Printing', unitPrice: 1.00, description: 'Per page' },
    { name: 'A3 Color Print', category: 'Printing', unitPrice: 3.00, description: 'Per page' },
    // Photocopying
    { name: 'A4 Photocopy (B&W)', category: 'Photocopying', unitPrice: 0.30, description: 'Per page' },
    { name: 'A4 Photocopy (Color)', category: 'Photocopying', unitPrice: 1.50, description: 'Per page' },
    { name: 'A3 Photocopy (B&W)', category: 'Photocopying', unitPrice: 0.60, description: 'Per page' },
    // Lamination
    { name: 'A4 Lamination', category: 'Lamination', unitPrice: 3.00, description: 'Per sheet' },
    { name: 'A3 Lamination', category: 'Lamination', unitPrice: 5.00, description: 'Per sheet' },
    { name: 'ID Card Lamination', category: 'Lamination', unitPrice: 1.50, description: 'Per card' },
    // Binding
    { name: 'Spiral Binding', category: 'Book Binding', unitPrice: 5.00, description: 'Per document' },
    { name: 'Soft Cover Binding', category: 'Book Binding', unitPrice: 8.00, description: 'Per document' },
    { name: 'Hard Cover Binding', category: 'Book Binding', unitPrice: 20.00, description: 'Per document' },
    // Scanning
    { name: 'Scan to PDF/USB', category: 'Scanning', unitPrice: 1.00, description: 'Per page' },
    { name: 'Scan to Email', category: 'Scanning', unitPrice: 1.50, description: 'Per page' },
    // Typing
    { name: 'Document Typing', category: 'Typing', unitPrice: 2.00, description: 'Per page' },
    // Editing
    { name: 'Document Editing', category: 'Editing', unitPrice: 10.00, description: 'Per document' },
    { name: 'Document Editing (per hour)', category: 'Editing', unitPrice: 15.00, description: 'Per hour' },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { id: service.name }, // won't match, will always create
      update: {},
      create: service,
    }).catch(() => {}); // skip if already exists
  }

  // Use createMany for efficiency
  await prisma.service.createMany({
    data: services,
    skipDuplicates: true,
  }).catch(() => {});

  console.log(`✅ ${services.length} services seeded`);

  // ── Default Boss Account ───────────────────────────────────
  const bossEmail = 'boss@gosandy.com';
  const existing = await prisma.user.findUnique({ where: { email: bossEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash('Boss@Gosandy2024', 12);
    await prisma.user.create({
      data: {
        fullName: 'Gosandy Boss',
        email: bossEmail,
        passwordHash,
        role: 'BOSS',
      },
    });
    console.log('✅ Default Boss account created');
    console.log('   Email   : boss@gosandy.com');
    console.log('   Password: Boss@Gosandy2024');
    console.log('   ⚠️  Change this password immediately after first login!\n');
  } else {
    console.log('ℹ️  Boss account already exists, skipping\n');
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch(e => { console.error('Seed error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
