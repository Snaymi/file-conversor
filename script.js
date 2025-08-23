function extrairMovimentacoes(texto) {
  const linhas = texto.split('\n');
  const movimentacoes = [];
  let i = 0;

  while (i < linhas.length) {
    const linha = linhas[i];

    // ✅ Proteção contra linhas indefinidas ou vazias
    if (!linha) {
      i++;
      continue;
    }

    console.log('🔍 Processando linha:', linha);

    // 🧠 Exemplo de regex para detectar início de uma movimentação
    const match = linha.match(/^(\d{2}\/\d{2})\s+(.+?)\s+(-?\d+,\d{2})$/);
    if (match) {
      const [_, data, descricao, valor] = match;

      const movimentacao = {
        data,
        descricao: descricao.trim(),
        valor: parseFloat(valor.replace('.', '').replace(',', '.')),
      };

      console.log('✅ Movimentação extraída:', movimentacao);
      movimentacoes.push(movimentacao);
    }

    i++;
  }

  return movimentacoes;
}
