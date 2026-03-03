// ==================== ESTADO GLOBAL ====================

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks'];

let selectedDate = getTodayString();
let currentMeal = '';
let meals = { breakfast: [], lunch: [], dinner: [], snacks: [] };
let pendingFood = null; // { name, caloriesPer100, carbsPer100, proteinPer100, fatPer100 }

// ==================== UTILITÁRIOS ====================

function $(id) { return document.getElementById(id); }

/** Calcula macros proporcionais a uma quantidade (baseado em per100g) */
function calcMacros(per100, grams) {
    const factor = grams / 100;
    return {
        calories: Math.round(per100.caloriesPer100 * factor * 10) / 10,
        carbs:    Math.round(per100.carbsPer100 * factor * 10) / 10,
        protein:  Math.round(per100.proteinPer100 * factor * 10) / 10,
        fat:      Math.round(per100.fatPer100 * factor * 10) / 10
    };
}

/** Formata macros numa string legível */
function formatMacros(m) {
    return `${m.calories} cal | C: ${m.carbs}g | P: ${m.protein}g | G: ${m.fat}g`;
}

/** Extrai um valor numérico de uma regex numa string */
function extractNumber(text, regex) {
    return parseFloat(text.match(regex)?.[1]) || 0;
}

/** Extrai valores nutricionais de uma descrição FatSecret */
function parseNutrition(description) {
    return {
        calories: extractNumber(description, /Calories:\s*([\d.]+)/),
        fat:      extractNumber(description, /Fat:\s*([\d.]+)/),
        carbs:    extractNumber(description, /Carbs:\s*([\d.]+)/),
        protein:  extractNumber(description, /Protein:\s*([\d.]+)/)
    };
}

/** Salva refeições e atualiza a UI */
function persistAndRefresh(meal) {
    saveMealsToStorage();
    updateMealList(meal);
    updateTotals();
}

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
    $('date-picker').value = selectedDate;
    refreshUI();
}

function loadDate(dateStr) {
    selectedDate = dateStr;
    refreshUI();
}

function refreshUI() {
    $('current-date-label').textContent = formatDateLabel(selectedDate);
    $('date-picker').value = selectedDate;
    meals = loadMealsFromStorage(selectedDate);
    MEAL_TYPES.forEach(m => updateMealList(m));
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

function showModal(id)  { $(id).style.display = 'flex'; }
function hideModal(id)  { $(id).style.display = 'none'; }

function openAddFood(meal) {
    currentMeal = meal;
    showModal('add-food-modal');
}

function openQuantityModal(foodData) {
    pendingFood = foodData;
    const base = calcMacros(foodData, 100);
    $('quantity-food-info').innerHTML = `<strong>${foodData.name}</strong><br>
        <small>Por 100g — ${formatMacros(base)}</small>`;
    $('quantity-input').value = '100';
    updateQuantityPreview();
    showModal('quantity-modal');
    $('quantity-input').focus();
}

function closeQuantityModal() {
    hideModal('quantity-modal');
    pendingFood = null;
    $('quantity-preview').textContent = '';
}

function updateQuantityPreview() {
    if (!pendingFood) return;
    const qty = parseFloat($('quantity-input').value) || 0;
    const m = calcMacros(pendingFood, qty);
    $('quantity-preview').innerHTML = `<strong>${qty}g:</strong> ${formatMacros(m)}`;
}

function confirmQuantity() {
    if (!pendingFood) return;
    const qty = parseFloat($('quantity-input').value) || 0;
    if (qty <= 0) {
        alert('Insira uma quantidade válida.');
        return;
    }
    const food = { name: `${pendingFood.name} (${qty}g)`, ...calcMacros(pendingFood, qty) };
    meals[currentMeal].push(food);
    persistAndRefresh(currentMeal);
    closeQuantityModal();
}

function closeModal() {
    hideModal('add-food-modal');
    clearInputs();
}

const INPUT_IDS = ['food-search', 'food-name', 'food-calories', 'food-carbs', 'food-protein', 'food-fat'];

function clearInputs() {
    INPUT_IDS.forEach(id => $(id).value = '');
    $('search-results').innerHTML = '';
}

function addFoodManual() {
    const name = $('food-name').value;
    if (!name) { alert('Digite o nome do alimento'); return; }

    const per100 = {
        name,
        caloriesPer100: parseFloat($('food-calories').value) || 0,
        carbsPer100:    parseFloat($('food-carbs').value) || 0,
        proteinPer100:  parseFloat($('food-protein').value) || 0,
        fatPer100:      parseFloat($('food-fat').value) || 0
    };
    closeModal();
    openQuantityModal(per100);
}

function updateMealList(meal) {
    const list = $(`${meal}-list`);
    list.innerHTML = meals[meal].map((food, index) => `
        <li>
            <span class="food-name">${food.name}</span>
            <span class="food-info">${formatMacros(food)}</span>
            <button class="remove-btn" onclick="removeFood('${meal}', ${index})">✕</button>
        </li>
    `).join('');
}

function removeFood(meal, index) {
    meals[meal].splice(index, 1);
    persistAndRefresh(meal);
}

function updateTotals() {
    const totals = Object.values(meals).flat().reduce(
        (acc, food) => ({
            calories: acc.calories + food.calories,
            carbs:    acc.carbs + food.carbs,
            protein:  acc.protein + food.protein,
            fat:      acc.fat + food.fat
        }),
        { calories: 0, carbs: 0, protein: 0, fat: 0 }
    );

    $('total-calories').textContent = Math.round(totals.calories);
    $('total-carbs').textContent    = totals.carbs.toFixed(1) + 'g';
    $('total-protein').textContent  = totals.protein.toFixed(1) + 'g';
    $('total-fat').textContent      = totals.fat.toFixed(1) + 'g';
}

// ==================== PESQUISA API ====================

async function searchFood() {
    const query = $('food-search').value;
    const resultsDiv = $('search-results');
    
    if (!query.trim()) {
        resultsDiv.innerHTML = 'Digite um alimento para pesquisar.';
        return;
    }

    resultsDiv.innerHTML = 'Pesquisando...';

    try {
        const response = await fetch(`/api/search?food=${encodeURIComponent(query)}`);
        const data = await response.json();
        const foods = data.foods?.food;

        if (foods) {
            resultsDiv.innerHTML = foods.slice(0, 5).map(food => `
                <div class="search-result-item">
                    <strong>${food.food_name}</strong>
                    <p>${food.food_description}</p>
                    <button onclick="selectFood('${food.food_name.replace(/'/g, "\\'")}', '${food.food_description.replace(/'/g, "\\'")}')">Selecionar</button>
                </div>
            `).join('');
        } else {
            resultsDiv.innerHTML = 'Nenhum resultado encontrado.';
        }
    } catch (error) {
        resultsDiv.innerHTML = 'Erro na pesquisa.';
        console.error(error);
    }
}

function selectFood(name, description) {
    const nutr = parseNutrition(description);

    // Extrair porção base (ex: "Per 100g") e normalizar para 100g
    const baseGrams = extractNumber(description, /Per\s+(\d+)\s*g\b/i) || 100;
    const factor = 100 / baseGrams;

    closeModal();
    openQuantityModal({
        name,
        caloriesPer100: nutr.calories * factor,
        carbsPer100:    nutr.carbs * factor,
        proteinPer100:  nutr.protein * factor,
        fatPer100:      nutr.fat * factor
    });
}

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
    refreshUI();

    // Atualizar preview ao digitar quantidade
    const qtyInput = $('quantity-input');
    if (qtyInput) {
        qtyInput.addEventListener('input', updateQuantityPreview);
        qtyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirmQuantity();
        });
    }
});