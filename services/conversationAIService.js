import sortearEspecialidade from "../utils/sortearEspecialidade.js";
import databaseService from './databaseService.js';
import azureOpenAIService from '../services/azureOpenAIService.js';

class ConversationAIService {

    /**
        * Valida sessionId e retorna dados da sessão
        */
    async _validarSessao(sessionId) {
        if (!sessionId || typeof sessionId !== 'string') {
            throw new Error('SessionId inválido');
        }

        const dadosExistentes = await databaseService.obterSessao(sessionId);
        if (!dadosExistentes) {
            throw new Error(`Sessão não encontrada: ${sessionId}`);
        }

        return dadosExistentes;
    }

    async initChat(sessionId, userName) {
        try {
            console.log('🚀 Iniciando nova sessão:', sessionId);

            const especialidade = sortearEspecialidade.sortearEspecialidade();
            const resposta = await azureOpenAIService.initChat(especialidade);

            // Salvar sessão completa no banco de dados se temos sessionId
            if (sessionId) {
                console.log('💾 Criando sessão inicial...');
                await databaseService.criarSessao(sessionId, {
                    nome_aluno: userName,
                    estudo_de_caso: resposta.resposta,
                    especialidade: especialidade,
                    tokens_utilizados: resposta.tokens_utilizados
                });
                console.log('✅ Sessão inicial criada com sucesso');
            }
            return {
                resposta: resposta.respostaHtml,
                nomeAluno: userName,
                historico: resposta.historico,
                tokens_utilizados: resposta.tokens_utilizados
            };

        } catch (error) {
            console.error('Erro ao iniciar chat:', error);
            throw new Error('Falha ao iniciar chat: ' + error.message);
        }
    }

    /**
     * Gera nova pergunta e adiciona ao histórico
     */
    async gerarPergunta(sessionId) {
        try {
            console.log('📝 Gerando pergunta para:', sessionId);

            const dadosExistentes = await this._validarSessao(sessionId);
            const casoClinico = dadosExistentes.estudo_de_caso;
            const historicoExistente = dadosExistentes?.historico || [];

            const conteudoResposta = await azureOpenAIService.gerarPergunta(casoClinico, historicoExistente);

            const historicoAtualizado = await databaseService.adicionarPerguntaHistorico(
                sessionId,
                conteudoResposta.resposta,
                conteudoResposta.tokens_utilizados || 0
            );

            return {
                resposta: conteudoResposta.resposta,
                historicoAtualizado: historicoAtualizado,
                tokens_utilizados: conteudoResposta.tokens_utilizados
            };

        } catch (error) {
            console.error('❌ Erro ao gerar pergunta:', error);
            throw new Error('Falha ao gerar pergunta: ' + error.message);
        }
    }


    /**
   * Gera nova pergunta e adiciona ao histórico
   */
    async gerarFeedbackFinal(sessionId) {
        try {
            console.log('📝 Gerando feedback final para:', sessionId);

            const dadosExistentes = await this._validarSessao(sessionId);
            const casoClinico = dadosExistentes.estudo_de_caso;
            const historicoExistente = dadosExistentes?.historico || [];

            const conteudoResposta = await azureOpenAIService.gerarFeedbackFinal(casoClinico, historicoExistente);

            await databaseService.atualizarFeedbackFinal(
                sessionId,
                conteudoResposta.resposta,
                conteudoResposta.tokens_utilizados || 0
            );

            return {
                resposta: conteudoResposta.respostaHtml,
                tokens_utilizados: conteudoResposta.tokens_utilizados
            };

        } catch (error) {
            console.error('❌ Erro ao gerar pergunta:', error);
            throw new Error('Falha ao gerar pergunta: ' + error.message);
        }
    }

    /**
     * Corrige resposta do aluno e atualiza APENAS o último registro
     */
    async correcaoResposta(sessionId, respostaQuestion) {
        try {
            console.log('💬 Processando correção para:', sessionId);

            const dadosExistentes = await this._validarSessao(sessionId);
            const historicoExistente = dadosExistentes.historico;
            if (historicoExistente.length === 0) {
                throw new Error('Nenhuma pergunta encontrada para corrigir');
            }

            const casoClinico = dadosExistentes.estudo_de_caso;
            const ultimaPergunta = historicoExistente[historicoExistente.length - 1]?.pergunta;

            if (!ultimaPergunta) {
                throw new Error('Última pergunta não encontrada');
            }

            const verificacao = await azureOpenAIService.verificarSeCorreta(casoClinico, ultimaPergunta, respostaQuestion);

            let feedback;
            let tokensUsados = verificacao.tokens_utilizados || 0;

            // Se incorreta e precisa feedback, gerar via IA
            if (!verificacao.correto && this._precisaFeedback(historicoExistente)) {
                const resultadoFeedback = await azureOpenAIService.gerarFeedback(casoClinico, historicoExistente);
                feedback = resultadoFeedback.feedback;
                tokensUsados += resultadoFeedback.tokens_utilizados || 0;
            } else {
                feedback = verificacao.correto ? "A resposta está correta!" : "A resposta está incorreta!";
            }

            await databaseService.atualizarUltimoRegistro(
                sessionId,
                respostaQuestion,
                feedback,
                tokensUsados
            );

            console.log('✅ Correção processada e histórico atualizado');
            console.log('✅ Feedback gerado:', feedback);

            return {
                resposta: feedback,
                historicoLength: historicoExistente.length,
                tokens_utilizados: tokensUsados
            };

        } catch (error) {
            console.error('❌ Erro na correção:', error);
            throw new Error('Falha na correção: ' + error.message);
        }
    }

    /**
        * Determina se precisa gerar feedback via IA baseado no histórico
        */
    _precisaFeedback(historico) {
        if (historico.length <= 1) return false;

        const penultimaResposta = historico[historico.length - 2]?.feedback;
        return penultimaResposta !== "A resposta está correta!";
    }

    /**
     * Buscar sessão completa (wrapper para compatibilidade)
     */
    async buscarSessaoCompleta(sessionId) {
        return await this._validarSessao(sessionId);
    }

    /**
     * Obter histórico completo da conversa
     */
    async obterHistorico(sessionId) {
        try {
            const dadosSessao = await this._validarSessao(sessionId);

            return {
                historico: dadosSessao.historico || [],
                total: dadosSessao.historico?.length || 0,
                especialidade: dadosSessao.especialidade,
                nomeAluno: dadosSessao.nome_aluno,
                estudoDeCaso: dadosSessao.estudo_de_caso,
                feedbackFinal: dadosSessao.feedback_final,
                tokensUtilizados: dadosSessao.tokens_utilizados || 0
            };

        } catch (error) {
            console.error('❌ Erro ao obter histórico:', error);
            return {
                historico: [],
                total: 0,
                especialidade: null
            };
        }
    }

}

export default new ConversationAIService();