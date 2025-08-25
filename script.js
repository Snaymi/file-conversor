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
                console.log('📚 Arquivo lido como ArrayBuffer — iniciando processamento com pdf.js biblioteca que espera dados Uint8Array. ⚠ ⚠');

                //Uint8Array - estrutura de dados em JavaScript usada para armazenar uma sequência de números inteiros sem sinal.
                const typedArray = new Uint8Array(event.target.result);
                //event - é o objeto do evento quando a leitura termina
                //target - elemento que disparou o esse evento (aqui é o próprio FileReader)
                //event.target.result - é o conteúdo lido do arquivo.
                // Ler um arquivo com FileReader.readAsArrayBuffer(), ele retorna os dados brutos do arquivo em formato ArrayBuffer. Mas o pdfjsLib.getDocument() — a biblioteca que estou usando para ler PDFs — espera um Uint8Array, que é uma forma mais específica de representar bytes.

                console.log('Dados binários (genéricos) extraidos, converção para Uint8Array feita! ✅')

                //"try tenta executar o código normalmente"
                try {
                    const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
                    console.log(`📄 PDF carregado — total de páginas: ${pdf.numPages}`);

                    let textoCompleto = '';

                    for (let i = 1; i <= pdf.numPages; i++) {
                        console.log(`🔍 Extraindo texto da página ${i}`);
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        const textoPagina = content.items.map(item => item.str).join('\n');
                        textoCompleto += `\n\n--- Página ${i} ---\n\n${textoPagina}`;
                    }
                    console.log('Texto extraído:', textoCompleto); // ← adicione isso
                    // ⚠️ Interrompe processamento ao encontrar a frase de parada
                    const fraseParada = 'totalizador de aplicações automáticas';
                    const indiceParada = textoCompleto.toLowerCase().indexOf(fraseParada.toLowerCase());

                    if (indiceParada !== -1) {
                        console.log('🛑 Frase de parada encontrada — interrompendo processamento após esse ponto');
                        textoCompleto = textoCompleto.slice(0, indiceParada);
                    } else {
                        console.log('✅ Nenhuma frase de parada encontrada — processando todas as páginas');
                    }

                    const paginas = textoCompleto.split(/--- Página \d+ ---/).filter(p => p.trim() !== '');
                    const todasTransacoes = [];

                    paginas.forEach((paginaTexto, idx) => {
                        const transacoes = extrairTransacoesFormatadas(paginaTexto);
                        console.log(`📄 Página ${idx + 1}`);

                        // ✅ Aqui está o console.table correto
                        console.table(
                            transacoes.map((t, i) => ({
                                índice: i,
                                data: t.data,
                                descrição: t.descricao,
                                entrada: t.entrada,
                                saída: t.saida,
                                saldo: t.saldo
                            }))
                        );

                        // ✅ Aqui acumulamos as transações fora do console.table
                        todasTransacoes.push(...transacoes);
                    });

                    // ✅ Aqui geramos o Excel com todas as transações acumuladas
                    gerarExcel(todasTransacoes);

                    console.log('✅ Texto extraído com sucesso — Preparando para exibir o botão');
                    exibirTexto(textoCompleto);
                }
                //"cacth" lida erros dentro do "try" - sem travar o script
                catch (erro) {
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

function extrairTransacoesFormatadas(texto) {
    const linhas = texto.split('\n').map(l => l.trim()).filter(l => l !== '');
    const transacoes = [];

    let bufferDescricao = '';
    let bufferData = '';
    let ultimaLinhaFoiValor = false;

    const valorRegex = /^(\d{1,3}(?:\.\d{3})*,\d{2})(-?)$/;
    const dataIsoladaRegex = /^\d{2}\/\d{2}$/;
    const dataEmbutidaRegex = /\d{2}\/\d{2}/;

    for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];

        // Detecta valor
        const valorMatch = linha.match(valorRegex);
        if (valorMatch) {
            const valor = valorMatch[1];
            const isSaida = valorMatch[2] === '-';

            // Tenta extrair data da descrição anterior
            let dataFinal = bufferData;
            if (!dataFinal && bufferDescricao) {
                const matchData = bufferDescricao.match(dataEmbutidaRegex);
                if (matchData) {
                    dataFinal = matchData[0];
                    bufferDescricao = bufferDescricao.replace(dataEmbutidaRegex, '').trim();
                }
            }

            // Verifica se é saldo
            if (bufferDescricao.toLowerCase().includes('saldo')) {
                transacoes.push({
                    data: dataFinal || '(sem data)',
                    descricao: bufferDescricao || '(sem descrição)',
                    entrada: '',
                    saida: '',
                    saldo: valor
                });
            } else {
                transacoes.push({
                    data: dataFinal || '(sem data)',
                    descricao: bufferDescricao || '(sem descrição)',
                    entrada: isSaida ? '' : valor,
                    saida: isSaida ? valor : '',
                    saldo: ''
                });
            }

            // Limpa buffers
            bufferDescricao = '';
            bufferData = '';
            ultimaLinhaFoiValor = true;
            continue;
        }

        // Detecta data isolada
        if (dataIsoladaRegex.test(linha)) {
            bufferData = linha;
            continue;
        }

        // Se não for valor nem data isolada, é descrição
        bufferDescricao = linha;
        ultimaLinhaFoiValor = false;
    }

    return transacoes;
}
function gerarExcel(transacoes, nomeArquivo = 'Transacoes.xlsx') {
    console.log('📊 Gerando planilha Excel...');

    const worksheet = XLSX.utils.json_to_sheet(transacoes);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    link.textContent = '📊 Baixar Excel das Transações';
    link.className = 'btn-download';
    document.getElementById('process-area').appendChild(link);

    console.log('✅ Planilha Excel pronta para download');
}

// Função para exibir o texto extraído e permitir download
function exibirTexto(texto) {
    //console.log('🖥️ Exibindo texto extraído no elemento #process-area');
    const areaProcessamento = document.getElementById('process-area');

    //const pre = document.createElement('pre');
    //pre.textContent = texto;
    //areaProcessamento.appendChild(pre);
    //Agora exibe apenas o botão para download do arquivo txt.
    console.log('📁 Criando arquivo .txt para download');
    const blob = new Blob([texto], { type: 'text/plain' });
    console.log('Etiqueta pronta ✅')
    //blob - guarda o texto extraido com a etiqueta: 'Sou um arquivo TXT
    const url = URL.createObjectURL(blob);
    //Endereço para o browser buscar o arquivo .txt
    console.log('Endereço encontrado ✅')

    const link = document.createElement('a');
    //Ponto de partida para criação do dowunload.
    //Cria o elemeto link

    //Aponta para o endereço temporário que o browser criou para acessar o conteúdo do arquivo.
    link.href = url; //Caminho para caixinha que preparei antes
    //Quando clicarem nese link busque esse conteúdo
    console.log('Conteúdo para download localizado ✅')
    link.download = 'Arquivo-convertido.txt'; // Nome do arquivo que o usuário vai baixar.
    console.log('Nome do Arquivo aplicado ✅')
    link.textContent = '📥 Baixar arquivo convertido 📥'; //Texto que aparece dentro do botão.
    console.log('Nome para o botão download aplicado ✅')
    link.className = 'btn-download'; //Da a classe 'btn-donwload' ao botão.
    console.log('Classe btn-download adicionada ao botão ✅')
    areaProcessamento.appendChild(link); //Coloca o botão na tela, dentro da área de processamento.
    console.log('Botão adicionado a area de procesasmento ✅')

    console.log('✅ Link de download criado e exibido com sucesso');
}
