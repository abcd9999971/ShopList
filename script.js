const SHEET_ID = '1I8fAECd8924BZAdFP3nJ5LIqLEtjC-qRLqFuqupvbp8'; // Google Sheet 的 ID
const cart = [];

// 從 Google Sheet 獲取資料
async function fetchProducts() {
    const url = '你的WebAppURL'; // 替換為 Apps Script 部署的 URL
    const response = await fetch(url);
    const products = await response.json(); // 將 JSON 資料轉換為物件
    renderProducts(products);
}

// 渲染商品清單
function renderProducts(products) {
    const productList = document.getElementById('products');
    productList.innerHTML = ''; // 清空現有列表

    products.forEach((product, index) => {
        const [name, price, description] = product;
        const div = document.createElement('div');
        div.innerHTML = `
            <span>${name} - $${price}</span>
            <p>${description}</p>
            <button onclick="addToCart('${name}', ${price})">加入購物車</button>
        `;
        productList.appendChild(div);
    });
}

// 加入購物車
function addToCart(name, price) {
    cart.push({ name, price, purchased: false });
    renderCart();
}

// 購物車渲染
function renderCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';

    let purchasedTotal = 0;
    let unpurchasedTotal = 0;

    cart.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${item.name} - $${item.price}</span>
            <input type="checkbox" ${item.purchased ? 'checked' : ''} 
                   onchange="togglePurchased(${index})">
            <button onclick="removeFromCart(${index})">移除</button>
        `;
        cartItems.appendChild(li);

        if (item.purchased) {
            purchasedTotal += item.price;
        } else {
            unpurchasedTotal += item.price;
        }
    });

    document.getElementById('purchased-total').innerText = purchasedTotal;
    document.getElementById('unpurchased-total').innerText = unpurchasedTotal;
}

// 切換購買狀態
function togglePurchased(index) {
    cart[index].purchased = !cart[index].purchased;
    renderCart();
}

// 移除商品
function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

// 初始化
fetchProducts();
