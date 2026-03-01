const axios = require('axios');

// API FatSecret
const clientId = 'e1616ca46d994be1934d3e9c53ee1008';
const clientSecret = 'f5141238be0d439195c9df8aa3ff8fe0';

async function getAccessToken() {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await axios.post('https://oauth.fatsecret.com/connect/token', 
        'grant_type=client_credentials&scope=basic', 
        {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    );
    return response.data.access_token;
}

async function searchFood(query) {
    const token = await getAccessToken();
    const response = await axios.get(`https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query)}&format=json`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
}

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const query = req.query.food;
        if (!query) {
            return res.status(400).json({ error: 'Parâmetro food é obrigatório' });
        }
        const dados = await searchFood(query);
        res.json(dados);
    } catch (error) {
        console.error('Erro na API:', error.message);
        res.status(500).json({ error: 'Erro na busca', details: error.message });
    }
};
