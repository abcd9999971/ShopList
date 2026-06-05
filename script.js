// 全局變數
let products = [];
const cart = [];
const CART_STORAGE_KEY = 'shopListCart';
const TSV_FILE = 'iipuro.tsv';

// 從本地TSV檔案讀取資料
async function loadProductsFromTSV() {
    try {
        const response = await fetch(TSV_FILE);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        products = parseProductsFromTSV(text);

        updateFilters();
        renderProducts();
    } catch (error) {
        console.error('載入TSV文件時發生錯誤:', error);
        alert('載入商品資料失敗，請確認 TSV 檔案存在且格式正確。');
    }
}

function parseProductsFromTSV(text) {
    const previousValues = [];

    return text
        .split(/\r?\n/)
        .slice(1)
        .filter(line => line.trim())
        .map((line, index) => {
            const fields = line.split('\t').map((field, fieldIndex) => {
                const value = field.trim();
                if (value === '同上') {
                    return previousValues[fieldIndex] || '';
                }

                return value;
            });

            fields.forEach((field, fieldIndex) => {
                previousValues[fieldIndex] = field;
            });

            const [stallNumber = '', type = '', character = '', name = '', price = '0', pic = '', recommended = ''] = fields;
            const parsedPrice = parseInt(price.trim(), 10);

            return {
                id: index + 1,
                stallNumber,
                type,
                character,
                name,
                price: Number.isNaN(parsedPrice) ? 0 : parsedPrice,
                pic,
                recommended: recommended.toUpperCase() === 'TRUE'
            };
        });
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function loadCart() {
    try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (!savedCart) {
            return;
        }

        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
            cart.length = 0;
            parsedCart.forEach(item => {
                cart.push({
                    id: item.id,
                    stallNumber: item.stallNumber || '',
                    name: item.name || '',
                    price: Number(item.price) || 0,
                    purchased: Boolean(item.purchased),
                    pic: item.pic || ''
                });
            });
        }
    } catch (error) {
        console.error('讀取購物清單保存資料時發生錯誤:', error);
        localStorage.removeItem(CART_STORAGE_KEY);
    }
}

// 更新篩選器
function updateFilters() {
    const types = new Set(products.map(p => p.type).filter(Boolean));
    const characters = new Set(products.map(p => p.character).filter(Boolean));

    const typeFilter = document.getElementById('typeFilter');
    typeFilter.innerHTML = '<option value="">全部類型</option>';
    Array.from(types).sort().forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeFilter.appendChild(option);
    });

    const characterFilter = document.getElementById('characterFilter');
    characterFilter.innerHTML = '<option value="">全部角色/CP</option>';
    Array.from(characters).sort().forEach(character => {
        const option = document.createElement('option');
        option.value = character;
        option.textContent = character;
        characterFilter.appendChild(option);
    });

    const recommendedFilter = document.getElementById('recommendedFilter');
    recommendedFilter.innerHTML = `
        <option value="">全部</option>
        <option value="true">刺寶優選</option>
        <option value="false">其餘</option>
    `;
}

// 篩選商品
function filterProducts() {
    const searchText = document.getElementById('searchInput').value.trim().toLowerCase();
    const selectedType = document.getElementById('typeFilter').value;
    const selectedCharacter = document.getElementById('characterFilter').value;
    const selectedRecommended = document.getElementById('recommendedFilter').value;

    const filteredProducts = products.filter(product => {
        const searchTarget = [
            product.stallNumber,
            product.type,
            product.character,
            product.name
        ].join(' ').toLowerCase();
        const typeMatch = !selectedType || product.type === selectedType;
        const characterMatch = !selectedCharacter || product.character === selectedCharacter;
        const recommendedMatch = !selectedRecommended ||
            (selectedRecommended === 'true' ? product.recommended : !product.recommended);
        const searchMatch = !searchText || searchTarget.includes(searchText);

        return searchMatch && typeMatch && characterMatch && recommendedMatch;
    });

    renderProducts(filteredProducts);
}

// 渲染商品列表
function renderProducts(productsToRender = products) {
    const productList = document.getElementById('product-list');
    if (!productList) {
        console.error('找不到 product-list 元素');
        return;
    }

    productList.innerHTML = '';
    document.getElementById('product-count').textContent = `${productsToRender.length} 件`;

    productsToRender.forEach(product => {
        const div = document.createElement('div');
        div.className = `product-card ${product.recommended ? 'recommended' : ''}`;

        if (product.pic) {
            const image = document.createElement('img');
            image.src = product.pic;
            image.alt = product.name;
            image.className = 'product-image';
            div.appendChild(image);
        } else {
            const imagePlaceholder = document.createElement('div');
            imagePlaceholder.className = 'product-image product-image-empty';
            div.appendChild(imagePlaceholder);
        }

        const meta = document.createElement('div');

        const stall = document.createElement('span');
        stall.className = 'stall-number';
        stall.textContent = product.stallNumber;
        meta.appendChild(stall);

        const type = document.createElement('span');
        type.className = `type-tag type-${product.type}`;
        type.textContent = product.type;
        meta.appendChild(type);

        if (product.recommended) {
            const recommended = document.createElement('span');
            recommended.className = 'recommended-tag';
            recommended.textContent = '刺寶優選';
            meta.appendChild(recommended);
        }

        div.appendChild(meta);

        const character = document.createElement('span');
        character.className = 'character-tag';
        character.textContent = product.character;
        div.appendChild(character);

        const title = document.createElement('h3');
        title.textContent = product.name;
        div.appendChild(title);

        const price = document.createElement('p');
        price.className = 'price';
        price.textContent = `¥${product.price}`;
        div.appendChild(price);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'add-button';
        button.textContent = '加入清單';
        button.addEventListener('click', () => addToCart(product.id));
        div.appendChild(button);

        productList.appendChild(div);
    });
}

// 添加到購物車
function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) {
        return;
    }

    cart.push({
        id: product.id,
        stallNumber: product.stallNumber,
        name: product.name,
        price: product.price,
        purchased: false,
        pic: product.pic
    });

    saveCart();
    renderCart();
}

// 切換購買狀態
function togglePurchased(index) {
    if (!cart[index]) {
        return;
    }

    cart[index].purchased = !cart[index].purchased;
    saveCart();
    renderCart();
}

// 從購物車移除
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
}

function clearCart() {
    if (cart.length === 0) {
        alert('購物清單已經是空的！');
        return;
    }

    if (confirm('確定要清空購物清單嗎？')) {
        cart.length = 0;
        saveCart();
        renderCart();
    }
}

function buildCartSummary() {
    const purchasedTotal = cart
        .filter(item => item.purchased)
        .reduce((total, item) => total + item.price, 0);
    const unpurchasedTotal = cart
        .filter(item => !item.purchased)
        .reduce((total, item) => total + item.price, 0);

    const lines = [
        '購買清單',
        '',
        ...cart.map(item => {
            const status = item.purchased ? '已購買' : '未購買';
            return `[${status}] ${item.stallNumber} ${item.name} ¥${item.price}`;
        }),
        '',
        `已購買總額: ¥${purchasedTotal}`,
        `未購買總額: ¥${unpurchasedTotal}`
    ];

    return lines.join('\n');
}

function downloadCart() {
    if (cart.length === 0) {
        alert('購物清單是空的，還沒有可以下載的內容。');
        return;
    }

    const blob = new Blob([buildCartSummary()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `shop-list-${date}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

// 渲染購物車
function renderCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';

    let purchasedTotal = 0;
    let unpurchasedTotal = 0;

    const actions = document.createElement('div');
    actions.className = 'cart-actions';

    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'secondary-button danger-button';
    clearButton.textContent = '清空購物清單';
    clearButton.onclick = clearCart;
    actions.appendChild(clearButton);

    const downloadButton = document.createElement('button');
    downloadButton.type = 'button';
    downloadButton.className = 'secondary-button';
    downloadButton.textContent = '下載購買清單';
    downloadButton.onclick = downloadCart;
    actions.appendChild(downloadButton);

    cartItems.appendChild(actions);

    cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'cart-item';

        const left = document.createElement('div');
        left.className = 'cart-item-main';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = item.purchased;
        checkbox.addEventListener('change', () => togglePurchased(index));
        left.appendChild(checkbox);

        const info = document.createElement('div');
        info.className = 'cart-item-info';

        if (item.pic) {
            const image = document.createElement('img');
            image.src = item.pic;
            image.alt = item.name;
            image.className = 'cart-item-image';
            info.appendChild(image);
        } else {
            const imagePlaceholder = document.createElement('div');
            imagePlaceholder.className = 'cart-item-image cart-item-image-empty';
            info.appendChild(imagePlaceholder);
        }

        const name = document.createElement('span');
        const stall = document.createElement('strong');
        stall.className = 'stall-number';
        stall.textContent = item.stallNumber;
        name.appendChild(stall);
        name.appendChild(document.createTextNode(item.name));
        info.appendChild(name);

        left.appendChild(info);
        div.appendChild(left);

        const right = document.createElement('div');
        right.className = 'cart-item-actions';

        const price = document.createElement('span');
        price.className = 'price';
        price.textContent = `¥${item.price}`;
        right.appendChild(price);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-btn';
        removeButton.textContent = '移除';
        removeButton.addEventListener('click', () => removeFromCart(index));
        right.appendChild(removeButton);

        div.appendChild(right);
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

function addAllRecommendedToCart() {
    const recommendedProducts = products.filter(product => product.recommended);

    if (recommendedProducts.length === 0) {
        alert('目前沒有推薦商品！');
        return;
    }

    recommendedProducts.forEach(product => {
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

    saveCart();
    renderCart();
}

function setupControls() {
    const controls = document.querySelector('.controls');
    const filterGroup = document.createElement('div');
    filterGroup.className = 'filter-group';

    const addAllButton = document.createElement('button');
    addAllButton.type = 'button';
    addAllButton.className = 'quick-action';
    addAllButton.textContent = '刺寶快樂鍵';
    addAllButton.onclick = addAllRecommendedToCart;

    filterGroup.appendChild(addAllButton);
    controls.appendChild(filterGroup);
}

document.addEventListener('DOMContentLoaded', function() {
    loadCart();
    renderCart();
    setupControls();
    loadProductsFromTSV();
});
