/* ============================================================
   SERVICIO · QUITAR
   La inversa de dividir: el usuario elige qué páginas sacar
   y el resultado es UN solo PDF con el resto.
   Reutiliza interpretarRangos (definida en dividir.js), que
   devuelve [{desde, hasta}, ...].
   ============================================================ */

SERVICIOS.quitar = async function (archivos, opciones, avisar) {
  const archivo = archivos[0];
  const doc = await abrirPdf(archivo.bytes);
  const total = doc.getPageCount();

  // Sin texto, no hay nada que quitar: es un error del usuario, no un "quitar todas".
  const texto = (opciones.paginas || '').trim();
  if (texto === '') throw new Error('Escribí qué páginas querés quitar (ej: 2, 5-7).');

  // interpretarRangos devuelve [{desde, hasta}]. Lo pasamos a un Set de números 1-based.
  const grupos = interpretarRangos(texto, total);
  const aQuitar = new Set();
  for (const g of grupos) {
    for (let p = g.desde; p <= g.hasta; p++) aQuitar.add(p);
  }

  if (aQuitar.size === 0) throw new Error('No hay páginas válidas para quitar.');
  if (aQuitar.size >= total) {
    throw new Error('No podés quitar todas las páginas: el PDF quedaría vacío.');
  }

  avisar('Quitando páginas…');

  // removePage de pdf-lib es 0-based. Recorremos DE ATRÁS para adelante:
  // si borrás primero la 2, las siguientes corren un lugar y borrarías la equivocada.
  for (let n = total; n >= 1; n--) {
    if (aQuitar.has(n)) doc.removePage(n - 1);
  }

  const bytes = await doc.save({ useObjectStreams: true });
  const quedan = total - aQuitar.size;
  return {
    tipo: 'descargas',
    mensaje: `Se quitaron ${aQuitar.size} ${aQuitar.size === 1 ? 'página' : 'páginas'}: quedan ${quedan}.`,
    archivos: [{ nombre: nombreSinExtension(archivo.nombre) + '-recortado.pdf', bytes }]
  };
};