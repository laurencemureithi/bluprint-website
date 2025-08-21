
const navBtn = document.querySelector('[data-nav]');
const navMenu = document.querySelector('[data-menu]');
if(navBtn){
  navBtn.addEventListener('click', ()=>{ navMenu?.classList.toggle('open'); });
}
const themeBtn = document.querySelectorAll('[data-theme]');
themeBtn.forEach(btn=>btn.addEventListener('click', (e)=>{
  const mode = e.target.dataset.theme;
  document.documentElement.dataset.theme = mode;
  localStorage.setItem('theme', mode);
  themeBtn.forEach(b=>b.classList.toggle('active', b.dataset.theme===mode));
}));
const saved = localStorage.getItem('theme');
if(saved){ document.documentElement.dataset.theme = saved; document.querySelector(`[data-theme="${saved}"]`)?.classList.add('active'); }

// Simple filter on work page
const filters = document.querySelectorAll('[data-filter]');
const cards = document.querySelectorAll('[data-cat]');
filters.forEach(f=>f.addEventListener('click',()=>{
  const t=f.dataset.filter;
  filters.forEach(x=>x.classList.remove('active'));
  f.classList.add('active');
  cards.forEach(c=> c.style.display = (t==='all'|| c.dataset.cat.includes(t)) ? '' : 'none');
}));

// Register SW (relative path for GitHub Pages repo)
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  });
}
