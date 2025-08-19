    //Seleciona o iput do arquivo
    const fileInput = document.getElementById('file-input');

    //Seleciona a area onde o conteúdo será exibido.
    const processArea = document.getElementById('process-area');
    const emptyState = document.getElementById('empty-state');

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

                //Limpa a área para mostrar um novo conteúdo:
                processArea.innerHTML = '';

                //Divide o conteúdo em por linhas
                const linhas = content.split('\n');

                //Filtra apenas linhas |C100| que existem:
                const blocoC100 = linhas.filter(linha => linha.includes('|C100|'));

                //Filtra apenas linhas |C170| que existem:
                const blocoC170 = linhas.filter (linha => linha.includes('|C170|'))

                //CONTA quantas linhas C100 existem
                const quantidadeC100 = blocoC100.length;
                const quantidadeC170 = blocoC170.length;


                //Mostra a quantidade de blocos C100:
                const tituloC100 = document.createElement('h3');
                tituloC100.textContent = `Blocos C100 encontrados: ${quantidadeC100}`;
                tituloC100.classList.add('C100-content')
                processArea.appendChild(tituloC100);

                //Mostra a quantidade de blocos C170:
                const tituloC170 = document.createElement('h3');
                tituloC170.textContent = `Blocos C170 encontrados: ${quantidadeC170}`;
                tituloC170.classList.add('C170-content')
                processArea.appendChild(tituloC170);


                //Mostra o conteúdo completo do arquivo:
                const output = document.createElement('pre');
                output.textContent = content;
                output.classList.add('file-content')
                processArea.appendChild(output);

                //insere o conteúdo do arquivo dentro:
                output.textContent = content;

                //Adiciona um área de processamento
                processArea.append(output);
        };
        reader.readAsText(file)
    })