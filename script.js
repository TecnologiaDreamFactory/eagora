// ============================================
// PROJETO DREAMERS CONTRA O SOMBRA
// Correção de Timing e Scroll Restoration
// ============================================

(function() {
    'use strict';

    // 1. CORREÇÃO CRÍTICA: DESATIVAR RESTAURAÇÃO DE SCROLL DO NAVEGADOR
    // Isso impede que o navegador tente rolar a página para baixo ao recarregar,
    // eliminando o conflito com o GSAP que causa o "puxão".
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    
    // Forçar topo imediatamente
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    let loaderCompleted = false;
    
    // Aguardar evento do loader
    window.addEventListener('loaderComplete', () => {
        loaderCompleted = true;
        // Pequeno delay para garantir que o DOM "assentou" após o loader sair
        setTimeout(() => {
            if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                initializeApp();
            }
        }, 100);
    });
    
    // Função de inicialização com retry (caso a CDN demore)
    let retryCount = 0;
    const MAX_RETRIES = 50;
    
    function initializeApp() {
        if (!loaderCompleted) return;
        
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            retryCount++;
            if (retryCount < MAX_RETRIES) {
                setTimeout(initializeApp, 100);
            } else {
                console.error('GSAP falhou ao carregar.');
            }
            return;
        }
        
        // Registrar e Configurar
        gsap.registerPlugin(ScrollTrigger);
        
        // Configuração global para melhorar performance e precisão
        ScrollTrigger.config({
            limitCallbacks: true,
            ignoreMobileResize: true // Evita recálculos desnecessários na barra de URL mobile
        });

        setTrueVHeight();
        startApp();
    }
    
    function setTrueVHeight() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // LÓGICA PRINCIPAL
    function startApp() {
        const isMobile = () => window.innerWidth <= 768;
        const screenWidth = window.innerWidth;
        
        // Garantia extra de topo
        window.scrollTo(0, 0);

        // ============================================
        // SLIDE 1 - ANIMAÇÃO INICIAL
        // ============================================
        function animateFirstSlide(onComplete) {
            const sections = document.querySelectorAll('.story-section');
            if (sections.length === 0) return;
            
            const firstSection = sections[0];
            const firstPanel = firstSection.querySelector('.panel');
            // Seleciona elementos internos mantendo sua estrutura original
            const elements = firstSection.querySelectorAll('.panel-visual-img, .panel-text-frame, .dialogue');
            
            // Estado inicial: Visível mas transparente
            gsap.set(firstSection, { display: 'flex', opacity: 1, visibility: 'visible' });
            gsap.set(firstPanel, { opacity: 0 });
            gsap.set(elements, { opacity: 0, scale: 0.1, y: 50, rotation: -12 });
            
            const tl1 = gsap.timeline({
                onComplete: () => {
                    // Libera o scroll apenas quando a animação termina e o layout está estável
                    document.documentElement.style.overflowY = "auto";
                    document.body.style.overflowY = "auto";
                    
                    // REFRESH CRÍTICO: Força o GSAP a ler as posições agora que o scroll existe
                    ScrollTrigger.refresh(true);
                    
                    if (onComplete) onComplete();
                }
            });

            // Animação "Pipoca" Original
            tl1.to(firstPanel, { opacity: 1, duration: 1, ease: "power3.out" })
               .to(elements, {
                   opacity: 1,
                   scale: 1,
                   y: 0,
                   rotation: 0,
                   stagger: 0.15,
                   duration: 1.3,
                   ease: "elastic.out(1, 0.5)"
               }, "-=0.5");
        }

        // ============================================
        // SLIDES SEGUINTES (2 a 7) - LÓGICA COMPLETA
        // ============================================
        function animateSubsequentSlides() {
            const sections = document.querySelectorAll('.story-section');
            const mobile = isMobile();

            sections.forEach((section, index) => {
                if (index === 0) return; // Pular Slide 1
                
                // Preparar estado inicial
                gsap.set(section, { opacity: 1, visibility: 'visible', pointerEvents: 'auto', display: 'flex' });

                const panel = section.querySelector('.panel');
                const image = section.querySelector('.panel-visual-img');
                const text = section.querySelector('.panel-text-frame');
                const dialogue = section.querySelector('.dialogue');
                
                if (!panel) return;

                // SUAS VARIÁVEIS ORIGINAIS (Leque, Distância, Rotação)
                // Lógica: index 1 aqui no loop é o Slide 2 na tela
                // Slide 3 (index 2) é o que tem o efeito "Leque" forte
                
                let slideFromLeft = mobile ? ((index - 1) % 2 === 1) : (index % 2 === 1);
                
                // Slide 3 (index 2) recebe tratamento especial de distância (1.8x)
                let distMultiplier = (mobile && index === 2) ? 1.8 : 0.7; 
                
                let fromX = slideFromLeft ? -(screenWidth * distMultiplier) : (screenWidth * distMultiplier);
                let rotationVal = (mobile && index === 2) ? 30 : 0;
                let scaleVal = (mobile && index === 2) ? 0.4 : 0.85;

                // TIMELINE COM SCROLLTRIGGER OTIMIZADO
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: section,
                        start: "top bottom", // Começa quando o topo da seção toca o fundo da tela
                        end: "center center", // Termina no centro
                        // Scrub suavizado (1.5 a 3.0) absorve micro-tremores do dedo
                        scrub: mobile ? (index === 2 ? 3.0 : 1.5) : 1.2, 
                        invalidateOnRefresh: true,
                        preventOverlaps: true,
                        // fastScrollEnd: true // Opcional: remove se causar pulos em scrolls rápidos
                    }
                });

                // 1. Entrada do Painel (Lateral)
                tl.fromTo(panel, 
                    { 
                        x: fromX, 
                        opacity: 0, 
                        scale: scaleVal, 
                        rotation: slideFromLeft ? -rotationVal : rotationVal 
                    },
                    { 
                        x: 0, 
                        opacity: 1, 
                        scale: 1, 
                        rotation: 0, 
                        duration: 1.5, 
                        ease: "power3.out" 
                    }
                );

                // 2. Elementos Internos (Pipoca atrasada)
                if (image) {
                    tl.fromTo(image, 
                        { scale: (mobile && index === 2) ? 0.05 : 0.2, opacity: 0, rotation: slideFromLeft ? -35 : 35, y: 80 },
                        { scale: 1, opacity: 1, rotation: 0, y: 0, duration: 2.0, ease: "elastic.out(1, 0.4)" }, 
                        "-=1.2"
                    );
                }
                
                if (text) {
                    tl.fromTo(text, 
                        { scale: 0.3, opacity: 0, y: 70 },
                        { scale: 1, opacity: 1, y: 0, duration: 1.5, ease: "elastic.out(1, 0.6)" }, 
                        "-=1.3"
                    );
                }

                if (dialogue) {
                    tl.fromTo(dialogue, 
                        { opacity: 0, y: 35 },
                        { opacity: 1, y: 0, duration: 1.2, ease: "power2.out" }, 
                        "-=1.0"
                    );
                }
            });
        }

        // ============================================
        // SLIDE FINAL (8) - EXPLOSÃO HQ "POW!"
        // ============================================
        function animateFinalSlide() {
            const section8 = document.querySelector('#section-8');
            if (!section8) return;

            gsap.set(section8, { opacity: 1, visibility: 'visible', display: 'flex' });
            
            const tlFinal = gsap.timeline({
                scrollTrigger: {
                    trigger: section8,
                    start: "top bottom",
                    end: "center center",
                    scrub: 2.0 // Scrub alto para dar peso à explosão
                }
            });

            // Logo voando de baixo
            tlFinal.fromTo(section8.querySelector('.logo-final'), 
                { y: 900, scale: 0.3, opacity: 0, rotation: -20 },
                { y: 0, scale: 1.4, opacity: 1, rotation: 15, duration: 2.5, ease: "expo.out" }
            )
            // Ajuste final da logo (Bounce)
            .to(section8.querySelector('.logo-final'), {
                scale: 1,
                rotation: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.3)"
            });

            // Frase final aparecendo
            tlFinal.fromTo(section8.querySelector('.frase-final'), 
                { opacity: 0, scaleX: 0.3, scaleY: 1.5, filter: "blur(5px)" },
                { opacity: 1, scaleX: 1, scaleY: 1, filter: "blur(0px)", duration: 1.5, ease: "back.out(1.7)" }, 
                "-=1"
            );
        }

        // ============================================
        // INICIALIZAÇÃO EM CASCATA
        // ============================================
        // 1. Anima Slide 1
        // 2. Configura os outros slides (sem animar ainda)
        // 3. Libera o scroll
        // 4. Dá o Refresh final no GSAP
        animateFirstSlide(() => {
            animateSubsequentSlides();
            animateFinalSlide();
            
            // Refresh duplo para garantir que mobile bars não quebrem o layout
            requestAnimationFrame(() => ScrollTrigger.refresh());
            setTimeout(() => ScrollTrigger.refresh(), 500);
        });
    }

    // Handlers de redimensionamento (Mobile URL bar)
    window.addEventListener('resize', () => {
        setTrueVHeight();
        // Debounce para evitar refresh excessivo
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
    });
    
})();
