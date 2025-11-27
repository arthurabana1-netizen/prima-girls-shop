// --- CONFIGURATION ---
// I have inserted your specific Google Sheet Link here:
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCp9HDFZI7AodQIJN4zyTLWbLy2LK9ORzxT9QtJMe8ggTVOYeknYent5E9Gp_BzZpIzsaUB0RWxzr7/pub?output=csv'; 

// I have inserted your phone number (formatted for WhatsApp without the '+'):
const ADMIN_PHONE = '250786023627'; 
// ---------------------

let products = []; 
let cart = [];

// NEW LOGO URL 
const FALLBACK_LOGO_URL = 'https://i.postimg.cc/g0K6WDxZ/prima-girls-shop-logo-2.png';

// 1. Fetch Products from Google Sheet (unchanged)
async function loadProducts() {
    const container = document.getElementById('product-container');
    
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        
        products = parseCSV(data);
        
        if (products.length === 0) {
            container.innerHTML = '<div class="loading">No products found. Ensure spreadsheet has required columns.</div>';
        } else {
            // Initialize the background and slider components
            initBackgroundFader();
            initHeroSlider();
            
            // Render the main product grid
            renderProducts(products); 
        }

    } catch (error) {
        console.error("Error loading sheet:", error);
        container.innerHTML = '<div class="loading">Error loading products. Check sheet link or CORS (use Live Server).</div>';
    }
}

// Helper: Simple CSV Parser (unchanged)
function parseCSV(csvText) {
    const rows = csvText.split('\n').map(row => row.split(','));
    const headers = rows[0].map(h => h.trim().toLowerCase());
    
    const data = [];
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < headers.length) continue;
        
        const obj = {};
        headers.forEach((header, index) => {
            let value = row[index] ? row[index].replace(/"/g, '').trim() : '';
            if (header === 'image') header = 'frontview';
            
            obj[header] = value;
        });
        
        if(obj.name) data.push(obj);
    }
    return data;
}

// 2. Filtering and Searching Logic (unchanged)
function filterAndSearch() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    
    let filteredList = products.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(searchInput);
        const categoryMatch = (product.category && product.category.toLowerCase().includes(searchInput));
        const colorMatch = (product.color && product.color.toLowerCase().includes(searchInput));
        const sizeMatch = (product.size && product.size.toLowerCase().includes(searchInput));

        return nameMatch || categoryMatch || colorMatch || sizeMatch;
    });

    renderProducts(filteredList);
}


// 3. Render Products Grouped by Category (updated image fallback)
function renderProducts(productList) {
    const container = document.getElementById('product-container');
    container.innerHTML = ''; 

    if (productList.length === 0) {
        container.innerHTML = '<p class="loading">No products match your current search terms.</p>';
        return;
    }

    const groupedProducts = productList.reduce((acc, product) => {
        const category = product.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(product);
        return acc;
    }, {});

    for (const category in groupedProducts) {
        const titleBar = document.createElement('h3');
        titleBar.classList.add('category-title');
        titleBar.textContent = category;
        container.appendChild(titleBar);

        const grid = document.createElement('div');
        grid.classList.add('product-grid');
        
        groupedProducts[category].forEach((product) => {
            const card = document.createElement('div');
            card.classList.add('product-card');
            
            // Use FALLBACK_LOGO_URL if no specific image is found
            const imgSource = product.frontview || product.image || FALLBACK_LOGO_URL;
            const color = product.color || 'transparent';
            const size = product.size ? `(${product.size})` : '';

            card.onclick = (e) => {
                // Open preview modal if clicking anywhere but the "Add to Cart" button
                if (!e.target.classList.contains('add-btn')) {
                    openPreviewModal(product);
                }
            };

            const productIndex = products.findIndex(p => p.name === product.name && p.price === product.price);

            card.innerHTML = `
                <img src="${imgSource}" alt="${product.name}" class="product-img">
                <div class="product-info">
                    <div class="product-name">
                        <span>${product.name}</span>
                        <div class="product-specs">
                            <span class="color-swatch" style="background-color: ${color};" title="Color: ${color}"></span>
                            <span class="product-size">${size}</span>
                        </div>
                    </div>
                    <div class="product-price">${product.price} RWF</div>
                    <button class="add-btn" onclick="addToCart(${productIndex})">Add to Cart</button>
                </div>
            `;
            grid.appendChild(card);
        });
        
        container.appendChild(grid);
    }
}


// 4. Initialize Background Fader (unchanged)
function initBackgroundFader() {
    const uniqueImages = [...new Set(products.map(p => p.frontview || p.image).filter(Boolean))];
    
    if (uniqueImages.length < 2) return; 

    const faderContainer = document.getElementById('background-fader');
    if (!faderContainer) return;

    const imagesToDisplay = uniqueImages.slice(0, 5); 

    imagesToDisplay.forEach((imgUrl, index) => {
        const bgDiv = document.createElement('div');
        bgDiv.classList.add('bg-image');
        bgDiv.style.backgroundImage = `url('${imgUrl}')`;
        bgDiv.style.animationDelay = `${index * 4}s`; 
        faderContainer.appendChild(bgDiv);
    });
}

// 5. Initialize Hero Slider (updated image fallback)
function initHeroSlider() {
    const track = document.getElementById('slider-track');
    if (!track || products.length === 0) return;

    const originalProducts = products;
    
    // Duplicate products for a seamless looping animation
    const sliderProducts = [...originalProducts, ...originalProducts]; 
    const itemWidth = 150; // Must match CSS .slider-item width
    const itemMargin = 15; // Must match CSS .slider-item margin-right
    const animationSpeed = 4.0; // seconds per item

    track.innerHTML = ''; 

    sliderProducts.forEach(product => {
        const item = document.createElement('div');
        item.classList.add('slider-item');
        
        // Use FALLBACK_LOGO_URL if no specific image is found
        const imgSource = product.frontview || product.image || FALLBACK_LOGO_URL;
        
        item.onclick = () => openPreviewModal(product);

        item.innerHTML = `
            <img src="${imgSource}" alt="${product.name}">
            <div class="slider-text">${product.name}</div>
        `;
        track.appendChild(item);
    });
    
    // --- CRITICAL FIX: Calculate and enforce the track width ---
    
    // 1. Calculate the distance for ONE full loop (original product set)
    const originalCount = originalProducts.length;
    const slideDistance = originalCount * (itemWidth + itemMargin); 
    
    // 2. Calculate the total physical width of the track (including duplicates)
    const totalTrackWidth = sliderProducts.length * (itemWidth + itemMargin);
    
    // 3. Set the physical width so the items don't wrap
    track.style.width = `${totalTrackWidth}px`; 

    // 4. Set CSS variable for the @keyframes animation to read the distance of ONE loop
    document.documentElement.style.setProperty('--slide-width', `-${slideDistance}px`);
    
    // 5. Set animation duration (time taken to slide one full loop)
    track.style.animationDuration = `${originalCount * animationSpeed}s`;
    
    // 6. Ensure animation is enabled
    track.style.animationPlayState = 'running';
}


// 6. Product Preview Modal Functions (updated image fallback)
function openPreviewModal(product) {
    const modal = document.getElementById('preview-modal');
    const detailsDiv = document.getElementById('preview-details');
    
    const frontView = product.frontview || product.image;
    const color = product.color || 'N/A';
    const size = product.size || 'N/A';

    const galleryHtml = `
        <div class="preview-gallery">
            ${createImageViewer(frontView, 'Front View')}
            ${createImageViewer(product.topview, 'Top View')}
            ${createImageViewer(product.bottomview, 'Bottom View')}
            ${createImageViewer(product.backview, 'Back View')}
        </div>
    `;
    
    const productIndex = products.findIndex(p => p.name === product.name && p.price === product.price);

    detailsDiv.innerHTML = `
        <h3>${product.name}</h3>
        <p class="preview-price">${product.price} RWF</p>
        <p><strong>Color:</strong> <span class="color-swatch" style="background-color: ${color};"></span> ${color}</p>
        <p style="margin-bottom: 20px;"><strong>Size:</strong> ${size}</p>
        
        ${galleryHtml}
        
        <button class="preview-add-btn" onclick="addAndClosePreview(${productIndex})">
            Add to Cart
        </button>
    `;

    modal.style.display = 'flex';
}

function createImageViewer(link, title) {
    // Use FALLBACK_LOGO_URL if no specific image is found
    const finalLink = link || FALLBACK_LOGO_URL;
    const finalTitle = link ? title : 'Image Not Found (Placeholder)';

    // Only return the HTML if a link exists (either real or fallback)
    if (!finalLink) return ''; 
    return `
        <div class="preview-image-container">
            <img src="${finalLink}" alt="${finalTitle}">
            <p style="margin-top: 5px; font-size: 0.85rem; color: var(--light-text);">${finalTitle}</p>
        </div>
    `;
}


function closePreviewModal() {
    document.getElementById('preview-modal').style.display = 'none';
}

function addAndClosePreview(index) {
    addToCart(index);
    closePreviewModal();
}


// 7. Cart Logic (unchanged)
function addToCart(index) {
    cart.push(products[index]);
    updateCartUI();
    toggleCart(); 
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
        const priceNumber = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        total += priceNumber;
        
        const color = item.color || 'N/A';
        const size = item.size || 'N/A';

        const div = document.createElement('div');
        div.classList.add('cart-item');
        
        div.innerHTML = `
            <span>${item.name}</span>
            <div class="cart-specs">
                <span class="color-swatch" style="background-color: ${color};" title="Color: ${color}"></span> 
                ${size}
            </div>
            <div class="cart-price-remove">
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

// 8. WhatsApp Integration (unchanged)
function checkoutViaWhatsApp() {
    if (cart.length === 0) {
        alert("Cart is empty!");
        return;
    }

    let message = "Muraho, Nashakaga gutumiza ibi:\n\n";
    let total = 0;

    cart.forEach(item => {
        const priceNumber = parseInt(item.price.replace(/[^0-9]/g, '')) || 0;
        const color = item.color || 'N/A';
        const size = item.size ? ` (Size: ${item.size})` : '';
        
        message += `- ${item.name} ${size} [Color: ${color}]: ${item.price} RWF\n`;
        total += priceNumber;
    });

    message += `\n*Igiciro Cyose: ${total} RWF*`;
    message += `\n\nMwambwira niba biboneka.`;

    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
}

function openChat() {
    const message = "Hello, I have a question about your products.";
    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// Start app
loadProducts();