import { Router } from 'express';
import iaController from '../controllers/iaController.js';

const router = Router();

// Inicializar chat com caso clínico
router.post('/iniciar-chat', iaController.iniciarChat);

// Enviar pergunta para IA
router.post('/ask', iaController.gerarPergunta);

router.post('/feedback', iaController.corrigirResposta);

// Obter histórico de conversas (geral ou por grupo)
router.get('/history', iaController.obterHistorico);

router.post('/feedback-final', iaController.gerarFeedBackFinal);

export default router;