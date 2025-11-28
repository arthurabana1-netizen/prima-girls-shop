// --- CONFIGURATION ---
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCp9HDFZI7AodQIJN4zyTLWbLy2LK9ORzxT9QtJMe8ggTVOYeknYent5E9Gp_BzZpIzsaUB0RWxzr7/pub?output=csv'; 
const ADMIN_PHONE = '250786023627'; 
const FALLBACK_LOGO = 'https://i.postimg.cc/g0K6WDxZ/prima-girls-shop-logo-2.png';

// Time in milliseconds to wait before cycling images on hover.
// Currently set to 2000ms (2 seconds). Change to 15000ms if you require 15 seconds.
const HOVER_DELAY = 2000; 
// ---------------------

let products = []; 
let cart = [];
let slideIndex = 0;

// 1. Initialize
async function loadProducts() {
    const container = document.getElementById('product-container');
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        products = parseCSV(data);
        
        if (products.length > 0) {
            initSlider();
            renderProducts(products);
        } else {
            container.innerHTML = 'No products found.';
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = 'Error loading products.';
    }
}

function parseCSV(csv) {
    const rows = csv.split('\n').map(row => row.split(','));
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const data = [];
    for(let i=1; i<rows.length; i++) {
        let row = rows[i];
        if(row.length < headers.length) continue;
        let obj = {};
        headers.forEach((h, idx) => obj[h] = row[idx] ? row[idx].replace(/"/g, '').trim() : '');
        if(obj.name) data.push(obj);
    }
    return data;
}

// 2. Render Products with Hover Effect
function renderProducts(list) {
    const container = document.getElementById('product-container');
    container.innerHTML = '';
    
    const grouped = list.reduce((acc, p) => {
        const cat = p.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
    }, {});

    for (const [category, items] of Object.entries(grouped)) {
        const title = document.createElement('h3');
        title.className = 'category-title';
        title.textContent = category;
        container.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'product-grid';

        items.forEach((p) => {
            const globalIndex = products.indexOf(p);
            let img = p.frontview || p.image || FALLBACK_LOGO;
            
            let card = document.createElement('div');
            card.className = 'product-card';
            
            // Generate HTML
            card.innerHTML = `
                <img src="${img}" class="product-img" id="img-${globalIndex}" alt="${p.name}">
                <div class="product-info">
                    <div class="product-name">${p.name}</div>
                    <div class="product-price">${p.price} RWF</div>
                    <button class="add-btn" onclick="addToCart(${globalIndex})">Add to Cart</button>
                </div>
            `;
            
            // Click Event
            card.onclick = (e) => {
                if(!e.target.classList.contains('add-btn')) openPreview(p);
            };

            // HOVER EVENT LOGIC
            const imgElement = card.querySelector('.product-img');
            handleHoverEffect(imgElement, p);

            grid.appendChild(card);
        });

        container.appendChild(grid);
    }
}

// 3. Hover Effect Logic (Fading Views)
function handleHoverEffect(imgElement, product) {
    let hoverTimeout;
    let cycleInterval;
    let viewIndex = 0;
    
    // Collect available views (must have a valid URL)
    const views = [
        product.frontview || product.image,
        product.topview,
        product.bottomview,
        product.backview
    ].filter(url => url && url.length > 5);

    if (views.length <= 1) return; // No need to animate

    imgElement.addEventListener('mouseenter', () => {
        // Wait for specified delay before starting animation
        hoverTimeout = setTimeout(() => {
            cycleInterval = setInterval(() => {
                viewIndex = (viewIndex + 1) % views.length;
                // Fade out
                imgElement.style.opacity = 0;
                setTimeout(() => {
                    imgElement.src = views[viewIndex];
                    // Fade in
                    imgElement.style.opacity = 1;
                }, 200); // Wait for fade out to switch src
            }, 2000); // Switch image every 2 seconds
        }, HOVER_DELAY);
    });

    imgElement.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        clearInterval(cycleInterval);
        // Reset to original view
        imgElement.style.opacity = 1;
        imgElement.src = views[0];
        viewIndex = 0;
    });
}

// 4. Fading Slider
function initSlider() {
    const slider = document.getElementById('hero-slider');
    const slides = products.filter(p => p.frontview || p.image).slice(0, 5);
    
    if(slides.length === 0) return;
    
    slider.style.display = 'block';
    slider.innerHTML = '';
    
    slides.forEach((p, idx) => {
        let div = document.createElement('div');
        div.className = `slider-item ${idx === 0 ? 'active' : ''}`;
        
        div.onclick = () => openPreview(p);

        div.innerHTML = `
            <img src="${p.frontview || p.image}" class="slider-img">
            <div class="slider-caption">${p.name}</div>
        `;
        slider.appendChild(div);
    });
    
    // Auto-cycle the slider
    setInterval(() => {
        let items = document.querySelectorAll('.slider-item');
        if(items.length > 0) {
            items[slideIndex].classList.remove('active');
            slideIndex = (slideIndex + 1) % items.length;
            items[slideIndex].classList.add('active');
        }
    }, 4000); 
}

// 5. Preview Modal (All views displayed)
function openPreview(p) {
    const modal = document.getElementById('preview-modal');
    
    // Define all possible views and their labels
    const viewsData = [
        { url: p.frontview || p.image, label: 'Front View' },
        { url: p.topview, label: 'Top View' },
        { url: p.bottomview, label: 'Bottom View' },
        { url: p.backview, label: 'Back View' },
    ];
    
    // Filter out missing views
    let availableViews = viewsData.filter(v => v.url && v.url.length > 5);

    // If no images are available, use the fallback logo
    if (availableViews.length === 0) {
        availableViews = [{ url: FALLBACK_LOGO, label: 'Image' }];
    } 
    
    // Generate HTML for the gallery, showing image and label
    let imgsHTML = availableViews.map(v => `
        <div class="preview-image-container">
            <img src="${v.url}" class="preview-img" alt="${v.label}">
            <p style="font-size:0.8rem; color:#777; margin-top:5px; margin-bottom: 5px;">${v.label}</p>
        </div>
    `).join('');
    
    const globalIndex = products.indexOf(p);

    document.querySelector('#preview-modal .modal-content').innerHTML = `
        <span class="close-btn" onclick="closePreviewModal()">&times;</span>
        
        <h2 class="preview-header-text">
            <i class="fa-solid fa-arrow-left back-icon" onclick="closePreviewModal()"></i>
            Preview
        </h2>
        
        <div id="preview-details">
            <div class="preview-product-title">${p.name}</div>
            <div class="preview-price">${p.price} RWF</div>
            <div style="font-size:0.9rem; color:#666; margin-bottom:10px;">
                Color: ${p.color || 'N/A'} | Size: ${p.size || 'N/A'}
            </div>
            
            <div class="preview-gallery">${imgsHTML}</div>
            
            <div style="height: 10px;"></div>
        </div>
        
        <button class="preview-add-btn" onclick="addToCart(${globalIndex}); closePreviewModal()">
            Add to Cart
        </button>
    `;
    
    modal.style.display = 'flex';
}

function closePreviewModal() {
    document.getElementById('preview-modal').style.display = 'none';
}

// 6. Cart Logic
function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.classList.toggle('open');
}

function addToCart(idx) {
    cart.push(products[idx]);
    updateCartUI();
    toggleCart(); 
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    const count = document.getElementById('cart-count');
    const totalEl = document.getElementById('cart-total');
    
    container.innerHTML = '';
    let total = 0;
    
    cart.forEach((p, idx) => {
        let price = parseInt(p.price.replace(/[^0-9]/g, '')) || 0;
        total += price;
        
        let div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-details">
                <div class="cart-name-text">${p.name}</div>
                <div class="cart-specs-text">${p.size || ''} ${p.color || ''}</div>
            </div>
            <div>
                <span class="cart-item-price">${p.price}</span>
                <i class="fa-solid fa-trash remove-item" onclick="removeFromCart(${idx})"></i>
            </div>
        `;
        container.appendChild(div);
    });
    
    count.innerText = cart.length;
    totalEl.innerText = total;
    if(cart.length === 0) container.innerHTML = '<p>Your cart is empty.</p>';
}

// 7. Search
function filterAndSearch() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(term));
    renderProducts(filtered);
}

// 8. Checkout
function checkoutViaWhatsApp() {
    if(cart.length === 0) return alert("Cart is empty");
    
    let msg = "Hello, I want to order:\n\n";
    let total = 0;
    cart.forEach(p => {
        let price = parseInt(p.price.replace(/[^0-9]/g, '')) || 0;
        total += price;
        msg += `- ${p.name} (${p.size||''} ${p.color||''}): ${p.price}\n`;
    });
    msg += `\nTotal: ${total} RWF`;
    
    window.open(`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`, '_blank');
}

loadProducts();