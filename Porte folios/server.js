// server.js - Backend pour le portfolio
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'projects.json');

// Middleware
app.use(cors()); // Permet les requêtes cross-origin
app.use(express.json()); // Parse les données JSON
app.use(express.static('public')); // Sert les fichiers statiques

// Structure par défaut des données
const defaultData = {
    personal: [
        {
            id: 1,
            title: "Application de Gestion de Tâches",
            description: "Une application web permettant de gérer ses tâches quotidiennes avec un système de priorités et de catégories.",
            technologies: ["JavaScript", "React", "Node.js", "MongoDB"],
            projectLink: "https://github.com/moncompte/todo-app",
            downloadLink: "",
            createdAt: new Date().toISOString()
        }
    ],
    group: [
        {
            id: 2,
            title: "Site E-commerce Collaboratif",
            description: "Développement en équipe d'une plateforme e-commerce complète avec panier, paiement et gestion des stocks.",
            technologies: ["PHP", "Laravel", "MySQL", "Bootstrap"],
            projectLink: "https://github.com/equipe/ecommerce-site",
            downloadLink: "https://github.com/equipe/ecommerce-site/archive/main.zip",
            createdAt: new Date().toISOString()
        }
    ]
};

// Fonction pour lire les données du fichier
async function readData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si le fichier n'existe pas, créer avec les données par défaut
        await writeData(defaultData);
        return defaultData;
    }
}

// Fonction pour écrire les données dans le fichier
async function writeData(data) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'écriture:', error);
        return false;
    }
}

// Générer un ID unique pour les nouveaux projets
function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

// ROUTES API

// GET - Récupérer tous les projets
app.get('/api/projects', async (req, res) => {
    try {
        const data = await readData();
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des projets'
        });
    }
});

// POST - Ajouter un nouveau projet
app.post('/api/projects/:type', async (req, res) => {
    try {
        const { type } = req.params; // 'personal' ou 'group'
        const projectData = req.body;

        // Validation
        if (!['personal', 'group'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Type de projet invalide. Utilisez "personal" ou "group"'
            });
        }

        if (!projectData.title || !projectData.description) {
            return res.status(400).json({
                success: false,
                error: 'Le titre et la description sont obligatoires'
            });
        }

        // Lire les données actuelles
        const data = await readData();

        // Créer le nouveau projet avec un ID unique
        const newProject = {
            id: generateId(),
            title: projectData.title,
            description: projectData.description,
            technologies: projectData.technologies || [],
            projectLink: projectData.projectLink || '',
            downloadLink: projectData.downloadLink || '',
            createdAt: new Date().toISOString()
        };

        // Ajouter le projet
        data[type].push(newProject);

        // Sauvegarder
        const saved = await writeData(data);
        
        if (saved) {
            res.json({
                success: true,
                message: 'Projet ajouté avec succès',
                project: newProject
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la sauvegarde'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de l\'ajout du projet'
        });
    }
});

// DELETE - Supprimer un projet
app.delete('/api/projects/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;

        // Validation
        if (!['personal', 'group'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Type de projet invalide'
            });
        }

        // Lire les données actuelles
        const data = await readData();

        // Trouver l'index du projet à supprimer
        const projectIndex = data[type].findIndex(project => project.id == id);

        if (projectIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Projet non trouvé'
            });
        }

        // Supprimer le projet
        const deletedProject = data[type].splice(projectIndex, 1)[0];

        // Sauvegarder
        const saved = await writeData(data);

        if (saved) {
            res.json({
                success: true,
                message: 'Projet supprimé avec succès',
                deletedProject: deletedProject
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la sauvegarde'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la suppression'
        });
    }
});

// PUT - Modifier un projet existant
app.put('/api/projects/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const updateData = req.body;

        // Validation
        if (!['personal', 'group'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Type de projet invalide'
            });
        }

        // Lire les données actuelles
        const data = await readData();

        // Trouver le projet à modifier
        const projectIndex = data[type].findIndex(project => project.id == id);

        if (projectIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Projet non trouvé'
            });
        }

        // Mettre à jour le projet (garder l'ID et la date de création)
        const updatedProject = {
            ...data[type][projectIndex],
            ...updateData,
            id: data[type][projectIndex].id, // Garder l'ID original
            createdAt: data[type][projectIndex].createdAt, // Garder la date de création
            updatedAt: new Date().toISOString()
        };

        data[type][projectIndex] = updatedProject;

        // Sauvegarder
        const saved = await writeData(data);

        if (saved) {
            res.json({
                success: true,
                message: 'Projet modifié avec succès',
                project: updatedProject
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la sauvegarde'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la modification'
        });
    }
});

// Route pour servir le frontend (optionnel)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route non trouvée'
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📁 Données sauvegardées dans: ${DATA_FILE}`);
    console.log(`\n📋 API Endpoints disponibles:`);
    console.log(`   GET    /api/projects           - Récupérer tous les projets`);
    console.log(`   POST   /api/projects/:type     - Ajouter un projet (personal/group)`);
    console.log(`   PUT    /api/projects/:type/:id - Modifier un projet`);
    console.log(`   DELETE /api/projects/:type/:id - Supprimer un projet`);
});

module.exports = app;