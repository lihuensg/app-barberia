# CLOUDINARY_SETUP

Variables de entorno necesarias (poner en Render/Lambda):

- CLOUDINARY_ENABLED=true
- CLOUDINARY_CLOUD_NAME=tu_cloud_name
- CLOUDINARY_API_KEY=tu_api_key
- CLOUDINARY_API_SECRET=tu_api_secret
- CLOUDINARY_FOLDER=nazabarber

Flujo recomendado de uploads:

1. Frontend solicita al admin que suba imagen (multipart) a endpoint `POST /api/redsocial/upload-image`.
2. Backend (con Multer en memoria) recibe archivo y lo sube a Cloudinary.
3. Backend devuelve `{ imageUrl, imagePublicId }`.
4. Frontend crea el post (admin) enviando `imagen: imageUrl` y opcional `imagePublicId` en `POST /api/redsocial/crear-post`.

Notas:
- No exponer `CLOUDINARY_API_SECRET` al frontend.
- En desarrollo local puedes dejar `CLOUDINARY_ENABLED=false` y usar URLs ya alojadas.
- Limites de tamaño: perfil 2MB, posts 5MB. Formatos permitidos: jpg, png, webp.
