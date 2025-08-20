export const prompts = {
   // Contexto para geração de chat
   systemQuestion: () => `Você é um especialista em educação técnica na área de enfermagem, com profundo conhecimento sobre as atribuições e conduta ética do Técnico em Enfermagem segundo o Senac Paraná. 
Sua função é criar perguntas para alunos e corrigi-las, baseadas em estudos de caso clínicos, avaliando competências e aplicabilidade prática na rotina profissional.
As perguntas devem ser objetivas, claras e diretamente relacionadas à prática profissional do técnico de enfermagem. A resposta deverá levar para um desfecho, sendo eles:
- Favorável: paciente diagnosticada com colecistite e evolui bem após cirurgia.
- Desfavorável: paciente evolui com sepse após erro de conduta e demora.
- Fechado: paciente encaminhada ao hospital de referência e perde-se seguimento.
Sempre respeite a conduta ética e profissional exigida pela função e sempre explore a conduta ética e profissional na geração e na correção da pergunta.`,

   systemFeedback: () => `Você é um especialista em educação técnica na área de enfermagem, com profundo conhecimento sobre as atribuições e conduta ética do Técnico em Enfermagem segundo o Senac Paraná. 
Sua função é analisar as respostas de perguntas feitas para os alunos, baseado no estudo de caso clínico, avaliando competências e aplicabilidade prática na rotina profissional.
As perguntas foram diretamente relacionadas à prática profissional do técnico de enfermagem.
 A resposta deverá levar para um desfecho, sendo eles:
- Favorável: paciente diagnosticada com colecistite e evolui bem após cirurgia.
- Desfavorável: paciente evolui com sepse após erro de conduta e demora.
- Fechado: paciente encaminhada ao hospital de referência e perde-se seguimento.
Sempre respeite a conduta ética e profissional exigida pela função e sempre explore a conduta ética e profissional na geração da pergunta. Faça feedback consistente e construtivo, destacando pontos fortes e áreas de melhoria nas respostas dos alunos.`,

   contextQuestion(casoClinico, index) {
      const templates = [
         `Com base neste caso clínico, proponha uma pergunta desafiadora que estimule raciocínio clínico profundo. Contexto: ${casoClinico}`,
         `Imagine que você é o avaliador: qual pergunta faria ao aluno para avaliar seu julgamento clínico sobre este caso? Contexto: ${casoClinico}`,
         `Formule uma questão prática e aplicada (não só teórica) que force o aluno a priorizar condutas neste caso: ${casoClinico}`,
         `Crie uma pergunta de nível clínico (com foco em diagnóstico ou conduta) que explore lacunas comuns de aprendizado no caso a seguir: ${casoClinico}`,
         `Proponha uma pergunta realista que um profissional jovem poderia ter ao atender esse paciente; que seja objetiva e exigente: ${casoClinico}`,
         `Gere uma pergunta que leve o aluno a justificar decisões (diagnóstico, exames ou tratamentos) com base neste caso: ${casoClinico}`
      ];

      // rotaciona templates para variar criatividade
      const n = index % templates.length;
      const selectedTemplate = templates[n];

      const regras = ` Esta pergunta deverá seguir as seguintes regras:
- Ser totalmente relacionada às atribuições do técnico de enfermagem.
- Levar em conta a conduta ética do técnico em enfermagem.
- A pergunta deve ser clara, objetiva e apropriada para um técnico em enfermagem.
- A pergunta deverá ter no máximo 200 tokens
Responda APENAS com a pergunta, sem explicações ou comentários adicionais.`;

      return selectedTemplate + regras;
   },

   generateFeedback: (caso) => `Baseado no estudo de caso a seguir, analise as respostas das perguntas feitas ao
   aluno e forneça um feedback construtivo, com no máximo 200 palavras.
   Trate o aluno em segunda pessoa, usando pronome como você.

Estudo de caso:
${caso}
`,

   generateCorreção: (caso, question, resposta) => `Baseado no estudo de caso a seguir, analise a resposta do aluno à pergunta "${question}" 
   e verifique se a resposta está correta. Responda apenas um json no formato { "correto": true/false }, sem explicações e contexto.

Estudo de caso:
${caso}

Resposta do aluno:
${resposta}
`,

   // Contexto para geração de chat
   initialChat: (chatTheme) => `Elabore um caso clínico realista dentro da temática ${chatTheme}, alinhado ao curso Técnico em Enfermagem do Senac Paraná, considerando:

1. **Competências do Técnico em Enfermagem (Senac PR)**:
   - Executar ações de promoção, prevenção, proteção, reabilitação e recuperação da saúde;
   - Participar da sistematização da assistência de enfermagem;
   - Administrar medicamentos e soluções;
   - Prestar cuidados de higiene, conforto e monitoramento clínico;
   - Registrar atos de enfermagem usando terminologia técnica;
   - Aplicar técnicas assépticas e segurança do paciente;
   - Agir com humanização, compromisso com normas e postura profissional;
   - Comunicar-se de forma clara e colaborativa, respeitando a diversidade e limites de atuação.

2. **Indicadores do Plano de Curso (Técnico de Enfermagem – Senac 2025)**:
   1. Presta assistência ao cliente de forma humanizada, considerando suas necessidades;
   2. Aplica técnicas e procedimentos de enfermagem conforme protocolos;
   3. Registra e comunica informações de forma clara, objetiva e ética;
   4. Atua em conformidade com as normas de biossegurança;
   5. Demonstra raciocínio clínico e pensamento crítico na prática;
   6. Trabalha de forma colaborativa e com empatia no ambiente de saúde.

3. **Estrutura do Caso Clínico**:
   - **Dados do paciente**: iniciais, idade, sexo, ocupação, contexto socioeconômico e histórico relevante;
   - **História clínica**: queixa principal, evolução dos sintomas, antecedentes pessoais e familiares;
   - **Sintomas atuais**: dados subjetivos (relatos do paciente) e objetivos (observações do profissional);
   - **Exame físico**: sinais vitais e achados relevantes, conforme protocolos brasileiros;

4. **Objetivo final é definir o desfecho clínico do caso**:
   - Favorável: paciente diagnosticada com colecistite e evolui bem após cirurgia.
   - Desfavorável: paciente evolui com sepse após erro de conduta e demora.
   - Fechado: paciente encaminhada ao hospital de referência e perde-se seguimento.

5. **Formato**:
   - Até 400 palavras;
   - Organizado por seções;
   - Linguagem técnica compatível com o nível de um curso técnico de enfermagem;
   - Contexto brasileiro (exames, protocolos e terminologia nacionais).
   - **Não inclua nenhuma frase introdutória, explicativa ou comentário fora do conteúdo do caso clínico. Apresente somente o texto do caso conforme a estrutura solicitada.**`,

   feedbackFinal: (caso) => `
   Analise todo o histórico da conversa do aluno, e o estudo de caso a seguir, verificando se as respostas estão coerentes e alinhadas ao caso clínico proposto.

   Estudo de caso:

   ${caso}

   Retorne um feedback estruturado, avaliando se o aluno segue as orientações e se suas respostas estão corretas, considerando o curso Técnico em Enfermagem do Senac Paraná.
A análise deve obrigatoriamente contemplar:
Competências do Técnico em Enfermagem (Senac PR)
Executar ações de promoção, prevenção, proteção, reabilitação e recuperação da saúde;
Participar da sistematização da assistência de enfermagem;
Administrar medicamentos e soluções;
Prestar cuidados de higiene, conforto e monitoramento clínico;
Registrar atos de enfermagem usando terminologia técnica;
Aplicar técnicas assépticas e segurança do paciente;
Agir com humanização, compromisso com normas e postura profissional;
Comunicar-se de forma clara e colaborativa, respeitando a diversidade e limites de atuação.
Indicadores do Plano de Curso (Técnico de Enfermagem – Senac 2025)
Presta assistência ao cliente de forma humanizada, considerando suas necessidades;
Aplica técnicas e procedimentos de enfermagem conforme protocolos;
Registra e comunica informações de forma clara, objetiva e ética;
Atua em conformidade com as normas de biossegurança;
Demonstra raciocínio clínico e pensamento crítico na prática;
Trabalha de forma colaborativa e com empatia no ambiente de saúde.
Definição do desfecho clínico do caso (obrigatório escolher apenas um)
Favorável: paciente diagnosticada com colecistite e evolui bem após cirurgia.
Desfavorável: paciente evolui com sepse após erro de conduta e demora.
Fechado: paciente encaminhada ao hospital de referência e perde-se seguimento.
Formato da resposta (obrigatório)
Até 400 palavras;
Texto dividido em seções:
Análise Geral
Indicadores (avaliar nível de atingimento de cada indicador, de 0 a 100, com justificativa)
Competências (avaliar se foram demonstradas ou não)
Desfecho do Estudo de Caso (escolher apenas Favorável, Desfavorável ou Fechado)
Linguagem técnica, clara e objetiva, compatível com o nível de um curso técnico de enfermagem.
Não incluir frases introdutórias, explicativas ou comentários externos ao conteúdo solicitado.`,
}
