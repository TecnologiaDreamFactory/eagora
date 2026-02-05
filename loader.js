// LOADER DE SEGURANÇA - LÓGICA
(function() {
    'use strict';
    
    // BLOQUEAR SCROLL IMEDIATAMENTE
    document.body.classList.add('loader-active');
    
    let progress = 0;
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const currentSlideElement = document.getElementById('current-slide');
    
    let abrindoShown = false;
    
    function showAbrindo() {
        if (abrindoShown) return;
        
        abrindoShown = true;
        
        // Fade in do "Abrindo"
        currentSlideElement.className = 'slide-fade-in text-center w-full';
        currentSlideElement.innerHTML = '<span class="text-green-400 font-bold">Abrindo</span>';
    }
    
    function updateProgress() {
        if (progress < 100) {
            // Incremento variável mais lento para dar tempo de ler
            const increment = Math.random() * 0.8 + 0.5;
            progress = Math.min(progress + increment, 100);
            
            progressBar.style.width = progress + '%';
            progressText.textContent = Math.floor(progress);
            
            // Mostrar "Abrindo" quando chegar em 90%
            if (progress >= 90 && !abrindoShown) {
                showAbrindo();
            }
            
            // Intervalo maior para tornar mais lento
            setTimeout(updateProgress, 100);
        } else {
            // Progresso completo
            progress = 100;
            progressBar.style.width = '100%';
            progressText.textContent = '100';
            
            // Garantir que "Abrindo" seja mostrado
            if (!abrindoShown) {
                showAbrindo();
            }
            
            // Remover loader após animação
            setTimeout(() => {
                const loader = document.getElementById('security-loader');
                if (loader) {
                    loader.classList.add('loader-fade-out');
                    setTimeout(() => {
                        loader.remove();
                        
                        // HABILITAR SCROLL AGORA
                        document.body.classList.remove('loader-active');
                        
                        // INICIAR SCRIPT PRINCIPAL SOMENTE APÓS LOADER REMOVER
                        // Disparar evento customizado para script.js iniciar
                        window.dispatchEvent(new Event('loaderComplete'));
                    }, 500);
                }
            }, 1500);
        }
    }
    
    // Iniciar progresso após pequeno delay
    setTimeout(updateProgress, 300);
})();
