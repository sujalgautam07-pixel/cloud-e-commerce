// CloudMart Frontend Application Logic

// Auto-detect API Base URL
const isLocalFile = window.location.protocol === "file:";
const API_BASE = isLocalFile ? "http://127.0.0.1:8080" : window.location.origin;

let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cloudmart_cart") || "[]");
let currentRole = "customer"; // 'customer' or 'admin'
let selectedCategory = "All";
let searchQuery = "";
let adminTab = "inventory"; // 'inventory' or 'orders'

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  fetchSystemInfo();
  loadProducts();
  updateCartBadge();
  lucide.createIcons();
});

// Toast notification
function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  const msgEl = document.getElementById("toast-message");
  const bodyEl = document.getElementById("toast-body");

  msgEl.textContent = message;
  bodyEl.className = isError
    ? "bg-rose-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-medium border border-rose-700"
    : "bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-medium border border-slate-700";

  toast.classList.remove("translate-y-20", "opacity-0");
  setTimeout(() => {
    toast.classList.add("translate-y-20", "opacity-0");
  }, 3200);
}

// ----------------- CLOUD & SYSTEM INFO -----------------
async function fetchSystemInfo() {
  try {
    const res = await fetch(`${API_BASE}/api/info`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    document.getElementById("cloud-env").textContent = data.environment;
    document.getElementById("cloud-tier").textContent = data.cloud_tier;
    document.getElementById("cloud-host").textContent = data.active_pods || data.hostname;
  } catch (err) {
    document.getElementById("cloud-env").textContent = "Cluster Offline";
    document.getElementById("cloud-tier").textContent = "Standalone";
    document.getElementById("cloud-host").textContent = "localhost";
  }
}

// ----------------- ROLE SWITCHING -----------------
function toggleRole() {
  if (currentRole === "customer") {
    switchView("admin");
  } else {
    switchView("customer");
  }
}

function switchView(role) {
  currentRole = role;
  const custView = document.getElementById("customer-view");
  const adminView = document.getElementById("admin-view");
  const roleLabel = document.getElementById("role-label");
  const custNavControls = document.getElementById("customer-nav-controls");
  const toggleBtn = document.getElementById("view-toggle-btn");

  if (role === "admin") {
    custView.classList.add("hidden");
    adminView.classList.remove("hidden");
    custNavControls.classList.add("hidden");
    roleLabel.textContent = "Exit to Customer View";
    toggleBtn.classList.replace("bg-slate-100", "bg-indigo-50");
    toggleBtn.classList.replace("text-slate-700", "text-indigo-700");
    fetchAdminMetrics();
    fetchAdminData();
  } else {
    adminView.classList.add("hidden");
    custView.classList.remove("hidden");
    custNavControls.classList.remove("hidden");
    roleLabel.textContent = "Switch to Admin";
    toggleBtn.classList.replace("bg-indigo-50", "bg-slate-100");
    toggleBtn.classList.replace("text-indigo-700", "text-slate-700");
    loadProducts();
  }
  lucide.createIcons();
}

// ----------------- CUSTOMER CATALOG -----------------
async function loadProducts() {
  try {
    let url = `${API_BASE}/api/products`;
    const params = new URLSearchParams();
    if (selectedCategory !== "All") params.append("category", selectedCategory);
    if (searchQuery.trim() !== "") params.append("search", searchQuery.trim());
    if ([...params].length > 0) url += `?${params.toString()}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load products");
    allProducts = await res.json();
    renderProductsGrid();
  } catch (err) {
    showToast("Error connecting to catalog service", true);
  }
}

function filterCategory(cat) {
  selectedCategory = cat;
  document.querySelectorAll(".cat-pill").forEach(el => {
    if (el.textContent.includes(cat) || (cat === "All" && el.textContent.includes("All"))) {
      el.className = "cat-pill px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-sm transition";
    } else {
      el.className = "cat-pill px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 transition";
    }
  });
  loadProducts();
}

function handleSearch(val) {
  searchQuery = val;
  loadProducts();
}

function renderProductsGrid() {
  const grid = document.getElementById("products-grid");
  const empty = document.getElementById("no-products");

  if (allProducts.length === 0) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  grid.innerHTML = allProducts.map(p => {
    const isOutOfStock = p.stock <= 0;
    const isLowStock = p.stock > 0 && p.stock <= 5;
    
    return `
      <div class="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group">
        <div class="h-48 w-full bg-slate-100 overflow-hidden relative">
          <img 
            src="${p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'}" 
            alt="${p.title}" 
            class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'"
          />
          <span class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
            ${p.category}
          </span>
          ${isOutOfStock 
            ? `<span class="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Sold Out</span>`
            : isLowStock 
              ? `<span class="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Only ${p.stock} left</span>`
              : `<span class="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">${p.stock} in stock</span>`
          }
        </div>
        
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-slate-900 text-base line-clamp-1">${p.title}</h3>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2">${p.description || "High quality cloud-certified item."}</p>
          </div>
          
          <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span class="text-lg font-extrabold text-slate-900">$${p.price.toFixed(2)}</span>
            <button 
              onclick="addToCart(${p.id})" 
              ${isOutOfStock ? "disabled" : ""}
              class="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition ${
                isOutOfStock 
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              }"
            >
              <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
              <span>${isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  lucide.createIcons();
}

// ----------------- SHOPPING CART -----------------
function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.product.id === productId);
  const currentQty = existing ? existing.quantity : 0;

  if (currentQty + 1 > product.stock) {
    showToast(`Sorry, only ${product.stock} units available in cloud inventory.`, true);
    return;
  }

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ product, quantity: 1 });
  }

  saveCart();
  showToast(`Added "${product.title}" to cart`);
}

function updateCartQuantity(productId, delta) {
  const item = cart.find(i => i.product.id === productId);
  if (!item) return;

  // Refresh live stock reference
  const product = allProducts.find(p => p.id === productId) || item.product;
  const newQty = item.quantity + delta;

  if (newQty <= 0) {
    cart = cart.filter(i => i.product.id !== productId);
  } else if (newQty > product.stock) {
    showToast(`Max available stock is ${product.stock}`, true);
    return;
  } else {
    item.quantity = newQty;
  }

  saveCart();
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.product.id !== productId);
  saveCart();
  renderCart();
}

function saveCart() {
  localStorage.setItem("cloudmart_cart", JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  if (totalCount > 0) {
    badge.textContent = totalCount;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function toggleCartModal() {
  const modal = document.getElementById("cart-modal");
  const isHidden = modal.classList.contains("hidden");
  if (isHidden) {
    renderCart();
    modal.classList.remove("hidden");
  } else {
    modal.classList.add("hidden");
  }
}

function renderCart() {
  const itemsContainer = document.getElementById("cart-items");
  const subtotalEl = document.getElementById("cart-subtotal");
  const taxEl = document.getElementById("cart-tax");
  const totalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");

  if (cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <i data-lucide="shopping-bag" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
        <p class="text-sm">Your cart is empty.</p>
      </div>
    `;
    subtotalEl.textContent = "$0.00";
    taxEl.textContent = "$0.00";
    totalEl.textContent = "$0.00";
    checkoutBtn.disabled = true;
    lucide.createIcons();
    return;
  }

  checkoutBtn.disabled = false;
  let subtotal = 0;

  itemsContainer.innerHTML = cart.map(item => {
    const itemTotal = item.product.price * item.quantity;
    subtotal += itemTotal;
    return `
      <div class="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <img src="${item.product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}" class="w-14 h-14 object-cover rounded-lg" />
        <div class="flex-1 min-w-0">
          <h4 class="text-xs font-bold text-slate-900 truncate">${item.product.title}</h4>
          <span class="text-xs text-indigo-600 font-semibold">$${item.product.price.toFixed(2)}</span>
          <div class="flex items-center space-x-2 mt-1">
            <button onclick="updateCartQuantity(${item.product.id}, -1)" class="w-5 h-5 rounded bg-white border text-slate-600 flex items-center justify-center text-xs font-bold hover:bg-slate-200">-</button>
            <span class="text-xs font-bold text-slate-800">${item.quantity}</span>
            <button onclick="updateCartQuantity(${item.product.id}, 1)" class="w-5 h-5 rounded bg-white border text-slate-600 flex items-center justify-center text-xs font-bold hover:bg-slate-200">+</button>
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs font-bold text-slate-900">$${itemTotal.toFixed(2)}</div>
          <button onclick="removeFromCart(${item.product.id})" class="text-slate-400 hover:text-rose-500 mt-1">
            <i data-lucide="trash-2" class="w-3.5 h-3.5 inline"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");

  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  taxEl.textContent = `$${tax.toFixed(2)}`;
  totalEl.textContent = `$${total.toFixed(2)}`;

  lucide.createIcons();
}

// ----------------- CHECKOUT & ORDERS -----------------
function openCheckoutModal() {
  toggleCartModal();
  document.getElementById("checkout-modal").classList.remove("hidden");
}

function closeCheckoutModal() {
  document.getElementById("checkout-modal").classList.add("hidden");
}

async function submitOrder(e) {
  e.preventDefault();
  const btn = document.getElementById("submit-order-btn");
  btn.disabled = true;
  btn.textContent = "Processing Order in Cluster...";

  const orderPayload = {
    customer_name: document.getElementById("cust-name").value,
    customer_email: document.getElementById("cust-email").value,
    customer_address: document.getElementById("cust-address").value,
    items: cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity
    }))
  };

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Order submission failed");
    }

    const orderData = await res.json();
    closeCheckoutModal();
    
    // Clear cart
    cart = [];
    saveCart();

    // Show confirmation modal
    document.getElementById("success-order-number").textContent = orderData.order_number;
    document.getElementById("order-success-modal").classList.remove("hidden");
    lucide.createIcons();
    
    // Refresh catalog to reflect new stock levels
    loadProducts();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = "Place Order Now";
  }
}

function closeSuccessModal() {
  document.getElementById("order-success-modal").classList.add("hidden");
}

// ----------------- TRACK ORDER -----------------
function openTrackModal() {
  document.getElementById("track-modal").classList.remove("hidden");
  document.getElementById("track-result").classList.add("hidden");
}

function closeTrackModal() {
  document.getElementById("track-modal").classList.add("hidden");
}

async function searchOrder() {
  const orderNum = document.getElementById("track-order-input").value.trim().toUpperCase();
  const resultDiv = document.getElementById("track-result");
  if (!orderNum) return;

  try {
    const res = await fetch(`${API_BASE}/api/orders/${orderNum}`);
    if (!res.ok) throw new Error("Order not found");
    const order = await res.json();

    const statusColors = {
      Pending: "bg-amber-100 text-amber-800",
      Processing: "bg-blue-100 text-blue-800",
      Shipped: "bg-purple-100 text-purple-800",
      Delivered: "bg-emerald-100 text-emerald-800",
      Cancelled: "bg-rose-100 text-rose-800"
    };

    resultDiv.classList.remove("hidden");
    resultDiv.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <span class="text-xs text-slate-500">Order Reference</span>
          <h4 class="font-bold text-slate-900">${order.order_number}</h4>
          <p class="text-xs text-slate-600 mt-0.5">Placed on: ${new Date(order.created_at).toLocaleString()}</p>
        </div>
        <span class="px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[order.status] || 'bg-slate-200'}">
          ${order.status}
        </span>
      </div>

      <div class="border-t border-slate-200 pt-3 text-xs space-y-1">
        <div class="font-semibold text-slate-700">Items Ordered:</div>
        ${order.items.map(it => `
          <div class="flex justify-between text-slate-600">
            <span>${it.product_title} × ${it.quantity}</span>
            <span>$${(it.price * it.quantity).toFixed(2)}</span>
          </div>
        `).join("")}
        <div class="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
          <span>Total:</span>
          <span>$${order.total_amount.toFixed(2)}</span>
        </div>
      </div>
    `;
  } catch (err) {
    resultDiv.classList.remove("hidden");
    resultDiv.innerHTML = `<div class="text-xs text-rose-600 font-semibold">❌ Order not found. Please verify your reference ID.</div>`;
  }
}

// ----------------- ADMIN DASHBOARD -----------------
async function fetchAdminMetrics() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/metrics`);
    if (!res.ok) return;
    const m = await res.json();
    document.getElementById("metric-revenue").textContent = `$${m.total_revenue.toFixed(2)}`;
    document.getElementById("metric-orders").textContent = m.total_orders;
    document.getElementById("metric-products").textContent = m.total_products;
    document.getElementById("metric-lowstock").textContent = m.low_stock_count;
    document.getElementById("metric-pending").textContent = m.pending_orders;
  } catch (err) {
    console.error("Metrics load failed", err);
  }
}

function switchAdminTab(tab) {
  adminTab = tab;
  const invSec = document.getElementById("admin-inventory-section");
  const ordSec = document.getElementById("admin-orders-section");
  const invBtn = document.getElementById("tab-inventory-btn");
  const ordBtn = document.getElementById("tab-orders-btn");

  if (tab === "inventory") {
    invSec.classList.remove("hidden");
    ordSec.classList.add("hidden");
    invBtn.className = "border-b-2 border-indigo-600 pb-3 text-sm font-semibold text-indigo-600 flex items-center space-x-2";
    ordBtn.className = "border-b-2 border-transparent pb-3 text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center space-x-2";
  } else {
    invSec.classList.add("hidden");
    ordSec.classList.remove("hidden");
    ordBtn.className = "border-b-2 border-indigo-600 pb-3 text-sm font-semibold text-indigo-600 flex items-center space-x-2";
    invBtn.className = "border-b-2 border-transparent pb-3 text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center space-x-2";
  }
  fetchAdminData();
  lucide.createIcons();
}

async function fetchAdminData() {
  if (adminTab === "inventory") {
    const res = await fetch(`${API_BASE}/api/products`);
    const products = await res.json();
    const tbody = document.getElementById("admin-products-table");
    tbody.innerHTML = products.map(p => `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-4 flex items-center space-x-3">
          <img src="${p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60'}" class="w-10 h-10 object-cover rounded-lg border" />
          <div>
            <div class="font-bold text-slate-900">${p.title}</div>
            <div class="text-xs text-slate-400">ID: #${p.id}</div>
          </div>
        </td>
        <td class="p-4 text-slate-600">${p.category}</td>
        <td class="p-4 font-bold text-slate-900">$${p.price.toFixed(2)}</td>
        <td class="p-4">
          <div class="flex items-center space-x-2">
            <span class="px-2 py-0.5 rounded text-xs font-semibold ${p.stock <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
              ${p.stock} units
            </span>
            <button onclick="quickUpdateStock(${p.id}, ${p.stock + 5})" title="+5 stock" class="text-slate-400 hover:text-indigo-600 text-xs px-1.5 py-0.5 border rounded hover:bg-slate-100 font-mono">+5</button>
          </div>
        </td>
        <td class="p-4 text-right space-x-2">
          <button onclick="editProductModal(${p.id})" class="text-slate-400 hover:text-indigo-600 transition p-1">
            <i data-lucide="edit-3" class="w-4 h-4 inline"></i>
          </button>
          <button onclick="deleteProduct(${p.id})" class="text-slate-400 hover:text-rose-600 transition p-1">
            <i data-lucide="trash-2" class="w-4 h-4 inline"></i>
          </button>
        </td>
      </tr>
    `).join("");
  } else {
    const res = await fetch(`${API_BASE}/api/orders`);
    const orders = await res.json();
    const tbody = document.getElementById("admin-orders-table");
    tbody.innerHTML = orders.map(o => `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-4 font-mono font-bold text-indigo-600 text-xs">${o.order_number}</td>
        <td class="p-4">
          <div class="font-semibold text-slate-900">${o.customer_name}</div>
          <div class="text-xs text-slate-400">${o.customer_email}</div>
        </td>
        <td class="p-4 text-xs text-slate-600">${o.items.length} items (${o.items.map(i => i.product_title).join(", ")})</td>
        <td class="p-4 font-bold text-slate-900">$${o.total_amount.toFixed(2)}</td>
        <td class="p-4">
          <span class="px-2.5 py-1 rounded-full text-xs font-bold ${
            o.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
            o.status === 'Shipped' ? 'bg-purple-100 text-purple-800' :
            o.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
            o.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
            'bg-amber-100 text-amber-800'
          }">
            ${o.status}
          </span>
        </td>
        <td class="p-4 text-right">
          <select onchange="updateOrderStatus(${o.id}, this.value)" class="text-xs border rounded-lg px-2 py-1 bg-white font-medium focus:ring-1 focus:ring-indigo-500">
            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
            <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
      </tr>
    `).join("");
  }
  lucide.createIcons();
}

async function quickUpdateStock(id, newStock) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: newStock })
    });
    if (res.ok) {
      showToast("Inventory stock updated in cluster");
      fetchAdminData();
      fetchAdminMetrics();
    }
  } catch (err) {
    showToast("Failed to update stock", true);
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      showToast(`Order status updated to ${newStatus}`);
      fetchAdminMetrics();
    }
  } catch (err) {
    showToast("Failed to update status", true);
  }
}

// ----------------- PRODUCT CREATE / EDIT / DELETE -----------------
function openAddProductModal() {
  document.getElementById("product-modal-title").textContent = "Add New Product";
  document.getElementById("product-form").reset();
  document.getElementById("prod-id").value = "";
  document.getElementById("product-modal").classList.remove("hidden");
}

async function editProductModal(id) {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    const p = await res.json();
    document.getElementById("product-modal-title").textContent = "Edit Product";
    document.getElementById("prod-id").value = p.id;
    document.getElementById("prod-title").value = p.title;
    document.getElementById("prod-category").value = p.category;
    document.getElementById("prod-price").value = p.price;
    document.getElementById("prod-stock").value = p.stock;
    document.getElementById("prod-image").value = p.image_url || "";
    document.getElementById("prod-desc").value = p.description || "";
    document.getElementById("product-modal").classList.remove("hidden");
  } catch (err) {
    showToast("Error retrieving product details", true);
  }
}

function closeProductModal() {
  document.getElementById("product-modal").classList.add("hidden");
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById("prod-id").value;
  const payload = {
    title: document.getElementById("prod-title").value,
    category: document.getElementById("prod-category").value,
    price: parseFloat(document.getElementById("prod-price").value),
    stock: parseInt(document.getElementById("prod-stock").value),
    image_url: document.getElementById("prod-image").value || null,
    description: document.getElementById("prod-desc").value || null,
  };

  const method = id ? "PUT" : "POST";
  const url = id ? `${API_BASE}/api/products/${id}` : `${API_BASE}/api/products`;

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error();
    showToast(id ? "Product updated" : "New product published");
    closeProductModal();
    fetchAdminData();
    fetchAdminMetrics();
  } catch (err) {
    showToast("Error saving product", true);
  }
}

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to remove this product from inventory?")) return;
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Product deleted");
      fetchAdminData();
      fetchAdminMetrics();
    }
  } catch (err) {
    showToast("Failed to delete product", true);
  }
}
