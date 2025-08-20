import Datastore from 'nedb-promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseService {
    constructor() {
        const dataDir = path.join(__dirname, '../data');

        // Banco principal para estudos de caso completos
        this.estudosCasosDb = Datastore.create(path.join(dataDir, 'estudos_casos.db'));

        // Banco para sessões básicas (manter para compatibilidade)
        this.db = Datastore.create(path.join(dataDir, 'sessions.db'));
    }

    // ====================================
    // MÉTODOS PRINCIPAIS (estudos_casos.db)
    // ====================================

    /**
     * Criar nova sessão completa (usado no initChat)
     */
    async criarSessao(sessionId, dados) {
        try {
            console.log('🚀 Criando nova sessão:', sessionId);

            const documento = {
                sessionId,
                nome_aluno: dados.nome_aluno || dados["nome do aluno"] || "Usuário Anônimo",
                estudo_de_caso: dados.estudo_de_caso || dados["estudo de caso"] || "",
                especialidade: dados.especialidade || "",
                historico: [], // Sempre inicia vazio
                feedback_final: null,
                tokens_utilizados: Number(dados.tokens_utilizados) || 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                status: "ativo"
            };

            const resultado = await this.estudosCasosDb.insert(documento);
            console.log('✅ Sessão criada:', sessionId);

            return resultado;
        } catch (error) {
            console.error('❌ Erro ao criar sessão:', error);
            throw new Error(`Falha ao criar sessão: ${error.message}`);
        }
    }

    /**
     * Obter sessão completa (sem validações que quebram o fluxo)
     */
    async obterSessao(sessionId) {
        try {
            if (!sessionId || typeof sessionId !== 'string') {
                throw new Error('SessionId inválido');
            }

            const resultado = await this.estudosCasosDb.findOne({
                sessionId,
                status: "ativo"
            });

            if (!resultado) {
                return null; // Não lançar erro, deixar caller decidir
            }

            // Normalizar campos para uso interno
            return {
                ...resultado,
                estudo_de_caso: resultado.estudo_de_caso || resultado["estudo de caso"] || "",
                nome_aluno: resultado.nome_aluno || resultado["nome do aluno"] || "Usuário Anônimo",
                historico: Array.isArray(resultado.historico) ? resultado.historico : []
            };

        } catch (error) {
            console.error('❌ Erro ao obter sessão:', error);
            return null;
        }
    }

    /**
     * Adicionar novo registro ao histórico (usado no gerarPergunta)
     */
    async adicionarPerguntaHistorico(sessionId, pergunta, tokensUsados = 0) {
        try {
            console.log('📝 Adicionando pergunta ao histórico:', sessionId);

            const sessao = await this.obterSessao(sessionId);
            if (!sessao) {
                throw new Error(`Sessão não encontrada: ${sessionId}`);
            }

            const novoRegistro = {
                pergunta: String(pergunta).trim(),
                resposta: null,
                feedback: null,
                created_at: new Date().toISOString()
            };

            const historicoAtualizado = [...sessao.historico, novoRegistro];

            await this._atualizarCampos(sessionId, {
                historico: historicoAtualizado,
                tokens_utilizados: (sessao.tokens_utilizados || 0) + tokensUsados
            });

            console.log('✅ Pergunta adicionada:', sessionId);
            return historicoAtualizado;

        } catch (error) {
            console.error('❌ Erro ao adicionar pergunta:', error);
            throw error;
        }
    }

    /**
     * Atualizar último registro com resposta e feedback (usado no correcaoResposta)
     */
    async atualizarUltimoRegistro(sessionId, resposta, feedback, tokensUsados = 0) {
        try {
            console.log('💬 Atualizando último registro:', sessionId);

            const sessao = await this.obterSessao(sessionId);
            if (!sessao) {
                throw new Error(`Sessão não encontrada: ${sessionId}`);
            }

            if (sessao.historico.length === 0) {
                throw new Error('Nenhuma pergunta encontrada no histórico');
            }

            const historico = [...sessao.historico];
            const ultimoIdx = historico.length - 1;

            // Atualizar apenas campos fornecidos
            historico[ultimoIdx] = {
                ...historico[ultimoIdx],
                ...(resposta && { resposta: String(resposta).trim() }),
                ...(feedback && { feedback: String(feedback).trim() }),
                updated_at: new Date().toISOString()
            };

            await this._atualizarCampos(sessionId, {
                historico,
                tokens_utilizados: (sessao.tokens_utilizados || 0) + tokensUsados
            });

            console.log('✅ Último registro atualizado:', sessionId);
            return historico;

        } catch (error) {
            console.error('❌ Erro ao atualizar último registro:', error);
            throw error;
        }
    }

    /**
   * Atualizar feedback final da sessão (usado no gerarFeedbackFinal)
   */
    async atualizarFeedbackFinal(sessionId, feedbackFinal, tokensUsados = 0) {
        try {
            console.log('📝 Atualizando feedback final:', sessionId);

            const sessao = await this.obterSessao(sessionId);
            if (!sessao) {
                throw new Error(`Sessão não encontrada: ${sessionId}`);
            }

            // ✅ VERIFICAÇÃO: Confirmar que histórico não será alterado
            const historicoOriginal = [...(sessao.historico || [])];

            console.log('📊 Estado antes da atualização:', {
                sessionId,
                historicoLength: historicoOriginal.length,
                feedbackAtual: sessao.feedback_final ? 'EXISTS' : 'NULL',
                novoFeedbackLength: String(feedbackFinal).length
            });

            // ✅ ATUALIZAÇÃO ISOLADA: Somente feedback_final e tokens
            const camposParaAtualizar = {
                feedback_final: String(feedbackFinal).trim(),
                tokens_utilizados: (sessao.tokens_utilizados || 0) + tokensUsados
            };

            // ✅ LOG DE SEGURANÇA: Confirmar que histórico não está sendo tocado
            if (camposParaAtualizar.historico) {
                throw new Error('ERRO DE SEGURANÇA: Tentativa de modificar histórico detectada!');
            }

            await this._atualizarCampos(sessionId, camposParaAtualizar);

            // ✅ VERIFICAÇÃO PÓS-ATUALIZAÇÃO: Confirmar integridade do histórico
            const sessaoAtualizada = await this.obterSessao(sessionId);
            const historicoDepois = [...(sessaoAtualizada.historico || [])];

            if (historicoOriginal.length !== historicoDepois.length) {
                console.error('🚨 ALERTA: Tamanho do histórico mudou!', {
                    antes: historicoOriginal.length,
                    depois: historicoDepois.length
                });
            }

            console.log('✅ Feedback final atualizado com sucesso:', {
                sessionId,
                historicoIntacto: historicoOriginal.length === historicoDepois.length,
                feedbackSalvo: Boolean(sessaoAtualizada.feedback_final),
                tamanhoFeedback: sessaoAtualizada.feedback_final?.length || 0
            });

            return {
                sucesso: true,
                feedbackSalvo: sessaoAtualizada.feedback_final,
                historicoIntacto: historicoOriginal.length === historicoDepois.length
            };
        } catch (error) {
            console.error('❌ Erro ao atualizar feedback geral:', error);
            throw error;
        }
    }


    /**
     * Método interno para atualizar campos (operação atômica)
     */
    async _atualizarCampos(sessionId, campos) {
        const dadosAtualizar = {
            ...campos,
            updated_at: new Date().toISOString()
        };

        return await this.estudosCasosDb.update(
            { sessionId, status: "ativo" },
            { $set: dadosAtualizar }
        );
    }

    /**
     * Obter estatísticas da sessão
     */
    async obterEstatisticas(sessionId) {
        try {
            const sessao = await this.obterSessao(sessionId);
            if (!sessao) return null;

            const historicoValido = sessao.historico.filter(h => h.pergunta);
            const respostasCompletas = historicoValido.filter(h => h.resposta && h.feedback);

            return {
                sessionId,
                nome_aluno: sessao.nome_aluno,
                especialidade: sessao.especialidade,
                total_perguntas: historicoValido.length,
                respostas_completas: respostasCompletas.length,
                tem_feedback_final: Boolean(sessao.feedback_final), // ✅ NOVO CAMPO
                tokens_utilizados: sessao.tokens_utilizados || 0,
                created_at: sessao.created_at,
                updated_at: sessao.updated_at
            };

        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return null;
        }
    }

    /**
     * Listar sessões ativas
     */
    async listarSessoes(limite = 10) {
        try {
            return await this.estudosCasosDb
                .find({ status: "ativo" })
                .sort({ updated_at: -1 })
                .limit(limite);
        } catch (error) {
            console.error('❌ Erro ao listar sessões:', error);
            return [];
        }
    }

    /**
     * Arquivar sessão
     */
    async arquivarSessao(sessionId) {
        try {
            await this._atualizarCampos(sessionId, { status: "arquivado" });
            console.log('📦 Sessão arquivada:', sessionId);
            return true;
        } catch (error) {
            console.error('❌ Erro ao arquivar sessão:', error);
            return false;
        }
    }

    // ====================================
    // MÉTODOS DE COMPATIBILIDADE (DEPRECATED)
    // ====================================

    /**
     * @deprecated Use criarSessao()
     */
    async salvarSessaoCompleta(sessionId, dados) {
        console.warn('⚠️ salvarSessaoCompleta está deprecated, use criarSessao()');
        return await this.criarSessao(sessionId, dados);
    }

    /**
     * @deprecated Use obterSessao()
     */
    async obterSessaoCompleta(sessionId) {
        console.warn('⚠️ obterSessaoCompleta está deprecated, use obterSessao()');
        return await this.obterSessao(sessionId);
    }

    /**
     * @deprecated Use atualizarUltimoRegistro()
     */
    async atualizarUltimoRegistroHistorico(sessionId, partialEntry = {}) {
        console.warn('⚠️ atualizarUltimoRegistroHistorico está deprecated, use atualizarUltimoRegistro()');

        const { resposta, feedback, ...outros } = partialEntry;
        return await this.atualizarUltimoRegistro(
            sessionId,
            resposta,
            feedback,
            outros.tokens_utilizados || 0
        );
    }

    // ====================================
    // MÉTODOS DE DEBUG E MANUTENÇÃO
    // ====================================

    /**
     * Debug simplificado
     */
    async debug() {
        try {
            const total = await this.estudosCasosDb.count({ status: "ativo" });
            const ultimaSessao = await this.estudosCasosDb
                .findOne({ status: "ativo" })
                .sort({ updated_at: -1 });

            console.log('📊 DATABASE DEBUG:');
            console.log(`   Total sessões ativas: ${total}`);

            if (ultimaSessao) {
                console.log(`   Última sessão: ${ultimaSessao.sessionId}`);
                console.log(`   Perguntas: ${ultimaSessao.historico?.length || 0}`);
                console.log(`   Tokens: ${ultimaSessao.tokens_utilizados || 0}`);
            }

        } catch (error) {
            console.error('❌ Erro no debug:', error);
        }
    }
}

export default new DatabaseService();