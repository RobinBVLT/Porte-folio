// Configuration de l'API
const API_BASE_URL = '/api';

let currentProjectType = '';
let techStack = [];
let projects = {
    personal: [],
    group: []
};

// Fonction pour afficher les messages de statut
function showStatusMessage(message, type = 'success') {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${type}`;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);
    
    setTimeout(() => statusDiv.classList.add('show'), 100);
    
    setTimeout(() => {
        statusDiv.classList.remove('show');
        setTimeout(() => statusDiv.remove(), 300);
    }, 3000);
}

// Charger les projets au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
});

// Fonction pour charger tous les projets
async function loadProjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/projects`);
        const result = await response.json();
        
        if (result.success) {
            projects = result.data || { personal: [], group: [] };
            // S'assurer que les tableaux existent
            if (!projects.personal) projects.personal = [];
            if (!projects.group) projects.group = [];
            
            displayProjects('personal', projects.personal);
            displayProjects('group', projects.group);
        } else {
            projects = { personal: [], group: [] };
            showStatusMessage('Erreur lors du chargement des projets', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        projects = { personal: [], group: [] };
        showStatusMessage('Impossible de se connecter au serveur', 'error');
        
        // Masquer les indicateurs de chargement
        document.getElementById('personal-projects').innerHTML = '<p style="text-align: center; color: #888;">Impossible de charger les projets</p>';
        document.getElementById('group-projects').innerHTML = '<p style="text-align: center; color: #888;">Impossible de charger les projets</p>';
    }
}

// Fonction pour afficher les projets
function displayProjects(type, projectList) {
    const containerId = type === 'personal' ? 'personal-projects' : 'group-projects';
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Container non trouvé: ${containerId}`);
        return;
    }
    
    if (projectList.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #888;">Aucun projet pour le moment</p>';
        return;
    }
    
    container.innerHTML = projectList.map(project => `
        <div class="project-card">
            <button class="delete-btn" onclick="deleteProject('${type}', '${project.id}')">×</button>
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
            <div class="project-tech">
                ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
            </div>
            <div class="project-links">
                ${project.projectLink ? `<a href="${project.projectLink}" target="_blank" class="project-link">🔗 Voir le projet</a>` : ''}
                ${project.downloadLink ? `<a href="${project.downloadLink}" target="_blank" class="project-link download-link">📥 Télécharger</a>` : ''}
            </div>
        </div>
    `).join('');
}

// Ouvrir le modal pour ajouter un projet
function openModal(type) {
    console.log('Ouverture du modal pour:', type);
    currentProjectType = type;
    console.log('currentProjectType défini à:', currentProjectType);
    
    document.getElementById('projectModal').style.display = 'block';
    document.getElementById('modal-title').textContent = 
        type === 'personal' ? 'Ajouter un Projet Personnel' : 'Ajouter un Projet de Groupe';
    
    // Réinitialiser le formulaire
    document.getElementById('projectForm').reset();
    techStack = [];
    updateTechDisplay();
}

// Fermer le modal
function closeModal() {
    document.getElementById('projectModal').style.display = 'none';
    currentProjectType = '';
    techStack = [];
    updateTechDisplay();
}

// Fermer le modal en cliquant à l'extérieur
window.onclick = function(event) {
    const modal = document.getElementById('projectModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Ajouter une technologie à la liste
function addTech() {
    const techInput = document.getElementById('techInput');
    const tech = techInput.value.trim();
    
    if (tech && !techStack.includes(tech)) {
        techStack.push(tech);
        techInput.value = '';
        updateTechDisplay();
    }
}

// Supprimer une technologie de la liste
function removeTech(tech) {
    techStack = techStack.filter(t => t !== tech);
    updateTechDisplay();
}

// Mettre à jour l'affichage des technologies
function updateTechDisplay() {
    const techList = document.getElementById('techList');
    techList.innerHTML = techStack.map(tech => `
        <span class="tech-item">
            ${tech}
            <span class="remove-tech" onclick="removeTech('${tech}')">×</span>
        </span>
    `).join('');
}

// Permettre d'ajouter une tech avec Enter
document.getElementById('techInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        addTech();
    }
});

// Gérer la soumission du formulaire
document.getElementById('projectForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('projectTitle').value.trim(),
        description: document.getElementById('projectDescription').value.trim(),
        technologies: techStack,
        projectLink: document.getElementById('projectLink').value.trim(),
        downloadLink: document.getElementById('downloadLink').value.trim()
    };
    
    // Validation
    if (!formData.title || !formData.description) {
        showStatusMessage('Le titre et la description sont obligatoires', 'error');
        return;
    }
    
    // Désactiver le bouton pendant l'envoi
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Ajout en cours...</span>';
    
    try {
        console.log('Envoi vers:', `${API_BASE_URL}/projects/${currentProjectType}`);
        console.log('Données:', formData);
        
        const response = await fetch(`${API_BASE_URL}/projects/${currentProjectType}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('Statut de la réponse:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erreur du serveur:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Réponse du serveur:', result);
        
        if (result && result.success) {
            showStatusMessage('Projet ajouté avec succès !', 'success');
            closeModal();
            
            // S'assurer que le tableau existe avant d'ajouter
            if (!projects[currentProjectType]) {
                projects[currentProjectType] = [];
            }
            
            // Ajouter le projet à la liste locale et rafraîchir l'affichage
            if (result.project) {
                console.log('Ajout du projet dans:', currentProjectType);
                console.log('Projet à ajouter:', result.project);
                
                // CORRECTION : Vérifier que currentProjectType n'est pas vide
                if (!currentProjectType) {
                    console.error('currentProjectType est vide !');
                    // Recharger toute la page pour être sûr
                    await loadProjects();
                    return;
                }
                
                projects[currentProjectType].push(result.project);
                console.log('Liste après ajout:', projects[currentProjectType]);
                displayProjects(currentProjectType, projects[currentProjectType]);
            }
        } else {
            showStatusMessage(result?.error || 'Erreur lors de l\'ajout', 'error');
        }
    } catch (error) {
        console.error('Erreur détaillée:', error);
        console.log('URL appelée:', `${API_BASE_URL}/projects/${currentProjectType}`);
        console.log('Données envoyées:', formData);
        showStatusMessage(`Erreur de connexion: ${error.message}`, 'error');
    } finally {
        // Réactiver le bouton
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// Supprimer un projet
async function deleteProject(type, id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${type}/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatusMessage('Projet supprimé avec succès', 'success');
            
            // Supprimer le projet de la liste locale et rafraîchir l'affichage
            projects[type] = projects[type].filter(project => project.id !== id);
            displayProjects(type, projects[type]);
        } else {
            showStatusMessage(result.error || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showStatusMessage('Erreur de connexion au serveur', 'error');
    }
}

// Navigation smooth scroll
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});