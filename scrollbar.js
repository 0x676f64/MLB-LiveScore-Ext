// Get button elements
const scrollLeftBtn = document.getElementById('scrollLeft');
const scrollRightBtn = document.getElementById('scrollRight');

// Scroll amount in pixels
const scrollAmount = 300;

// Right button - scroll right
scrollRightBtn.addEventListener('click', function() {
    window.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
    });
});

// Left button - scroll left  
scrollLeftBtn.addEventListener('click', function() {
    window.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
    });
});

// Alternative: If you want to scroll a specific container instead of the whole page
// Replace '.your-container' with your actual container selector

const container = document.querySelector('.table-container');

scrollRightBtn.addEventListener('click', function() {
    container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
    });
});

scrollLeftBtn.addEventListener('click', function() {
    container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
    });
});