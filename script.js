// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Initialize math rendering
    initMathRendering();
    
    // Initialize comparison slider
    initComparisonSlider();
    
    // Initialize Gaussian splat viewer
    initGaussianViewer();
});

// Math rendering with KaTeX
function initMathRendering() {
    // Render inline math
    const inlineMath = document.querySelectorAll('.math-inline');
    inlineMath.forEach(element => {
        try {
            katex.render(element.textContent, element, {
                throwOnError: false,
                displayMode: false
            });
        } catch (e) {
            console.warn('KaTeX rendering error:', e);
        }
    });
    
    // Render block math
    const blockMath = document.querySelectorAll('.math-block');
    blockMath.forEach(element => {
        try {
            katex.render(element.textContent, element, {
                throwOnError: false,
                displayMode: true
            });
        } catch (e) {
            console.warn('KaTeX rendering error:', e);
        }
    });
}

// Image comparison slider functionality
function initComparisonSlider() {
    const imageComparison = document.getElementById('imageComparison');
    if (!imageComparison) return;
    
    const slider = document.getElementById('comparisonSlider');
    const overlayImage = document.getElementById('overlayImage');
    const container = imageComparison.querySelector('.comparison-container');
    
    let isDragging = false;
    let containerRect = null;
    
    // Mouse events
    slider.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    // Touch events for mobile
    slider.addEventListener('touchstart', startDrag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', stopDrag);
    
    // Keyboard events for accessibility
    slider.setAttribute('tabindex', '0');
    slider.setAttribute('role', 'slider');
    slider.setAttribute('aria-valuemin', '0');
    slider.setAttribute('aria-valuemax', '100');
    slider.setAttribute('aria-valuenow', '50');
    slider.setAttribute('aria-label', 'Image comparison slider');
    
    slider.addEventListener('keydown', handleKeyboard);
    
    function startDrag(e) {
        isDragging = true;
        containerRect = container.getBoundingClientRect();
        e.preventDefault();
    }
    
    function stopDrag() {
        isDragging = false;
        containerRect = null;
    }
    
    function drag(e) {
        if (!isDragging || !containerRect) return;
        
        let clientX;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
        } else {
            clientX = e.clientX;
        }
        
        const x = clientX - containerRect.left;
        const percentage = Math.max(0, Math.min(100, (x / containerRect.width) * 100));
        
        updateSlider(percentage);
    }
    
    function handleKeyboard(e) {
        const currentValue = parseFloat(slider.getAttribute('aria-valuenow'));
        let newValue = currentValue;
        
        switch(e.key) {
            case 'ArrowLeft':
                newValue = Math.max(0, currentValue - 5);
                break;
            case 'ArrowRight':
                newValue = Math.min(100, currentValue + 5);
                break;
            case 'Home':
                newValue = 0;
                break;
            case 'End':
                newValue = 100;
                break;
            default:
                return;
        }
        
        e.preventDefault();
        updateSlider(newValue);
    }
    
    function updateSlider(percentage) {
        // Move the slider line
        slider.style.left = percentage + '%';
        
        // Update the clip-path of the overlay image
        overlayImage.style.clipPath = `inset(0 ${100 - percentage}% 0 0)`;
        
        // Update aria attribute
        slider.setAttribute('aria-valuenow', Math.round(percentage));
    }
    
    // Click to move slider
    container.addEventListener('click', function(e) {
        if (slider.contains(e.target)) return;
        
        containerRect = container.getBoundingClientRect();
        const x = e.clientX - containerRect.left;
        const percentage = Math.max(0, Math.min(100, (x / containerRect.width) * 100));
        updateSlider(percentage);
    });
}

// Gaussian splat viewer functionality
function initGaussianViewer() {
    const canvas = document.getElementById('gaussianCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let rotation = { x: 0, y: 0 };
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };
    let animationId = null;
    
    // Set canvas size
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Mouse events
    canvas.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    // Touch events
    canvas.addEventListener('touchstart', startDrag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', stopDrag);
    
    // Keyboard events
    canvas.addEventListener('keydown', handleKeyboard);
    canvas.setAttribute('tabindex', '0');
    
    function startDrag(e) {
        isDragging = true;
        
        if (e.type === 'touchstart') {
            lastMouse.x = e.touches[0].clientX;
            lastMouse.y = e.touches[0].clientY;
        } else {
            lastMouse.x = e.clientX;
            lastMouse.y = e.clientY;
        }
        
        e.preventDefault();
    }
    
    function stopDrag() {
        isDragging = false;
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        let clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const deltaX = clientX - lastMouse.x;
        const deltaY = clientY - lastMouse.y;
        
        rotation.x += deltaY * 0.5;
        rotation.y += deltaX * 0.5;
        
        lastMouse.x = clientX;
        lastMouse.y = clientY;
        
        e.preventDefault();
    }
    
    function handleKeyboard(e) {
        switch(e.key) {
            case 'ArrowLeft':
                rotation.y -= 10;
                break;
            case 'ArrowRight':
                rotation.y += 10;
                break;
            case 'ArrowUp':
                rotation.x -= 10;
                break;
            case 'ArrowDown':
                rotation.x += 10;
                break;
            default:
                return;
        }
        e.preventDefault();
    }
    
    // Animation loop
    function animate() {
        // Clear canvas
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw placeholder "splats"
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2 + rotation.y * 0.01;
            const radius = 60 + Math.sin(rotation.x * 0.01 + i * 0.5) * 20;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius * 0.6;
            const size = 3 + Math.sin(rotation.x * 0.01 + i * 0.3) * 2;
            
            // Create gradient for each "splat"
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            const hue = (i * 7 + rotation.y * 0.1) % 360;
            gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.8)`);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        animationId = requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
    
    // Clean up animation when page unloads
    window.addEventListener('beforeunload', function() {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle window resize for responsive elements
window.addEventListener('resize', debounce(function() {
    // Reinitialize components that need resize handling
    const slider = document.getElementById('comparisonSlider');
    if (slider) {
        // Update slider position on resize
        const currentValue = parseFloat(slider.getAttribute('aria-valuenow')) || 50;
        const overlayImage = document.getElementById('overlayImage');
        
        // Trigger a small update to recalculate positions
        setTimeout(() => {
            slider.style.left = currentValue + '%';
            if (overlayImage) {
                overlayImage.style.clipPath = `inset(0 ${100 - currentValue}% 0 0)`;
            }
        }, 100);
    }
}, 250)); 