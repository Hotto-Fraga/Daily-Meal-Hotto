// Variáveis globais para gerenciar refeições
let currentMeal = '';
const meals = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
};

function openAddFood(meal) {
    currentMeal = meal;
    document.getElementById('add-food-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('add-food-modal').style.display = 'none';
    clearInputs();
}

function clearInputs() {
    document.getElementById('food-search').value = '';
    document.getElementById('food-name').value = '';
    document.getElementById('food-calories').value = '';
    document.getElementById('food-carbs').value = '';
    document.getElementById('food-protein').value = '';
    document.getElementById('food-fat').value = '';
    document.getElementById('search-results').innerHTML = '';
}

function addFoodManual() {
    const name = document.getElementById('food-name').value;
    const calories = parseFloat(document.getElementById('food-calories').value) || 0;
    const carbs = parseFloat(document.getElementById('food-carbs').value) || 0;
    const protein = parseFloat(document.getElementById('food-protein').value) || 0;
    const fat = parseFloat(document.getElementById('food-fat').value) || 0;

    if (!name) {
        alert('Digite o nome do alimento');
        return;
    }

    const food = { name, calories, carbs, protein, fat };
    meals[currentMeal].push(food);
    updateMealList(currentMeal);
    updateTotals();
    closeModal();
}

function updateMealList(meal) {
    const list = document.getElementById(`${meal}-list`);
    list.innerHTML = '';
    
    meals[meal].forEach((food, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="food-name">${food.name}</span>
            <span class="food-info">${food.calories} cal | C: ${food.carbs}g | P: ${food.protein}g | G: ${food.fat}g</span>
            <button class="remove-btn" onclick="removeFood('${meal}', ${index})">✕</button>
        `;
        list.appendChild(li);
    });
}

function removeFood(meal, index) {
    meals[meal].splice(index, 1);
    updateMealList(meal);
    updateTotals();
}

function updateTotals() {
    let totalCalories = 0, totalCarbs = 0, totalProtein = 0, totalFat = 0;

    Object.values(meals).forEach(mealFoods => {
        mealFoods.forEach(food => {
            totalCalories += food.calories;
            totalCarbs += food.carbs;
            totalProtein += food.protein;
            totalFat += food.fat;
        });
    });

    document.getElementById('total-calories').textContent = Math.round(totalCalories);
    document.getElementById('total-carbs').textContent = totalCarbs.toFixed(1) + 'g';
    document.getElementById('total-protein').textContent = totalProtein.toFixed(1) + 'g';
    document.getElementById('total-fat').textContent = totalFat.toFixed(1) + 'g';
}

async function searchFood() {
    const query = document.getElementById('food-search').value;
    const resultsDiv = document.getElementById('search-results');
    
    if (!query.trim()) {
        resultsDiv.innerHTML = 'Digite um alimento para pesquisar.';
        return;
    }

    resultsDiv.innerHTML = 'Pesquisando...';

    try {
        const response = await fetch(`/api/search?food=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.foods && data.foods.food) {
            resultsDiv.innerHTML = '';
            data.foods.food.slice(0, 5).forEach(food => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.innerHTML = `
                    <strong>${food.food_name}</strong>
                    <p>${food.food_description}</p>
                    <button onclick="selectFood('${food.food_name.replace(/'/g, "\\'")}', '${food.food_description.replace(/'/g, "\\'")}')">Selecionar</button>
                `;
                resultsDiv.appendChild(div);
            });
        } else {
            resultsDiv.innerHTML = 'Nenhum resultado encontrado.';
        }
    } catch (error) {
        resultsDiv.innerHTML = 'Erro na pesquisa.';
        console.error(error);
    }
}

function selectFood(name, description) {
    // Parse description: "Per 100g - Calories: 52kcal | Fat: 0.17g | Carbs: 13.81g | Protein: 0.26g"
    const calories = parseFloat(description.match(/Calories:\s*([\d.]+)/)?.[1]) || 0;
    const fat = parseFloat(description.match(/Fat:\s*([\d.]+)/)?.[1]) || 0;
    const carbs = parseFloat(description.match(/Carbs:\s*([\d.]+)/)?.[1]) || 0;
    const protein = parseFloat(description.match(/Protein:\s*([\d.]+)/)?.[1]) || 0;

    const food = { name, calories, carbs, protein, fat };
    meals[currentMeal].push(food);
    updateMealList(currentMeal);
    updateTotals();
    closeModal();
}