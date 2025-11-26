document.addEventListener('DOMContentLoaded', () => {

    const splatterContainer = document.getElementById('splatter-container');
    const navbar = document.getElementById('navbar');
    const searchButton = document.getElementById('search-button'); 
    const contentSection = document.getElementById('content-section'); 
    const vh = window.innerHeight;

    // --- 1. Realistic Spray Paint Splatter Generation ---
    function generateSplatter(container, count) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * 7 + 3; 
            const x = Math.random() * 100; 
            const y = Math.random() * 100;
            const opacity = Math.random() * 0.7 + 0.3;

            particle.classList.add('splatter-particle');
            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${x}%;
                bottom: ${y}%;
                opacity: ${opacity};
                filter: blur(${size * 0.1}px);
            `;
            container.appendChild(particle);
        }
    }
    
    generateSplatter(splatterContainer, 80);


    // --- 2. Scroll Logic For Splatter Shrink ---
    const initialScale = 1.0; 
    const finalScale = 0.05; 
    const initialOpacity = 1.0;
    const finalOpacity = 0.0;
    const scrollThreshold = vh * 0.8;

    function updateSplatter() {
        const scrollY = window.scrollY;
        const scrollProgress = Math.min(1, scrollY / scrollThreshold);
        
        const currentScale = initialScale - (initialScale - finalScale) * scrollProgress;
        const currentOpacity = initialOpacity - (initialOpacity - finalOpacity) * scrollProgress;

        splatterContainer.style.transform = `scale(${Math.max(finalScale, currentScale)})`;
        splatterContainer.style.opacity = `${Math.max(finalOpacity, currentOpacity)}`;
    }



    // --- 3. Navbar Hide When Scrolling Down ---
    let lastScroll = 0;

    function navbarScrollHandler() {
        const currentScroll = window.scrollY;

        // Hide navbar when scrolling DOWN
        if (currentScroll > lastScroll && currentScroll > 50) {
            navbar.style.transform = "translateY(-100%)";
            navbar.classList.remove("navbar-blur");
            navbar.classList.add("navbar-solid");
        } 
        // Show navbar when scrolling UP
        else {
            navbar.style.transform = "translateY(0)";
            
            if (currentScroll < 50) {
                navbar.classList.add("navbar-blur");
                navbar.classList.remove("navbar-solid");
            }
        }

        lastScroll = currentScroll;
    }



    // --- 4. Combine Scroll Actions ---
    window.addEventListener("scroll", () => {
        updateSplatter();
        navbarScrollHandler();
    });

    updateSplatter();



    // --- 5. Button Scroll To Section ---
    if (searchButton) {
        searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (contentSection) {
                contentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

});

const searchBarContainer = document.querySelector('.recipe-finder-container');
let lastScrollPosition = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    // SCROLL DOWN → Expand & Show (grow bigger)
    if (currentScroll > lastScrollPosition && currentScroll > 100) {
        searchBarContainer.classList.remove("shrink-roll");
        searchBarContainer.classList.add("expand-open");
    } 
    // SCROLL UP → Shrink & Disappear (make smaller)
    else {
        searchBarContainer.classList.remove("expand-open");
        searchBarContainer.classList.add("shrink-roll");
    }

    lastScrollPosition = currentScroll;
});
