/* ---
Fichier: script.js (CORRIGÉ)
--- */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURATION ---
    const pages = document.querySelectorAll('.page');
    const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook-test/analyse-site';

    // --- 2. LOGIQUE DE NAVIGATION ---
    
    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('page-active');
        });

        const targetPage = document.querySelector(pageId);
        if (targetPage) {
            targetPage.classList.add('page-active');
            window.scrollTo(0, 0);
        }
        
        // --- Page 4 Logique (Conservée) ---
        if (pageId === '#page-4') {
            triggerSuggestionLoading();
        }
    }

    // --- 3. LOGIQUE D'ANALYSE (LE CŒUR DU MVP) ---

    async function startAnalysis() {
        const urlInput = document.querySelector('#page-1 input[type="text"]');
        const siteUrl = urlInput.value;
        if (!siteUrl) {
            alert('Veuillez entrer une URL');
            return;
        }

        // 1. Changer de page et afficher le spinner
        showPage('#page-2');
        document.querySelector('.url-display span').textContent = siteUrl; // Affiche l'URL en cours d'analyse
        
        // 2. Appeler votre backend n8n local
        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: siteUrl }),
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
            }

            // Renommé 'n8nResponse' pour plus de clarté
            const n8nResponse = await response.json(); 

            // 3. Nous avons la réponse !
            console.log('Business DNA reçu:', n8nResponse);

            // --- CORRECTION ---
            // Extrayez le VRAI objet JSON de la réponse n8n
            const dna = n8nResponse.json;
            
            // 4. D'ABORD, naviguer vers la page 3
            showPage('#page-3');

            // 5. ENSUITE, remplir la page (AVEC LE BON OBJET)
            populateDnaPage(dna); // <-- PROBLÈME RÉSOLU

        } catch (error) {
            console.error('Impossible de contacter n8n ou de générer le DNA:', error);
            alert(`Une erreur est survenue: ${error.message}. Vérifiez que n8n est lancé et que le CORS est configuré.`);
            showPage('#page-1'); // Revenir à la page 1
        }
    }

// --- 4. LOGIQUE DE REMPLISSAGE (PAGE 3) ---

function populateDnaPage(dna) {
    // Projet
    const projectH2 = document.querySelector('#dna-project h2');
    if (projectH2) projectH2.textContent = dna.projectName || 'Project Name';
    
    const tagline = document.querySelector('.tagline-display');
    if (tagline) tagline.textContent = dna.tagline || 'Your tagline here.';
    
    const websiteLink = document.querySelector('#dna-project a');
    if (websiteLink) {
        websiteLink.href = dna.website || '#';
        websiteLink.textContent = dna.website || 'www.website.com';
    }
    
    // Overview (AVEC SÉCURITÉ)
    if (dna.overview) {
        const brandNameP = document.querySelector('#dna-overview p:nth-child(1) strong');
        if (brandNameP && brandNameP.nextSibling) {
            brandNameP.nextSibling.textContent = ` ${dna.overview.brandName || ''}`;
        }

        const industryP = document.querySelector('#dna-overview p:nth-child(2) strong');
        if (industryP && industryP.nextSibling) {
            industryP.nextSibling.textContent = ` ${dna.overview.industry || ''}`;
        }

        const conceptP = document.querySelector('#dna-overview p:nth-child(3) strong');
        if (conceptP && conceptP.nextSibling) {
            conceptP.nextSibling.textContent = ` ${dna.overview.concept || ''}`;
        }
    }

    // Fonts
    if (dna.fonts) {
        const primaryFont = document.querySelector('#dna-fonts .font-example-playfair');
        if (primaryFont) primaryFont.textContent = dna.fonts.primary || 'Primary Font';
        
        const secondaryFont = document.querySelector('#dna-fonts .font-example-lato');
        if (secondaryFont) secondaryFont.textContent = dna.fonts.secondary || 'Secondary Font';
    }

    // Tags (Aesthetic, Values, Tone)
    populateTagList('#dna-aesthetic .tag-list', dna.aesthetic);
    populateTagList('#dna-values .tag-list', dna.values);
    populateTagList('#dna-tone .tag-list', dna.tone);

    // Colors
    const colorPalette = document.querySelector('#dna-colors .color-palette');
    if (colorPalette) {
        colorPalette.innerHTML = ''; // Vider les couleurs statiques
        if (dna.colors && dna.colors.length > 0) {
            dna.colors.slice(0, 5).forEach(hex => { // Limiter à 5
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.innerHTML = `
                    <div class="swatch-circle" style="background-color: ${hex}; border: ${hex === '#FFFFFF' ? '1px solid #ccc' : 'none'}"></div>
                    <span>${hex}</span>
                `;
                colorPalette.appendChild(swatch);
            });
        }
    }

    // Images
    const imageGrid = document.querySelector('#dna-images .image-grid');
    if (imageGrid) {
        imageGrid.innerHTML = ''; // Vider les images statiques
        if (dna.scrapedImages && dna.scrapedImages.length > 0) {
            dna.scrapedImages.slice(0, 6).forEach(imgData => { // Limiter à 6
                let src = imgData.src;
                if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                    try {
                        let baseUrl = new URL(dna.website);
                        src = new URL(src, baseUrl.origin).href;
                    } catch (e) {
                        return; 
                    }
                }

                const img = document.createElement('img');
                img.src = src;
                img.alt = 'Brand image';
                imageGrid.appendChild(img);
            });
        }
    }
    
    // RE-ATTACHER LA LIGHTBOX aux nouvelles images
    attachLightboxListeners();
}
    
    function populateTagList(selector, tags) {
        const list = document.querySelector(selector);
        list.innerHTML = ''; // Vider les tags statiques
        if (tags && tags.length > 0) {
            tags.forEach(tagText => {
                const li = document.createElement('li');
                li.textContent = tagText;
                list.appendChild(li);
            });
        }
    }

    // --- 5. LOGIQUE LIGHTBOX (Conservée et améliorée) ---

    const lightboxOverlay = document.getElementById('lightbox-overlay');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDescription = document.getElementById('lightbox-description');

    function openLightbox(e) {
        const clickedImage = e.target;
        lightboxImage.src = clickedImage.src;
        
        const suggestionCard = clickedImage.closest('.suggestion-card');
        if (suggestionCard) {
            const content = suggestionCard.querySelector('.suggestion-content');
            lightboxTitle.textContent = content.querySelector('h3').textContent;
            lightboxDescription.textContent = content.querySelector('p').textContent;
            lightboxCaption.style.display = 'block';
        } else {
            lightboxCaption.style.display = 'none';
        }

        lightboxOverlay.style.display = 'flex';
        setTimeout(() => { lightboxOverlay.style.opacity = '1'; }, 10);
        document.body.classList.add('lightbox-active');
    }

    function closeLightbox() {
        lightboxOverlay.style.opacity = '0';
        document.body.classList.remove('lightbox-active');
        setTimeout(() => {
            lightboxOverlay.style.display = 'none';
            lightboxImage.src = ''; 
            lightboxTitle.textContent = '';
            lightboxDescription.textContent = '';
        }, 300);
    }

    function attachLightboxListeners() {
        // Cible TOUTES les images (statiques page 4, dynamiques page 3)
        const imagesToObserve = document.querySelectorAll('.image-grid img, .suggestion-image img');
        imagesToObserve.forEach(img => {
            // Empêche de doubler les écouteurs
            img.removeEventListener('click', openLightbox); 
            img.addEventListener('click', openLightbox);
        });
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxOverlay.addEventListener('click', (e) => {
        if (e.target === lightboxOverlay) closeLightbox();
    });

    // --- 6. LOGIQUE PAGE 4 (Conservée) ---
    
    function triggerSuggestionLoading() {
        const suggestionCards = document.querySelectorAll('.suggestion-card');
        suggestionCards.forEach(card => card.classList.remove('loaded'));
        setTimeout(() => {
            suggestionCards.forEach(card => card.classList.add('loaded'));
        }, 5000);
    }

    // --- 7. INITIALISATION ---
    
    // Gérer tous les liens de navigation SAUF le bouton d'analyse
    const navLinks = document.querySelectorAll('a[href^="#page-"]');
    navLinks.forEach(link => {
        if (link.id !== 'start-analysis') { // On exclut notre bouton spécial
            link.addEventListener('click', (e) => {
                e.preventDefault(); 
                const targetId = link.getAttribute('href');
                showPage(targetId);
            });
        }
    });
    
    // Gérer le bouton d'analyse spécial
    const startButton = document.getElementById('start-analysis');
    if (startButton) {
        startButton.addEventListener('click', (e) => {
            e.preventDefault();
            startAnalysis();
        });
    }

    // Gérer le fallback (non nécessaire, mais propre)
    const fallbackLink = document.querySelector('.generation-complete-link');
    if (fallbackLink) fallbackLink.style.display = 'none';
    
    // Attacher la lightbox aux images statiques (page 4)
    attachLightboxListeners();

    // Afficher la page initiale
    const currentHash = window.location.hash;
    if (currentHash && currentHash.startsWith("#page-")) {
        showPage(currentHash);
    } else {
        showPage('#page-1');
    }
});