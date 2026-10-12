import { prisma } from "./lib/prisma";

async function main() {
  const seasons = await prisma.season.findMany();

  console.log("Database connection successful!");
  console.log("Seasons:", seasons);
}

main()
  .catch((error) => {
    console.error("Database connection failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });