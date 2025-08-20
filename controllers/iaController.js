import conversationAIService from '../services/conversationAIService.js';
import sessionService from '../services/sessionService.js';

class IAController {

    /**
     * Inicializar chat com caso clínico
     */
    async iniciarChat(req, res) {
        try {

            // Debug da sessão
            sessionService.debugSessao(req);

            // Validar sessão
            const sessao = sessionService.inicializarChatData(req);
            const sessionId = sessao.userId;
            const sessionUserName = sessao.chatData?.userName || 'Usuário Anônimo';

            // Inicializar chat com IA
            const resultado = await conversationAIService.initChat(sessionId, sessionUserName);

            res.json({
                success: true,
                sessionId: sessionId,
                casoClinico: resultado.resposta,
                tokensUtilizados: resultado.tokens_utilizados
            });

        } catch (error) {
            console.error('Erro ao iniciar chat:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Gerar pergunta para o aluno
     */
    async gerarPergunta(req, res) {
        try {
            const { sessionId } = req.body;

            console.log('📝 Gerando pergunta para sessionId:', sessionId);
            // Validação
            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    error: 'SessionId é obrigatório'
                });
            }

            // Validar sessão
            const sessao = sessionService.validarSessao(req);

            // Gerar pergunta usando o Azure OpenAI Service
            const resultado = await conversationAIService.gerarPergunta(
                sessionId
            );
    
            res.json({
                success: true,
                sessionId: sessionId,
                pergunta: resultado.resposta,
                tokensUtilizados: resultado.tokens_utilizados,
                historicoLength: resultado.historicoAtualizado?.length || 0
            });

        } catch (error) {
            console.error('❌ Erro ao processar pergunta:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao processar pergunta',
                message: error.message
            });
        }
    }

    /**
    * Gerar pergunta para o aluno
    */
    async corrigirResposta(req, res) {
        try {
            const { resposta, sessionId } = req.body;

            console.log('💬 Gerando feedback para sessionId:', sessionId);
            console.log('📝 Resposta recebida:', resposta);

            // Validação
            if (!resposta || !sessionId) {
                return res.status(400).json({
                    success: false,
                    error: 'Resposta e sessionId são obrigatórios'
                });
            }

            // Validar sessão
            const sessao = sessionService.validarSessao(req);

            // Gerar feedback usando o Azure OpenAI Service
            const resultado = await conversationAIService.correcaoResposta(
                sessionId, resposta
            );

            res.json({
                success: true,
                sessionId: sessionId,
                feedback: resultado.resposta,
                tokensUtilizados: resultado.tokens_utilizados,
                historicoLength: resultado.historicoLength || 0
            });

        } catch (error) {
            console.error('❌ Erro ao processar feedback:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao processar feedback',
                message: error.message
            });
        }
    }

     /**
    * Gerar feedback final da sessão
    */
    async gerarFeedBackFinal(req, res) {
        try {
            const { sessionId } = req.body;

            console.log('💬 Gerando feedback final para sessionId:', sessionId);

            // Validação
            if (!sessionId) {
                return res.status(400).json({
                    success: false,
                    error: 'SessionId é obrigatório'
                });
            }

            // Validar sessão
            const sessao = sessionService.validarSessao(req);

            // Gerar feedback final usando o Conversation AI Service
            const resultado = await conversationAIService.gerarFeedbackFinal(
                sessionId
            );

            res.json({
                success: true,
                sessionId: sessionId,
                resposta: resultado.resposta,
                tokensUtilizados: resultado.tokens_utilizados,
                jaExistia: resultado.jaExistia || false
            });

        } catch (error) {
            console.error('❌ Erro ao processar feedback final:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao processar feedback final',
                message: error.message
            });
        }
    }


    /**
     * Obter histórico de conversas
     */
    async obterHistorico(req, res) {
        try {
            const sessao = sessionService.validarSessao(req);
            const sessionId = sessao.userId;

            console.log('📊 Obtendo histórico para sessionId:', sessionId);

            // Buscar histórico completo do banco de dados
            const resultado = await conversationAIService.obterHistorico(sessionId);

            if (!resultado) {
                return res.json({
                    historico: [],
                    total: 0,
                    sessionId: sessionId,
                    especialidade: null,
                    nomeAluno: null,
                    estudoDeCaso: null
                });
            }

            res.json({
                sessionId: sessionId,
                historico: resultado.historico || [],
                total: resultado.total || 0,
                especialidade: resultado.especialidade,
                nomeAluno: resultado.nomeAluno,
                estudoDeCaso: resultado.estudoDeCaso,
                feedbackFinal: resultado.feedbackFinal || null,
                tokensUtilizados: resultado.tokensUtilizados || 0
            });

        } catch (error) {
            console.error('❌ Erro ao obter histórico:', error);
            res.status(404).json({
                error: 'Erro ao obter histórico',
                message: error.message
            });
        }
    }
}

export default new IAController();