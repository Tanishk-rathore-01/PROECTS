// Wait for the DOM to load before executing the script
document.addEventListener('DOMContentLoaded', () => {
  const rocketIcon = document.querySelector('.icon');
  let clickCount = 0;

  rocketIcon.addEventListener('click', () => {
    clickCount++;
    rocketIcon.classList.toggle('clicked');
    
    // Reset animation after it completes
    setTimeout(() => {
      rocketIcon.classList.remove('clicked');
    }, 1000);
    
    console.log(`🚀 Rocket clicked ${clickCount} times! Animation triggered`);
  });

  // Add hover effect to header
  const header = document.querySelector('header');
  header.addEventListener('mouseenter', () => {
    header.style.transform = 'translateY(-2px)';
  });
  header.addEventListener('mouseleave', () => {
    header.style.transform = 'translateY(0)';
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const items = document.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('.panel');

  items.forEach(item => {
    item.addEventListener('click', () => {
      // remove active from all items
      items.forEach(i => i.classList.remove('active'));
      // add active to clicked item
      item.classList.add('active');

      // hide all panels
      panels.forEach(panel => panel.classList.remove('active'));
      // show the panel that matches the clicked item
      const panelId = item.getAttribute('data-panel');
      document.getElementById(panelId).classList.add('active');
    });

    // Add keyboard navigation
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });
});