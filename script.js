    //Seleciona o iput do arquivo
    const fileInput = document.getElementById('file-input');

    //Seleciona a area onde o conteúdo será exibido.
    const processArea = document.getElementById('process-area');
    const emptyState = document.getElementById('empty-state');

    //Quando o usuário seleciona o arquivo
    fileInput.addEventListener('change', function(){
        const file = fileInput.files[0]
        if(!file) return;

        const reader = new FileReader();

        reader.onload = function (e) {
            const content = e.target.result;

                //Remove o estado vazio
                emptyState.style.display = 'none';

                //Cria um elemento para mostrar o conteúdo
                const output = document.createElement('pre');
                output.textContent = content;

                //Adiciona um área de processamento
                processArea.append(output);
        };
        reader.readAsText(file)
    })