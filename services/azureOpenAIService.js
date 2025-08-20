import { AzureOpenAI } from "openai";
import { azureConfig } from '../config/azureConfig.js';
import { prompts } from '../config/promptsConfig.js';
import TextFormatter from '../utils/textFormatter.js';

class AzureOpenAIService {
    constructor() {
        this.client = new AzureOpenAI({
            endpoint: azureConfig.endpoint,
            apiKey: azureConfig.apiKey,
            apiVersion: azureConfig.apiVersion,
            deployment: azureConfig.deployment
        });
    }

    /**
    * Configurações padrão para chamadas da API
    */
    _getDefaultConfig(maxTokens = 200, temperature = 0.7) {
        return {
            max_tokens: maxTokens,
            temperature: temperature,
            top_p: 0.9,
            frequency_penalty: 0.3,
            presence_penalty: 0.2,
            stop: null
        };
    }

    /**
  * Executa chamada para Azure OpenAI com configuração padrão
  */
    async _executarChamada(messages, maxTokens = 200, temperature = 0.7) {
        try {
            const resposta = await this.client.chat.completions.create({
                messages,
                ...this._getDefaultConfig(maxTokens, temperature)
            });

            return {
                content: resposta.choices[0].message.content,
                tokens: resposta.usage?.total_tokens || 0
            };
        } catch (error) {
            console.error('❌ Erro na chamada Azure OpenAI:', error);
            throw new Error('Falha na comunicação com Azure OpenAI: ' + error.message);
        }
    }

    /**
    * Parse seguro de JSON da resposta da IA
    */
    _parseJsonResponse(raw) {
        try {
            return (typeof raw === 'object') ? raw : JSON.parse(String(raw).trim());
        } catch (err) {
            // Tentar extrair JSON do texto
            const match = String(raw).match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                } catch (err2) {
                    throw new Error('Resposta da IA contém JSON inválido');
                }
            }
            throw new Error('Resposta da IA não contém JSON válido');
        }
    }

    async initChat(especialidade) {
        try {

            const messages = [
                {
                    role: "system",
                    content: `Você é um especialista em educação técnica na área da saúde. Sua tarefa é gerar casos clínicos realistas para 
                    uso em atividades de aprendizagem do curso Técnico em Enfermagem do Senac Paraná. Nunca inclua comentários, 
                    introduções ou explicações — apenas o conteúdo do caso clínico, conforme solicitado pelo usuário.`
                },
                { role: "user", content: prompts.initialChat(especialidade) }
            ];

            const resultado = await this._executarChamada(messages, 600, 0.5);
            const conteudoFormatado = this.processarConteudo(resultado.content);

            return {
                respostaHtml: conteudoFormatado.html,
                resposta: conteudoFormatado.textoLimpo,
                tokens_utilizados: resultado.tokens
            };

        } catch (error) {
            console.error('Erro ao iniciar chat:', error);
            throw new Error('Falha ao iniciar chat: ' + error.message);
        }
    }

    /**
     * Gerar pergunta baseada no caso clínico (SEM manipular histórico)
     */
    async gerarPergunta(casoClinico, historicoExistente = []) {
        try {

            if (!casoClinico) {
                throw new Error('Caso clínico é obrigatório');
            }

            const messages = [
                {
                    role: "system",
                    content: prompts.systemQuestion()
                },
                ...this.processarHistorico(historicoExistente),
                { role: "user", content: prompts.contextQuestion() }
            ];

            const resultado = await this._executarChamada(messages);
            const conteudoFormatado = this.processarConteudo(resultado.content);

            return {
                respostaHtml: conteudoFormatado.html,
                resposta: conteudoFormatado.textoLimpo,
                tokens_utilizados: resultado.tokens
            };

        } catch (error) {
            console.error('❌ Erro ao gerar pergunta:', error);
            throw new Error('Falha ao gerar pergunta: ' + error.message);
        }
    }

    /**
   * Gerar feedback final baseado no caso clínico (SEM manipular histórico)
   */
    async gerarFeedbackFinal(casoClinico, historicoExistente = []) {
        try {

            if (!casoClinico) {
                throw new Error('Caso clínico é obrigatório');
            }

            const messages = [
                {
                    role: "system",
                    content: prompts.systemFeedback()
                },
                ...this.processarHistorico(historicoExistente),
                { role: "user", content: prompts.feedbackFinal(casoClinico, historicoExistente.length) }
            ];

            const resultado = await this._executarChamada(messages, 600, 0.5);
            const conteudoFormatado = this.processarConteudo(resultado.content);

            return {
                respostaHtml: conteudoFormatado.html,
                resposta: conteudoFormatado.textoLimpo,
                tokens_utilizados: resultado.tokens
            };


        } catch (error) {
            console.error('❌ Erro ao gerar pergunta:', error);
            throw new Error('Falha ao gerar pergunta: ' + error.message);
        }
    }

    /**
    * Verificar se resposta do aluno está correta
    */
    async verificarSeCorreta(casoClinico, ultimaPergunta, respostaQuestion) {

        if (!casoClinico || !ultimaPergunta || !respostaQuestion) {
            throw new Error('Parâmetros obrigatórios não fornecidos');
        }

        const messages = [
            { role: "system", content: prompts.systemQuestion() },
            { role: "user", content: prompts.generateCorreção(casoClinico, ultimaPergunta, respostaQuestion) }
        ];

        const resultado = await this._executarChamada(messages);
        const retorno = this._parseJsonResponse(resultado.content);
        const estaCorreto = Boolean(retorno?.correto);

        let feedbackRetorno = "Resposta correta";
        let corretoRetorno = true;

        return {
            correto: estaCorreto,
            feedback: estaCorreto ? "A resposta está correta!" : "A resposta está incorreta!",
            tokens_utilizados: resultado.tokens
        };

    }

    /**
    * Gerar feedback detalhado (SEM manipular histórico)
    */
    async gerarFeedback(casoClinico, historicoExistente) {
        try {

            if (!casoClinico) {
                throw new Error('Caso clínico é obrigatório');
            }

            const messages = [
                { role: "system", content: prompts.systemFeedback() },
                ...this.processarHistorico(historicoExistente),
                { role: "user", content: prompts.generateFeedback(casoClinico) }
            ];

            const resultado = await this._executarChamada(messages);
            const conteudoFormatado = this.processarConteudo(resultado.content);

            return {
                feedback: conteudoFormatado.textoLimpo,
                tokens_utilizados: resultado.tokens
            };

        } catch (error) {
            console.error('❌ Erro ao gerar feedback:', error);
            throw new Error('Falha ao gerar feedback: ' + error.message);
        }
    }

    /**
    * Processa conteúdo através do TextFormatter
    */
    processarConteudo(conteudo) {
        if (!conteudo) return { textoOriginal: '', html: '', textoLimpo: '' };

        return {
            textoOriginal: TextFormatter.paraTextoLimpo(conteudo),
            html: TextFormatter.paraHTML(conteudo),
            textoLimpo: TextFormatter.paraTextoLimpo(conteudo)
        };
    }

    /**
 * Processa o histórico existente e retorna um array de mensagens no formato esperado.
 * @param {Array} historicoExistente - O histórico de interações.
 * @returns {Array} - Um array de mensagens no formato { role, content }.
 */
    processarHistorico(historicoExistente) {
        if (!Array.isArray(historicoExistente) || historicoExistente.length === 0) {
            return []; // Retorna vazio se o histórico não for válido ou estiver vazio
        }

        return historicoExistente.flatMap(entry => {
            const mappedEntries = [];

            // Adicionar pergunta se existir
            if (entry.pergunta) {
                mappedEntries.push({ role: "assistant", content: entry.pergunta });
            }

            // Adicionar resposta se existir
            if (entry.resposta) {
                mappedEntries.push({ role: "user", content: entry.resposta });
            }

            // Adicionar feedback se existir
            if (entry.feedback) {
                mappedEntries.push({ role: "assistant", content: entry.feedback });
            }

            return mappedEntries;
        });
    }
}

export default new AzureOpenAIService();