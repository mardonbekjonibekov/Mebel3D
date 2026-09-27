import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

for (const model of ["banner", "setting", "tgSession"]) {
  if (!prisma[model]) {
    throw new Error(
      "Baza yangilangan, lekin server hali eski versiyada ishlayapti. Terminalda Ctrl+C bosib, `npm run dev` ni qayta ishga tushiring."
    );
  }
}
