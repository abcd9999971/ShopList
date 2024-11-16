// 全局變數
let products = [];
const cart = [];

// 從本地TSV檔案讀取資料
async function loadProductsFromTSV() {
    try {
        const response = await fetch('ssf08.tsv');
        const text = await response.text();
        const lines = text.split('\n');
        
        // 跳過標題行，處理資料行
        products = lines.slice(1)
            .filter(line => line.trim()) // 過濾空行
            .map((line, index) => {
                // 根據新的TSV格式調整欄位映射
                const [stallNumber, type, character, name, price, pic, recommended] = line.split('\t');
                return {
                    id: index + 1,
                    stallNumber: stallNumber.trim(), // 攤位號
                    type: type.trim(),      // 情況
                    character: character.trim(), // 角色/CP
                    name: name.trim(),      // 內容
                    price: parseInt(price.trim(), 10),
                    pic: pic.trim(),
                    recommended: recommended?.trim().toUpperCase() === 'TRUE' // 刺寶優選
                };
            });

        // 更新網頁顯示
        updateFilters();
        renderProducts();
    } catch (error) {
        console.error('Error loading TSV file:', error);
        console.error('Error details:', error.message);
    }
}

// 更新篩選器
function updateFilters() {
    // 重新獲取唯一值
    const stallNumbers = new Set(products.map(p => p.stallNumber));
    const types = new Set(products.map(p => p.type));
    const characters = new Set(products.map(p => p.character));

    // 更新攤位篩選器
    const stallFilter = document.getElementById('stallFilter');
    stallFilter.innerHTML = '<option value="">全部攤位</option>';
    Array.from(stallNumbers).sort().forEach(stall => {
        const option = document.createElement('option');
        option.value = stall;
        option.textContent = `攤位 ${stall}`;
        stallFilter.appendChild(option);
    });

    // 更新類型篩選器
    const typeFilter = document.getElementById('typeFilter');
    typeFilter.innerHTML = '<option value="">全部類型</option>';
    Array.from(types).sort().forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeFilter.appendChild(option);
    });

    // 更新角色篩選器
    const characterFilter = document.getElementById('characterFilter');
    characterFilter.innerHTML = '<option value="">全部角色/CP</option>';
    Array.from(characters).sort().forEach(character => {
        const option = document.createElement('option');
        option.value = character;
        option.textContent = character;
        characterFilter.appendChild(option);
    });

    // 更新推薦篩選器
    const recommendedFilter = document.getElementById('recommendedFilter');
    recommendedFilter.innerHTML = `
        <option value="">全部</option>
        <option value="true">刺包優選</option>
        <option value="false">其餘</option>
    `;
}

// 篩選商品
function filterProducts() {
    const selectedStall = document.getElementById('stallFilter').value;
    const selectedType = document.getElementById('typeFilter').value;
    const selectedCharacter = document.getElementById('characterFilter').value;
    const selectedRecommended = document.getElementById('recommendedFilter').value;

    const filteredProducts = products.filter(product => {
        const stallMatch = !selectedStall || product.stallNumber === selectedStall;
        const typeMatch = !selectedType || product.type === selectedType;
        const characterMatch = !selectedCharacter || product.character === selectedCharacter;
        // 處理推薦篩選
        const recommendedMatch = !selectedRecommended || 
            (selectedRecommended === 'TRUE' ? product.recommended : !product.recommended);
        
        return stallMatch && typeMatch && characterMatch && recommendedMatch;
    });

    renderProducts(filteredProducts);
}

// 渲染商品列表
function renderProducts(productsToRender = products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    
    productsToRender.forEach(product => {
        const div = document.createElement('div');
        div.className = `product-card ${product.recommended ? 'recommended' : ''}`;
        div.innerHTML = `
            <img src="${product.pic}" alt="${product.name}" class="product-image">
            <div>
                <span class="stall-number">${product.stallNumber}</span>
                <span class="type-tag type-${product.type}">${product.type}</span>
                ${product.recommended ? '<span class="recommended-tag">刺包優選</span>' : ''}
            </div>
            <span class="character-tag">${product.character}</span>
            <h3>${product.name}</h3>
            <p class="price">¥${product.price}</p>
            <button onclick="addToCart(${product.id}, '${product.stallNumber}', 
                '${product.type}', '${product.character}',
                '${product.name.replace("'", "\\'")}', ${product.price})">
                加入清單
            </button>
        `;
        productList.appendChild(div);
    });
}

// 添加到購物車
function addToCart(id, stallNumber, type, character, name, price) {
    cart.push({ id, stallNumber, type, character, name, price, purchased: false });
    renderCart();
}

// 切換購買狀態
function togglePurchased(index) {
    cart[index].purchased = !cart[index].purchased;
    renderCart();
}

// 從購物車移除
function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

// 渲染購物車
function renderCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';
    
    let purchasedTotal = 0;
    let unpurchasedTotal = 0;

    cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div style="display: flex; align-items: center;">
                <input type="checkbox" 
                    ${item.purchased ? 'checked' : ''} 
                    onchange="togglePurchased(${index})">
                <span>
                    <strong>${item.stallNumber}</strong>
                    <span class="type-tag type-${item.type}">${item.type}</span>
                    <span class="character-tag">${item.character}</span>
                    ${item.name} - 
                    <span class="price">¥${item.price}</span>
                </span>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${index})">移除</button>
        `;
        cartItems.appendChild(div);

        if (item.purchased) {
            purchasedTotal += item.price;
        } else {
            unpurchasedTotal += item.price;
        }
    });

    document.getElementById('purchased-total').textContent = purchasedTotal;
    document.getElementById('unpurchased-total').textContent = unpurchasedTotal;
}

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', loadProductsFromTSV);