// -----------------------------
// Helpers
// -----------------------------
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

// -----------------------------
// Theme toggle
// -----------------------------
const root = document.documentElement;
const themeBtn = $("#themeToggle");
const savedTheme = localStorage.getItem("theme");
if(savedTheme){ root.setAttribute("data-theme", savedTheme); }
themeBtn?.addEventListener("click", () => {
  const cur = root.getAttribute("data-theme");
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

// Convert KES prices shown on page to local currency
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

      if(priceEl) priceEl.textContent = new Intl.NumberFormat(undefined, { style:'currency', currency }).format(local);
      if(hintEl) {
        hintEl.textContent = 'KES ' + new Intl.NumberFormat('en-KE', { style:'currency', currency:'KES', maximumFractionDigits:0 }).format(kes).replace('KES','').trim();
      } else if(priceEl){
        const span = document.createElement('div');
        span.className = 'muted tiny';
        span.setAttribute('data-price-hint','');
        span.textContent = 'KES ' + new Intl.NumberFormat('en-KE', { style:'currency', currency:'KES', maximumFractionDigits:0 }).format(kes).replace('KES','').trim();
        priceEl.insertAdjacentElement('afterend', span);
      }
    });
  }catch(e){
    // fallback to KES only
    els.forEach(card => {
      const kes = parseFloat(card.getAttribute('data-price-kes')) || 0;
      const priceEl = card.querySelector('[data-price]');
      if(priceEl) priceEl.textContent = new Intl.NumberFormat('en-KE', { style:'currency', currency:'KES' }).format(kes);
    });
  }
}

// Helper for formatting
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
// Corporate Packages modal (reuses #quoteModal from index.html)
// -----------------------------
(function initCorporateModal(){
  const modal = $("#quoteModal");
  if(!modal) return;

  const form = modal.querySelector("form");
  const nameInput = modal.querySelector("input[name='name']") || modal.querySelector("#phoneInput");

  $$("[data-open-corporate]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      initPhoneInputs();
      modal.classList.add("show");
      modal.setAttribute("open","");
      setTimeout(()=> nameInput?.focus(), 200);
    });
  });

  // Close handlers
  modal.querySelectorAll("[data-close], .modal-close").forEach(el=>{
    el.addEventListener("click", ()=> {
      modal.classList.remove("show");
      modal.removeAttribute("open");
    });
  });
})();

// -----------------------------
// Creative Services modal (new: #creativeModal)
// -----------------------------
(function initCreativeModal(){
  const modal = $("#creativeModal");
  if(!modal) return;

  const selectedService = modal.querySelector("#selectedService");
  const form = modal.querySelector("form");
  const nameInput = modal.querySelector("input[name='name']");

  $$("[data-open-creative]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      const plan = btn.dataset.plan || "Custom Service";
      if(selectedService) selectedService.value = plan;
      if($("#modalServiceTitle")) $("#modalServiceTitle").textContent = `Request — ${plan}`;

      initPhoneInputs();
      modal.classList.add("show");
      modal.setAttribute("open","");
      setTimeout(()=> nameInput?.focus(), 200);
    });
  });

  // Close handlers
  modal.querySelectorAll("[data-close], .modal-close").forEach(el=>{
    el.addEventListener("click", ()=> {
      modal.classList.remove("show");
      modal.removeAttribute("open");
    });
  });
})();


// -----------------------------
// Init on page load
// -----------------------------
convertPrices();
initPhoneInputs();
