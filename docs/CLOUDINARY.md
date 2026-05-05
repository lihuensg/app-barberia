# Cloudinary

- Imágenes finales en Cloudinary.
- No usar base64 como almacenamiento final.
- No usar `uploads/` como storage permanente.
- Máximo 2MB para foto de perfil.
- Máximo 5MB para posts.
- Formatos permitidos: JPG, PNG, WEBP.
- Variables en backend: `CLOUDINARY_ENABLED`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER`.
- Ver detalles técnicos en `backend/CLOUDINARY_SETUP.md`.
