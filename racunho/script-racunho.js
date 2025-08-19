// Seleciona o input do arquivo
const fileInput = document.getElementById('file-input');

// Seleciona a área onde o conteúdo será exibido
const processArea = document.getElementById('process-area');
const emptyState = document.getElementById('empty-state');

// Quando o usuário seleciona o arquivo
fileInput.addEventListener('change', function () {
  const file = fileInput.files[0];
  if (!file) return;

  // Verifica se o arquivo é um .txt
  if (file.type !== 'text/plain') {
    alert('Favor selecionar um arquivo .txt válido.');
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const content = e.target.result;

    // Remove o estado vazio
    emptyState.style.display = 'none';

    // Limpa a área de exibição antes de mostrar novo conteúdo
    processArea.innerHTML = '';

    // Divide o conteúdo em linhas
    const linhas = content.split('\n');

    // Filtra apenas as linhas que contêm "|C100|"
    const blocoC100 = linhas.filter(linha => linha.includes('|C100|'));

    // Conta quantas linhas C100 existem
    const quantidadeC100 = blocoC100.length;

    // Primeiro: mostra a quantidade de blocos C100
    const tituloC100 = document.createElement('h3');
    tituloC100.textContent = `Blocos C100 encontrados: ${quantidadeC100}`;
    tituloC100.classList.add('file-content');
    processArea.appendChild(tituloC100);

    // Depois: mostra o conteúdo completo do arquivo
    const output = document.createElement('pre');
    output.textContent = content;
    output.classList.add('file-content');
    processArea.appendChild(output);
  };

  reader.readAsText(file);
});
