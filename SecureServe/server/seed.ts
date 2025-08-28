import { db } from './db';
import { users, students, items, loans } from '@shared/schema-sqlite';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding database...');
  
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@example.com'));
    
    if (existingAdmin.length === 0) {
      // Create admin user
      const adminPasswordHash = await bcrypt.hash('Admin!234', 12);
      const [adminUser] = await db.insert(users).values({
        email: 'admin@example.com',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        isActive: true,
      }).returning();
      console.log('✅ Created admin user:', adminUser.email);
    } else {
      console.log('ℹ️ Admin user already exists');
    }
    
    // Check if clerk user exists
    const existingClerk = await db.select().from(users).where(eq(users.email, 'clerk@example.com'));
    
    if (existingClerk.length === 0) {
      // Create clerk user
      const clerkPasswordHash = await bcrypt.hash('Clerk!234', 12);
      const [clerkUser] = await db.insert(users).values({
        email: 'clerk@example.com',
        passwordHash: clerkPasswordHash,
        role: 'CLERK',
        isActive: true,
      }).returning();
      console.log('✅ Created clerk user:', clerkUser.email);
    } else {
      console.log('ℹ️ Clerk user already exists');
    }
    
    // Check if auditor user exists
    const existingAuditor = await db.select().from(users).where(eq(users.email, 'auditor@example.com'));
    
    if (existingAuditor.length === 0) {
      // Create auditor user
      const auditorPasswordHash = await bcrypt.hash('Auditor!234', 12);
      const [auditorUser] = await db.insert(users).values({
        email: 'auditor@example.com',
        passwordHash: auditorPasswordHash,
        role: 'AUDITOR',
        isActive: true,
      }).returning();
      console.log('✅ Created auditor user:', auditorUser.email);
    } else {
      console.log('ℹ️ Auditor user already exists');
    }
    
    // Create sample students
    const sampleStudents = [
      { studentNo: 'STU001', name: 'John', surname: 'Smith', roomNo: '204A' },
      { studentNo: 'STU002', name: 'Emma', surname: 'Johnson', roomNo: '305B' },
      { studentNo: 'STU003', name: 'Michael', surname: 'Brown', roomNo: '102C' },
      { studentNo: 'STU004', name: 'Sarah', surname: 'Davis', roomNo: '401D' },
      { studentNo: 'STU005', name: 'Alex', surname: 'Wilson', roomNo: '203A' },
    ];
    
    for (const studentData of sampleStudents) {
      const existing = await db.select().from(students).where(eq(students.studentNo, studentData.studentNo));
      if (existing.length === 0) {
        await db.insert(students).values(studentData);
        console.log('✅ Created student:', studentData.studentNo);
      }
    }
    
    // Create sample items
    const sampleItems = [
      { name: 'HDMI Cable', category: 'Cables & Adapters', specification: '2m HDMI 2.0 cable with gold connectors', assetTag: 'HDMI-001', isActive: true },
      { name: 'USB-C Charger', category: 'Chargers', specification: '65W USB-C PD charger with cable', assetTag: 'CHG-001', isActive: true },
      { name: 'Scientific Calculator', category: 'Electronics', specification: 'Casio FX-991ES PLUS scientific calculator', assetTag: 'CALC-001', isActive: true },
      { name: 'Ethernet Cable', category: 'Cables & Adapters', specification: '5m Cat6 ethernet cable', assetTag: 'ETH-001', isActive: true },
      { name: 'Wireless Mouse', category: 'Electronics', specification: 'Logitech M705 wireless mouse with USB receiver', assetTag: 'MOUSE-001', isActive: true },
      { name: 'USB Hub', category: 'Electronics', specification: '4-port USB 3.0 hub', assetTag: 'HUB-001', isActive: true },
      { name: 'Laptop Stand', category: 'Accessories', specification: 'Adjustable aluminum laptop stand', assetTag: 'STAND-001', isActive: true },
      { name: 'Phone Charger', category: 'Chargers', specification: 'USB-A to Lightning cable and wall adapter', assetTag: 'PHONE-001', isActive: true },
      { name: 'Desk Lamp', category: 'Furniture', specification: 'LED desk lamp with adjustable brightness', assetTag: 'LAMP-001', isActive: true },
      { name: 'Extension Cord', category: 'Cables & Adapters', specification: '3m extension cord with 4 outlets', assetTag: 'EXT-001', isActive: true },
    ];
    
    for (const itemData of sampleItems) {
      const existing = await db.select().from(items).where(eq(items.assetTag, itemData.assetTag!));
      if (existing.length === 0) {
        await db.insert(items).values(itemData);
        console.log('✅ Created item:', itemData.assetTag);
      }
    }
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('👑 Admin: admin@example.com / Admin!234');
    console.log('👤 Clerk: clerk@example.com / Clerk!234');
    console.log('🔍 Auditor: auditor@example.com / Auditor!234');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seed };