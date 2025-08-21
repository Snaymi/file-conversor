    //Seleciona o iput do arquivo
    const fileInput = document.getElementById('file-input');

    //Seleciona a area onde o conteúdo será exibido.
    const processArea = document.getElementById('process-area');
    const emptyState = document.getElementById('empty-state');
    const conteudoC100 = document.getElementById('conteudo-c100');
    const conteudoC170 = document.getElementById('conteudo-c170');
    const conteudoC190 = document.getElementById('conteudo-c190');

    //Quando o usuário seleciona o arquivo
    fileInput.addEventListener('change', function(){
        const file = fileInput.files[0];
        if(!file) return;

        //Verifica se o Arquivo é um .txt
        if (file.type !== 'text/plain'){
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
                const blocoC170 = linhas.filter (linha => linha.includes('|C170|'))

                ////Filtra apenas linhas |C190| que existem:
                const blocoC190 = linhas.filter (linha => linha.includes('|C190|'))

                //CONTA quantas linhas C100 existem
                const quantidadeC100 = blocoC100.length;
                const quantidadeC170 = blocoC170.length;
                const quantidadeC190 = blocoC190.length;


                //Mostra a quantidade de blocos C100:
                const tituloC100 = document.createElement('h3');
                tituloC100.textContent = `Blocos C100 encontrados: ${quantidadeC100}`;
                tituloC100.classList.add('C100-content')
                ////"prepend -- Adiciona no começo do elemento PAI"
                document.getElementById('coluna-c100').prepend(tituloC100);

                //Mostra a quantidade de blocos C170:
                const tituloC170 = document.createElement('h3');
                tituloC170.textContent = `Blocos C170 encontrados: ${quantidadeC170}`;
                tituloC170.classList.add('C170-content');
                //"prepend -- Adiciona no começo do elemento PAI"
                document.getElementById('coluna-c170').prepend(tituloC170);

                //Mostra a quantidadde de blocos C190:
                const tituloC190 = document.createElement('h3');
                tituloC190.textContent = `Blocos C190 encontrados: ${quantidadeC190}`;
                tituloC190.classList.add('C190-content');
                //prepend -- Adiciona no começo do elemento PAI
                document.getElementById('coluna-c190').prepend(tituloC190);

                //Exibe o conteúdo dos blocos em suas respectivas colunas:
                conteudoC100.textContent = blocoC100.join('\n');
                conteudoC170.textContent = blocoC170.join('\n');
                conteudoC190.textContent = blocoC190.join('\n');
                //Explicando join:
                //array.join(separador) - sua sintaxe
                //array - conjunto de elementos
                //join - oq fica entre cada elemento - no caso acima é uma quebra de linha '\n'.

                //Percorr cada linha do Arquivo
                linhas.forEach((linha,index) => {
                    console.log("verificando linha: ", index + 1);
                    //Se a linha contém um bloco C100, atualiza a referência
                    if (linha.includes('|C100|')) {
                        ultimoC100 = linha; // Guarda o último C100 encontrado
                    }
                    //verifica se a linha contém um bloco C170 ou C190
                    if (linha.includes('|C170|') || linha.includes('|C190|')){
                        
                        //verifica se existe um C100 antes se não causa um erro
                        if (!ultimoC100){
                            erros.push(`Erro na linha ${index + 1}: ${linha.trim()} - sem  C100 anterior.`);
                        }
                    }
                });
                //Exibe erros na tela (na area-erros no html)
                const areaErros = document.getElementById('area-erros');
                areaErros.textContent = erros.length > 0
                ? erros.join('\n') // mostra erros, linha por linha
                : 'Nenhum Erro encontrado'; // se não houver erros mostra a mensagem
        };
        reader.readAsText(file);
    })