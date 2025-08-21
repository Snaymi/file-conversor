//Seleciona o iput do arquivo
const fileInput = document.getElementById('file-input');

//Seleciona a area onde o conteúdo será exibido.
const processArea = document.getElementById('process-area');
const emptyState = document.getElementById('empty-state');
const conteudoC100 = document.getElementById('conteudo-c100');
const conteudoC170 = document.getElementById('conteudo-c170');
const conteudoC190 = document.getElementById('conteudo-c190');

//Quando o usuário seleciona o arquivo
fileInput.addEventListener('change', function () {
    console.log('Arquivo Selecionado');
    const file = fileInput.files[0];
    if (!file) return;

    //Verifica se o Arquivo é um .txt
    if (file.type !== 'text/plain') {
        alert('Favor selecionar um arquivo .txt válido.');
        return;
    }
    //Cria um leitor de arquivos
    const reader = new FileReader();

    //Quando o arquivo for carregado:
    reader.onload = function (e) {
        //Pega o conteúdo do arquivo como texto
        const content = e.target.result;

        //Remove o estado vazio
        emptyState.style.display = 'none';
        //Limpa somente o conteudo das colunas:
        conteudoC100.textContent = '';
        conteudoC170.textContent = '';
        conteudoC190.textContent = '';


        //Divide o conteúdo em por linhas
        //"Quebre essa string toda sempre que encontrar uma quebra de linha"
        //linhas → vira um array, onde cada item é uma linha do arquivo.
        const linhas = content.split('\n');

        //Variável que vai guardar o último Bloco C100
        //Null - não tem valor AINDA
        //Quando encontrar um C170 ou C190, verifica se houve um C100 ANTES
        let ultimoC100 = null;

        //Array que armazena os erros
        let erros = [];


        //Filtra apenas linhas |C100| que existem:
        const blocoC100 = linhas.filter(linha => linha.includes('|C100|'));

        //Filtra apenas linhas |C170| que existem:
        const blocoC170 = linhas.filter(linha => linha.includes('|C170|'))

        ////Filtra apenas linhas |C190| que existem:
        const blocoC190 = linhas.filter(linha => linha.includes('|C190|'))

        //CONTA quantas linhas C100 existem
        const quantidadeC100 = blocoC100.length;
        const quantidadeC170 = blocoC170.length;
        const quantidadeC190 = blocoC190.length;


        //Mostra a quantidade de blocos C100:
        //const tituloC100 = document.createElement('h3');
        //tituloC100.textContent = `Blocos C100 encontrados: ${quantidadeC100}`;
        //tituloC100.classList.add('C100-content')
        ////"prepend -- Adiciona no começo do elemento PAI"
        //document.getElementById('coluna-c100').prepend(tituloC100);

        //Mostra a quantidade de blocos C170:
        //const tituloC170 = document.createElement('h3');
        //tituloC170.textContent = `Blocos C170 encontrados: ${quantidadeC170}`;
        //tituloC170.classList.add('C170-content');
        //"prepend -- Adiciona no começo do elemento PAI"
        //document.getElementById('coluna-c170').prepend(tituloC170);

        //Mostra a quantidadde de blocos C190:
        //const tituloC190 = document.createElement('h3');
        //tituloC190.textContent = `Blocos C190 encontrados: ${quantidadeC190}`;
        //tituloC190.classList.add('C190-content');
        //prepend -- Adiciona no começo do elemento PAI
        //document.getElementById('coluna-c190').prepend(tituloC190);

        //Exibe o conteúdo dos blocos em suas respectivas colunas:
        //conteudoC100.textContent = blocoC100.join('\n');
        //conteudoC170.textContent = blocoC170.join('\n');
        //conteudoC190.textContent = blocoC190.join('\n');
        //Explicando join:
        //array.join(separador) - sua sintaxe
        //array - conjunto de elementos
        //join - oq fica entre cada elemento - no caso acima é uma quebra de linha '\n'.

        //Percorre cada linha do Arquivo
        linhas.forEach((linha, index) => {
            console.log("verificando linha: ", index + 1);
            //Se a linha contém um bloco C100, atualiza a referência
            if (linha.includes('|C100|')) {
                ultimoC100 = linha; // Guarda o último C100 encontrado
            }
            //verifica se a linha contém um bloco C170 ou C190
            if (linha.includes('|C170|') || linha.includes('|C190|')) {

                //verifica se existe um C100 antes se não causa um erro
                if (!ultimoC100) {
                    erros.push(`Erro na linha ${index + 1}: ${linha.trim()} - sem  C100 anterior.`);
                }
            }
        });

        //Agrupamento por notas:
        //Cria um array vazio "notas"
        //Guarda objetos que representam cada nota fiscal encontrada no arquivo, com seus dados e blocos relacionados. 
        let notas = [];
        //Percorro cada linha do arquivo UMA por UMA:
        //"linha" - é o conteúdo da linha atual
        //"index" - é o número da linha (começando do zero)
        linhas.forEach((linha, index) => {
            //Verifica se a linha contém o bloco |C100|, que representa da NF
            //if = sim --> traz os dados principais da NF:
            if (linha.includes('|C100|')) {
                //Transforme a linha em uma array chamado campos, onde cada posição representa um campo da nota.
                const campos = linha.split('|'); //Divid a linha em partes, separando pelo caractere "|"
                //cria uma chave única para identificar a nota:
                //campos [2] - modelo da nota
                //campos [3] - número da nota
                const chave = `${campos[2]}-${campos[3]}`; // modelo + numero de nota
                const valorNota = parseFloat((campos[12] || '0').replace(',', '.')) || 0; //Valor total da NF
                //parseFloat - converte string em um número decimal.
                //Replace - Troca vírgula por ponto para fazer a conversão
                // Se for um valor inválido retorna NaN
                // || 0 - Caso dê tudo erraod substitua por 0 para não quebrar a app.
                notas.push({ //"push" - adiciona um objeto no final do array "notas"
                    chave, //Variável (identificador)
                    valorNota, //Variável (valor da NF)
                    itens: [],//inicia uma array vazio chamado "itens" 
                    impostos: []//inicia um array vazio chamado "impostos"
                });
            }
            if (linha.includes('|C170|')) {
                //Transforme a linha em uma array chamado campos, onde cada posição representa um campo da nota.
                const campos = linha.split('|'); //Divid a linha em partes, separando pelo caractere "|"
                const valorItem = parseFloat((campos[8]|| '0').replace(',', '.')) || 0;
                const notaAtual = notas[notas.length - 1];
                if (notaAtual) {
                    notaAtual.itens.push(valorItem);
                }
            }
            if (linha.includes('|C190|')) {
                //Transforme a linha em uma array chamado campos, onde cada posição representa um campo da nota.
                const campos = linha.split('|'); //Divid a linha em partes, separando pelo caractere "|"
                const valorImposto = parseFloat((campos[5] || '0').replace(',', '.')) || 0;
                const notaAtual = notas[notas.length - 1];
                if (notaAtual) {
                    notaAtual.impostos.push(valorImposto);
                }
            }

        });
        notas.forEach((nota, i) => {
            const somaItens = nota.itens.reduce((acc, val) => acc + val, 0);
            const somaImpostos = nota.impostos.reduce((acc, val) => acc + val, 0);
            const totalCalculado = somaItens + somaImpostos;

            // Comparação com tolerância de arredondamento
            //Math.abs(...) - Pega o valor da diferença (sendo positivo ou negativo)
            if (Math.abs(nota.valorNota - totalCalculado) > 0.01) //verifica se há diferença entre o valor declarado da nota e o total calculado(soma dos itens + impostos)
            //nota.valorNota: valor que veio da nota fiscal (que foi declarado)
            //totalCalculado: soma dos itens(somaItens) + impostos (somaImpostos)
            //nota.valorNota - totalCalculado: diferença entre o valor declarado e o valor calculado.
            //>0,1 -> Se a diferença for maior que 1 centavo acusa um erro.
            {
                //erros.push(...) --> adiciona uma mensagem ao array "erros"
                //erros --> guarda tudo encontrado
                //.push--> adiciona um item no final da lista
                erros.push(`Nota ${nota.chave} (linha ${i + 1}): valor declarado (${nota.valorNota.toFixed(2)}) difere da soma de itens (${somaItens.toFixed(2)}) + impostos (${somaImpostos.toFixed(2)}).`);
                //${nota.chave}: mostra a cahve da nota(identificador único)
                //${i + 1}: mostra o número da linha (indice do array + 1)
                //${nota.valorNota.toFixed(2)}: mostra o valor declarado com 2 casas DECIMAIS
                //${somaItens.toFixed(2)} e ${somaImpostos.toFixed(2)}: mostram os valores calculados com 2 casas decimais.
                
            }
        });

        //Exibe erros na tela (na area-erros no html)
        const areaErros = document.getElementById('area-erros');
        areaErros.textContent = erros.length > 0
            ? erros.join('\n') // mostra erros, linha por linha
            : 'Nenhum Erro encontrado'; // se não houver erros mostra a mensagem
    };
    reader.readAsText(file);
}
)