// API endpoints
const API = {
  categories: "https://openapi.programming-hero.com/api/categories",
  plants: "https://openapi.programming-hero.com/api/plants",
  byCategory: (id) => `https://openapi.programming-hero.com/api/category/${id}`,
  plantDetail: (id) => `https://openapi.programming-hero.com/api/plant/${id}`,
};

// Elements
const categoriesList = document.getElementById("categoriesList");
const plantsGrid = document.getElementById("plantsGrid");
const spinner = document.getElementById("spinner");

const heartCountEl = document.getElementById("heartCount");
const copyCountEl = document.getElementById("copyCount");
const coinsEl = document.getElementById("coins");

const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const clearCartBtn = document.getElementById("clearCart");

const detailModal = document.getElementById("detailModal");
const closeModalBtn = document.getElementById("closeModal");
const modalName = document.getElementById("modalName");
const modalImage = document.getElementById("modalImage");
const modalDesc = document.getElementById("modalDesc");
const modalPrice = document.getElementById("modalPrice");

// state
let heartCount = 0;
let copyCount = 0;
let coins = 100; 
let cart = {}; 

// helper: show / hide spinner
function showSpinner(){ spinner.style.display = "block"; }
function hideSpinner(){ spinner.style.display = "none"; }


function getPlantsFromResponse(res){
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.plants && Array.isArray(res.plants)) return res.plants;
  if (res.data && Array.isArray(res.data)) return res.data;
  return [];
}

// fetch categories and render
function loadCategories(){
  fetch(API.categories)
    .then(r => r.json())
    .then(data => {
      const cats = data.categories || [];
      renderCategories(cats);
    })
    .catch(e => {
      console.error("Categories load error:", e);
    });
}

// render category items
function renderCategories(categories){
  categories.forEach(cat => {
    const li = document.createElement("li");
    
    // Convert to Title Case: "all trees" becomes "All Trees"
    li.textContent = cat.category
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    li.className = "category-item";
    li.dataset.id = cat.id;
    li.addEventListener("click", () => {
      // active class
      document.querySelectorAll(".category-item").forEach(el => el.classList.remove("active"));
      li.classList.add("active");
      if (cat.id === "all") loadAllPlants();
      else loadPlantsByCategory(cat.id);
    });
    categoriesList.appendChild(li);
  });
}

// load all plants
function loadAllPlants(){
  showSpinner();
  fetch(API.plants)
    .then(r => r.json())
    .then(data => {
      const plants = getPlantsFromResponse(data.plants || data.data || data);
      renderPlants(plants);
    })
    .catch(err => {
      plantsGrid.innerHTML = "<p style='padding:20px;color:#b00;'>Failed to load plants.</p>";
      console.error(err);
    })
    .finally(()=> hideSpinner());
}

// load plants by category
function loadPlantsByCategory(id){
  showSpinner();
  fetch(API.byCategory(id))
    .then(r => r.json())
    .then(data => {
      const plants = getPlantsFromResponse(data.plants || data.data || data);
      renderPlants(plants);
    })
    .catch(err => {
      plantsGrid.innerHTML = "<p style='padding:20px;color:#b00;'>Failed to load plants for category.</p>";
      console.error(err);
    })
    .finally(()=> hideSpinner());
}

// render plant cards
function renderPlants(plants){
  plantsGrid.innerHTML = "";
  if (!plants || plants.length === 0){
    plantsGrid.innerHTML = "<p style='padding:20px'>No plants found.</p>";
    return;
  }

  plants.forEach(p => {
    const plantId = p.id || p.plant_id || p._id || p.plant_id;
    const name = p.plant_name || p.name || p.plantName || "Unknown";
    const price = Number(p.price || p.cost || 100);
    const img = p.image || p.img || "";

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-media"><img src="${img}" alt="${name}" /></div>
      <h4>${name}</h4>
      <p>${(p.description && p.description.slice(0,120)) || "No description available."}</p>
      <span class="badge">${p.category || "Plant"}</span>

      <div class="card-bottom">
        <div class="actions-inline">
          <button class="add-btn" data-name="${name}" data-price="${price}">Add to Cart</button>
        </div>
        <div class="price">${price}৳</div>
      </div>
      <div style="margin-top:8px; text-align:center;">
      </div>
    `;
    plantsGrid.appendChild(card);
  });
}

// CART
function renderCart(){
  cartItemsEl.innerHTML = "";
  const names = Object.keys(cart);
  if (names.length === 0){
    cartItemsEl.innerHTML = "<li class='cart-item empty'>Cart is empty</li>";
    cartTotalEl.textContent = "0৳";
    return;
  }
  names.forEach(name => {
    const info = cart[name];
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <div>
        <div style="font-weight:700">${name}</div>
        <div style="font-size:12px;color:#667">Qty: ${info.qty} × ${info.price}৳</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="font-weight:800">${info.qty * info.price}৳</div>
        <button class="small-btn remove-btn" data-name="${name}">Remove</button>
      </div>
    `;
    cartItemsEl.appendChild(li);
  });
  // total calc
  let total = 0;
  names.forEach(n => total += cart[n].price * cart[n].qty);
  cartTotalEl.textContent = total + "৳";
}

// add to cart function
function addToCart(name, price){
  if (cart[name]) cart[name].qty += 1;
  else cart[name] = { price: Number(price), qty: 1 };
  renderCart();
}

// remove from cart
function removeFromCart(name){
  delete cart[name];
  renderCart();
}

// clear cart
function clearCart(){
  cart = {};
  renderCart();
}




// DETAILS modal (fetch plant detail by id)
function showPlantDetail(id){
  if (!id){
    alert("No ID available for this plant.");
    return;
  }
  // show spinner inside modal area (simple)
  modalName.textContent = "Loading...";
  modalDesc.textContent = "";
  modalPrice.textContent = "";
  modalImage.src = "";

  detailModal.classList.add("show");
  detailModal.setAttribute("aria-hidden","false");

  fetch(API.plantDetail(id))
    .then(r => r.json())
    .then(data => {
      // try to read detail fields
      const p = data.data || data.plant || data || {};
      const name = p.plant_name || p.name || p.plantName || "No name";
      const desc = p.description || p.details || "No details available.";
      const img = p.image || "";
      const price = p.price || p.cost || 100;

      modalName.textContent = name;
      modalDesc.textContent = desc;
      modalPrice.textContent = price;
      modalImage.src = img;
    })
    .catch(e => {
      modalName.textContent = "Failed to load details.";
      console.error(e);
    });
}

// close modal
function closeModal(){
  detailModal.classList.remove("show");
  detailModal.setAttribute("aria-hidden","true");
}

// Event delegation for buttons in plant grid & cart actions
document.addEventListener("click", function(e){
  const addBtn = e.target.closest(".add-btn");
  if (addBtn){
    const name = addBtn.dataset.name;
    const price = addBtn.dataset.price;
    addToCart(name, price);
    return;
  }

  const removeBtn = e.target.closest(".remove-btn");
  if (removeBtn){
    const name = removeBtn.dataset.name;
    removeFromCart(name);
    return;
  }

  const clearBtn = e.target.closest("#clearCart");
  if (clearBtn){
    clearCart();
    return;
  }

  const copyBtn = e.target.closest(".copy-btn");
  if (copyBtn){
    const name = copyBtn.dataset.name;
    copyName(name);
    return;
  }

  const heartBtn = e.target.closest(".heart-btn");
  if (heartBtn){
    addHeart();
    return;
  }

  const detailBtn = e.target.closest(".detail-btn");
  if (detailBtn){
    const id = detailBtn.dataset.id;
    showPlantDetail(id);
    return;
  }
});

// close modal listeners
closeModalBtn.addEventListener("click", closeModal);
detailModal.addEventListener("click", function(e){
  if (e.target === detailModal) closeModal();
});

// donate form simple handler (demo)
document.getElementById("donateForm").addEventListener("submit", function(e){
  e.preventDefault();
  const name = document.getElementById("donorName").value;
  const count = document.getElementById("donorCount").value || "1";
  alert(`Thank you ${name}! You pledged ${count} tree(s).`);
  this.reset();
});

// close modal init (in case element not yet present)
if (!closeModalBtn){
  // nothing
}

// initial render setup
document.getElementById("year").textContent = new Date().getFullYear();
renderCart();
loadCategories();
loadAllPlants();

