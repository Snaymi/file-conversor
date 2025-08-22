const  {app, BrowserWindow} = require('electron');
//constante - nunca vai mudar
//app - gera um ciclo de inicar e fechar
//BrowserWindow - Cria uma janela para exibir meu Html
//require('electron') - importa o módulo de electron

const path = require('path');
//importa o módulo NATIVO chamado path
//Monta os arquivos de forma Segura
//Módulo path - ajuda a manipular caminhos dos arquivos
//evita erros dos separadores de pastas.

function createWindow (){
    const win = new BrowserWindow({
        width: 800, //largura da nova janela
        height: 600, //altura da nova janela

        //configurações que afetam seu comportamento.
        webPreferences: {
            nodeIntegration: true, //permite usar recursos do Node.js dentro do HTML
            contextIsolation:false 
            //Permite usar Node.JS no front end, Ideal pra protótipos e apps simples 
        }
    })
    win.loadFile(path.join(__dirname, 'index.html'));
}
app.whenReady().then(createWindow); 