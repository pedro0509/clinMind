import express from 'express';
import databaseService from '../services/databaseService.js';

const router = express.Router();

// Visualizar todas as sessões
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await databaseService.obterTodasSessoes();
        res.json({
            total: sessions.length,
            sessions: sessions
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Visualizar sessão específica
router.get('/sessions/:id', async (req, res) => {
    try {
        const session = await databaseService.obterSessao(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Sessão não encontrada' });
        }
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Visualizar conversas de uma sessão
router.get('/sessions/:id/conversations', async (req, res) => {
    try {
        const conversations = await databaseService.obterConversas(req.params.id);
        res.json({
            sessionId: req.params.id,
            total: conversations.length,
            conversations: conversations
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Estatísticas gerais
router.get('/stats', async (req, res) => {
    try {
        const sessions = await databaseService.obterTodasSessoes();
        const totalSessions = sessions.length;
        const activeSessions = sessions.filter(s => s.status === 'active').length;
        
        res.json({
            totalSessions,
            activeSessions,
            lastSession: sessions[0] || null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;