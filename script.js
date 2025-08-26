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

//Processa um texto bruto contendo informações financeiras (como extratos bancários)
//  e estrutura essas informações em objetos de transações formatadas
console.log('🔁 Entrando na função para extrair as transações 🔁')
function extrairTransacoesFormatadas(texto) {
    console.log('🔁 Dividindo texto bruto em linhas 🔁');
    const linhas = texto.split('\n') // Divide o texto bruto em linhas, usando quebra de linha (\n)
    .map(l => l.trim()) //Remove espaços em branco do ínicio e fim de cada linha
    //trim - Remove espaços em branco no ínicio e no fim de uma string
    //map - cria um novo array com resultados da transformação
    .filter(l => l !== '');//Elimina linhas que ficaram vázias após o trim
    //Resultado - array só ocm linhas relevantes, limpas e prontas para o processo.
    console.log('🔁 Criando novo Array com os resultados do map 🔁');
console.log('🔁 Removendo espaços em branco no ínicio e no fim de cada linha 🔁');
    console.log('🔁 Eliminando linhas que ficaram vazias do novo array 🔁');
    const transacoes = []; // Array vazio para armazenamento
    console.log('Array vazio criado ✅');
    let bufferDescricao = ''; //Guarda a descrição
    let bufferData = ''; //Guarda a dadta
    let ultimaLinhaFoiValor = false;
    //"A última linha que li ainda não foi um valor"
    //pq false? - Nenhuma linha foi lida ainda
    //Então não faz sentido assumir que já lemos um valor
    console.log ('Buffers prontos ✅');

    //Regex - Procura padrões em textos
    //Detectos de formatos específicos
    //(^) - Começo da linha
    //(\d{1,3}(/:\.\d{3})*,\d{2})) - Números com ponto e virgula no formato brasileiro 
    //(-?) - pode ter um hífen no final
    // $ - fim da linha
    const valorRegex = /^(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})(-?)$/;

    const dataIsoladaRegex = /^\d{2}\/\d{2}$/;
    //a string inteira tem que ser SOMENTE a DATA
    const dataEmbutidaRegex = /\d{2}\/\d{2}/;
    //Não exige que a data esteja sozinha
console.log('Regex - Scanner pronto para detectar padrões ✅');
    for (let i = 0; i < linhas.length; i++) {
//percorre cada linha do array 'linhas', que contém o conteúdo do PDF
        const linha = linhas[i];
//linha - representa o conteúdo atual sendo analisado
        // Detecta valor
        const valorMatch = linha.match(valorRegex);
        //verifica se a linha contém um valor no formato brasileiro
        
        console.log('Analisando valor da linha 🔁' );
        console.log('Padrão brasileiro encontrado ✅');
        // Só vai entrar nesse próximo bloco SE a linha analisada contiver um valor monetário detectado pelo 'valorRegex'
        if (valorMatch) {
            const valor = valorMatch[1]; //Extrai um valor número da transação
            const isSaida = valorMatch[2] === '-';
            //se tiver um '-' no final indica que é uma saída

            // Tenta extrair data da descrição anterior SE não houver, vai tentar extrair da descrição
            let dataFinal = bufferData;

            //Se não encontrou data e existe uma descrição anterior, tenta buscar a data nela mesmo.
            console.log('Tentando extrair a data 🔁');
            if (!dataFinal && bufferDescricao) {
                const matchData = bufferDescricao.match(dataEmbutidaRegex);

                //Se existe uma data embutida na descrição
                //Salva essa data em 'dataFinal'
                //Remove a data da descrição depois de armazenada
                console.log('Data extraída ✅')
                if (matchData) {
                    console.log('Limpando a data que está na descrição 🔁');
                    dataFinal = matchData[0];
                    bufferDescricao = bufferDescricao.replace(dataEmbutidaRegex, '').trim();
                    console.log('Limpeza concluída ✅');
                }
            }
            console.log('Verificando se o valor é Entrada/ Saída/ Saldo 🔁');
            // Verifica se é saldo
            if (bufferDescricao.toLowerCase().includes('saldo')) {
                console.log('Saldo detectado ✅');
                transacoes.push({
                    data: dataFinal || '(sem data)',
                    descricao: bufferDescricao || '(sem descrição)',
                    entrada: '',
                    saida: '',
                    saldo: valor
                    //Cria um objeto de transação com o campo saldo preenchido
                    //Entrada e saída ficam vazios
                });
                //Se não é saldo, então é uma transação comum
                //Entrada ou saída
            } else {
                console.log('Entrada Ou Saída detectado ✅');
                console.log('🔁 Aplicando lógica ternária para identificação 🔁')
                transacoes.push({
                    //Pq não preciso declarar variáveis?
                    //"Crie um objeto com essas chaves: data, descricao, entrada, saida, saldo 
                    // E atribua os valores conforme a lógica."
                    data: dataFinal || '(sem data)',
                    descricao: bufferDescricao || '(sem descrição)',
                    entrada: isSaida ? '' : valor,
                    saida: isSaida ? valor : '',
                    saldo: ''
                });
            }

            // Limpa buffers
            console.log('Transação finalizada, preparando para próxima ✅');
            bufferDescricao = '';
            bufferData = '';
            ultimaLinhaFoiValor = true;
            //Ao identificar que a transação está completa os valores que foram guardados temporariamente 
            //São apagados e prepara o terrono para a próxima transação
            continue;
        }

        // Detecta data isolada
        if (dataIsoladaRegex.test(linha)) {
            console.log('Data isolada Detectada e Extraída ✅');
            bufferData = linha;
            continue;
        }

        // Se não for valor nem data isolada, é descrição
        console.log('Valor nem data isolada detectada - Indicativo para DESCRIÇÃO ✅ ')
        bufferDescricao = linha;
        ultimaLinhaFoiValor = false;
    }
    console.log('Devolvendo toda Transação... ✅')
    return transacoes;
    //Trabalho da função concluído, devolve todo resultado
}

//Converte um conjunto de transações em uma planilha Excel (.xlsx) 
// E cria dinamicamente um link para download dessa planilha no navegador.
function gerarExcel(transacoes, nomeArquivo = 'Transacoes.xlsx') {
    console.log('📊 Gerando planilha Excel...');

    const worksheet = XLSX.utils.json_to_sheet(transacoes);
    //Usa a biblioteca SheetJS(XLSX) para converter o array 'transações' em uma planilha
    //cada objeto vira uma linha e cada chave vira uma coluna.
    console.log('Biblioteca SheetJS iniciando processo... ✅');
    const workbook = XLSX.utils.book_new();
    //Cria uma variável workbook  e adiciona a aba transações no excel
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transações');
    console.log('Aba Criada no Excel ✅');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    console.log('buffer binário.xlsx pronto ✅');
    //convert o workbook em um 'buffer binário' no formato .xlsx
    //Ele é o conteúdo bruto do EXCEL.
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    console.log('blob gerado, link temporário em produção... 🔁')
    //Cria um Blob, que é um tipo de arquivo temporário na memória do navegador.

    const url = URL.createObjectURL(blob);
    //Gera uma URL temporária para esse blob que será usado para baixar o arquivo

    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    link.textContent = '📊 Baixar Excel das Transações.xlsx 📊';
    link.className = 'btn-download';
    document.getElementById('download-btn').appendChild(link);

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
    link.textContent = '📥 Baixar arquivo convertido .txt 📥'; //Texto que aparece dentro do botão.
    console.log('Nome para o botão download aplicado ✅')
    link.className = 'btn-download'; //Da a classe 'btn-donwload' ao botão.
    console.log('Classe btn-download adicionada ao botão ✅')
    document.getElementById('download-btn').appendChild(link); //Coloca o botão na tela, dentro da área de processamento.
    console.log('Botão adicionado a area de procesasmento ✅')

    console.log('✅ Link de download criado e exibido com sucesso');
}
