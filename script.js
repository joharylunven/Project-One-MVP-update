/* ---
Fichier: script.js (FINAL)
--- */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. CONFIGURATION ---
    const pages = document.querySelectorAll('.page');
    const N8N_DNA_WEBHOOK_URL = 'http://localhost:5678/webhook-test/analyse-site';
    const N8N_CAMPAIGN_WEBHOOK_URL = 'http://localhost:5678/webhook-test/generate-campaigns'; // NOUVEAU

    let currentBusinessDNA = null; // NOUVEAU: Pour mémoriser le DNA

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
        
        // --- Page 4 Logique (MODIFIÉE) ---
        // Quand on affiche la page 4, on lance la génération des campagnes
        if (pageId === '#page-4') {
            triggerSuggestionLoading();
        }
    }

    // --- 3. LOGIQUE D'ANALYSE (PAGE 1 -> 3) ---

    async function startAnalysis() {
        const urlInput = document.querySelector('#page-1 input[type="text"]');
        const siteUrl = urlInput.value;
        if (!siteUrl) {
            alert('Veuillez entrer une URL');
            return;
        }

        // 1. Changer de page et afficher le spinner
        showPage('#page-2');
        document.querySelector('.url-display span').textContent = siteUrl;
        
        // 2. Appeler le backend n8n (Webhook 1: DNA)
        try {
            const response = await fetch(N8N_DNA_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: siteUrl }),
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
            }

            const n8nResponse = await response.json(); 
            const dna = n8nResponse.json;
            
            // --- NOUVEAU: Mémoriser le DNA ---
            currentBusinessDNA = dna; 
            
            // 4. Afficher la page 3
            showPage('#page-3');

            // 5. Remplir la page 3
            populateDnaPage(dna); 

        } catch (error) {
            console.error('Impossible de contacter n8n ou de générer le DNA:', error);
            alert(`Une erreur est survenue: ${error.message}. Vérifiez que n8n est lancé et que le CORS est configuré.`);
            showPage('#page-1'); 
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
        
        // Overview
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

        // Tags
        populateTagList('#dna-aesthetic .tag-list', dna.aesthetic);
        populateTagList('#dna-values .tag-list', dna.values);
        populateTagList('#dna-tone .tag-list', dna.tone);

        // Colors
        const colorPalette = document.querySelector('#dna-colors .color-palette');
        if (colorPalette) {
            colorPalette.innerHTML = ''; 
            if (dna.colors && dna.colors.length > 0) {
                dna.colors.slice(0, 5).forEach(hex => { 
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
            imageGrid.innerHTML = ''; 
            if (dna.scrapedImages && dna.scrapedImages.length > 0) {
                dna.scrapedImages.slice(0, 6).forEach(imgData => { 
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
        
        attachLightboxListeners();
    }
    
    function populateTagList(selector, tags) {
        const list = document.querySelector(selector);
        if (!list) return; // Sécurité
        list.innerHTML = ''; 
        if (tags && tags.length > 0) {
            tags.forEach(tagText => {
                const li = document.createElement('li');
                li.textContent = tagText;
                list.appendChild(li);
            });
        }
    }

    // --- 5. LOGIQUE LIGHTBOX (INCHANGÉE) ---

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
        const imagesToObserve = document.querySelectorAll('.image-grid img, .suggestion-image img');
        imagesToObserve.forEach(img => {
            img.removeEventListener('click', openLightbox); 
            img.addEventListener('click', openLightbox);
        });
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxOverlay.addEventListener('click', (e) => {
        if (e.target === lightboxOverlay) closeLightbox();
    });

    // --- 6. LOGIQUE PAGE 4 (TOTALEMENT REFAITE) ---
    
    async function triggerSuggestionLoading() {
        // 1. Vérifier si on a le DNA
        if (!currentBusinessDNA) {
            console.error('Aucun DNA trouvé. Impossible de générer des campagnes.');
            alert('Erreur: Le DNA de l\'entreprise n\'a pas été trouvé. Veuillez recommencer.');
            showPage('#page-1');
            return;
        }

        const suggestionGrid = document.querySelector('.suggestion-grid');
        suggestionGrid.innerHTML = ''; // Vider la grille

        // 2. Afficher 3 "squelettes" de chargement
        for (let i = 0; i < 3; i++) {
            const placeholder = document.createElement('article');
            placeholder.className = 'suggestion-card';
            placeholder.innerHTML = `
                <div class="suggestion-image">
                    <div class="loading-overlay"><div class="spinner"></div></div>
                </div>
                <div class="suggestion-content">
                    <h3>Génération de l'idée...</h3>
                    <p>Veuillez patienter pendant que nous contactons l'IA...</p>
                </div>
            `;
            suggestionGrid.appendChild(placeholder);
        }

        // 3. Appeler n8n (Webhook 2: Campagnes) en envoyant le DNA
        try {
            const response = await fetch(N8N_CAMPAIGN_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentBusinessDNA) // On envoie le DNA complet
            });

            if (!response.ok) {
                throw new Error(`Erreur de l'API Gemini: ${response.statusText}`);
            }

            const n8nResponse = await response.json();
            // On s'attend à ce que n8n renvoie { json: [ {title, description, imageUrl}, ... ] }
            const campaigns = n8nResponse.json;

            // 4. Remplir la page avec les vraies données
            populateCampaignPage(campaigns);

        } catch (error) {
            console.error('Erreur lors de la génération des campagnes:', error);
            suggestionGrid.innerHTML = `<p style="color: var(--color-accent-dark);">Une erreur est survenue: ${error.message}</p>`;
        }
    }

    // NOUVELLE FONCTION pour remplir la page 4
    function populateCampaignPage(campaigns) {
        const suggestionGrid = document.querySelector('.suggestion-grid');
        suggestionGrid.innerHTML = ''; // Vider les squelettes

        if (!campaigns || campaigns.length === 0) {
            suggestionGrid.innerHTML = '<p>Impossible de générer des campagnes.</p>';
            return;
        }

        // Créer les 3 vraies cartes
        campaigns.forEach(campaign => {
            const card = document.createElement('article');
            card.className = 'suggestion-card'; // Sans la classe 'loaded'

            card.innerHTML = `
                <div class="suggestion-image">
                    <div class="loading-overlay"><div class="spinner"></div></div>
                    <img src="${campaign.imageUrl}" alt="${campaign.title}">
                </div>
                <div class="suggestion-content">
                    <h3>${campaign.title}</h3>
                    <p>${campaign.description}</p>
                </div>
            `;
            suggestionGrid.appendChild(card);
        });

        // Forcer un "reflow" et ajouter la classe 'loaded' pour l'animation
        // C'est ce qui déclenche la transition d'opacité sur l'image
        setTimeout(() => {
            const cards = document.querySelectorAll('.suggestion-grid .suggestion-card');
            cards.forEach(card => card.classList.add('loaded'));
        }, 100);

        // Rattacher les écouteurs de la lightbox aux nouvelles images
        attachLightboxListeners();
    }

    // --- 7. INITIALISATION (Légèrement modifiée) ---
    
    // Gérer tous les liens de navigation
    const navLinks = document.querySelectorAll('a[href^="#page-"]');
    navLinks.forEach(link => {
        // Exclure le bouton d'analyse qui a sa propre logique
        if (link.id !== 'start-analysis') { 
            link.addEventListener('click', (e) => {
                e.preventDefault(); 
                const targetId = link.getAttribute('href');
                showPage(targetId); // Le clic sur "Looks good" (page-4) est géré ici
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
    
    // Attacher la lightbox aux images statiques (s'il y en avait)
    attachLightboxListeners();

    // Afficher la page initiale
    const currentHash = window.location.hash;
    if (currentHash && currentHash.startsWith("#page-")) {
        showPage(currentHash);
    } else {
        showPage('#page-1');
    }
});