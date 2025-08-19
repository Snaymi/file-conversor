    //Seleciona o iput do arquivo
    const fileInput = document.getElementById('file-input');

    //Seleciona a area onde o conteúdo será exibido.
    const processArea = document.getElementById('process-area');
    const emptyState = document.getElementById('empty-state');

    //Quando o usuário seleciona o arquivo
    fileInput.addEventListener('change', function(){
        const file = fileInput.files[0]
        if(!file) return;

        const reader = new
    })