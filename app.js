/* NEXTGEN MOBILE - ứng dụng Vanilla JS cho index.html */
(() => {
  const products = window.NEXTGEN_PRODUCTS || [];
  const vouchers = window.NEXTGEN_VOUCHERS || {};
  let state = {
    products: [...products],
    cart: JSON.parse(localStorage.getItem('nextgen-cart') || '[]'),
    brand: 'all',
    price: 'all',
    feature: 'all',
    search: '',
    sort: 'default',
    voucher: null,
    shipping: 'standard',
    payment: 'cash'
  };

  const $ = id => document.getElementById(id);
  const money = n => new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.round(n))) + 'đ';
  const product = id => products.find(p => p.id === Number(id));
  const save = () => localStorage.setItem('nextgen-cart', JSON.stringify(state.cart));
  const toast = msg => {
    const el = $('appToast'), text = $('appToastMessage');
    if (!el || !text) return;
    text.textContent = msg;
    el.classList.remove('hidden');
    el.classList.add('flex');
    clearTimeout(window.__toast);
    window.__toast = setTimeout(() => { el.classList.add('hidden'); el.classList.remove('flex'); }, 2600);
  };

  function renderBrands() {
    const counts = {};
    products.forEach(p => counts[p.brand] = (counts[p.brand] || 0) + 1);
    const brands = ['Apple','Samsung','Xiaomi','OPPO','Vivo','Realme','ASUS'];
    const html = brands.map(b => `
      <button onclick="selectBrand('${b}')" class="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl ${state.brand===b?'bg-blue-600/15 border border-blue-500/30 text-blue-300':'text-gray-300 hover:bg-slate-800 border border-transparent'} text-xs font-semibold transition-all">
        <span class="flex items-center gap-2"><i class="fa-solid fa-mobile-screen-button text-[11px]"></i>${b}</span>
        <span class="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full">${counts[b] || 0}</span>
      </button>`).join('');
    if ($('brandListSidebar')) $('brandListSidebar').innerHTML =
      `<button onclick="selectBrand('all')" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl ${state.brand==='all'?'bg-blue-600/15 border border-blue-500/30 text-blue-300':'text-gray-300 hover:bg-slate-800 border border-transparent'} text-xs font-semibold mb-1">${'<span>Tất cả thương hiệu</span>'}<span>${products.length}</span></button>` + html;
    if ($('mobileBrandsBar')) $('mobileBrandsBar').innerHTML =
      ['all',...brands].map(b => `<button onclick="selectBrand('${b}')" class="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold ${state.brand===b?'bg-blue-600 text-white':'bg-slate-800 text-gray-300'}">${b==='all'?'Tất cả':b}</button>`).join('');
  }

  function filtered() {
    let list = [...products];
    if (state.brand !== 'all') list = list.filter(p => p.brand === state.brand);
    if (state.price !== 'all') list = list.filter(p => {
      if (state.price === '<10m') return p.price < 1e7;
      if (state.price === '10-20m') return p.price >= 1e7 && p.price < 2e7;
      if (state.price === '20-30m') return p.price >= 2e7 && p.price < 3e7;
      if (state.price === '>30m') return p.price >= 3e7;
      return true;
    });
    if (state.feature !== 'all') list = list.filter(p => p.features.includes(state.feature));
    if (state.search) {
      const q = state.search.toLowerCase();
      list = list.filter(p => `${p.brand} ${p.name} ${p.features.join(' ')}`.toLowerCase().includes(q));
    }
    switch (state.sort) {
      case 'price-asc': list.sort((a,b)=>a.price-b.price); break;
      case 'price-desc': list.sort((a,b)=>b.price-a.price); break;
      case 'bestseller': list.sort((a,b)=>b.sold-a.sold); break;
      case 'discount': list.sort((a,b)=>b.discount-a.discount); break;
      case 'name': list.sort((a,b)=>a.name.localeCompare(b.name,'vi')); break;
    }
    return list;
  }

  function renderProducts() {
    const list = filtered();
    if ($('activeFilterTag')) $('activeFilterTag').textContent =
      state.search ? `Kết quả: "${state.search}"` : state.brand === 'all' ? 'Tất cả sản phẩm' : state.brand;
    if ($('productsCountDisplay')) $('productsCountDisplay').textContent = `${list.length} sản phẩm`;
    if (!$('productsGrid')) return;
    $('productsGrid').innerHTML = list.length ? list.map(p => `
      <article class="product-card bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div class="relative p-5 bg-slate-950/60">
          <span class="absolute left-4 top-4 z-10 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">${p.badge}</span>
          <span class="absolute right-4 top-4 z-10 bg-rose-500/15 text-rose-300 text-[10px] font-bold px-2 py-1 rounded-full">-${p.discount}%</span>
          <img src="${p.image}" alt="${p.name}" class="w-full aspect-square object-contain rounded-2xl main-preview-img cursor-pointer" onclick="showProductDetail(${p.id})">
        </div>
        <div class="p-5 space-y-3">
          <div>
            <p class="text-[10px] text-blue-400 font-bold uppercase">${p.brand}</p>
            <h3 class="text-sm font-bold text-white mt-1">${p.name}</h3>
          </div>
          <div class="flex items-center gap-2 text-[10px]">
            <span class="text-amber-400">★★★★★</span><span class="text-gray-500">${p.rating} · ${p.sold} đã bán</span>
          </div>
          <div class="flex items-end gap-2">
            <strong class="text-lg font-black text-blue-400">${money(p.price)}</strong>
            <del class="text-[10px] text-gray-500">${money(p.oldPrice)}</del>
          </div>
          <div class="text-[10px] text-gray-400 flex flex-wrap gap-1.5">
            ${p.features.map(f=>`<span class="bg-slate-800 px-2 py-1 rounded-md">${f}</span>`).join('')}
          </div>
          <div class="flex gap-2">
            <button onclick="showProductDetail(${p.id})" class="flex-1 py-2.5 rounded-xl border border-slate-700 hover:border-blue-500 text-xs font-bold text-gray-200">Chi tiết</button>
            <button onclick="addToCart(${p.id})" class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white">Thêm giỏ</button>
          </div>
        </div>
      </article>`).join('') : `<div class="col-span-full text-center py-16 text-gray-500">Không tìm thấy sản phẩm phù hợp.</div>`;
  }

  window.selectBrand = brand => { state.brand = brand; state.search=''; if($('searchInput')) $('searchInput').value=''; renderBrands(); renderProducts(); };
  window.filterByPrice = price => { state.price=price; renderProducts(); };
  window.filterByFeature = feature => { state.feature=feature; renderProducts(); };
  window.handleSearch = q => { state.search=q.trim(); renderProducts(); };
  window.handleSort = v => { state.sort=v; renderProducts(); };
  window.resetAllFilters = () => {
    state.brand='all'; state.price='all'; state.feature='all'; state.search=''; state.sort='default';
    document.querySelectorAll('input[name="priceFilter"]').forEach((x,i)=>x.checked=i===0);
    if($('searchInput')) $('searchInput').value='';
    renderBrands(); renderProducts();
  };

  window.navigateToCatalog = brand => {
    $('catalogView')?.classList.remove('hidden');
    $('detailView')?.classList.add('hidden');
    if (brand) window.selectBrand(brand);
    history.pushState({},'',location.pathname);
    window.scrollTo({top:0,behavior:'smooth'});
  };

  window.showProductDetail = id => {
    const p = product(id); if(!p) return;
    $('catalogView')?.classList.add('hidden'); $('detailView')?.classList.remove('hidden');
    $('productDetailContent').innerHTML = `
      <div class="space-y-8">
        <div class="text-xs text-gray-500">Trang chủ / ${p.brand} / <span class="text-gray-300">${p.name}</span></div>
        <div class="grid lg:grid-cols-2 gap-8">
          <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <img src="${p.image}" alt="${p.name}" class="w-full max-h-[520px] object-contain rounded-2xl main-preview-img">
            <div class="grid grid-cols-4 gap-2 mt-4">${[1,2,3,4].map(i=>`<img src="${p.image}" class="aspect-square object-contain bg-slate-950 rounded-xl border border-slate-800 p-2">`).join('')}</div>
          </div>
          <div class="space-y-6">
            <div><span class="text-xs text-blue-400 font-bold uppercase">${p.brand}</span><h1 class="text-3xl font-black text-white mt-2">${p.name}</h1>
              <div class="mt-2 text-amber-400 text-sm">★★★★★ <span class="text-gray-500 text-xs">${p.rating}/5 · ${p.sold} đã bán</span></div>
            </div>
            <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div class="flex items-end gap-3"><span class="text-3xl font-black text-blue-400">${money(p.price)}</span><del class="text-sm text-gray-500">${money(p.oldPrice)}</del></div>
              <p class="text-xs text-emerald-400 mt-2">Tiết kiệm ${money(p.oldPrice-p.price)}</p>
            </div>
            <div><h3 class="text-xs font-bold text-gray-300 uppercase mb-3">Dung lượng</h3><div class="flex flex-wrap gap-2" id="storageOptions">
              ${p.storage.map((s,i)=>`<button onclick="chooseStorage(${p.id},'${s}',this)" class="px-4 py-2 rounded-xl border ${i===0?'border-blue-500 bg-blue-500/10 text-blue-300':'border-slate-700 text-gray-300'} text-xs font-bold">${s}</button>`).join('')}
            </div></div>
            <div><h3 class="text-xs font-bold text-gray-300 uppercase mb-3">Màu sắc</h3><div class="flex flex-wrap gap-2">${p.colors.map(c=>`<button class="px-4 py-2 rounded-xl border border-slate-700 hover:border-blue-500 text-xs text-gray-300">${c}</button>`).join('')}</div></div>
            <div class="grid grid-cols-2 gap-3 text-xs">${[['Chipset','Snapdragon / Apple Silicon cao cấp'],['RAM',p.ram],['5G',p.features.includes('5G')?'Có':'Không'],['Màn hình',p.features.includes('165Hz')?'165Hz':p.features.includes('120Hz')?'120Hz':'60Hz'],['Pin','≥ 4.500mAh'],['Kháng nước',p.features.includes('Waterproof')?'IP68':'Theo tiêu chuẩn hãng']].map(([a,b])=>`<div class="bg-slate-900 border border-slate-800 rounded-xl p-3"><span class="text-gray-500">${a}</span><strong class="block text-gray-200 mt-1">${b}</strong></div>`).join('')}</div>
            <div class="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5"><h3 class="text-sm font-black text-emerald-400">THÔNG TIN BẢO HÀNH ĐẦY ĐỦ</h3><ul class="mt-3 space-y-2 text-xs text-gray-300"><li>✓ ${p.warranty}</li><li>✓ 1 đổi 1 trong 30 ngày nếu lỗi phần cứng do nhà sản xuất</li><li>✓ Hỗ trợ tại showroom và trung tâm bảo hành ủy quyền</li><li>✓ Phiếu bảo hành điện tử theo IMEI</li></ul></div>
            <button onclick="addToCart(${p.id});openCartDrawer()" class="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black">Thêm vào giỏ hàng · ${money(p.price)}</button>
          </div>
        </div>
      </div>`;
    history.pushState({product:id},'',`#product-detail?id=${id}`);
    window.scrollTo({top:0,behavior:'smooth'});
  };
  window.chooseStorage = (id, storage, btn) => {
    document.querySelectorAll('#storageOptions button').forEach(b=>b.classList.remove('border-blue-500','bg-blue-500/10','text-blue-300'));
    btn.classList.add('border-blue-500','bg-blue-500/10','text-blue-300');
  };

  window.addToCart = id => {
    const p=product(id); if(!p) return;
    const item=state.cart.find(x=>x.id===id);
    if(item) item.qty++; else state.cart.push({id,qty:1});
    save(); renderCart(); toast(`Đã thêm ${p.name} vào giỏ hàng`);
  };
  window.changeCartQty = (id, delta) => {
    const item=state.cart.find(x=>x.id===id); if(!item) return;
    item.qty += delta; if(item.qty<=0) state.cart=state.cart.filter(x=>x.id!==id);
    save(); renderCart();
  };
  window.removeCartItem = id => { state.cart=state.cart.filter(x=>x.id!==id); save(); renderCart(); };

  function cartSubtotal() { return state.cart.reduce((s,x)=>s+(product(x.id)?.price||0)*x.qty,0); }
  function renderCart() {
    const count=state.cart.reduce((s,x)=>s+x.qty,0), subtotal=cartSubtotal();
    if($('cartBadgeCount')) $('cartBadgeCount').textContent=count;
    if($('cartSubtotalPrice')) $('cartSubtotalPrice').textContent=money(subtotal);
    if($('cartDrawerItemsList')) $('cartDrawerItemsList').innerHTML = state.cart.length ? state.cart.map(x=>{
      const p=product(x.id); return `<div class="flex gap-3 p-3 bg-slate-800/70 rounded-2xl border border-slate-700"><img src="${p.image}" class="w-16 h-16 object-contain bg-slate-950 rounded-xl"><div class="flex-1"><div class="text-xs font-bold text-white">${p.name}</div><div class="text-xs text-blue-400 mt-1">${money(p.price)}</div><div class="flex items-center gap-2 mt-2"><button onclick="changeCartQty(${p.id},-1)" class="w-6 h-6 rounded bg-slate-700">−</button><span class="text-xs">${x.qty}</span><button onclick="changeCartQty(${p.id},1)" class="w-6 h-6 rounded bg-slate-700">+</button><button onclick="removeCartItem(${p.id})" class="ml-auto text-rose-400 text-[11px]">Xóa</button></div></div></div>`;
    }).join('') : `<div class="text-center py-16 text-gray-500 text-xs">Giỏ hàng đang trống.</div>`;
  }
  window.openCartDrawer=()=>{renderCart();$('cartOverlay')?.classList.remove('hidden');$('cartDrawer')?.classList.remove('translate-x-full');};
  window.closeCartDrawer=()=>{$('cartOverlay')?.classList.add('hidden');$('cartDrawer')?.classList.add('translate-x-full');};

  window.copyVoucher = code => {
    navigator.clipboard?.writeText(code).catch(()=>{});
    state.voucher=code; localStorage.setItem('nextgen-voucher',code);
    const input=$('voucherCodeInput'); if(input) input.value=code;
    toast(`Đã sao chép mã ${code}`);
  };
  window.applyVoucherCode=()=>{
    const code=($('voucherCodeInput')?.value||'').trim().toUpperCase();
    if(!vouchers[code]) return toast('Mã voucher không hợp lệ');
    state.voucher=code; localStorage.setItem('nextgen-voucher',code); toast(`Đã áp dụng ${code}`); renderCheckout();
  };

  function discount(subtotal) {
    const v=vouchers[state.voucher];
    if(!v || subtotal<v.min || v.type==='shipping' || v.type==='service') return 0;
    return Math.min(v.value, subtotal);
  }
  function shippingFee(subtotal) { return state.shipping==='express'?60000:(subtotal>=15000000?0:30000); }

  window.openCheckoutModal=()=>{
    if(!state.cart.length) return toast('Vui lòng thêm sản phẩm vào giỏ hàng');
    closeCartDrawer(); renderCheckout(); $('checkoutModal')?.classList.remove('hidden');
  };
  window.closeCheckoutModal=()=>{$('checkoutModal')?.classList.add('hidden');};
  function renderCheckout() {
    const subtotal=cartSubtotal(), disc=discount(subtotal), ship=(state.voucher==='FREESHIP'?0:shippingFee(subtotal));
    const vat=$('vatInvoiceCheckbox')?.checked ? (subtotal-disc)*0.10 : 0;
    const total=subtotal-disc+ship+vat;
    if($('checkoutItemsList')) $('checkoutItemsList').innerHTML=state.cart.map(x=>{const p=product(x.id);return `<div class="flex justify-between text-xs text-gray-300"><span>${p.name} × ${x.qty}</span><span>${money(p.price*x.qty)}</span></div>`}).join('');
    if($('checkoutSubtotal')) $('checkoutSubtotal').textContent=money(subtotal);
    if($('checkoutShippingFee')) $('checkoutShippingFee').textContent=ship===0?'Miễn phí':money(ship);
    if($('checkoutDiscountRow')) {$('checkoutDiscountRow').classList.toggle('hidden',disc===0); if($('checkoutDiscountAmount')) $('checkoutDiscountAmount').textContent='-'+money(disc);}
    if($('checkoutVatRow')) {$('checkoutVatRow').classList.toggle('hidden',vat===0); if($('checkoutVatAmount')) $('checkoutVatAmount').textContent='+'+money(vat);}
    if($('checkoutFinalTotal')) $('checkoutFinalTotal').textContent=money(total);
  }

  window.selectShippingMethod=m=>{state.shipping=m;renderCheckout();};
  window.selectPaymentMethod=m=>{state.payment=m;document.querySelectorAll('.payment-hint').forEach(x=>x.classList.add('hidden'));$('hint-'+m)?.classList.remove('hidden');};
  window.toggleVATInvoice=cb=>{$('vatInvoiceFields')?.classList.toggle('hidden',!cb.checked);renderCheckout();};

  window.handleCheckoutFormSubmit=e=>{
    e.preventDefault();
    const form=e.target;
    if(!form.checkValidity()){form.reportValidity();return;}
    if($('vatInvoiceCheckbox')?.checked && !['vatCompanyName','vatTaxCode','vatCompanyAddress','vatEmail'].every(id=>$(id)?.value.trim())) return toast('Vui lòng điền đủ thông tin VAT');
    const name=$('custFullName').value.trim();
    if(name.split(/\s+/).length<2) return toast('Họ tên cần tối thiểu 2 từ');
    if(!/^\d{12}$/.test($('custIdCard').value.trim())) return toast('CCCD phải gồm đúng 12 chữ số');
    if(!/^(03|05|07|08|09)\d{8}$/.test($('custPhone').value.trim())) return toast('Số điện thoại không hợp lệ');
    const subtotal=cartSubtotal(), disc=discount(subtotal), ship=(state.voucher==='FREESHIP'?0:shippingFee(subtotal)), vat=$('vatInvoiceCheckbox')?.checked?(subtotal-disc)*.1:0;
    const order='#NGM'+String(Date.now()).slice(-8), invoice='HD-2026-'+String(Math.floor(1000+Math.random()*9000));
    const total=subtotal-disc+ship+vat;
    $('invoiceContent').innerHTML=`<div class="invoice-printable bg-white text-slate-900 rounded-2xl p-7 space-y-5"><div class="flex justify-between border-b pb-4"><div><h1 class="text-2xl font-black">NEXTGEN MOBILE</h1><p class="text-xs">HÓA ĐƠN BÁN HÀNG & PHIẾU BẢO HÀNH ĐIỆN TỬ</p></div><div class="text-right text-xs"><div>Mã hóa đơn: <b>${invoice}</b></div><div>Mã đơn hàng: <b>${order}</b></div></div></div><div class="grid sm:grid-cols-2 gap-4 text-xs"><div><b>Khách hàng</b><p>${name}</p><p>${$('custPhone').value}</p><p>${$('custEmail').value}</p><p>${$('custAddress').value}</p></div><div><b>Thanh toán</b><p>${state.payment}</p><p>Vận chuyển: ${state.shipping}</p><p>Ghi chú: ${$('custNote').value}</p></div></div><table class="w-full text-xs border-collapse"><thead><tr class="border-y"><th class="text-left py-2">Sản phẩm</th><th>SL</th><th class="text-right">Thành tiền</th></tr></thead><tbody>${state.cart.map(x=>{const p=product(x.id);return `<tr class="border-b"><td class="py-2">${p.name}</td><td class="text-center">${x.qty}</td><td class="text-right">${money(p.price*x.qty)}</td></tr>`}).join('')}</tbody></table><div class="ml-auto max-w-xs space-y-1 text-xs"><div class="flex justify-between"><span>Tiền hàng</span><b>${money(subtotal)}</b></div><div class="flex justify-between"><span>Vận chuyển</span><b>${money(ship)}</b></div><div class="flex justify-between"><span>Voucher</span><b>-${money(disc)}</b></div><div class="flex justify-between"><span>VAT</span><b>${money(vat)}</b></div><div class="border-t pt-2 flex justify-between text-base"><b>TỔNG</b><b>${money(total)}</b></div></div><div class="flex justify-end gap-2 pt-3 no-print"><button onclick="window.print()" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">In Hóa Đơn / Lưu PDF</button><button onclick="closeInvoiceModal()" class="px-4 py-2 border rounded-xl text-xs">Đóng</button></div><div class="text-[10px] text-gray-500 border-t pt-3">VERIFIED E-SIGNATURE · Phiếu bảo hành điện tử được liên kết theo IMEI.</div></div>`;
    $('checkoutModal').classList.add('hidden'); $('invoiceModal').classList.remove('hidden');
    state.cart=[]; save(); renderCart();
  };
  window.closeInvoiceModal=()=>{$('invoiceModal')?.classList.add('hidden');};

  window.openWarrantyModal=()=>$('warrantyPolicyModal')?.classList.remove('hidden');
  window.closeWarrantyModal=()=>$('warrantyPolicyModal')?.classList.add('hidden');
  window.openTermsModal=()=>$('termsModal')?.classList.remove('hidden');
  window.closeTermsModal=()=>$('termsModal')?.classList.add('hidden');
  window.openWarrantyLookupModal=()=>$('warrantyLookupModal')?.classList.remove('hidden');
  window.closeWarrantyLookupModal=()=>$('warrantyLookupModal')?.classList.add('hidden');

  window.handleWarrantyLookup=e=>{
    e.preventDefault();
    const q=$('warrantySearchInput').value.trim();
    const db=window.NEXTGEN_WARRANTY||{};
    const found=db[q] || Object.values(db).find(x=>x.imei===q);
    if(!found){$('warrantyLookupResult').innerHTML=`<div class="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-xs text-rose-300">Không tìm thấy dữ liệu bảo hành mẫu cho thông tin <b>${q}</b>. Hãy kiểm tra lại IMEI/SĐT.</div>`;return;}
    $('warrantyLookupResult').innerHTML=`<div class="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-gray-300 space-y-2"><div class="text-emerald-400 font-bold">✓ Đã tìm thấy thông tin bảo hành</div><div class="grid grid-cols-2 gap-2"><span>Sản phẩm</span><b>${found.product}</b><span>IMEI</span><b class="font-mono-code">${found.imei}</b><span>Kích hoạt</span><b>${found.activated}</b><span>Hết hạn</span><b>${found.expires}</b><span>Gói</span><b>${found.package}</b></div><div class="border-t border-slate-700 pt-2"><b>Lịch sử:</b><ul class="list-disc ml-4 mt-1">${found.history.map(h=>`<li>${h}</li>`).join('')}</ul></div></div>`;
  };

  function countdown(){
    const end=Date.now()+14*3600*1000+42*60000+18000;
    const tick=()=>{let s=Math.max(0,Math.floor((end-Date.now())/1000));const h=Math.floor(s/3600);s%=3600;const m=Math.floor(s/60);s%=60;if($('timerHours'))$('timerHours').textContent=String(h).padStart(2,'0');if($('timerMinutes'))$('timerMinutes').textContent=String(m).padStart(2,'0');if($('timerSeconds'))$('timerSeconds').textContent=String(s).padStart(2,'0');};tick();setInterval(tick,1000);
  }

  window.addEventListener('popstate',()=>{const m=location.hash.match(/id=(\d+)/);m?showProductDetail(m[1]):navigateToCatalog('all');});
  document.addEventListener('DOMContentLoaded',()=>{renderBrands();renderProducts();renderCart();countdown();const m=location.hash.match(/id=(\d+)/);if(m)showProductDetail(m[1]);});
})();
