import { Router } from 'express';
import sessionController from '../controllers/sessionController.js';

const router = Router();

// Criar nova sessão
router.post('/create-session', sessionController.criarSessao);

// Obter dados da sessão
router.get('/chat-session', sessionController.obterSessao);

export default router;