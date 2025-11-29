

//API CONFIGURATION 
const API_MEAL_DB = 'https://www.themealdb.com/api/json/v1/1';
const API_COCKTAIL_DB = 'https://www.thecocktaildb.com/api/json/v1/1';
const API_OPEN_FOOD_FACTS = 'https://world.openfoodfacts.org';

//DOM ELEMENTS 
const splatterContainer = document.getElementById('splatter-container');
const navbar = document.getElementById('navbar');
const heroSearchButton = document.getElementById('hero-search-button');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const categoryRecipesContainer = document.getElementById('category-recipes-container');
const categoryTabs = document.querySelectorAll('.category-tab');
const rotatingPlate = document.getElementById('rotating-plate');
const contentSection = document.getElementById('content-section');
const messageArea = document.getElementById('message-area');
const resultsGrid = document.getElementById('results-grid');
const recipeModal = document.getElementById('recipe-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const recipeDetailsContent = document.getElementById('recipe-details-content');





//  message to user
function showMessage(message, type = 'info') {
    messageArea.textContent = message;
    messageArea.className = `message ${type}`;
    messageArea.style.display = 'block';
}

// Show loading message
function showLoading(message = 'Loading recipes...') {
    messageArea.innerHTML = `<span class="loading-spinner"></span>${message}`;
    messageArea.className = 'message loading';
    messageArea.style.display = 'block';
}

// Hide message
function hideMessage() {
    messageArea.style.display = 'none';
    messageArea.textContent = '';
}

// Clear results grid
function clearResults() {
    resultsGrid.innerHTML = '';
}

// Normalize data from different APIs
function normalizeData(item, source) {
    if (source === 'mealdb') {
        return {
            id: item.idMeal,
            name: item.strMeal,
            image: item.strMealThumb,
            category: item.strCategory,
            area: item.strArea,
            source: 'mealdb',
            original: item
        };
    } else if (source === 'cocktaildb') {
        return {
            id: item.idDrink,
            name: item.strDrink,
            image: item.strDrinkThumb,
            category: item.strCategory,
            area: item.strAlcoholic, // Using alcoholic status as area/type
            source: 'cocktaildb',
            original: item
        };
    } else if (source === 'openfoodfacts') {
        return {
            id: item.code, 
            name: item.product_name || 'Unknown Product',
            image: item.image_front_url || 'https://placehold.co/300x300?text=No+Image',
            category: item.categories_tags ? item.categories_tags[0].replace('en:', '') : 'Unknown',
            area: item.brands || 'Unknown Brand',
            source: 'openfoodfacts',
            original: item
        };
    }
    return null;
}



// Fetch from TheMealDB
async function fetchMeals(query) {
    try {
        const response = await fetch(`${API_MEAL_DB}/search.php?s=${encodeURIComponent(query)}`);
        const data = await response.json();
        return (data.meals || []).map(item => normalizeData(item, 'mealdb'));
    } catch (error) {
        console.error('MealDB Error:', error);
        return [];
    }
}

// Fetch from TheCocktailDB
async function fetchCocktails(query) {
    try {
        const response = await fetch(`${API_COCKTAIL_DB}/search.php?s=${encodeURIComponent(query)}`);
        const data = await response.json();
        return (data.drinks || []).map(item => normalizeData(item, 'cocktaildb'));
    } catch (error) {
        console.error('CocktailDB Error:', error);
        return [];
    }
}

// Fetch from OpenFoodFacts
async function fetchProducts(query) {
    try {
        // Using the search API for OpenFoodFacts
        const response = await fetch(`${API_OPEN_FOOD_FACTS}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`);
        const data = await response.json();
        return (data.products || []).map(item => normalizeData(item, 'openfoodfacts'));
    } catch (error) {
        console.error('OpenFoodFacts Error:', error);
        return [];
    }
}

// Search all APIs
async function searchAll(query) {
    showLoading(`Searching for "${query}" in Meals , Drinks and Products...`);
    clearResults();

    try {
        const [meals, cocktails, products] = await Promise.all([
            fetchMeals(query),
            fetchCocktails(query),
            fetchProducts(query)
        ]);

        const allResults = [...meals, ...cocktails, ...products];

        if (allResults.length > 0) {
            hideMessage();
            displayRecipes(allResults);
        } else {
            showMessage(`No results found for "${query}". Try another term!`, 'error');
        }
    } catch (error) {
        console.error('Search Error:', error);
        showMessage('An error occurred while searching. Please try again.', 'error');
    }
}

// Get recipes by category 
async function getRecipesByCategory(category) {
    try {
        const response = await fetch(`${API_MEAL_DB}/filter.php?c=${encodeURIComponent(category)}`);
        const data = await response.json();

        if (data.meals) {
            return data.meals.slice(0, 6).map(item => normalizeData(item, 'mealdb'));
        }
        return [];
    } catch (error) {
        console.error('Error fetching category recipes:', error);
        return [];
    }
}

// Display category recipes
function displayCategoryRecipes(recipes) {
    categoryRecipesContainer.innerHTML = '';

    recipes.forEach(item => {
        const card = document.createElement('div');
        card.className = 'category-recipe-card';
        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}" loading="lazy">
            <h4>${item.name}</h4>
        `;

        card.addEventListener('click', () => {
            getDetails(item);
        });

        categoryRecipesContainer.appendChild(card);
    });
}

// Load initial category
async function loadInitialCategory() {
    const recipes = await getRecipesByCategory('Breakfast');
    displayCategoryRecipes(recipes);
}

// Get details based on source
async function getDetails(item) {
    if (item.source === 'mealdb') {
        
        try {
            const response = await fetch(`${API_MEAL_DB}/lookup.php?i=${item.id}`);
            const data = await response.json();
            if (data.meals && data.meals[0]) {
                displayDetails(normalizeData(data.meals[0], 'mealdb'));
            }
        } catch (e) {
            console.error(e);
            showMessage('Failed to load details', 'error');
        }
    } else if (item.source === 'cocktaildb') {
        try {
            const response = await fetch(`${API_COCKTAIL_DB}/lookup.php?i=${item.id}`);
            const data = await response.json();
            if (data.drinks && data.drinks[0]) {
                displayDetails(normalizeData(data.drinks[0], 'cocktaildb'));
            }
        } catch (e) {
            console.error(e);
            showMessage('Failed to load details', 'error');
        }
    } else if (item.source === 'openfoodfacts') {
        
        displayDetails(item);
    }
}




// Display results in grid
function displayRecipes(items) {
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'recipe-item';
       
        let badgeColor = '#FACC15'; 
        let badgeText = 'Meal';
        if (item.source === 'cocktaildb') { badgeColor = '#ff6b6b'; badgeText = 'Drink'; }
        if (item.source === 'openfoodfacts') { badgeColor = '#4caf50'; badgeText = 'Product'; }

        card.innerHTML = `
            <div style="position: relative;">
                <span style="position: absolute; top: 10px; right: 10px; background: ${badgeColor}; color: #000; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">${badgeText}</span>
                <img src="${item.image}" alt="${item.name}" loading="lazy">
            </div>
            <h3>${item.name}</h3>
        `;

        card.addEventListener('click', () => {
            getDetails(item);
        });

        resultsGrid.appendChild(card);
    });
}

// Display details in modal
function displayDetails(item) {
    const data = item.original;
    let content = '';

    if (item.source === 'mealdb' || item.source === 'cocktaildb') {
        
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = data[`strIngredient${i}`];
            const measure = data[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
                ingredients.push(`${measure ? measure.trim() : ''} ${ingredient.trim()}`);
            }
        }

        let videoEmbed = '';
        if (data.strYoutube) {
            const videoId = data.strYoutube.split('v=')[1];
            if (videoId) {
                videoEmbed = `
                    <h3>Video Tutorial</h3>
                    <div class="video-wrapper">
                        <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                    </div>
                `;
            }
        }

        content = `
            <h2>${item.name}</h2>
            <img src="${item.image}" alt="${item.name}">
            <p><strong>Category:</strong> ${item.category || 'N/A'}</p>
            <p><strong>Type:</strong> ${item.area || 'N/A'}</p>
            <h3>Ingredients</h3>
            <ul>${ingredients.map(ing => `<li>${ing}</li>`).join('')}</ul>
            <h3>Instructions</h3>
            <p>${data.strInstructions || 'No instructions available.'}</p>
            ${videoEmbed}
            ${data.strSource ? `<p><a href="${data.strSource}" target="_blank">View Source</a></p>` : ''}
        `;
    } else if (item.source === 'openfoodfacts') {
        // Handle OpenFoodFacts
        content = `
            <h2>${item.name}</h2>
            <img src="${item.image}" alt="${item.name}">
            <p><strong>Brand:</strong> ${data.brands || 'N/A'}</p>
            <p><strong>Categories:</strong> ${item.category}</p>
            ${data.ingredients_text ? `<h3>Ingredients</h3><p>${data.ingredients_text}</p>` : ''}
            ${data.nutriments ? `
                <h3>Nutrition (per 100g)</h3>
                <ul>
                    <li>Energy: ${data.nutriments['energy-kcal_100g'] || 0} kcal</li>
                    <li>Fat: ${data.nutriments.fat_100g || 0}g</li>
                    <li>Carbs: ${data.nutriments.carbohydrates_100g || 0}g</li>
                    <li>Proteins: ${data.nutriments.proteins_100g || 0}g</li>
                </ul>
            ` : ''}
            <p><a href="https://world.openfoodfacts.org/product/${item.id}" target="_blank">View on OpenFoodFacts</a></p>
        `;
    }

    recipeDetailsContent.innerHTML = content;
    recipeModal.classList.remove('hidden');
}



// Hero search button
if (heroSearchButton) {
    heroSearchButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (contentSection) {
            contentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

// Search form submission
if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            searchAll(query);
        }
    });
}

// Category tab click handlers
if (categoryTabs) {
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const category = tab.getAttribute('data-category');
            const recipes = await getRecipesByCategory(category);
            displayCategoryRecipes(recipes);
        });
    });
}

// Modal close button
if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
        recipeModal.classList.add('hidden');
    });
}

// Close modal when clicking outside
if (recipeModal) {
    recipeModal.addEventListener('click', (e) => {
        if (e.target === recipeModal) {
            recipeModal.classList.add('hidden');
        }
    });
}



document.addEventListener('DOMContentLoaded', () => {
    const vh = window.innerHeight;

   // Realistic Spray Paint 
    function generateSplatter(container, count) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * 7 + 3;
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const opacity = Math.random() * 0.7 + 0.3;

            particle.classList.add('splatter-particle');
            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${x}%;
                bottom: ${y}%;
                opacity: ${opacity};
                filter: blur(${size * 0.1}px);
            `;
            container.appendChild(particle);
        }
    }

    if (splatterContainer) {
        generateSplatter(splatterContainer, 80);
    }

    //  Scroll Logic  Splatter Shrink 
    const initialScale = 1.0;
    const finalScale = 0.05;
    const initialOpacity = 1.0;
    const finalOpacity = 0.0;
    const scrollThreshold = vh * 0.8;

    function updateSplatter() {
        const scrollY = window.scrollY;
        const scrollProgress = Math.min(1, scrollY / scrollThreshold);

        const currentScale = initialScale - (initialScale - finalScale) * scrollProgress;
        const currentOpacity = initialOpacity - (initialOpacity - finalOpacity) * scrollProgress;

        if (splatterContainer) {
            splatterContainer.style.transform = `scale(${Math.max(finalScale, currentScale)})`;
            splatterContainer.style.opacity = `${Math.max(finalOpacity, currentOpacity)}`;
        }
    }


    function updatePlateRotation() {
        if (rotatingPlate) {
            const scrollY = window.scrollY;
            const additionalRotation = scrollY * 0.1;
            rotatingPlate.style.transform = `rotate(${additionalRotation}deg)`;
        }
    }

    
    window.addEventListener('scroll', () => {
        updateSplatter();
        
        updatePlateRotation();
    });

   
    updateSplatter();

    // Load initial category recipes
    loadInitialCategory();
});


//  NAVBAR SHOW
let lastScrollY = window.scrollY;

window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;

    
    if (currentScroll > lastScrollY) {
        navbar.style.top = "-80px"; 
    } 
   
    else {
        navbar.style.top = "0";
    }

    lastScrollY = currentScroll;
});
