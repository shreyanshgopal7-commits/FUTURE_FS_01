
/* assets/js/main.js - enhanced with cart, search/filter, checkout, login, orders */
const PRODUCTS = [
  {id:1, title:'Pro RGB Mouse', price:2499, img:'assets/images/mouse.png', tag:'peripheral'},
  {id:2, title:'RGB Mechanical Keyboard', price:4199, img:'assets/images/keyboard.png', tag:'peripheral'},
  {id:3, title:'Neon iPhone', price:69999, img:'assets/images/iphone.png', tag:'phone'},
  {id:4, title:'Dell Laptop', price:45499, img:'assets/images/dell.png', tag:'laptop'}
];

function qs(sel){ return document.querySelector(sel) }
function qsa(sel){ return Array.from(document.querySelectorAll(sel)) }

/* --- Storage helpers --- */
const STORAGE = {
  cartKey: 'techstore_cart_v1',
  usersKey: 'techstore_users_v1',
  ordersKey: 'techstore_orders_v1',
  currentUserKey: 'techstore_current_user_v1',
  read(key){ try{ return JSON.parse(localStorage.getItem(key)||'null') }catch(e){return null} },
  write(key,val){ localStorage.setItem(key, JSON.stringify(val)) }
}

/* --- Cart logic --- */
function getCart(){ return STORAGE.read(STORAGE.cartKey) || [] }
function saveCart(c){ STORAGE.write(STORAGE.cartKey, c); renderCartBadge(); }
function addToCart(id, qty=1){
  const cart = getCart();
  const existing = cart.find(i=>i.id===id);
  if(existing){ existing.qty += qty }
  else{ const p = PRODUCTS.find(p=>p.id===id); cart.push({id:p.id, title:p.title, price:p.price, img:p.img, qty}) }
  saveCart(cart);
  flashMessage('Added to cart');
  renderProducts(); renderCart();
}
function changeQty(id, delta){
  const cart = getCart();
  const item = cart.find(i=>i.id===id);
  if(!item) return;
  item.qty += delta;
  if(item.qty < 1) { // remove
    const idx = cart.findIndex(i=>i.id===id);
    cart.splice(idx,1);
  }
  saveCart(cart); renderCart(); renderProducts();
}
function setQty(id, val){
  const cart = getCart();
  const item = cart.find(i=>i.id===id);
  if(!item) return;
  item.qty = Math.max(1, Math.floor(val)||1);
  saveCart(cart); renderCart(); renderProducts();
}
function cartTotal(){ return getCart().reduce((s,i)=> s + i.price * i.qty, 0) }

/* --- UI rendering --- */
function renderProducts(filterText=''){
  const grid = qs('.products');
  if(!grid) return;
  const filter = filterText.trim().toLowerCase();
  const items = PRODUCTS.filter(p=> p.title.toLowerCase().includes(filter) || p.tag.includes(filter));
  grid.innerHTML = items.map(p=>{
    const inCart = getCart().find(c=>c.id===p.id);
    return `
      <div class="card">
        <div class="badge">${p.tag}</div>
        <div class="img-wrap"><img src="${p.img}" alt="${p.title}"></div>
        <div class="prod-title">${p.title}</div>
        <div class="prod-price">₹${p.price.toLocaleString()}</div>
        <div style="margin-top:12px;display:flex;gap:8px;align-items:center">
          <button class="btn buy-btn" data-id="${p.id}">${inCart? 'In Cart ('+inCart.qty+')' : 'Buy Now'}</button>
          <button class="btn details-btn" data-id="${p.id}">Details</button>
        </div>
      </div>
    `
  }).join('');
  // attach handlers
  qsa('.buy-btn').forEach(b=> b.onclick = ()=> addToCart(Number(b.dataset.id)));
  qsa('.details-btn').forEach(b=> b.onclick = ()=> showDetails(Number(b.dataset.id)));
}

function renderCartBadge(){
  const count = getCart().reduce((s,i)=> s + i.qty, 0);
  qs('.cart-count').innerText = count;
}

/* --- Cart panel --- */
function renderCart(){
  const container = qs('.cart-panel');
  if(!container) return;
  const cart = getCart();
  if(cart.length === 0){
    container.innerHTML = `<div style="padding:18px;color:var(--muted)">Your cart is empty</div>`;
    return;
  }
  container.innerHTML = cart.map(i=>`
    <div style="display:flex;gap:12px;align-items:center;padding:10px;border-bottom:1px solid rgba(255,255,255,0.02)">
      <img src="${i.img}" style="width:64px;height:48px;object-fit:contain;border-radius:8px">
      <div style="flex:1">
        <div style="font-weight:700">${i.title}</div>
        <div style="color:var(--muted);font-size:13px">₹${i.price.toLocaleString()}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <button class="btn small" data-id="${i.id}" data-delta="-1">-</button>
        <input class="qty-input" data-id="${i.id}" value="${i.qty}" style="width:48px;text-align:center;background:transparent;border:1px solid rgba(255,255,255,0.03);padding:6px;border-radius:8px;color:inherit">
        <button class="btn small" data-id="${i.id}" data-delta="1">+</button>
      </div>
      <div style="width:110px;text-align:right;font-weight:700">₹${(i.price*i.qty).toLocaleString()}</div>
    </div>
  `).join('') + `
    <div style="padding:12px;display:flex;justify-content:space-between;align-items:center">
      <div style="font-weight:700">Total</div>
      <div style="font-weight:900">₹${cartTotal().toLocaleString()}</div>
    </div>
    <div style="padding:12px;display:flex;gap:8px">
      <button class="btn" id="checkout-btn">Checkout</button>
      <button class="btn" id="clear-cart-btn">Clear</button>
    </div>
  `;
  // handlers
  qsa('.btn.small').forEach(b=> b.onclick = ()=> changeQty(Number(b.dataset.id), Number(b.dataset.delta)));
  qsa('.qty-input').forEach(inp=> inp.onchange = ()=> setQty(Number(inp.dataset.id), Number(inp.value)));
  qs('#checkout-btn').onclick = ()=> openCheckout();
  qs('#clear-cart-btn').onclick = ()=> { if(confirm('Clear cart?')){ saveCart([]); renderCart(); } };
}

/* --- Details modal --- */
function showDetails(id){
  const p = PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  const modal = qs('.modal');
  modal.querySelector('.modal-title').innerText = p.title;
  modal.querySelector('.modal-body').innerHTML = `
    <div style="display:flex;gap:12px;align-items:center">
      <img src="${p.img}" style="width:160px;height:140px;object-fit:contain;border-radius:10px">
      <div>
        <div style="font-weight:700">${p.title}</div>
        <div style="color:var(--muted);margin-top:8px">Category: ${p.tag}</div>
        <div style="margin-top:10px;font-weight:700;color:var(--accent1)">₹${p.price.toLocaleString()}</div>
        <div style="margin-top:12px"><button class="btn" id="modal-add" data-id="${p.id}">Add to cart</button></div>
      </div>
    </div>
  `;
  modal.classList.add('open');
  qs('#modal-add').onclick = ()=> { addToCart(p.id); modal.classList.remove('open'); }
}

/* --- Flash message --- */
function flashMessage(msg){
  let el = qs('.flash');
  if(!el){ el = document.createElement('div'); el.className='flash'; document.body.appendChild(el); }
  el.innerText = msg; el.style.opacity = '1';
  setTimeout(()=> el.style.opacity = '0', 1400);
}

/* --- Checkout --- */
function openCheckout(){
  const cart = getCart();
  if(cart.length === 0){ alert('Cart is empty'); return; }
  qs('.checkout-panel').classList.add('open');
  renderCheckoutForm();
}

function renderCheckoutForm(){
  const form = qs('.checkout-form');
  form.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px">
      <label>Full name <input name="name" required></label>
      <label>Email <input name="email" type="email" required></label>
      <label>Address <input name="address" required></label>
      <label>City <input name="city" required></label>
      <label>Pincode <input name="pincode" required></label>
    </div>
    <div style="margin-top:12px;display:flex;gap:8px">
      <button class="btn" id="place-order">Place Order</button>
      <button class="btn" id="cancel-order">Cancel</button>
    </div>
  `;
  qs('#cancel-order').onclick = ()=> qs('.checkout-panel').classList.remove('open');
  qs('#place-order').onclick = ()=> placeOrder();
}

function placeOrder(){
  const form = qs('.checkout-form');
  const data = [...form.querySelectorAll('input')].reduce((acc,i)=> (acc[i.name]=i.value, acc), {});
  // simple validation
  if(!data.name || !data.email || !data.address){ alert('Please fill required fields'); return; }
  const order = {
    id: 'ORD' + Date.now(),
    date: new Date().toISOString(),
    items: getCart(),
    total: cartTotal(),
    customer: data
  };
  // store in orders (per user if logged in)
  const current = STORAGE.read(STORAGE.currentUserKey);
  let orders = STORAGE.read(STORAGE.ordersKey) || [];
  if(current){ order.user = current; }
  orders.push(order);
  STORAGE.write(STORAGE.ordersKey, orders);
  // clear cart
  saveCart([]);
  qs('.checkout-panel').classList.remove('open');
  flashMessage('Order placed');
  renderOrdersForUser();
}

/* --- User login & order history (optional) --- */
function loginModal(open=true){
  const m = qs('.login-modal');
  if(open) m.classList.add('open'); else m.classList.remove('open');
}
function signup(username, password){
  const users = STORAGE.read(STORAGE.usersKey) || [];
  if(users.find(u=>u.username===username)){ alert('User exists'); return false; }
  users.push({username, password});
  STORAGE.write(STORAGE.usersKey, users);
  return true;
}
function login(username, password){
  const users = STORAGE.read(STORAGE.usersKey) || [];
  const u = users.find(x=> x.username===username && x.password===password);
  if(!u){ alert('Invalid credentials'); return false; }
  STORAGE.write(STORAGE.currentUserKey, u.username);
  renderAuthUI();
  loginModal(false);
  flashMessage('Signed in');
  renderOrdersForUser();
  return true;
}
function logout(){ localStorage.removeItem(STORAGE.currentUserKey); renderAuthUI(); renderOrdersForUser(); flashMessage('Signed out'); }
function renderAuthUI(){
  const current = STORAGE.read(STORAGE.currentUserKey);
  if(current){
    qs('.auth-area').innerHTML = `<div style="display:flex;gap:8px;align-items:center"><div style="color:var(--muted)">Hi, ${current}</div><button class="btn" id="logout-btn">Logout</button></div>`;
    qs('#logout-btn').onclick = logout;
  } else {
    qs('.auth-area').innerHTML = `<button class="btn" id="login-btn">Login</button>`;
    qs('#login-btn').onclick = ()=> loginModal(true);
  }
}

/* --- Order history render --- */
function renderOrdersForUser(){
  const area = qs('.orders-area');
  const current = STORAGE.read(STORAGE.currentUserKey);
  const orders = STORAGE.read(STORAGE.ordersKey) || [];
  let userOrders = orders;
  if(current) userOrders = orders.filter(o=> o.user===current);
  area.innerHTML = userOrders.length ? userOrders.map(o=>`
    <div style="padding:10px;border-radius:10px;background:linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.01));margin-bottom:8px">
      <div style="display:flex;justify-content:space-between"><div><strong>${o.id}</strong> — ${new Date(o.date).toLocaleString()}</div><div><strong>₹${o.total.toLocaleString()}</strong></div></div>
      <div style="color:var(--muted);margin-top:6px">${o.items.length} items</div>
    </div>
  `).join('') : `<div style="color:var(--muted)">No orders yet.</div>`;
}

/* --- Init --- */
document.addEventListener('DOMContentLoaded', ()=>{
  // render product grid
  renderProducts();
  renderCartBadge();
  renderCart();
  renderAuthUI();
  renderOrdersForUser();

  // search
  const search = qs('#search-input');
  if(search){
    search.oninput = ()=> renderProducts(search.value);
  }

  // open/close cart panel toggles
  qs('#open-cart').onclick = ()=> qs('.cart-drawer').classList.toggle('open');
  qs('#close-cart').onclick = ()=> qs('.cart-drawer').classList.remove('open');

  // modal close buttons
  qsa('.modal .close, .modal .backdrop').forEach(b=> b.addEventListener('click', ()=> qs('.modal').classList.remove('open')));
  qsa('.login-modal .close, .login-modal .backdrop').forEach(b=> b.addEventListener('click', ()=> loginModal(false)));

  // login form events
  qs('#login-form').onsubmit = (e)=>{ e.preventDefault(); const un = qs('#login-user').value; const pw = qs('#login-pass').value; if(un && pw) login(un,pw); };
  qs('#signup-btn').onclick = ()=> { const un = qs('#signup-user').value; const pw = qs('#signup-pass').value; if(un&&pw){ if(signup(un,pw)){ alert('Signup success, please login.'); } } }

  // cart clear on load if malformed
  try{ getCart(); } catch(e){ saveCart([]); }
});
