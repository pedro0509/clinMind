class TextFormatter {
    /**
     * Converte texto da IA para HTML formatado
     * @param {string} texto - Texto bruto da IA
     * @returns {string} HTML formatado
     */
    static paraHTML(texto) {
        if (!texto) return '';

        let textoFormatado = texto;

        textoFormatado = textoFormatado.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        textoFormatado = textoFormatado.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        textoFormatado = textoFormatado.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

        // Converter quebras de linha \n para <br>
        textoFormatado = textoFormatado.replace(/\n/g, '<br>');

        // Converter texto em negrito **texto** para <strong>texto</strong>
        textoFormatado = textoFormatado.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Converter texto em itálico *texto* para <em>texto</em>
        textoFormatado = textoFormatado.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Converter listas com - ou * para <ul><li>
        textoFormatado = textoFormatado.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
        textoFormatado = textoFormatado.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Converter números de lista 1. 2. etc para <ol><li>
        textoFormatado = textoFormatado.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
        textoFormatado = textoFormatado.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

        // Remover quebras duplas desnecessárias
        textoFormatado = textoFormatado.replace(/<br><br>/g, '<br>');

        // Adicionar parágrafos para blocos de texto
        const paragrafos = textoFormatado.split('<br><br>');
        if (paragrafos.length > 1) {
            textoFormatado = paragrafos.map(p => p.trim() ? `<p>${p}</p>` : '').join('');
        }

        return textoFormatado.trim();
    }

    /**
     * Converte texto da IA para texto limpo (sem formatação)
     * @param {string} texto - Texto bruto da IA
     * @returns {string} Texto limpo
     */
    static paraTextoLimpo(texto) {
        if (!texto) return '';

        let textoLimpo = texto;

        textoLimpo = textoLimpo.replace(/^#{1,6}\s+/gm, '');

        // Remover formatação de negrito
        textoLimpo = textoLimpo.replace(/\*\*(.*?)\*\*/g, '$1');

        // Remover formatação de itálico
        textoLimpo = textoLimpo.replace(/\*(.*?)\*/g, '$1');

        // Converter \n para quebras de linha normais
        textoLimpo = textoLimpo.replace(/\\n/g, '\n');

        // Normalizar quebras de linha múltiplas
        textoLimpo = textoLimpo.replace(/\n\n+/g, '\n\n');

        return textoLimpo.trim();
    }

    /**
     * Extrair seções específicas do caso clínico
     * @param {string} texto - Texto do caso clínico
     * @returns {Object} Objeto com seções organizadas
     */
    static extrairSecoesCasoClinico(texto) {
        const secoes = {
            dadosPaciente: '',
            historiaClinica: '',
            sintomas: '',
            examesFisicos: '',
            questao: '',
            textoCompleto: texto
        };

        // Tentar identificar seções comuns
        const linhas = texto.split('\n');
        let secaoAtual = 'dadosPaciente';

        linhas.forEach(linha => {
            const linhaLimpa = linha.trim().toLowerCase();

            if (linhaLimpa.includes('dados do paciente') || linhaLimpa.includes('identificação')) {
                secaoAtual = 'dadosPaciente';
            } else if (linhaLimpa.includes('história clínica') || linhaLimpa.includes('histórico')) {
                secaoAtual = 'historiaClinica';
            } else if (linhaLimpa.includes('sintomas') || linhaLimpa.includes('queixa')) {
                secaoAtual = 'sintomas';
            } else if (linhaLimpa.includes('exame físico') || linhaLimpa.includes('exames')) {
                secaoAtual = 'examesFisicos';
            } else if (linhaLimpa.includes('questão') || linhaLimpa.includes('pergunta')) {
                secaoAtual = 'questao';
            } else if (linha.trim()) {
                secoes[secaoAtual] += linha + '\n';
            }
        });

        // Limpar seções
        Object.keys(secoes).forEach(key => {
            if (key !== 'textoCompleto') {
                secoes[key] = secoes[key].trim();
            }
        });

        return secoes;
    }

    /**
     * Validar se o texto parece ser um caso clínico válido
     * @param {string} texto - Texto a validar
     * @returns {boolean} True se parece válido
     */
    static validarCasoClinico(texto) {
        if (!texto || texto.length < 50) return false;

        const indicadores = [
            'paciente', 'idade', 'anos', 'sintomas', 'queixa',
            'história', 'exame', 'diagnóstico', 'tratamento'
        ];

        const textoLower = texto.toLowerCase();
        const indicadoresEncontrados = indicadores.filter(ind =>
            textoLower.includes(ind)
        );

        return indicadoresEncontrados.length >= 3;
    }
}

export default TextFormatter;