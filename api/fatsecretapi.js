import axios from 'axios';

// API FatSecret
const clientId = 'e1616ca46d994be1934d3e9c53ee1008';
const clientSecret = 'f5141238be0d439195c9df8aa3ff8fe0';

const getAccessToken = async () => {
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
};

const searchFood = async (query) => {
    const token = await getAccessToken();
    const response = await axios.get(`https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query)}&format=json`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

export { searchFood, getAccessToken };

