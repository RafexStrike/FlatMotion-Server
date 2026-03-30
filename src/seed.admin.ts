import { auth } from "./lib/auth";
import { prisma } from "./lib/prisma";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "admin123456";
  const name = process.env.ADMIN_NAME || "System Admin";

  console.log(`Checking if admin user (${email}) exists...`);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    if (existingUser.role !== "ADMIN") {
      await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
      });
      console.log(`User ${email} found. Updated role to ADMIN.`);
    } else {
      console.log(`Admin user ${email} already exists. No action taken.`);
    }
    return;
  }

  console.log(`Creating new admin user: ${email}`);

  try {
    // We try using the better-auth API directly
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (result && result.user) {
      // Update role to ADMIN immediately after creation
      await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
      });
      console.log(`Admin user created successfully!`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    } else {
      console.error("Failed to create admin user using better-auth.", result);
    }
  } catch (error) {
    console.error("Error creating admin user. This might be due to better-auth requiring a request context.", error);
    console.log("Attempting manual creation...");
    
    // Better Auth uses scrypt by default (if 1.0) or bcrypt.
    // If auth.api.signUpEmail fails in CLI, the best way is to fetch the API if it's running.
    console.error("Please run the server and register this user manually, then manually set their role to ADMIN in the database, OR use the auth API directly via curl.");
  }
}

seedAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
