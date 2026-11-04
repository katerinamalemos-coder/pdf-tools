/* ============================================================
   SERVICIO · NUMERAR
   Escribe "Página N de M" al pie de cada página.
   Usa page.drawText con una fuente estándar (Helvetica).
   La posición Y se mide desde el borde INFERIOR de la página.
   ============================================================ */

SERVICIOS.numerar = async function (archivos, opciones, avisar) {
  const archivo = archivos[0];
  const doc = await abrirPdf(archivo.bytes);
  const paginas = doc.getPages();
  const total = paginas.length;

  // Formato configurable. {n} = número de página, {m} = total.
  const formato = (opciones.formato || '').trim() || 'Página {n} de {m}';
  // Margen inferior en puntos. Number('') === 0, así que validamos con isFinite.
  const margenCrudo = Number(opciones.margen);
  const margen = Number.isFinite(margenCrudo) && margenCrudo >= 0 ? margenCrudo : 30;
  const tamano = 10;

  avisar('Insertando la numeración…');

  // Una sola fuente para todo el documento: más liviano y consistente.
  const fuente = await doc.embedFont(PDFLib.StandardFonts.Helvetica);

  for (let i = 0; i < total; i++) {
    const pagina = paginas[i];
    const texto = formato.replaceAll('{n}', String(i + 1)).replaceAll('{m}', String(total));

    const anchoTexto = fuente.widthOfTextAtSize(texto, tamano);
    const { width } = pagina.getSize();          // ancho de ESTA página (pueden ser distintas)

    pagina.drawText(texto, {
      x: (width - anchoTexto) / 2,               // centrado horizontalmente
      y: margen,                                  // margen desde el borde inferior
      size: tamano,
      font: fuente,
      color: PDFLib.rgb(0.2, 0.2, 0.2)
    });
  }

  const bytes = await doc.save({ useObjectStreams: true });
  return {
    tipo: 'descargas',
    mensaje: `Se numeraron ${total} ${total === 1 ? 'página' : 'páginas'}.`,
    archivos: [{ nombre: nombreSinExtension(archivo.nombre) + '-numerado.pdf', bytes }]
  };
};