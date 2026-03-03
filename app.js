import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { searchFood } from './api/fatsecretapi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Desabilita cache para desenvolvimento
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

// Rota para a home page (ANTES do static para não servir index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

// Servir ficheiros estáticos (sem index.html automático)
app.use(express.static(__dirname, { index: false }));

// Rota para obter o IP do cliente
app.get('/ip', async (req, res) => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Rota para busca de alimentos
app.get('/api/search', async (req, res) => {
    const query = req.query.food;
    if (!query) {
        return res.status(400).json({ error: 'Parâmetro food é obrigatório' });
    }
    try {
        const dados = await searchFood(query);
        res.json(dados);
    } catch (error) {
        console.error('Erro na busca:', error.message);
        res.status(500).json({ error: 'Erro na busca', details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Export para Vercel
export default app;