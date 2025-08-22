const fileInput = document.getElementById('file-input').addEventListener('change', readFile);

function readFile(event) {
  const file = event.target.files[0];
  if (!file || file.type !== 'application/pdf') {
    console.log('Arquivo Selecionado');
    document.getElementById('area-erros').textContent = '⚠ Selecione um arquivo válido ⚠';
    return;
  }
  processarPDF(file);
}

function extrairTransacoes(texto) {
  const regexTransacao = /(\d{2}\/\d{2})\s+(.+?)\s+((\d{1,3}(\.\d{3})*,\d{2}-?)?)\s*((\d{1,3}(\.\d{3})*,\d{2}-?)?)?\s*((\d{1,3}(\.\d{3})*,\d{2})?)?/g;
  const transacoes = [];

  let match;
  while ((match = regexTransacao.exec(texto)) !== null) {
    const data = match[1];
    const descricao = match[2].trim();
    const entrada = match[3].endsWith('-') ? '' : match[3];
    const saida = match[3].endsWith('-') ? match[3].replace('-', '') : '';
    const saldo = match[9] || '';

    transacoes.push({
      Data: data,
      Descrição: descricao,
      Entrada: entrada,
      Saída: saida,
      Saldo: saldo
    });
  }

  console.log('Transações:', transacoes);
  gerarExcelComBordas(transacoes);
}

async function processarPDF(file) {
  const reader = new FileReader();
  reader.onload = async function () {
    const typedarray = new Uint8Array(reader.result);
    const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
    let textoCompleto = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      textoCompleto += strings.join(' ') + '\n';
    }

    console.log('Texto extraído:', textoCompleto);
    extrairTransacoes(textoCompleto); // ✅ agora está visível
  };
  reader.readAsArrayBuffer(file);
}

function gerarExcelComBordas(transacoes) {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['Data', 'Descrição', 'Entrada', 'Saída', 'Saldo'],
    ...transacoes.map(t => [t.Data, t.Descrição, t.Entrada, t.Saída, t.Saldo])
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = { c: C, r: R };
      const cell_ref = XLSX.utils.encode_cell(cell_address);
      if (!ws[cell_ref]) continue;

      ws[cell_ref].s = {
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
  }

  wb.SheetNames.push("Extrato");
  wb.Sheets["Extrato"] = ws;

  XLSX.writeFile(wb, "extrato_com_bordas.xlsx");

  document.getElementById('area-erros').textContent = '✅ Arquivo gerado com sucesso! Verifique sua pasta de downloads.';
}
