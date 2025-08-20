// ClinMind Chat Interface JavaScript
// Extracted from chat.html for better code organization

// DOM elements
const chatBody = document.getElementById('chat-body');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// Session data storage
let sessionData = {
    sessionId: null,
    especialidade: null,
    casoClinico: null,
    nomeAluno: null
};

// Função para rolar o chat para a última mensagem
const scrollToBottom = () => {
    chatBody.scrollTop = chatBody.scrollHeight;
};

// Função para adicionar uma nova mensagem
const addMessage = () => {
    const messageText = messageInput.value.trim();

    if (messageText === '') {
        return; // Não envia mensagens vazias
    }

    // Cria o HTML para a nova mensagem enviada
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'sent');
    messageElement.innerHTML = `
        <div class="message-bubble">
            <p class="m-0">${messageText}</p>
        </div>
        <img src="https://i.pravatar.cc/150?u=user1" alt="Avatar" class="message-avatar">
    `;

    // Adiciona a nova mensagem ao corpo do chat
    chatBody.appendChild(messageElement);

    // Limpa o campo de input
    messageInput.value = '';

    sendResponse(messageText);

    // Foca no input novamente
    messageInput.focus();

    // Rola para o final
    scrollToBottom();
};

// Função para adicionar mensagem do sistema/bot
const addBotMessage = (messageText, isHtml) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'received');

    const contentHTML = isHtml ? messageText : escapeHtml(messageText);

    messageElement.innerHTML = `
        <img src="./assets/img/logo.svg" alt="ClinMind Bot" class="message-avatar">
        <div class="message-bubble">
            <p class="m-0">${contentHTML}</p>
        </div>`;

    chatBody.appendChild(messageElement);
    scrollToBottom();
};

// Função para adicionar mensagem do usuário (para histórico)
const addUserMessage = (messageText) => {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'sent');
    messageElement.innerHTML = `
        <div class="message-bubble">
            <p class="m-0">${escapeHtml(messageText)}</p>
        </div>
        <img src="https://i.pravatar.cc/150?u=user1" alt="Avatar" class="message-avatar">
    `;

    chatBody.appendChild(messageElement);
    scrollToBottom();
};

// Função para inicializar o chat
const inicializarChat = async () => {
    // Limpar mensagens de exemplo
    chatBody.innerHTML = '';

    // 1. Mensagem de boas-vindas
    addBotMessage('Olá! Vamos praticar um pouco? Já estou gerando sua simulação... 🏥');

    // 3. Aguardar 3 segundos e gerar o caso clínico
    await delay(1500);
    const casoGerado = await gerarCasoClinico();

    // 4. Se o caso foi gerado com sucesso, continuar
    if (casoGerado) {
        await delay(3000);
        addBotMessage('Agora vou preparar uma pergunta sobre este caso... 😊​');

        // 5. Aguardar 3 segundos e gerar pergunta
        await delay(2000);
        await gerarPergunta();
    }
};

// Função auxiliar para criar delays
const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

//função para enviar a resposta e pegar o feedbak
const sendResponse = async (resposta) => {
    // Fazer chamada para a API
    const response = await fetch('/api/ia/feedback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            sessionId: sessionData.sessionId,
            resposta: resposta
        })
    });

    if (response.ok) {
        const data = await response.json();
        addBotMessage(data.feedback, true);

        await delay(3000);

        if (data.historicoLength < 11) {
            if (data.historicoLength == 10)
                addBotMessage('Vamos para a última pergunta...🤩​​');
            else
                addBotMessage('Vamos para a próxima pergunta... ​🤓');

            // 5. Aguardar 3 segundos e gerar pergunta
            await delay(2000);
            await gerarPergunta();

        } else {
            addBotMessage('Parabéns! Você completou todas as perguntas deste caso clínico. 🎉​');
            await delay(3000);
            addBotMessage('Vou gerar um PDF com um resumo da nossa conversa e um feedback geral!😉​');
            await delay(3000);
            await gerarFeedbackFinal();
        }

    } else {
        addBotMessage('Erro ao enviar feedback. Tente novamente.', true);
    }
};

// Função para gerar caso clínico (conectar com a API)
const gerarCasoClinico = async () => {
    addBotMessage('Preparando seu caso clínico personalizado...');

    try {
        // Fazer chamada para a API
        const response = await fetch('/api/ia/iniciar-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();

            // Armazenar dados da sessão
            sessionData = {
                sessionId: data.sessionId,
                casoClinico: data.casoClinico,
                nomeAluno: data.nomeAluno
            };

            addBotMessage(data.casoClinico, true);
            return true;
        } else {
            addBotMessage('Ops! Tive um problema para gerar o caso clínico. Tente novamente.');
            return false;
        }
    } catch (error) {
        console.error('Erro ao gerar caso clínico:', error);
        addBotMessage('Erro de conexão. Verifique sua internet e tente novamente.');
        return false;
    }
};

// Função para gerar pergunta (conectar com a API)
const gerarPergunta = async () => {
    const indicador = mostrarIndicadorDigitacao();
    try {
        // Verificar se temos os dados necessários
        if (!sessionData.sessionId) {
            removerIndicadorDigitacao(indicador);
            addBotMessage('Erro: Sessão não encontrada. Recarregue a página.');
            return false;
        }

        // Fazer chamada para a API
        const response = await fetch('/api/ia/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                sessionId: sessionData.sessionId
            })
        });

        // Remover indicador antes de mostrar resposta
        removerIndicadorDigitacao(indicador);

        if (response.ok) {
            const data = await response.json();
            addBotMessage(data.pergunta, true);

            return true;
        } else {
            const errorData = await response.json();
            console.error('Erro da API:', errorData);
            addBotMessage('Ops! Tive um problema para gerar a pergunta 😥. Tente novamente.');
            return false;
        }
    } catch (error) {
        removerIndicadorDigitacao(indicador);
        console.error('Erro ao gerar pergunta:', error);
        addBotMessage('Erro de conexão. Verifique sua internet e tente novamente.');
        return false;
    }
};

// Função para gerar feedback final (conectar com a API)
const gerarFeedbackFinal = async () => {
    const indicador = mostrarIndicadorDigitacao();
    try {
        // Verificar se temos os dados necessários
        if (!sessionData.sessionId) {
            removerIndicadorDigitacao(indicador);
            addBotMessage('Erro: Sessão não encontrada. Recarregue a página.');
            return false;
        }

        // Fazer chamada para a API de feedback final
        const response = await fetch('/api/ia/feedback-final', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                sessionId: sessionData.sessionId
            })
        });

        // Remover indicador antes de mostrar feedback
        removerIndicadorDigitacao(indicador);

        if (response.ok) {
            const data = await response.json();

            addBotMessage('Aqui esta o seu feedback final...');
            addBotMessage(data.resposta, true);

            // Aguardar um momento e gerar relatório automaticamente
            await delay(2000);
            addBotMessage('📄 Gerando seu relatório completo para impressão...');

            await delay(2000);
            await imprimirRelatorioCompleto();

            return true;
        } else {
            const errorData = await response.json();
            console.error('Erro da API:', errorData);
            addBotMessage('Ops! Tive um problema para gerar o feedback final 😥. Tente novamente.');
            return false;
        }
    } catch (error) {
        removerIndicadorDigitacao(indicador);
        console.error('Erro ao gerar feedback final:', error);
        addBotMessage('Erro de conexão. Verifique sua internet e tente novamente.');
        return false;
    }
};
// Função para escapar HTML se necessário
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// Função para recuperar conversa anterior (se existir)
const recuperarConversaAnterior = async () => {
    try {
        const response = await fetch('/api/ia/history', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();

            if (data.total > 0) {
                // Armazenar dados da sessão
                sessionData = {
                    sessionId: data.sessionId,
                    especialidade: data.especialidade,
                    casoClinico: data.estudoDeCaso,
                    nomeAluno: data.nomeAluno
                };

                // Reconstruir conversa
                addBotMessage('Bem-vindo de volta! Recuperando sua conversa anterior...');

                setTimeout(() => {
                    // Mostrar histórico
                    data.historico.forEach((msg, index) => {
                        setTimeout(() => {
                            if (msg.role === 'assistant') {
                                addBotMessage(msg.content, true);
                            } else if (msg.role === 'user') {
                                addUserMessage(msg.content);
                            }
                        }, index * 500); // Delay entre mensagens
                    });
                }, 1000);

                return true; // Conversa recuperada
            }
        }
    } catch (error) {
        console.error('Erro ao recuperar conversa:', error);
    }

    return false; // Nenhuma conversa anterior
};

// Função para mostrar indicador de digitação
const mostrarIndicadorDigitacao = () => {
    const indicador = document.createElement('div');
    indicador.classList.add('message', 'received', 'typing-indicator');
    indicador.innerHTML = `
        <img src="./assets/img/logo.svg" alt="ClinMind Bot" class="message-avatar">
        <div class="message-bubble">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatBody.appendChild(indicador);
    scrollToBottom();
    return indicador;
};

// Função para remover indicador de digitação
const removerIndicadorDigitacao = (indicador) => {
    if (indicador && indicador.parentNode) {
        indicador.parentNode.removeChild(indicador);
    }
};

// Função para imprimir relatório completo da conversa
const imprimirRelatorioCompleto = async () => {
    try {
        // Buscar dados completos da sessão
        const response = await fetch('/api/ia/history', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            addBotMessage('❌ Erro ao buscar dados para o relatório. Tente novamente.');
            return;
        }

        const dados = await response.json();

        // Debug para verificar se o feedback geral está presente
        console.log('📊 Dados para relatório:', dados);
        console.log('📝 Feedback geral encontrado:', dados.feedbackFinal ? 'SIM' : 'NÃO');

        // Debug visual no chat (apenas para desenvolvimento)
        if (!dados.feedbackFinal && !dados.feedback_geral) {
            addBotMessage(`
                <div style="padding: 8px; background: rgba(255, 193, 7, 0.1); border-radius: 6px; border-left: 3px solid #ffc107; margin: 5px 0; font-size: 12px;">
                    🔧 <strong>Debug:</strong> Feedback geral não encontrado nos dados da API
                    <br><small>Histórico: ${dados.total || 0} perguntas | FeedbackFinal: ${dados.feedbackFinal ? 'PRESENTE' : 'AUSENTE'}</small>
                </div>
            `, true);
        }

        // Tentar criar janela de impressão
        let janelaImpressao;
        try {
            janelaImpressao = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        } catch (e) {
            console.error('Erro ao abrir popup:', e);
        }

        // Verificar se a janela foi criada ou se foi bloqueada
        if (!janelaImpressao || janelaImpressao.closed || typeof janelaImpressao.closed == 'undefined') {
            // Popup foi bloqueado - usar método alternativo
            addBotMessage(`
                <div style="padding: 10px; background: rgba(255, 193, 7, 0.1); border-radius: 8px; border-left: 4px solid #ffc107; margin: 10px 0;">
                    ⚠️ <strong>Popup foi bloqueado pelo seu navegador</strong>
                    <br><br>
                    <div class="chat-buttons-container">
                        <button onclick="baixarRelatorioHTML()" class="chat-action-button">
                            📄 Baixar Relatório
                        </button>
                        <button onclick="copiarRelatorioHTML()" class="chat-action-button success">
                            📋 Copiar HTML
                        </button>
                    </div>
                    <small style="color: #6c757d;">� <strong>Dica:</strong> Para habilitar popups, clique no ícone do bloqueador na barra de endereços</small>
                </div>
            `, true);

            // Armazenar dados para uso posterior
            window.dadosRelatorio = dados;
            return;
        }

        const htmlRelatorio = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Relatório de Simulação - ClinMind</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #fff;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 3px solid #007bff;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        color: #007bff;
                        margin-bottom: 10px;
                    }
                    .info-box {
                        background-color: #f8f9fa;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        border-left: 4px solid #007bff;
                    }
                    .caso-clinico {
                        background-color: #e8f4fd;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 25px;
                        border: 1px solid #b8daff;
                    }
                    .pergunta-resposta {
                        margin-bottom: 25px;
                        padding: 15px;
                        border-radius: 8px;
                        border: 1px solid #dee2e6;
                    }
                    .pergunta {
                        background-color: #fff3cd;
                        padding: 12px;
                        border-radius: 6px;
                        margin-bottom: 10px;
                        border-left: 4px solid #ffc107;
                    }
                    .resposta {
                        background-color: #d1ecf1;
                        padding: 12px;
                        border-radius: 6px;
                        margin-bottom: 10px;
                        border-left: 4px solid #17a2b8;
                    }
                    .feedback {
                        background-color: #d4edda;
                        padding: 12px;
                        border-radius: 6px;
                        border-left: 4px solid #28a745;
                    }
                    .feedback-final {
                        background-color: #f8d7da;
                        padding: 20px;
                        border-radius: 8px;
                        margin-top: 30px;
                        border: 1px solid #f5c6cb;
                    }
                    .section-title {
                        color: #007bff;
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        padding-bottom: 5px;
                        border-bottom: 2px solid #007bff;
                    }
                    .metadata {
                        font-size: 12px;
                        color: #6c757d;
                        text-align: right;
                        margin-top: 20px;
                    }
                    @media print {
                        body { margin: 0; padding: 15px; }
                        .no-print { display: none; }
                    }
                    .print-button {
                        background-color: #007bff;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin: 20px 0;
                        font-size: 16px;
                    }
                    .print-button:hover {
                        background-color: #0056b3;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">🏥 ClinMind</div>
                    <h1>Relatório de Simulação Clínica</h1>
                    <p>Sistema de Treinamento em Enfermagem</p>
                </div>

                <div class="info-box">
                    <strong>👤 Aluno:</strong> ${dados.nomeAluno || 'Não informado'}<br>
                    <strong>🏥 Especialidade:</strong> ${dados.especialidade || 'Não informado'}<br>
                    <strong>📅 Data:</strong> ${new Date().toLocaleDateString('pt-BR')}<br>
                    <strong>📊 Total de Perguntas:</strong> ${dados.total || 0}<br>
                    <strong>🔢 Tokens Utilizados:</strong> ${dados.tokensUtilizados || 0}
                </div>

                <button class="print-button no-print" onclick="window.print()">🖨️ Imprimir Relatório</button>

                <div class="section-title">📋 Caso Clínico</div>
                <div class="caso-clinico">
                    ${dados.estudoDeCaso || 'Caso clínico não disponível'}
                </div>

                <div class="section-title">💬 Histórico da Conversa</div>
                ${gerarHistoricoHtml(dados.historico || [])}

                ${dados.feedbackFinal || dados.feedback_geral ? `
                <div class="section-title">📝 Feedback Final</div>
                <div class="feedback-final">
                    ${dados.feedbackFinal || 'Feedback geral não disponível'}
                </div>
                ` : `
                <div class="section-title">📝 Feedback Geral</div>
                <div class="feedback-final" style="color: #6c757d; font-style: italic;">
                    ⚠️ Feedback geral ainda não foi gerado para esta sessão.
                    <br><br>
                    <small>O feedback geral é gerado automaticamente após completar todas as 10 perguntas da simulação.</small>
                </div>
                `}

                <div class="metadata">
                    Relatório gerado automaticamente pelo ClinMind em ${new Date().toLocaleString('pt-BR')}<br>
                    © ${new Date().getFullYear()} ClinMind - Sistema de Treinamento em Enfermagem
                </div>
            </body>
            </html>
        `;

        // Verificar se a janela ainda está aberta e acessível
        try {
            if (janelaImpressao && !janelaImpressao.closed) {
                janelaImpressao.document.write(htmlRelatorio);
                janelaImpressao.document.close();
                janelaImpressao.focus();
                addBotMessage('✅ Relatório aberto em nova janela! Você pode visualizar e imprimir quando quiser.');
            } else {
                throw new Error('Janela foi fechada ou não está acessível');
            }
        } catch (writeError) {
            console.error('Erro ao escrever no popup:', writeError);
            // Método alternativo se não conseguir escrever na janela
            addBotMessage(`
                <div style="padding: 10px; background: rgba(220, 53, 69, 0.1); border-radius: 8px; border-left: 4px solid #dc3545; margin: 10px 0;">
                    ⚠️ <strong>Erro ao gerar popup</strong>
                    <br>Usando métodos alternativos:
                    <br><br>
                    <div class="chat-buttons-container">
                        <button onclick="baixarRelatorioHTML()" class="chat-action-button">
                            📄 Baixar Relatório
                        </button>
                        <button onclick="copiarRelatorioHTML()" class="chat-action-button success">
                            📋 Copiar HTML
                        </button>
                    </div>
                </div>
            `, true);

            // Armazenar dados para uso posterior
            window.dadosRelatorio = dados;
            window.htmlRelatorio = htmlRelatorio;
        }

    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        addBotMessage(`
            <div style="padding: 10px; background: rgba(220, 53, 69, 0.1); border-radius: 8px; border-left: 4px solid #dc3545; margin: 10px 0;">
                ❌ <strong>Erro ao gerar relatório</strong>
                <br>Métodos alternativos disponíveis:
                <br><br>
                <div class="chat-buttons-container">
                    <button onclick="baixarRelatorioHTML()" class="chat-action-button">
                        📄 Baixar Relatório
                    </button>
                </div>
                <small style="color: #6c757d;">Se o problema persistir, tente permitir popups para este site.</small>
            </div>
        `, true);
    }
};

// Função auxiliar para gerar HTML do histórico
const gerarHistoricoHtml = (historico) => {
    if (!historico || historico.length === 0) {
        return '<p>Nenhuma conversa registrada.</p>';
    }

    return historico.map((item, index) => {
        return `
            <div class="pergunta-resposta">
                <div style="font-weight: bold; color: #007bff; margin-bottom: 15px;">
                    Questão ${index + 1}
                </div>
                
                ${item.pergunta ? `
                <div class="pergunta">
                    <strong>❓ Pergunta:</strong><br>
                    ${item.pergunta}
                </div>
                ` : ''}
                
                ${item.resposta ? `
                <div class="resposta">
                    <strong>💭 Sua Resposta:</strong><br>
                    ${item.resposta}
                </div>
                ` : ''}
                
                ${item.feedback ? `
                <div class="feedback">
                    <strong>✅ Feedback:</strong><br>
                    ${item.feedback}
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
};

// Função para baixar relatório como arquivo HTML
const baixarRelatorioHTML = async () => {
    try {
        let dados = window.dadosRelatorio;
        let htmlContent = window.htmlRelatorio;

        // Se não temos os dados armazenados, buscar novamente
        if (!dados) {
            const response = await fetch('/api/ia/history', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                dados = await response.json();
            } else {
                addBotMessage('❌ Erro ao buscar dados para download.');
                return;
            }
        }

        // Se não temos o HTML montado, gerar novamente
        if (!htmlContent) {
            htmlContent = gerarHTMLRelatorio(dados);
        }

        // Debug para verificar se o feedback final está sendo incluído
        console.log('📊 Dados para download:', dados);
        console.log('📝 Feedback geral no download:', dados.feedbackFinal || 'NÃO ENCONTRADO');

        // Criar blob e download
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ClinMind_Relatorio_${dados.nomeAluno || 'Usuario'}_${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        addBotMessage('✅ Relatório baixado com sucesso! Abra o arquivo no seu navegador para visualizar e imprimir.');

    } catch (error) {
        console.error('Erro ao baixar relatório:', error);
        addBotMessage('❌ Erro ao baixar relatório. Tente novamente.');
    }
};

// Função para copiar HTML do relatório
const copiarRelatorioHTML = async () => {
    try {
        let dados = window.dadosRelatorio;
        let htmlContent = window.htmlRelatorio;

        // Se não temos os dados, buscar novamente
        if (!dados) {
            const response = await fetch('/api/ia/history', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                dados = await response.json();
            } else {
                addBotMessage('❌ Erro ao buscar dados para cópia.');
                return;
            }
        }

        // Se não temos o HTML, gerar
        if (!htmlContent) {
            htmlContent = gerarHTMLRelatorio(dados);
        }

        // Copiar para clipboard
        await navigator.clipboard.writeText(htmlContent);
        addBotMessage('✅ HTML do relatório copiado! Cole em um arquivo .html e abra no navegador.');

    } catch (error) {
        console.error('Erro ao copiar relatório:', error);
        addBotMessage('❌ Erro ao copiar. Seu navegador pode não suportar esta função.');
    }
};

// Função para gerar HTML do relatório (reutilizável)
const gerarHTMLRelatorio = (dados) => {
    return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Relatório de Simulação - ClinMind</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #fff;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #007bff;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 24px;
                    font-weight: bold;
                    color: #007bff;
                    margin-bottom: 10px;
                }
                .info-box {
                    background-color: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    border-left: 4px solid #007bff;
                }
                .caso-clinico {
                    background-color: #e8f4fd;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                    border: 1px solid #b8daff;
                }
                .pergunta-resposta {
                    margin-bottom: 25px;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #dee2e6;
                }
                .pergunta {
                    background-color: #fff3cd;
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 10px;
                    border-left: 4px solid #ffc107;
                }
                .resposta {
                    background-color: #d1ecf1;
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 10px;
                    border-left: 4px solid #17a2b8;
                }
                .feedback {
                    background-color: #d4edda;
                    padding: 12px;
                    border-radius: 6px;
                    border-left: 4px solid #28a745;
                }
                .feedback-final {
                    background-color: #f8d7da;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 30px;
                    border: 1px solid #f5c6cb;
                }
                .section-title {
                    color: #007bff;
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 15px;
                    padding-bottom: 5px;
                    border-bottom: 2px solid #007bff;
                }
                .metadata {
                    font-size: 12px;
                    color: #6c757d;
                    text-align: right;
                    margin-top: 20px;
                }
                @media print {
                    body { margin: 0; padding: 15px; }
                    .no-print { display: none; }
                }
                .print-button {
                    background-color: #007bff;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 20px 0;
                    font-size: 16px;
                }
                .print-button:hover {
                    background-color: #0056b3;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🏥 ClinMind</div>
                <h1>Relatório de Simulação Clínica</h1>
                <p>Sistema de Treinamento em Enfermagem</p>
            </div>

            <div class="info-box">
                <strong>👤 Aluno:</strong> ${dados.nomeAluno || 'Não informado'}<br>
                <strong>🏥 Especialidade:</strong> ${dados.especialidade || 'Não informado'}<br>
                <strong>📅 Data:</strong> ${new Date().toLocaleDateString('pt-BR')}<br>
                <strong>📊 Total de Perguntas:</strong> ${dados.total || 0}<br>
                <strong>🔢 Tokens Utilizados:</strong> ${dados.tokensUtilizados || 0}
            </div>

            <button class="print-button no-print" onclick="window.print()">🖨️ Imprimir Relatório</button>

            <div class="section-title">📋 Caso Clínico</div>
            <div class="caso-clinico">
                ${dados.estudoDeCaso || 'Caso clínico não disponível'}
            </div>

            <div class="section-title">💬 Histórico da Conversa</div>
            ${gerarHistoricoHtml(dados.historico || [])}

            ${dados.feedbackFinal || dados.feedbackGeral ? `
            <div class="section-title">📝 Feedback Geral</div>
            <div class="feedback-final">
                ${dados.feedbackFinal || dados.feedbackGeral || 'Feedback geral não disponível'}
            </div>
            ` : `
            <div class="section-title">📝 Feedback Geral</div>
            <div class="feedback-final" style="color: #6c757d; font-style: italic;">
                ⚠️ Feedback geral ainda não foi gerado para esta sessão.
                <br><br>
                <small>O feedback geral é gerado automaticamente após completar todas as 10 perguntas da simulação.</small>
            </div>
            `}

            <div class="metadata">
                Relatório gerado automaticamente pelo ClinMind em ${new Date().toLocaleString('pt-BR')}<br>
                © ${new Date().getFullYear()} ClinMind - Sistema de Treinamento em Enfermagem
            </div>
        </body>
        </html>
    `;
};

// Event listeners
const initializeEventListeners = () => {
    // Evento de clique no botão de enviar
    sendButton.addEventListener('click', addMessage);

    // Evento de pressionar "Enter" no campo de input
    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Impede a quebra de linha no input
            addMessage();
        }
    });
};

// Inicializar o chat quando a página carregar
window.addEventListener('DOMContentLoaded', async () => {
    // Inicializar event listeners
    initializeEventListeners();

    // Primeiro tentar recuperar conversa anterior
    const conversaRecuperada = await recuperarConversaAnterior();

    // Se não houver conversa anterior, iniciar nova
    if (!conversaRecuperada) {
        inicializarChat();
    }
});
