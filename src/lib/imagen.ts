/** Convierte una imagen del navegador a WebP (máx. 800 px) para que pese poco. */
export async function convertirAWebp(archivo: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);

    const ctx = canvas.getContext("2d");
    if (!ctx) return archivo;

    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolver) =>
      canvas.toBlob(resolver, "image/webp", 0.85),
    );

    return blob ?? archivo;
  } catch {
    // Si el navegador no puede procesarla, se sube el archivo original.
    return archivo;
  }
}
