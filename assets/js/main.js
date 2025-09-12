// -----------------------------
// Full main.js
// - Handles theme, nav, lightbox, geo/currency, phone UI
// - Modal handling for corporate (#quoteModal) and creative (#creativeModal)
// - Supports [data-open-quote], [data-open-corporate], [data-open-creative]
// - Clean KES formatting ("From KES 15,000")
// -----------------------------

// -----------------------------
// Helpers
// -----------------------------
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

// Format helper for KES
function formatKES(value) {
  return 'KES ' + Number(value).toLocaleString('en-KE');
}

// -----------------------------
// Theme toggle
// -----------------------------
const root = document.documentElement;
const themeBtn = $("#themeToggle");
const savedTheme = localStorage.getItem("theme");
if (savedTheme) root.setAttribute("data-theme", savedTheme);
themeBtn?.addEventListener("click", () => {
  const cur = root.getAttribute("data-theme") || 'system';
  const next = cur === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});

// -----------------------------
// Mobile nav
// -----------------------------
const navToggle = $(".nav-toggle");
const navList = $("#nav-list");
navToggle?.addEventListener("click", () => {
  const exp = navToggle.getAttribute("aria-expanded") === "true";
  navToggle.setAttribute("aria-expanded", (!exp).toString());
  navList?.classList.toggle("show");
});

// -----------------------------
// Lightbox
// -----------------------------
$$('[data-lightbox]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const src = a.getAttribute('href');
    const title = a.getAttribute('data-title') || '';
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:200;';
    overlay.innerHTML = `<figure style="max-width:90vw;max-height:90vh">
      <img src="${src}" alt="${title}" style="max-width:100%;max-height:80vh;display:block;border-radius:12px"/>
      <figcaption style="color:#fff;text-align:center;margin-top:.5rem">${title}</figcaption>
    </figure>`;
    overlay.addEventListener('click', ()=>document.body.removeChild(overlay));
    document.body.appendChild(overlay);
  });
});

// -----------------------------
// Region & currency helpers
// -----------------------------
async function fetchGeo(){
  try{
    const r = await fetch('https://ipapi.co/json').then(r=>r.json());
    return { country: (r.country || 'KE').toUpperCase(), currency: r.currency || null };
  }catch(e){
    return null;
  }
}

const COUNTRY_TO_CURRENCY = {
  KE:'KES', US:'USD', GB:'GBP', NG:'NGN', ZA:'ZAR', CA:'CAD', EU:'EUR', FR:'EUR', DE:'EUR',
  IT:'EUR', ES:'EUR', PT:'EUR', NL:'EUR', BE:'EUR', AT:'EUR', IE:'EUR', FI:'EUR', SE:'SEK', NO:'NOK',
  DK:'DKK', CH:'CHF', AU:'AUD', NZ:'NZD', IN:'INR', JP:'JPY', CN:'CNY', AE:'AED', SA:'SAR', QA:'QAR',
  KW:'KWD', EG:'EGP', TZ:'TZS', UG:'UGX', RW:'RWF', ET:'ETB', GH:'GHS'
};

async function getRegionAndCurrency(){
  const geo = await fetchGeo();
  let country = (geo && geo.country) ? geo.country : null;
  let currency = (geo && geo.currency) ? geo.currency : null;

  if(!country){
    const lang = navigator.language || 'en-KE';
    const m = lang.match(/[-_](\w\w)/);
    country = (m && m[1]) ? m[1].toUpperCase() : 'KE';
  }
  if(!currency){
    currency = COUNTRY_TO_CURRENCY[country] || 'USD';
  }
  return { country, currency };
}

// Convert KES prices to local + show "From KES …"
async function convertPrices(){
  const { currency } = await getRegionAndCurrency();
  const els = $$('[data-pricing] [data-price-kes]');
  if(els.length === 0) return;

  try{
    const res = await fetch('https://api.exchangerate.host/latest?base=KES');
    const data = await res.json();
    const rate = data.rates?.[currency] || 1;

    els.forEach(card => {
      const kes = parseFloat(card.getAttribute('data-price-kes')) || 0;
      const local = kes * rate;
      const priceEl = card.querySelector('[data-price]');
      const hintEl = card.querySelector('[data-price-hint]');

      if (priceEl) {
        // show converted local price (e.g. USD 120)
        priceEl.textContent = new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency
        }).format(local);
      }

      const formattedKES = formatKES(kes);
      if (hintEl) {
        hintEl.textContent = 'From ' + formattedKES;
      } else if (priceEl) {
        const span = document.createElement('div');
        span.className = 'muted tiny';
        span.setAttribute('data-price-hint', '');
        span.textContent = 'From ' + formattedKES;
        priceEl.insertAdjacentElement('afterend', span);
      }
    });
  }catch(e){
    els.forEach(card => {
      const kes = parseFloat(card.getAttribute('data-price-kes')) || 0;
      const priceEl = card.querySelector('[data-price]');
      if(priceEl) priceEl.textContent = formatKES(kes);
    });
  }
}

async function formatLocalPriceFromKES(kesAmount){
  try{
    const { currency } = await getRegionAndCurrency();
    const res = await fetch('https://api.exchangerate.host/latest?base=KES&symbols=' + currency);
    const data = await res.json();
    const rate = data.rates?.[currency] || 1;
    const local = kesAmount * rate;
    const formattedLocal = new Intl.NumberFormat(undefined, { style:'currency', currency }).format(local);
    return { formattedLocal, currency };
  }catch(e){
    return { formattedLocal: null, currency: null };
  }
}

// -----------------------------
// Phone input setup
// -----------------------------
const PHONE_PLACEHOLDER = {
  KE:'+254 7xx xxx xxx', US:'+1 (xxx) xxx-xxxx', GB:'+44 xxxx xxxxxx', NG:'+234 xxx xxx xxxx',
  ZA:'+27 xx xxx xxxx', CA:'+1 (xxx) xxx-xxxx', AU:'+61 x xxxx xxxx', NZ:'+64 xx xxx xxxx',
  IN:'+91 xxxxx xxxxx', JP:'+81 xx xxxx xxxx', DE:'+49 xxxx xxxxxx', FR:'+33 x xx xx xx xx'
};

function initPhoneInputs(){
  let tries = 0;
  function doInit(){
    if(!window.intlTelInput){
      tries++;
      if(tries > 30) return;
      return setTimeout(doInit, 200);
    }

    window.intlTelInputGlobals.loadUtils('https://cdn.jsdelivr.net/npm/intl-tel-input@19.6.0/build/js/utils.js');
    const preferred = ['ke','ug','tz','ng','za','us','gb'];

    document.querySelectorAll('input[type="tel"]').forEach(function(input){
      if(input.dataset.iti) return;

      const iti = window.intlTelInput(input, {
        initialCountry: 'auto',
        separateDialCode: true,
        preferredCountries: preferred,
        geoIpLookup: function(success){
          fetch('https://ipapi.co/json')
            .then(r => r.json())
            .then(data => {
              const code = (data && data.country_code) ? data.country_code.toLowerCase() : 'ke';
              success(code);
            })
            .catch(() => success('ke'));
        },
        utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@19.6.0/build/js/utils.js',
      });

      input.dataset.iti = true;

      setTimeout(() => {
        const country = (iti.getSelectedCountryData && iti.getSelectedCountryData().iso2) || 'ke';
        input.placeholder = PHONE_PLACEHOLDER[country.toUpperCase()] || PHONE_PLACEHOLDER['KE'];
      }, 300);
    });
  }
  doInit();
}

// -----------------------------
// Robust Modal handling
// -----------------------------
function openModal(modal){
  if(!modal) return;
  modal.removeAttribute('hidden');
  modal.classList.add('show');
  modal.setAttribute('open', '');
}

function closeModal(modal){
  if(!modal) return;
  modal.classList.remove('show');
  modal.removeAttribute('open');
  modal.setAttribute('hidden', '');
}

// -----------------------------
// Unified Quote Modal
// -----------------------------
(function initQuoteModal(){
  const modal = document.getElementById('quoteModal');
  if(!modal) return;

  const phoneInput = modal.querySelector('#phoneInput');
  const serviceInput = modal.querySelector('#serviceInput') || modal.querySelector('input[name="service"]');
  const budgetInput = modal.querySelector('#budgetInput');
  const budgetVal = modal.querySelector('#budgetVal');

  document.querySelectorAll('[data-open-quote]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      const btnPrice = btn.dataset.priceKes ? parseFloat(btn.dataset.priceKes) : NaN;
      const card = btn.closest('.price-card');
      const cardPrice = card ? parseFloat(card.getAttribute('data-price-kes')) : NaN;
      const kes = !isNaN(btnPrice) ? btnPrice : (!isNaN(cardPrice) ? cardPrice : 0);

      const planText = btn.dataset.plan || (card ? (card.querySelector('h3')?.textContent || '') : '');

      if(serviceInput) serviceInput.value = planText;
      if(budgetInput && !isNaN(kes)) {
        budgetInput.value = kes;
        if(budgetVal) budgetVal.textContent = kes;
      }

      try { initPhoneInputs(); } catch(e){}

      openModal(modal);
      setTimeout(()=> (phoneInput || modal.querySelector('input[type="text"], input[type="email"], input[type="tel"]'))?.focus(), 180);
    });
  });

  modal.querySelectorAll('[data-close], .modal-close').forEach(el => {
    el.addEventListener('click', () => closeModal(modal));
  });

  modal.addEventListener('click', (e) => {
    if(e.target.classList.contains('modal-backdrop')) closeModal(modal);
  });

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && modal.classList.contains('show')) closeModal(modal);
  });
})();

// -----------------------------
// Creative modal
// -----------------------------
(function initCreativeModal(){
  const creativeModal = document.getElementById('creativeModal');
  const fallbackModal = document.getElementById('quoteModal');

  $$('[data-open-creative]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const plan = btn.dataset.plan || '';
      if(creativeModal){
        const sel = creativeModal.querySelector('#selectedService') || creativeModal.querySelector('input[name="service"]');
        if(sel && plan) sel.value = plan;
        initPhoneInputs();
        openModal(creativeModal);
        setTimeout(()=> creativeModal.querySelector('input[type="text"], input[type="tel"], input[type="email"]')?.focus(), 200);
        return;
      }
      if(fallbackModal){
        const serviceInput = fallbackModal.querySelector('#serviceInput') || fallbackModal.querySelector('input[name="service"]');
        if(serviceInput && plan) serviceInput.value = plan;
        initPhoneInputs();
        openModal(fallbackModal);
        setTimeout(()=> fallbackModal.querySelector('input[type="tel"], input[type="text"], input[type="email"]')?.focus(), 200);
      }
    });
  });
})();

// -----------------------------
// Basic form validation
// -----------------------------
document.addEventListener('submit', (ev) => {
  const form = ev.target;
  if(!form.classList.contains('quote-form')) return;
  const name = form.querySelector('input[name="name"]')?.value?.trim();
  const email = form.querySelector('input[name="email"]')?.value?.trim();
  const phone = form.querySelector('input[name="phone"]')?.value?.trim();
  if(!name && !email && !phone){
    ev.preventDefault();
    alert('Please include at least a name, email, or phone so we can reach you.');
    form.querySelector('input[name="name"], input[name="email"], input[name="phone"]')?.focus();
    return false;
  }
  return true;
});

// -----------------------------
// Toggle "View Packages"
// -----------------------------
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-toggle-packages]')) {
    const card = e.target.closest('.service-card');
    const list = card?.querySelector('.packages');
    if (!list) return;

    list.classList.toggle('show');
    e.target.textContent = list.classList.contains('show')
      ? 'Hide Packages'
      : 'View Packages';
  }
});

// -----------------------------
// Init on page load
// -----------------------------
convertPrices();
initPhoneInputs();
