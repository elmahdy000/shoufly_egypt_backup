import { prisma } from "./lib/prisma";

async function testConnection() {
  console.log("Testing Database Connection...");
  const url = process.env.DATABASE_URL || "NOT SET";
  console.log("DATABASE_URL starts with:", url.substring(0, 20));
  
  try {
    const userCount = await prisma.user.count();
    console.log("✅ Success! User count:", userCount);
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
}

testConnection();
