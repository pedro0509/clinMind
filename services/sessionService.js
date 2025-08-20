import { v4 as uuidv4 } from 'uuid';
import databaseService from './databaseService.js';

class SessionService {
    /**
     * Criar nova sessão
     */
    async criarSessao(req, dataChat) {

        // Criar userId se não existir
        if (!req.session.userId) {
            req.session.userId = uuidv4();
            req.session.createdAt = new Date();
        }

        // Salvar no banco de dados se nome e curso foram fornecidos
        if (dataChat.userName && dataChat.courseName) {
            try {
                await databaseService.salvarSessao(
                    req.session.userId,
                    dataChat.userName
                );
                console.log('Sessão salva no banco:', req.session.userId);
            } catch (error) {
                console.error('Erro ao salvar sessão no banco:', error);
            }
        }

        req.session.chatData = {
            userName: dataChat.userName || '',
            createdAt: new Date(),
            status: 'created',
            historico: []
        };

        return {
            sessionId: req.session.userId,
            chatData: req.session.chatData
        };
    }

    /**
     * Validar sessão básica (apenas userId)
     */
    validarSessaoBasica(req) {

        if (!req.session || !req.session.userId) {
            throw new Error('Sessão inválida ou expirada');
        }

        // Verificar expiração (24 horas)
        const sessionAge = new Date() - new Date(req.session.createdAt);
        const maxAge = 24 * 60 * 60 * 1000;

        if (sessionAge > maxAge) {
            req.session.destroy();
            throw new Error('Sessão expirada');
        }

        return req.session;
    }

    /**
     * Inicializar chatData se não existir
     */
    inicializarChatData(req) {

        const sessao = this.validarSessaoBasica(req);

        if (!sessao.chatData) {
            sessao.chatData = {
                userName: '',
                createdAt: new Date(),
                status: 'initializing',
                historico: []
            };
        } else {
            console.log('ChatData já existe:', sessao.chatData);
        }

        return sessao;
    }

    /**
     * Validar sessão existente com chatData
     */
    validarSessao(req) {
        // Primeiro valida a sessão básica
        const sessao = this.validarSessaoBasica(req);

        // Depois verifica se tem chatData
        if (!sessao.chatData) {
            console.log('Erro: ChatData não encontrado na sessão');
            throw new Error('Nenhum chat encontrado na sessão');
        }

        console.log('Sessão válida com chatData:', sessao.chatData);
        return sessao;
    }

    /**
     * Obter dados da sessão
     */
    obterDadosSessao(req) {
        const sessao = this.validarSessao(req);
        return {
            sessionId: sessao.userId,
            chatData: sessao.chatData,
            createdAt: sessao.createdAt
        };
    }

    /**
     * Atualizar histórico de conversa na sessão
     */
    atualizarHistorico(req, novoHistorico) {
        if (!req.session.chatData) {
            throw new Error('Sessão inválida');
        }

        req.session.chatData.historico = novoHistorico;
        return req.session.chatData;
    }

    /**
     * Obter histórico de conversa para um grupo específico
     * @param {Object} req - Request object
     * @returns {Array} Histórico do grupo
     */
    obterHistorico(sessao) {
        if (!sessao.chatData) {
            throw new Error('Sessão inválida');
        }

        if (!sessao.chatData.historico) {
            sessao.chatData.historico = [];
        }

        return sessao.chatData.historico || [];
    }

    /**
     * Debug: Verificar status da sessão
     */
    debugSessao(req) {
        console.log('=== DEBUG SESSÃO ===');
        console.log('req.session existe:', !!req.session);
        console.log('req.session.userId:', req.session?.userId);
        console.log('req.session.chatData:', req.session?.chatData);
        console.log('req.session.createdAt:', req.session?.createdAt);
        console.log('Session completa:', req.session);
        console.log('==================');
    }

}

export default new SessionService();