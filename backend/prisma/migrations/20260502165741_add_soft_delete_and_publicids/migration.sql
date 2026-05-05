-- AlterTable
ALTER TABLE "comentarios" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "imagePublicId" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "photoPublicId" TEXT;
