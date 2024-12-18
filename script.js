// 全局變數
let products = [];
const cart = [];

// 從本地TSV檔案讀取資料
async function loadProductsFromTSV() {
    try {
        console.log('開始載入TSV文件...'); // 調試日誌
        const response = await fetch('ssf08 - 1.tsv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        console.log('成功獲取TSV文件內容:', text.substring(0, 200) + '...'); // 顯示前200字符

        const lines = text.split('\n');
        console.log('總行數:', lines.length); // 調試日誌

        // 跳過標題行，處理資料行
        products = lines.slice(1)
            .filter(line => {
                const trimmed = line.trim();
                if (!trimmed) {
                    console.log('過濾掉空行');
                    return false;
                }
                return true;
            })
            .map((line, index) => {
                console.log('處理行:', line); // 調試日誌
                const [stallNumber, type, character, name, price, pic, recommended] = line.split('\t');
                const product = {
                    id: index + 1,
                    stallNumber: stallNumber.trim(),
                    type: type.trim(),
                    character: character.trim(),
                    name: name.trim(),
                    price: parseInt(price.trim(), 10),
                    pic: pic.trim(),
                    recommended: recommended?.trim().toUpperCase() === 'TRUE'
                };
                console.log('創建產品對象:', product); // 調試日誌
                return product;
            });

        console.log('處理後的商品數量:', products.length); // 調試日誌
        console.log('商品數據示例:', products[0]); // 調試日誌

        // 更新網頁顯示
        updateFilters();
        renderProducts();
    } catch (error) {
        console.error('載入TSV文件時發生錯誤:', error);
        console.error('錯誤詳情:', error.message);
    }
}

// 更新篩選器
function updateFilters() {
    // 重新獲取唯一值
    const stallNumbers = new Set(products.map(p => p.stallNumber));
    const types = new Set(products.map(p => p.type));
    const characters = new Set(products.map(p => p.character));

    /*
    // 更新攤位篩選器
    const stallFilter = document.getElementById('stallFilter');
    stallFilter.innerHTML = '<option value="">全部攤位</option>';
    Array.from(stallNumbers).sort().forEach(stall => {
        const option = document.createElement('option');
        option.value = stall;
        option.textContent = `攤位 ${stall}`;
        stallFilter.appendChild(option);
    });
*/

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
        <option value="true">刺寶優選</option>
        <option value="false">其餘</option>
    `;
}

// 篩選商品
// 修改 filterProducts 函數
function filterProducts() {
    const selectedType = document.getElementById('typeFilter').value;
    const selectedCharacter = document.getElementById('characterFilter').value;
    const selectedRecommended = document.getElementById('recommendedFilter').value;

    const filteredProducts = products.filter(product => {
        const typeMatch = !selectedType || product.type === selectedType;
        const characterMatch = !selectedCharacter || product.character === selectedCharacter;
        const recommendedMatch = !selectedRecommended || 
            (selectedRecommended === 'true' ? product.recommended === true : product.recommended === false);
        
        return typeMatch && characterMatch && recommendedMatch;
    });

    renderProducts(filteredProducts);
}

// 渲染商品列表
function renderProducts(productsToRender = products) {
    console.log('開始渲染商品列表'); // 調試日誌
    console.log('要渲染的商品數量:', productsToRender.length); // 調試日誌

    const productList = document.getElementById('product-list');
    if (!productList) {
        console.error('找不到product-list元素!');
        return;
    }

    productList.innerHTML = '';
    
    productsToRender.forEach((product, index) => {
        console.log(`渲染第 ${index + 1} 個商品:`, product); // 調試日誌

        const div = document.createElement('div');
        div.className = `product-card ${product.recommended ? 'recommended' : ''}`;
        div.innerHTML = `
            <img src="${product.pic}" alt="${product.name}" class="product-image">
            <div>
                <span class="stall-number">${product.stallNumber}</span>
                <span class="type-tag type-${product.type}">${product.type}</span>
                ${product.recommended ? '<span class="recommended-tag">刺寶優選</span>' : ''}
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
        console.log(`商品 ${index + 1} 渲染完成`); // 調試日誌
    });

    console.log('商品列表渲染完成'); // 調試日誌
}

// 添加到購物車
function addToCart(id, stallNumber, type, character, name, price) {
    // 從products數組中找到對應的商品以獲取圖片URL
    const product = products.find(p => p.id === id);
    cart.push({ 
        id, 
        stallNumber, 
        name, 
        price, 
        purchased: false,
        pic: product.pic // 添加圖片URL
    });
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

// 在 script.js 中添加新函數
function clearCart() {
    // 顯示確認對話框
    if (cart.length === 0) {
        alert('購物清單已經是空的！');
        return;
    }
    
    if (confirm('確定要清空購物清單嗎？')) {
        // 清空購物車陣列
        cart.length = 0;
        // 更新購物車顯示
        renderCart();
    }
}

// 渲染購物車
function renderCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';
    
    let purchasedTotal = 0;
    let unpurchasedTotal = 0;

    // 添加清空購物車按鈕
    const clearButton = document.createElement('button');
    clearButton.textContent = '清空購物清單';
    clearButton.onclick = clearCart;
    clearButton.style.marginBottom = '20px';
    clearButton.style.background = '#ff7675'; // 使用紅色背景
    clearButton.style.width = 'auto';
    clearButton.style.padding = '8px 16px';
    clearButton.style.fontSize = '1em';
    
    // 將清空按鈕添加到購物車頂部
    cartItems.appendChild(clearButton);

    cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div style="display: flex; align-items: center;">
                <input type="checkbox" 
                    ${item.purchased ? 'checked' : ''} 
                    onchange="togglePurchased(${index})">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <img src="${item.pic}" class="cart-item-image" alt="${item.name}">
                    <span>
                        <strong class="stall-number">${item.stallNumber}</strong>
                        ${item.name}
                    </span>
                </div>
            </div>
            <div style="display: flex; align-items: center;">
                <span class="price">¥${item.price}</span>
                <button class="remove-btn" onclick="removeFromCart(${index})">移除</button>
            </div>
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

// 在 script.js 中添加新函數
function addAllRecommendedToCart() {
    // 過濾出所有推薦商品
    const recommendedProducts = products.filter(product => product.recommended);
    
    // 檢查是否有推薦商品
    if (recommendedProducts.length === 0) {
        alert('目前沒有推薦商品！');
        return;
    }
    
    // 將每個推薦商品添加到購物車
    recommendedProducts.forEach(product => {
        // 檢查商品是否已在購物車中
        const isInCart = cart.some(item => item.id === product.id);
        if (!isInCart) {
            cart.push({
                id: product.id,
                stallNumber: product.stallNumber,
                name: product.name,
                price: product.price,
                purchased: false,
                pic: product.pic
            });
        }
    });
    
    // 更新購物車顯示
    renderCart();
}
// 確保頁面載入時添加按鈕
document.addEventListener('DOMContentLoaded', function() {
    loadProductsFromTSV();
    
    // 找到控制區域
    const controls = document.querySelector('.controls');
    
    // 創建新的過濾器組
    const filterGroup = document.createElement('div');
    filterGroup.className = 'filter-group';
    
    // 創建添加所有推薦按鈕
    const addAllButton = document.createElement('button');
    addAllButton.textContent = '刺寶快樂鍵';
    addAllButton.onclick = addAllRecommendedToCart;
    addAllButton.style.width = 'auto';  // 覆蓋原來的 100% 寬度
    addAllButton.style.padding = '8px 16px';  // 調整按鈕內邊距
    addAllButton.style.fontSize = '1em';  // 調整字體大小
    
    // 將按鈕添加到過濾器組
    filterGroup.appendChild(addAllButton);
    
    // 將過濾器組添加到控制區域
    controls.appendChild(filterGroup);
});

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', loadProductsFromTSV);