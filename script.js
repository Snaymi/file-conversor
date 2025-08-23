//Cria o Web Worker da Aspose
const AsposePdfWebWorker = new Worker("./aspose/AsposePDFforJS.js");

//Lida com erros do Worker
AsposePdfWebWorker.onerror = evt => {
  document.getElementById('area-erros').textContent = `Erro: ${evt.message}`;

};

//Lida com Mensagens do Worker
AsposePdfWebWorker.onmessage = evt => {
  if (evt.data === 'ready') {
    console.log ('Aspose PDF worker Carregado')
    return;
  }
  const { json } = evt.data;
  if (json.errorCode === 0) {
    const textoExtraido = json.text;
    processarTexto(textoExtraido); //Função que vou criar
    console.log(textoExtraido);
  } else {
    document.getElementById('area-erros').textContent = `Erro ${json.errorText}`;
  }
};
//Captura o arquivo PDF
document.getElementById('file-input').addEventListener('change', e => {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = event => {
    AsposePdfWebWorker.postMessage ({
      operation: 'getText', //pensar se compensa usar "getTable"
      params:[event.target.result]
    }, [event.target.result]);
  }
  reader.readAsArrayBuffer(file);
}
)