// Theme toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle?.addEventListener('click', () => {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('themeDark', dark ? '1' : '0');
});
if(localStorage.getItem('themeDark') === '1') document.documentElement.classList.add('dark');

// Scroll animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.card, h1, h2').forEach(el => {
    el.classList.add('animate-hidden');
    observer.observe(el);
});
// Project card expansion
document.querySelectorAll('.project-card').forEach(card => {
    const expandBtn = card.querySelector('.expand-btn');
    const details = card.querySelector('.project-details');
    
    if (expandBtn && details) {
        expandBtn.addEventListener('click', () => {
            const isExpanded = details.classList.toggle('expanded');
            expandBtn.innerHTML = isExpanded ? '⌃ Show Less' : '⌄ Show More';
            card.classList.toggle('expanded');
        });
    }
});