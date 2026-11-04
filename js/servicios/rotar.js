SERVICIOS.rotar = async function (archivos, opciones, avisar) {
  const archivo = archivos[0];
  const doc = await abrirPdf(archivo.bytes);
  const angulo = Number(opciones.angulo);
  const totalPaginas = doc.getPageCount();

  // interpretarRangos (de dividir.js) devuelve [{desde, hasta}, ...].
  // Lo expandimos a un array de números 1-based: [1,2,3,5,...]
  let numerosARotar;
  const texto = (opciones.paginas || '').trim();
  if (texto !== '') {
    const grupos = interpretarRangos(texto, totalPaginas);
    numerosARotar = [];
    for (const g of grupos) {
      for (let p = g.desde; p <= g.hasta; p++) numerosARotar.push(p);
    }
  } else {
    numerosARotar = Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }

  avisar('Rotando páginas seleccionadas…');
  const paginas = doc.getPages();

  for (const numPagina of numerosARotar) {
    const indice = numPagina - 1;
    if (indice >= 0 && indice < paginas.length) {
      const pagina = paginas[indice];
      const actual = pagina.getRotation().angle;
      pagina.setRotation(PDFLib.degrees((actual + angulo) % 360));
    }
  }

  const bytes = await doc.save({ useObjectStreams: true });
  return {
    tipo: 'descargas',
    mensaje: `Se rotaron ${numerosARotar.length} páginas ${angulo}°.`,
    archivos: [{ nombre: nombreSinExtension(archivo.nombre) + '-rotado.pdf', bytes }]
  };
};