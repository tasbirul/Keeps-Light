const API_URL = 'http://localhost:3000/api/notes';

// DOM Elements
const createNoteCollapsed = document.getElementById('create-note-collapsed');
const createNoteExpanded = document.getElementById('create-note-expanded');
const noteTitleInput = document.getElementById('note-title-input');
const noteContentInput = document.getElementById('note-content-input');
const closeCreateNoteBtn = document.getElementById('close-create-note');
const createPinBtn = document.getElementById('create-pin-btn');

const notesGrid = document.getElementById('notes-grid');
const pinnedNotesGrid = document.getElementById('pinned-notes-grid');
const pinnedSection = document.getElementById('pinned-notes-section');
const othersLabel = document.getElementById('others-label');

// State
let notes = [];

// Initialization
const init = async () => {
    await fetchNotes();
    setupEventListeners();
};

// API Calls
const fetchNotes = async () => {
    try {
        const response = await fetch(API_URL);
        notes = await response.json();
        renderNotes();
    } catch (error) {
        console.error('Error fetching notes:', error);
    }
};

const createNote = async (note) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(note)
        });
        const newNote = await response.json();
        notes.unshift(newNote);
        renderNotes();
    } catch (error) {
        console.error('Error creating note:', error);
    }
};

const updateNote = async (id, updates) => {
    try {
        const index = notes.findIndex(n => n.id === id);
        if (index !== -1) {
            notes[index] = { ...notes[index], ...updates };
            renderNotes();
        }

        await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    } catch (error) {
        console.error('Error updating note:', error);
        fetchNotes();
    }
};

const deleteNote = async (id) => {
    try {
        notes = notes.filter(n => n.id !== id);
        renderNotes();

        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Error deleting note:', error);
        fetchNotes();
    }
};

// Event Listeners
const setupEventListeners = () => {
    // Expand Create Note
    createNoteCollapsed.addEventListener('click', () => {
        createNoteCollapsed.classList.add('hidden');
        createNoteExpanded.classList.remove('hidden');
        noteTitleInput.focus();
    });

    // Close Create Note
    closeCreateNoteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeCreateNote();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        const createWrapper = document.querySelector('.create-note-wrapper');
        if (!createWrapper.contains(e.target) && !createNoteExpanded.classList.contains('hidden')) {
            closeCreateNote();
        }

        // Close color palette
        if (!e.target.closest('.icon-btn') && !e.target.closest('.color-palette')) {
            closeColorPalette();
        }
    });

    // Note Actions Delegation
    document.addEventListener('click', (e) => {
        const noteCard = e.target.closest('.note-card');
        const actionBtn = e.target.closest('.icon-btn');

        if (actionBtn) {
            const action = actionBtn.title;
            const noteId = noteCard ? parseInt(noteCard.dataset.id) : null;

            if (action === 'Delete' && noteId) {
                deleteNote(noteId);
            } else if (action === 'Color' && noteId) {
                e.stopPropagation();
                openColorPalette(e, noteId);
            }
        } else if (noteCard && !e.target.closest('.note-tools')) {
            openEditModal(parseInt(noteCard.dataset.id));
        }

        // Pin Button
        if (e.target.closest('.pin-btn')) {
            const btn = e.target.closest('.pin-btn');
            if (btn.id === 'create-pin-btn') {
                btn.classList.toggle('active');
            } else if (btn.id === 'edit-pin-btn') {
                btn.classList.toggle('active');
            } else {
                const noteCard = btn.closest('.note-card');
                if (noteCard) {
                    const noteId = parseInt(noteCard.dataset.id);
                    const note = notes.find(n => n.id === noteId);
                    if (note) {
                        updateNote(noteId, { ...note, is_pinned: !note.is_pinned });
                    }
                }
            }
        }
    });

    // Edit Modal
    document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('edit-modal')) {
            closeEditModal();
        }
    });

    document.getElementById('edit-delete-btn').addEventListener('click', () => {
        if (editingNoteId) {
            deleteNote(editingNoteId);
            closeEditModal();
        }
    });

    // Color Buttons
    document.getElementById('color-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openColorPalette(e, 'create');
    });

    document.getElementById('edit-color-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openColorPalette(e, 'edit');
    });
};

// Helper: Close Create Note
const closeCreateNote = () => {
    const title = noteTitleInput.value.trim();
    const content = noteContentInput.value.trim();
    const isPinned = createPinBtn.classList.contains('active');
    const color = createNoteExpanded.dataset.color || 'bg-default';

    if (title || content) {
        createNote({
            title,
            content,
            is_pinned: isPinned,
            color
        });
    }

    // Reset
    noteTitleInput.value = '';
    noteContentInput.value = '';
    createPinBtn.classList.remove('active');
    createNoteExpanded.dataset.color = 'bg-default';
    createNoteExpanded.className = 'create-note-expanded glass-panel hidden'; // Reset color

    // Toggle UI
    createNoteExpanded.classList.add('hidden');
    createNoteCollapsed.classList.remove('hidden');
};

// Color Palette
let activeColorTarget = null;

const openColorPalette = (e, target) => {
    closeColorPalette();
    activeColorTarget = target;

    const palette = document.createElement('div');
    palette.className = 'color-palette';

    const colors = ['bg-default', 'bg-red', 'bg-orange', 'bg-yellow', 'bg-green', 'bg-teal', 'bg-blue', 'bg-darkblue', 'bg-purple', 'bg-pink', 'bg-brown', 'bg-gray'];

    colors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = `color-option ${color}`;
        colorOption.addEventListener('click', (e) => {
            e.stopPropagation();
            handleColorSelection(color);
            closeColorPalette();
        });
        palette.appendChild(colorOption);
    });

    const rect = e.target.getBoundingClientRect();
    palette.style.position = 'fixed';
    palette.style.top = `${rect.bottom + 5}px`;
    palette.style.left = `${rect.left}px`;

    document.body.appendChild(palette);
};

const closeColorPalette = () => {
    const existingPalette = document.querySelector('.color-palette');
    if (existingPalette) existingPalette.remove();
    activeColorTarget = null;
};

const handleColorSelection = (color) => {
    if (activeColorTarget === 'create') {
        createNoteExpanded.dataset.color = color;
        // Optional: Visual feedback on create form could be added here
    } else if (activeColorTarget === 'edit') {
        if (editingNoteId) {
            const note = notes.find(n => n.id === editingNoteId);
            updateNote(editingNoteId, { ...note, color });
            document.querySelector('.modal-content').className = `modal-content glass-panel ${color}`;
        }
    } else if (typeof activeColorTarget === 'number') {
        const note = notes.find(n => n.id === activeColorTarget);
        if (note) {
            updateNote(activeColorTarget, { ...note, color });
        }
    }
};

// Edit Modal
let editingNoteId = null;
const editModal = document.getElementById('edit-modal');
const editTitleInput = document.getElementById('edit-note-title');
const editContentInput = document.getElementById('edit-note-content');
const editPinBtn = document.getElementById('edit-pin-btn');

const openEditModal = (id) => {
    const note = notes.find(n => n.id === id);
    if (note) {
        editingNoteId = id;
        editTitleInput.value = note.title;
        editContentInput.value = note.content;
        if (note.is_pinned) editPinBtn.classList.add('active');
        else editPinBtn.classList.remove('active');

        document.querySelector('.modal-content').className = `modal-content glass-panel ${note.color}`;
        editModal.classList.remove('hidden');
    }
};

const closeEditModal = () => {
    if (editingNoteId) {
        const note = notes.find(n => n.id === editingNoteId);
        if (note) {
            const newTitle = editTitleInput.value.trim();
            const newContent = editContentInput.value.trim();
            const isPinned = editPinBtn.classList.contains('active');

            if (newTitle !== note.title || newContent !== note.content || isPinned !== note.is_pinned) {
                updateNote(editingNoteId, {
                    ...note,
                    title: newTitle,
                    content: newContent,
                    is_pinned: isPinned
                });
            }
        }
    }
    editModal.classList.add('hidden');
    editingNoteId = null;
};

// Render Notes
const renderNotes = () => {
    notesGrid.innerHTML = '';
    pinnedNotesGrid.innerHTML = '';

    const pinnedNotes = notes.filter(note => note.is_pinned);
    const otherNotes = notes.filter(note => !note.is_pinned);

    if (pinnedNotes.length > 0) {
        pinnedSection.classList.remove('hidden');
        othersLabel.classList.remove('hidden');
        pinnedNotes.forEach(note => {
            pinnedNotesGrid.appendChild(createNoteElement(note));
        });
    } else {
        pinnedSection.classList.add('hidden');
        othersLabel.classList.add('hidden');
    }

    otherNotes.forEach(note => {
        notesGrid.appendChild(createNoteElement(note));
    });
};

const createNoteElement = (note) => {
    const div = document.createElement('div');
    div.className = `note-card glass-panel ${note.color} animate-fade-in`;
    div.dataset.id = note.id;

    // Safe content creation
    const titleDiv = document.createElement('div');
    titleDiv.className = 'note-card-title';
    titleDiv.textContent = note.title;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'note-card-content';
    contentDiv.textContent = note.content;

    const footerDiv = document.createElement('div');
    footerDiv.className = 'note-footer';
    footerDiv.innerHTML = `
        <div class="note-tools">
            <button class="icon-btn" title="Color"><span class="material-icons-outlined">palette</span></button>
            <button class="icon-btn" title="Delete"><span class="material-icons-outlined">delete</span></button>
        </div>
    `;

    const pinBtn = document.createElement('button');
    pinBtn.className = `icon-btn pin-btn ${note.is_pinned ? 'active' : ''}`;
    pinBtn.style.position = 'absolute';
    pinBtn.style.top = '8px';
    pinBtn.style.right = '8px';
    pinBtn.style.opacity = note.is_pinned ? '1' : '0';
    pinBtn.innerHTML = '<span class="material-icons-outlined">push_pin</span>';

    div.appendChild(titleDiv);
    div.appendChild(contentDiv);
    div.appendChild(footerDiv);
    div.appendChild(pinBtn);

    // Hover effect for pin button
    div.addEventListener('mouseenter', () => {
        pinBtn.style.opacity = '1';
    });
    div.addEventListener('mouseleave', () => {
        if (!note.is_pinned) pinBtn.style.opacity = '0';
    });

    return div;
};

init();
