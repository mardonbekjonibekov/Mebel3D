-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "buttonText" TEXT,
    "link" TEXT,
    "imageUrl" TEXT,
    "tone" TEXT NOT NULL DEFAULT 'orange',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "oldPrice" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "material" TEXT,
    "color" TEXT,
    "colors" TEXT,
    "colorParts" TEXT,
    "warrantyMonths" INTEGER,
    "installmentMonths" INTEGER,
    "stock" TEXT NOT NULL DEFAULT 'in',
    "leadDays" INTEGER,
    "width" INTEGER,
    "depth" INTEGER,
    "height" INTEGER,
    "imageUrl" TEXT,
    "images" TEXT,
    "glbUrl" TEXT,
    "usdzUrl" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("categoryId", "color", "colorParts", "colors", "createdAt", "depth", "description", "featured", "glbUrl", "height", "id", "imageUrl", "images", "material", "name", "oldPrice", "price", "usdzUrl", "width") SELECT "categoryId", "color", "colorParts", "colors", "createdAt", "depth", "description", "featured", "glbUrl", "height", "id", "imageUrl", "images", "material", "name", "oldPrice", "price", "usdzUrl", "width" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
