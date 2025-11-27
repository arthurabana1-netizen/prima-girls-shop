// --- CONFIGURATION ---
// I have inserted your specific Google Sheet Link here:
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCp9HDFZI7AodQIJN4zyTLWbLy2LK9ORzxT9QtJMe8ggTVOYeknYent5E9Gp_BzZpIzsaUB0RWxzr7/pub?output=csv'; 

// I have inserted your phone number (formatted for WhatsApp without the '+'):
const ADMIN_PHONE = '250786023627'; 
// ---------------------

let products = [];
let cart = [];

// 1. Fetch Products from Google Sheet
async function loadProducts() {
    const container = document.getElementById('product-container');
    
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        
        // Parse CSV text to Array
        products = parseCSV(data);
        
        // Check if products were found
        if (products.length === 0) {
            container.innerHTML = '<div class="loading">No products found in sheet. Check headers (Name, Price, Image).</div>';
        } else {
            renderProducts(products);
        }

    } catch (error) {
        console.error("Error loading sheet:", error);
        container.innerHTML = '<div class="loading">Error loading products. Check internet connection.</div>';
    }
}

// Helper: Simple CSV Parser
function parseCSV(csvText) {
    // Split into rows and clean up empty rows
    const rows = csvText.split('\n').map(row => row.split(','));
    
    // Get headers (Name, Price, Image) - assumes they are in the first row
    const headers = rows[0].map(h => h.trim().toLowerCase());
    
    const data = [];
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        // Skip incomplete rows
        if (row.length < headers.length) continue;
        
        const obj = {};
        headers.forEach((header, index) => {
            // Remove extra quotes if present and trim whitespace
            let value = row[index] ? row[index].replace(/"/g, '').trim() : '';
            obj[header] = value;
        });
        
        // Only add if there is a product name
        if(obj.name) data.push(obj);
    }
    return data;
}

// 2. Render Products to HTML
function renderProducts(productList) {
    const container = document.getElementById('product-container');
    container.innerHTML = ''; // Clear loading text

    productList.forEach((product, index) => {
        const card = document.createElement('div');
        card.classList.add('product-card');
        
        // Use a placeholder if image link is missing
        const imgSource = product.image ? product.image : 'https://via.placeholder.com/150?text=No+Image';

        card.innerHTML = `
            <img src="${imgSource}" alt="${product.name}" class="product-img">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">${product.price} RWF</div>
                <button class="add-btn" onclick="addToCart(${index})">Add to Cart</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// 3. Cart Logic
function addToCart(index) {
    cart.push(products[index]);
    updateCartUI();
    toggleCart(); // Open cart immediately to show user
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    
    cartItemsDiv.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        // Clean price string to ensure it's a number (remove 'RWF', commas, etc)
        const priceNumber = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        total += priceNumber;

        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `
            <span>${item.name}</span>
            <div>
                <span>${item.price}</span>
                <i class="fa-solid fa-trash remove-item" onclick="removeFromCart(${index})"></i>
            </div>
        `;
        cartItemsDiv.appendChild(div);
    });

    if (cart.length === 0) cartItemsDiv.innerHTML = '<p>Your cart is empty.</p>';
    
    cartCount.innerText = cart.length;
    cartTotal.innerText = total;
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

// 4. WhatsApp Integration (Checkout & Chat)

// Sends the Order
function checkoutViaWhatsApp() {
    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    let message = "Muraho, Nashakaga :\n\n";
    let total = 0;

    cart.forEach(item => {
        const priceNumber = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        message += `- ${item.name}: ${item.price} RWF\n`;
        total += priceNumber;
    });

    message += `\n*Total Price: ${total} RWF*`;
    message += `\n\nMwambwira niba biboneka.`;

    // Encode the text for URL
    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(url, '_blank');
}

// Opens General Chat
function openChat() {
    const message = "Hello, I have a question about your products.";
    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// Start app
loadProducts();