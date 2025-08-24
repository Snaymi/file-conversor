document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ DOM CARREGADA — todos os elementos estão prontos para interação');

    const btn = document.getElementById('btn-arquivo');
    const arquivo = document.getElementById('file-input');

    if (!btn) {
        console.error('❌ Botão #btn-arquivo não encontrado no DOM');
        return;
    }

    if (!arquivo) {
        console.error('❌ Elemento #file-input não encontrado no DOM');
        return;
    }
    console.log('Passou sem erros ✅ evento CLICK carregado ✅')
    btn.addEventListener('click', function () {
        console.log('🖱️ Botão clicado — abrindo seletor de arquivos');
        arquivo.click(); // Simula o clique no input de arquivo
        console.log('Click interagido ✅')
    });

    arquivo.addEventListener('change', function () {
        console.log('📤 Evento disparado — identificando o arquivo selecionado');
        const file = arquivo.files[0];
        console.log('🔁 Arquivo recebido, analisando 🔁')

        if (file) {
            console.log('📄 Arquivo Recebido com sucesso!');
            console.log('🔤 Nome do arquivo:', file.name);
            console.log('📦 Tipo do arquivo:', file.type);
            const tamanhoMB = (file.size / (1024 * 1024)).toFixed(2);
            console.log('Tamanho convertido de KB para MB (valor aproximado) ✅')
            console.log('📏 Tamanho do arquivo:', tamanhoMB, 'MB');
            console.log('📁 Elemento input de arquivo:', arquivo);

            // Cria o leitor de arquivos
            const reader = new FileReader();
            console.log('📥 FileReader instanciado — preparando leitura do arquivo');

            // Quando o arquivo for carregado
            reader.onload = async function (event) {
                console.log('📚 Arquivo lido como ArrayBuffer — iniciando processamento com pdf.js');

                const typedArray = new Uint8Array(event.target.result);

                try {
                    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
                    console.log(`📄 PDF carregado — total de páginas: ${pdf.numPages}`);

                    let textoCompleto = '';

                    for (let i = 1; i <= pdf.numPages; i++) {
                        console.log(`🔍 Extraindo texto da página ${i}`);
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        const textoPagina = content.items.map(item => item.str).join(' ');
                        textoCompleto += `\n\n--- Página ${i} ---\n\n${textoPagina}`;
                    }

                    console.log('✅ Texto extraído com sucesso — exibindo conteúdo');
                    exibirTexto(textoCompleto);
                } catch (erro) {
                    console.error('❌ Erro ao processar o PDF:', erro);
                }
            };

            // Inicia leitura do arquivo como ArrayBuffer
            reader.readAsArrayBuffer(file);
            console.log('⏳ Leitura do arquivo iniciada com FileReader');
        } else {
            console.log('⚠️ Nenhum arquivo foi selecionado pelo usuário');
        }
    });
});

// Função para exibir o texto extraído e permitir download
function exibirTexto(texto) {
    console.log('🖥️ Exibindo texto extraído no elemento #process-area');
    const areaProcessamento = document.getElementById('process-area');

    //const pre = document.createElement('pre');
    //pre.textContent = texto;
    //areaProcessamento.appendChild(pre);
    //Agora exibe apenas o botão para download do arquivo txt.
    console.log('📁 Criando arquivo .txt para download');
    const blob = new Blob([texto], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;
    link.download = 'texto-extraido.txt';
    link.textContent = '📥 Baixar como .txt';
    link.className = 'btn-download';
    areaProcessamento.appendChild(link);

    console.log('✅ Link de download criado e exibido com sucesso');
}
