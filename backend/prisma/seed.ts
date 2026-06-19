import { PrismaClient } from "@prisma/client";
import { auth } from "../src/auth/better-auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create test users via Better Auth API
  const user1Response = await auth.api.signUpEmail({
    body: {
      name: "Alice Johnson",
      email: "alice@example.com",
      password: "Password123!",
    },
  });

  const user2Response = await auth.api.signUpEmail({
    body: {
      name: "Bob Smith",
      email: "bob@example.com",
      password: "Password123!",
    },
  });

  console.log("✅ Created users:");
  console.log("  - alice@example.com / Password123!");
  console.log("  - bob@example.com / Password123!");

  // Create organizations for each user
  if (user1Response?.user) {
    const org1 = await prisma.organization.create({
      data: {
        id: `org_alice_${Date.now()}`,
        name: "Alice's Finances",
        slug: "alices-finances",
        members: {
          create: {
            id: `mem_alice_${Date.now()}`,
            userId: user1Response.user.id,
            role: "owner",
          },
        },
      },
    });
    console.log(`  - Created org: ${org1.name}`);
  }

  if (user2Response?.user) {
    const org2 = await prisma.organization.create({
      data: {
        id: `org_bob_${Date.now()}`,
        name: "Bob's Finances",
        slug: "bobs-finances",
        members: {
          create: {
            id: `mem_bob_${Date.now()}`,
            userId: user2Response.user.id,
            role: "owner",
          },
        },
      },
    });
    console.log(`  - Created org: ${org2.name}`);
  }

  console.log("✅ Seeding complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
