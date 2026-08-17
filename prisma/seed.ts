// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Add some initial content
  await prisma.content.createMany({
    data: [
      {
        type: 'text',
        title: 'Welcome to Vanca',
        description: 'Welcome message for new users',
        text: 'Welcome to Vanca! We are excited to have you here. Vanca is a platform that helps you achieve more.',
        isActive: true,
      },
      {
        type: 'text',
        title: 'Getting Started',
        description: 'Guide for getting started with Vanca',
        text: 'To get started with Vanca:\n1. Create your account\n2. Complete your profile\n3. Explore the features\n4. Connect with others',
        isActive: true,
      },
      {
        type: 'text',
        title: 'Support Hours',
        description: 'Our support hours and contact information',
        text: 'Our support team is available Monday to Friday, 9 AM to 6 PM. You can reach us at support@vanca.com',
        isActive: true,
      },
    ],
  })

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })