const path = require('path');
const express = require('express');
const { searchFood } = require('./api/fatsecretapi');

const app = express();

// Desabilita cache para desenvolvimento
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

app.use(express.static(__dirname));

// Rota para a home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});
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
    try {
        const query = req.query.food;
        const dados = await searchFood(query);
        res.json(dados);
    } catch (error) {
        res.status(500).json({ error: "Erro na busca" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Export para Vercel
module.exports = app;