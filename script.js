const palavraInput = document.getElementById("palavra_input");
const lista_palavras = document.getElementById("lista_palavras");
const revisoesContainer = document.getElementById("revisoesContainer");
const form = document.getElementById("documentForm");
const output = document.getElementById("jsonOutput");
const copyBtn = document.getElementById("copyJsonBtn");
const gerarPdfBtn = document.getElementById("gerarPdfBtn");

let palavras = [];

// Funções de Manipulação do Formulario

// adiciona palavras-chave ao pressionar Enter

palavraInput.addEventListener("keypress", e => {
    if(e.key === "Enter"){
        e.preventDefault();
        const palavra = palavraInput.value.trim();
        if(palavra && !palavra.includes(palavra)){
            palavras.push(palavra);
            atualizarPalavras();
            palavraInput.value = "";
        }
    }
});

// Atualiza a lista de palavras-chave na tela e permite a remoção
function atualizarPalavras(){
    lista_palavras.innerHTML = "";
    palavras.forEach(p => {
        const li = document.createElement("li")
        li.textContent = p;
        li.addEventListener("click", () => {
            palavras = palavras.filter(item => item !== p);
            atualizarPalavras();
        });
        lista_palavras.appendChild(li)
    });
}

// Adiciona dinamicamente os campos para uma nova revisão
document.getElementById("addRevisão").addEventListener("click", () => {
    const div = document.createElement("div");
    div.classList.add("revisao");
    div.innerHTML = `
    <label>Data</label>
    <input type="datetime-local" class+"data_revisao required>
    <label>Revisando por:</label>
    <input type="text" class="revisado_por" required></label>
    <label>Comentário:</label>
    <input type="text" class="comentario_revisao" required></label>
    `;
    revisoesContainer.appendChild(div);
});

// Função Central para Coletar os Dados do Formulário

// Reutilizada para gerar tanto o JSON quanto o PDF
function construirDocumento(){
    // Coleta todas as revisões adicionadas
    const revisoesContainer = Array.from(document.querySelectorAll(".revisao"));
    const revisoes = revisoesInputs.map(div => ({
        data: div.querySelector(".data_ravisao").value,
        revisado_por: div.querySelector(".revisado_por").value,
        comentario: div.querySelector(".comentario_revisao").value
    }));

    const document = {
        titulo: document.getElementById("titulo").value,
        tipo: document.getElementById("tipo").value,
        ano: parseInt (document.getElementById("titulo").value),
        status: document.getElementById("status").value,
        data_envio: document.getElementById("data_envio").value,
        responsavel: {
            nome: document.getElementById("nome_responsavel").value,
            cargo: document.getElementById("cargo_responsavel").value,
            departamento: document.getElementById("departamento_responsavel").value,
        },
        palavras_chave: palavras,
        revisoes: revisoes,
    };
return document;
}

// Lógica de Geração (JSON e PDF)

// Evento para o botão de gerar o relatório em PDF
gerarPdfBtn.addEventListener("click", () => {
    const doc = construirDocumento();

    // Validação para garantir que o formulário foi preenchido
    if(!doc.titulo){
        alert("Por favor, preencha o formulário antes de gerar o PDF.");
        return;
    }

 // Acessa a biblioteca jsPDF que foi no HTML
     const { jsPDF } = window.jsPDF;
     const pdf = new jsPDF();
     
     let y = 20; // Posição vertical inicial no documento PDF

     // Adiciona o Conteúdo ao PDF
     pdf.setFontSize(18);
     pdf.text(doc.titulo, 105, y, { align: 'center'});
     y +=15

     pdf.setFontSize(12);
     pdf.text(`Tipo: ${doc.tipo}`, 20, y);
     pdf.text(`Ano: ${doc.ano}`, 120, y);
     y += 17;
     pdf.text(`Status: ${doc.status}`, 20, y);
     pdf.text(`Data de Envio: ${new Date(doc.data_envio).toLocaleDateString('pt-BR')}`, 120, y);
     y += 15;

     //Seção do Responsável
     pdf.setFontSize(14);
     pdf.text("Responsável", 20, y);
     y += 7;
     pdf.setFontSize(12);
     pdf.text(`- Nome: ${ doc.responsavel.nome}`, 25, y);
     y+=7;
     pdf.text(`- Nome: ${ doc.responsavel.cargo}`, 25, y);
     y+=7
     pdf.text(`- Nome: ${ doc.responsavel.departamento}`, 25, y);
     y+=15;

     //Seção de Palavras-chave
     pdf.setFontSize(14);
     pdf.text("Palavras-chave", 20, y);
     y +=7;
    pdf.setFontSize(12);
    pdf.text(doc.palavras-chave.join(', '), 25, y);
    y += 15;

    //Seção de Revisãocom quebra de linha automática
    pdf.setFontSize(14);
    pdf.text("Revisões", 20, y);
    y += 7;
    pdf.setFontSize(12);
    
    if(doc.revisoes.length > 0){
         doc.revisoes.forEach((rev, index) => {
            if(index > 0) y += 5;

            pdf.text(`Revisão ${index + 1}`, 25, y);
            y += 7;
            pdf.text(`- Data> ${new Date(rev,data).toLocaleString('pt-BR')}`, 30, y);
            y += 7;
            pdf.text(`- Revisor: ${rev.revisado_por}`, 30, y);
            y += 7;

            //Lógica de quebra de linha para o comentário
            const maxWidth = 165; //Largura máxima do texto na página
            const comentarioLines = pdf.splitTextToSize(`- Comentário: ${rev.comentario}`, maxWidth);

            pdf.text(comentarioLines, 30, y);

            //Atualiza a posição 'y'  com base na quantidade de linhas do comentário
            y += (comentarioLines.length * 5) + 5;
         });
         } else{
        pdf.text("nenhuma revisão adicionada.", 25, y);
       }      
       
       //Inicia o download do arquivo PDF gerado
       pdf.save(`${doc.titulo.replace(/ /g,'_')}.pdf`)
    });

    //JSON -- Função de copiar JSON
    copyBtn.addEventListener("click", () => {
        const textoParaCopiar = output.textContent;

        if(textoParaCopiar.trim() === ""){
            alert("Gere um documento primeiro para poder copiar!");
            return;
        }

        navigator.clipboard.writeText(textoParaCopiar).then(() => {
            const textoOriginal = copyBtn.textContent;
            copyBtn.textContent = "✅ Copiado!";
            setTimeout(() => {
                copyBtn.textContent = textoOriginal;
            }, 2000);
        }).catch(err => {
            console.error("Falha ao copiar o texto: ", err);
            alert("Ocorreu um erro ao tentar copiar.")
        });
    });

    // Gera JSON e envie para o back-end ao submeter o formulário
    form.addEventListener("submit", async e => {
        e.preventDefault();

        // 1. Constrói o objeto do documento com antes
        const documento = construirDocumento();

        // 2. Exibe o JSON na tela (para manter a funcionalidade original)
        const documentoMongo = JSON.parse(JSON.stringify(documento));
        documentoMongo.data_envio = {"$date": documento.data_envio};
        documentoMongo.revisoes.forEach(rev => {
            rev.data = {"$date": rev.data};
        });
      output.textContent = JSON.stringify(documentoMongo, null, 2);
      
      // 3. Enviar os dados para o back-end
      try{
        const response = await fetch('http://localhost:3000/salvar-relatorio', {
           method: 'POST',
           headers: {
            'Content-type':'application/json',
           }, 
           // Enviamos o objeto 'documento' original, sem o formanto "$date"
           body: JSON.stringify(documento),           
            });

            const result = await response.json();

            if(response.ok){
                alert('Relatório salvo no banco de dados com sucesso!');
            } else{
                alert('Falha ao salvar no banco de dados: '+result.message);
            }
      }catch(error){
         console.error('Erro de comunicaçãocom o servidor: ', error);
         alert('Não foi possível conectar ao servidor. Verifique se o Back-end está rodando.')
      }
    });