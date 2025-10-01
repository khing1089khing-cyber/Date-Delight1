// Fresh JS (plain text). Make sure to open index1.html via a local server.

// Use slug tags: 'festivals' | 'corporate' | 'wedding'
const catalog = [
  { id:'date-powder', name:'Date Powder', pricing:'₹250', size:'200g jar', position:'Granulated sugar replacement', img:'DD_1.jpeg', tags:['festivals'] },
  { id:'choco-gift-dates', name:'Choco-coated Gift Dates', pricing:'₹600', size:'18 pc gift box (250g)', position:'Luxury indulgence, gifting', img:'DD_2.jpeg', tags:['festivals','wedding','corporate'] },
  { id:'energy-bars', name:'Date & Nut Energy Bars', pricing:'₹75', size:'40g single / multipack', position:'Clean-label, no added sugar snack', img:'DD_3.jpeg', tags:['corporate'] },
  { id:'mini-stuffed', name:'Mini Stuffed Date Packs', pricing:'₹600', size:'250g pack', position:'Nut-filled, protein-rich on-the-go snack', img:'DD_4.jpeg', tags:['festivals','corporate','wedding'] },
  { id:'date-nut-spread', name:'Date & Nut Spread', pricing:'₹330', size:'200g jar', position:'Healthy choco alternative', img:'DD_5.png', tags:['corporate'] },
  { id:'date-syrup', name:'Date Syrup', pricing:'₹300', size:'250ml bottle', position:'Natural sweetener, no refined sugar', img:'DD_6.png', tags:['festivals'] },
  { id:'medjool-safawi-pack', name:'Medjool / Safawi Dates Pack', pricing:'₹450', size:'500g pack', position:'Premium whole dates for health & lifestyle', img:'DD_7.png', tags:['festivals','wedding'] },
];

function setFallbackImage(imgEl){ if(!imgEl.dataset.fallback){ imgEl.dataset.fallback='1'; imgEl.src='DD_9.png'; } }

const grid = document.getElementById('productGrid');
let currentFilter = 'all';
function normTag(s){ return String(s||'').toLowerCase().trim(); }
function toCategorySlug(s){
  const t = normTag(s).replace(/\s+/g,'');
  if(t.startsWith('corporate')) return 'corporate';
  if(t.startsWith('wedding')) return 'wedding';
  if(t.startsWith('festival')) return 'festivals';
  if(['eid','diwali','onam','gifting'].includes(t)) return 'festivals';
  return s==='all' ? 'all' : t;
}

// Curated combos per category (ordered by preference)
const curated = {
  festivals: ['choco-gift-dates','mini-stuffed','medjool-safawi-pack','date-syrup'],
  corporate: ['energy-bars','date-nut-spread','date-syrup','mini-stuffed'],
  wedding:   ['choco-gift-dates','medjool-safawi-pack','mini-stuffed','date-powder']
};

function renderProducts(){
  const slug = toCategorySlug(currentFilter);
  let items;
  if(slug==='all'){
    items = catalog;
  } else if (curated[slug]){
    const order = new Map(curated[slug].map((id,i)=>[id,i]));
    items = catalog.filter(p => curated[slug].includes(p.id))
                   .sort((a,b)=>order.get(a.id)-order.get(b.id));
  } else {
    items = catalog.filter(p => (p.tags||[]).includes(slug));
  }
  grid.innerHTML = items.map(p => `
    <article class="card">
      <div class="card-media">
        <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="setFallbackImage(this)"/>
      </div>
      <div class="card-body">
        <div class="kicker">Imported from UAE • Ethically Sourced • Recyclable Pack</div>
        <div class="kicker">${p.size}</div>
        <div class="title">${p.name}</div>
        <div class="meta">${p.position}</div>
        <div class="price">${p.pricing}</div>
        ${(p.tags||[]).length?`<div class="meta">Tags: ${p.tags.join(', ')}</div>`:''}
        <div class="card-actions">
          <button class="btn btn-ghost" data-add="${p.id}">Add to Cart</button>
          <button class="btn btn-primary" data-buy="${p.id}">Buy Now</button>
        </div>
      </div>
    </article>
  `).join('');
}

// Cart state
const CART_KEY = 'dd_cart_v1';
const cart = new Map();
function addToCart(id, qty=1){ const product = catalog.find(p=>p.id===id); if(!product) return; const item = cart.get(id)||{qty:0,product}; item.qty+=qty; cart.set(id,item); saveCart(); updateCartUI(); toast(`${product.name} added to cart`); }
function buyNow(id){ addToCart(id); openCart(); }

// Cart UI
const cartDrawer=document.getElementById('cartDrawer');
const cartBackdrop=document.getElementById('cartBackdrop');
const cartItems=document.getElementById('cartItems');
const cartSubtotal=document.getElementById('cartSubtotal');
const cartCount=document.getElementById('cartCount');
function openCart(){ if(!cartDrawer) return; cartDrawer.classList.add('open'); if(cartBackdrop) cartBackdrop.classList.add('show'); cartDrawer.setAttribute('aria-hidden','false'); }
function closeCart(){ if(!cartDrawer) return; cartDrawer.classList.remove('open'); if(cartBackdrop) cartBackdrop.classList.remove('show'); cartDrawer.setAttribute('aria-hidden','true'); }
(document.getElementById('openCartBtn')||{}).onclick=openCart;
(document.getElementById('closeCartBtn')||{}).onclick=closeCart;
if(cartBackdrop) cartBackdrop.onclick=closeCart;
(document.getElementById('clearCartBtn')||{}).onclick=()=>{ cart.clear(); saveCart(); updateCartUI(); };
(document.getElementById('checkoutBtn')||{}).onclick=()=>{ const items=[...cart.values()].map(x=>`${x.product.name} x${x.qty}`).join(', '); if(!items){ toast('Your cart is empty'); return; } toast('Proceeding to checkout...'); };

function updateCartUI(){
  let subtotal=0;
  cartItems.innerHTML = [...cart.values()].map(({product,qty})=>{
    const price = parseMedianPrice(product.pricing);
    const line = price*qty;
    subtotal += line;
    return `
      <div class="cart-item">
        <img src="${product.img}" alt="${product.name}" onerror="this.style.visibility='hidden'"/>
        <div>
          <div class="name">${product.name}</div>
          <div class="muted">₹${price.toLocaleString('en-IN')} • ${product.size}</div>
          <div class="qty">
            <button onclick="decrQty('${product.id}')">-</button>
            <span>${qty}</span>
            <button onclick="incrQty('${product.id}')">+</button>
          </div>
        </div>
        <div>₹${line.toLocaleString('en-IN')}</div>
      </div>`
  }).join('') || '<div class="muted">Your cart is empty.</div>';
  cartSubtotal.textContent = Math.round(subtotal).toLocaleString('en-IN');
  cartCount.textContent = [...cart.values()].reduce((n,x)=>n+x.qty,0);
}
function incrQty(id){ const it=cart.get(id); if(!it) return; it.qty+=1; updateCartUI(); }
function decrQty(id){ const it=cart.get(id); if(!it) return; it.qty-=1; if(it.qty<=0) cart.delete(id); saveCart(); updateCartUI(); }

// Parse price from either a single value (₹1200) or a range (₹600–₹1200)
function parseMedianPrice(band){
  const s = String(band);
  const rangeRx = /₹\s*([0-9]+)\s*[–-]\s*₹?\s*([0-9]+)/;
  const singleRx = /₹\s*([0-9]+)/;
  const r = s.match(rangeRx);
  if (r) { const a=parseInt(r[1],10), b=parseInt(r[2],10); return Math.round((a+b)/2); }
  const o = s.match(singleRx);
  if (o) return parseInt(o[1],10);
  return 0;
}

const toastEl=document.getElementById('toast');
function toast(msg){ if(!toastEl) return; toastEl.textContent=msg; toastEl.classList.add('show'); setTimeout(()=>toastEl.classList.remove('show'),1600); }

(document.getElementById('year')||{}).textContent=new Date().getFullYear();

const pills=document.getElementById('filters');
const mood=document.getElementById('categoryMood');
function updateMood(slug){
  if(!mood) return;
  if(slug==='corporate'){ mood.style.backgroundImage = "url('DD_6.png')"; mood.style.opacity='0.18'; }
  else if(slug==='wedding'){ mood.style.backgroundImage = "url('DD_8.png')"; mood.style.opacity='0.2'; }
  else if(slug==='festivals'){ mood.style.backgroundImage = "url('DD_9.png')"; mood.style.opacity='0.18'; }
  else { mood.style.backgroundImage='none'; mood.style.opacity='0'; }
}
if(pills){ pills.addEventListener('click',e=>{ const b=e.target.closest('.pill'); if(!b) return; currentFilter=b.dataset.filter||'all'; for(const el of pills.querySelectorAll('.pill')) el.classList.remove('active'); b.classList.add('active'); renderProducts(); updateMood(toCategorySlug(currentFilter)); }); }

// Delegated handlers for Add to Cart / Buy Now to ensure reliability
if(grid){
  grid.addEventListener('click', (e)=>{
    const addBtn = e.target.closest('[data-add]');
    const buyBtn = e.target.closest('[data-buy]');
    if(addBtn){ addToCart(addBtn.getAttribute('data-add')); }
    if(buyBtn){ buyNow(buyBtn.getAttribute('data-buy')); }
  });
}

function saveCart(){
  const data = [...cart.values()].map(({product,qty})=>({id:product.id, qty}));
  try{ localStorage.setItem(CART_KEY, JSON.stringify(data)); }catch(e){}
}
function loadCart(){
  try{
    const raw = localStorage.getItem(CART_KEY);
    if(!raw) return;
    const arr = JSON.parse(raw);
    cart.clear();
    for(const {id, qty} of arr||[]){
      const product = catalog.find(p=>p.id===id); if(!product) continue;
      cart.set(id, { product, qty: Number(qty)||0 });
    }
  }catch(e){}
}

loadCart();
renderProducts();
updateCartUI();

// -------- Same-page Hamper Builder (modal) --------
const hamperBtn = document.getElementById('buildHamperBtn');
const hamperModal = document.getElementById('hamperModal');
const hamperOverlay = document.getElementById('hamperOverlay');
const hamperList = document.getElementById('hamperList');
const hamperTotal = document.getElementById('hamperTotal');
const hamperSelections = new Map(); // id -> qty

function openHamper(){ if(!hamperModal) return; hamperModal.classList.add('open'); hamperOverlay?.classList.add('show'); renderHamper(); }
function closeHamper(){ if(!hamperModal) return; hamperModal.classList.remove('open'); hamperOverlay?.classList.remove('show'); }
hamperBtn?.addEventListener('click', openHamper);
hamperOverlay?.addEventListener('click', closeHamper);
document.getElementById('hamperCloseBtn')?.addEventListener('click', closeHamper);
document.getElementById('hamperCloseBtn2')?.addEventListener('click', closeHamper);
document.getElementById('hamperAddBtn')?.addEventListener('click', ()=>{
  let added = 0;
  for(const [id, qty] of hamperSelections.entries()){
    if(qty>0){ addToCart(id, qty); added += qty; }
  }
  if(added>0){ toast('Hamper added to cart'); closeHamper(); } else { toast('Select items to add'); }
});

function renderHamper(){
  if(!hamperList) return;
  hamperList.innerHTML = catalog.map(p=>{
    const price = parseMedianPrice(p.pricing);
    return `
      <div class="hamper-item">
        <img src="${p.img}" alt="${p.name}" onerror="this.style.visibility='hidden'"/>
        <div class="info">
          <div class="name">${p.name}</div>
          <div class="muted">${p.size}</div>
        </div>
        <div class="price">₹${price.toLocaleString('en-IN')}</div>
        <div class="qty">
          <button data-act="-" data-id="${p.id}">-</button>
          <span data-q="${p.id}">0</span>
          <button data-act="+" data-id="${p.id}">+</button>
        </div>
      </div>`;
  }).join('');
  hamperList.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-act]');
    if(!btn) return;
    const id = btn.getAttribute('data-id');
    const act = btn.getAttribute('data-act');
    const prev = hamperSelections.get(id)||0;
    const next = Math.max(0, prev + (act==='+'?1:-1));
    hamperSelections.set(id, next);
    const span = hamperList.querySelector(`span[data-q="${id}"]`);
    if(span) span.textContent = String(next);
    updateHamperTotal();
  });
  updateHamperTotal();
}

function updateHamperTotal(){
  let total = 0;
  for(const [id, qty] of hamperSelections.entries()){
    const p = catalog.find(x=>x.id===id); if(!p||qty<=0) continue;
    total += parseMedianPrice(p.pricing)*qty;
  }
  if(hamperTotal) hamperTotal.textContent = total.toLocaleString('en-IN');
}
