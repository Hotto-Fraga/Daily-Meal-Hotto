// ==================== GESTÃO DE DATAS ====================

// Data selecionada (formato YYYY-MM-DD)
let selectedDate = getTodayString();
let currentMeal = '';
let meals = { breakfast: [], lunch: [], dinner: [], snacks: [] };

function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function formatDateLabel(dateStr) {
    const today = getTodayString();
    const date = new Date(dateStr + 'T12:00:00');
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const formatted = date.toLocaleDateString('pt-BR', options);

    if (dateStr === today) return `Hoje — ${formatted}`;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split('T')[0]) return `Ontem — ${formatted}`;

    return formatted;
}

function changeDate(offset) {
    const date = new Date(selectedDate + 'T12:00:00');
    date.setDate(date.getDate() + offset);
    selectedDate = date.toISOString().split('T')[0];
    document.getElementById('date-picker').value = selectedDate;
    refreshUI();
}

function loadDate(dateStr) {
    selectedDate = dateStr;
    refreshUI();
}

function refreshUI() {
    document.getElementById('current-date-label').textContent = formatDateLabel(selectedDate);
    document.getElementById('date-picker').value = selectedDate;
    meals = loadMealsFromStorage(selectedDate);
    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(m => updateMealList(m));
    updateTotals();
    updateAddButtons();
}

// Desativar botões "Adicionar" para dias passados (opcional: remover se quiser editar o passado)
function updateAddButtons() {
    const isEditable = true; // mude para (selectedDate === getTodayString()) se quiser bloquear dias passados
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.disabled = !isEditable;
        btn.style.opacity = isEditable ? '1' : '0.4';
    });
}

// ==================== LOCALSTORAGE ====================

function getStorageKey(dateStr) {
    return `meals_${dateStr}`;
}

function saveMealsToStorage() {
    localStorage.setItem(getStorageKey(selectedDate), JSON.stringify(meals));
    // Guardar lista de datas com dados
    const dates = JSON.parse(localStorage.getItem('meal_dates') || '[]');
    if (!dates.includes(selectedDate)) {
        dates.push(selectedDate);
        dates.sort();
        localStorage.setItem('meal_dates', JSON.stringify(dates));
    }
}

function loadMealsFromStorage(dateStr) {
    const data = localStorage.getItem(getStorageKey(dateStr));
    if (data) return JSON.parse(data);
    return { breakfast: [], lunch: [], dinner: [], snacks: [] };
}

// ==================== MODAL & ALIMENTOS ====================

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
    saveMealsToStorage();
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
    saveMealsToStorage();
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

// ==================== PESQUISA API ====================

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
    const calories = parseFloat(description.match(/Calories:\s*([\d.]+)/)?.[1]) || 0;
    const fat = parseFloat(description.match(/Fat:\s*([\d.]+)/)?.[1]) || 0;
    const carbs = parseFloat(description.match(/Carbs:\s*([\d.]+)/)?.[1]) || 0;
    const protein = parseFloat(description.match(/Protein:\s*([\d.]+)/)?.[1]) || 0;

    const food = { name, calories, carbs, protein, fat };
    meals[currentMeal].push(food);
    saveMealsToStorage();
    updateMealList(currentMeal);
    updateTotals();
    closeModal();
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
    refreshUI();
});