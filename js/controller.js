// Controller module for "My Flashcards". Wires UI events between flashcardModel and flashcardView.

import { flashcardModel } from './model.js';
import { flashcardView } from './view.js';

const state = {
  searchQuery: '',
  editingDeckId: null,
  study: {
    deckId: null,
    cards: [],
    index: 0,
    isRevealed: false,
    rightCount: 0,
  },
  onModalSubmit: null,
};

// Renders the Home dashboard and switches to the Home view.
function showHome() {
  const decks = flashcardModel.getDecks(state.searchQuery);
  flashcardView.renderHome(decks, flashcardModel.getMasteryPercent);
  flashcardView.showView('home');
}

// Renders the Edit Deck view for the given deck ID.
function showEditDeck(deckId) {
  const deck = flashcardModel.getDeckById(deckId);
  if (!deck) {
    showHome();
    return;
  }
  state.editingDeckId = deckId;
  flashcardView.renderEditDeck(deck);
  flashcardView.showView('edit');
}

// Starts a study session for the given deck ID.
function startStudy(deckId) {
  const deck = flashcardModel.getDeckById(deckId);
  if (!deck || deck.cards.length === 0) {
    alert('Add at least one flashcard before studying this deck.');
    return;
  }

  state.study = {
    deckId: deck.id,
    cards: [...deck.cards],
    index: 0,
    isRevealed: false,
    rightCount: 0,
  };

  flashcardView.showView('study');
  renderStudyStep(true);
}

// Renders either the current study card or the session completion summary.
function renderStudyStep(animate = true) {
  const deck = flashcardModel.getDeckById(state.study.deckId);
  const deckTitle = deck ? deck.title : 'Study Deck';

  if (state.study.index >= state.study.cards.length) {
    flashcardView.renderStudyComplete({
      deckTitle,
      totalReviewed: state.study.cards.length,
      rightCount: state.study.rightCount,
    });
    return;
  }

  flashcardView.renderStudyCard({
    deckTitle,
    card: state.study.cards[state.study.index],
    index: state.study.index,
    total: state.study.cards.length,
    isRevealed: state.study.isRevealed,
    animate,
  });
}

// Records whether the user got the current card right or needs review, then advances.
function rateStudyCard(status) {
  const card = state.study.cards[state.study.index];
  if (!card) return;

  flashcardModel.setCardStatus(state.study.deckId, card.id, status);
  if (status === 'mastered') {
    state.study.rightCount += 1;
  }

  state.study.index += 1;
  state.study.isRevealed = false;
  renderStudyStep(true);
}

// Wires all DOM event listeners for navigation, search, study, editing, and modals.
function bindEvents() {
  // Navbar
  document.querySelector('#brand-home-btn').addEventListener('click', showHome);
  document.querySelector('#new-deck-btn').addEventListener('click', () => {
    state.onModalSubmit = (formData) => {
      const title = formData.get('deckTitle').trim();
      if (!title) return;
      flashcardModel.createDeck(title);
      showHome();
    };
    flashcardView.openDeckModal({ title: 'Create New Deck', submitLabel: 'Create Deck' });
  });

  // Home search & deck card actions
  document.querySelector('#search-input').addEventListener('input', (event) => {
    state.searchQuery = event.target.value;
    const decks = flashcardModel.getDecks(state.searchQuery);
    flashcardView.renderHome(decks, flashcardModel.getMasteryPercent);
  });

  document.querySelector('#decks-grid').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-action]');
    if (!btn) return;
    const { action, deckId } = btn.dataset;

    if (action === 'study-deck') {
      startStudy(deckId);
    } else if (action === 'edit-deck') {
      showEditDeck(deckId);
    } else if (action === 'delete-deck') {
      const deck = flashcardModel.getDeckById(deckId);
      if (deck && confirm(`Delete "${deck.title}" and all of its cards?`)) {
        flashcardModel.deleteDeck(deckId);
        showHome();
      }
    }
  });

  // Edit Deck actions
  document.querySelector('#edit-back-btn').addEventListener('click', showHome);
  document.querySelector('#rename-deck-btn').addEventListener('click', () => {
    const deck = flashcardModel.getDeckById(state.editingDeckId);
    if (!deck) return;
    state.onModalSubmit = (formData) => {
      const newTitle = formData.get('deckTitle').trim();
      if (!newTitle) return;
      flashcardModel.renameDeck(deck.id, newTitle);
      showEditDeck(deck.id);
    };
    flashcardView.openDeckModal({
      title: 'Rename Deck',
      submitLabel: 'Save Name',
      initialTitle: deck.title,
    });
  });

  document.querySelector('#add-card-btn').addEventListener('click', () => {
    state.onModalSubmit = (formData) => {
      const question = formData.get('question').trim();
      const answer = formData.get('answer').trim();
      if (!question || !answer) return;
      flashcardModel.addCard(state.editingDeckId, question, answer);
      showEditDeck(state.editingDeckId);
    };
    flashcardView.openCardModal({ title: 'Add New Flashcard' });
  });

  document.querySelector('#cards-table-body').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-action]');
    if (!btn) return;
    const { action, cardId } = btn.dataset;
    const deck = flashcardModel.getDeckById(state.editingDeckId);
    const card = deck?.cards.find((item) => item.id === cardId);
    if (!card) return;

    if (action === 'edit-card') {
      state.onModalSubmit = (formData) => {
        const question = formData.get('question').trim();
        const answer = formData.get('answer').trim();
        if (!question || !answer) return;
        flashcardModel.updateCard(state.editingDeckId, cardId, question, answer);
        showEditDeck(state.editingDeckId);
      };
      flashcardView.openCardModal({
        title: 'Edit Flashcard',
        initialQuestion: card.question,
        initialAnswer: card.answer,
      });
    } else if (action === 'delete-card') {
      if (confirm('Delete this flashcard?')) {
        flashcardModel.deleteCard(state.editingDeckId, cardId);
        showEditDeck(state.editingDeckId);
      }
    }
  });

  // Study mode actions
  document.querySelector('#study-back-btn').addEventListener('click', showHome);
  document.querySelector('#study-card').addEventListener('click', () => {
    state.study.isRevealed = !state.study.isRevealed;
    renderStudyStep(false);
  });
  document.querySelector('#need-review-btn').addEventListener('click', () => rateStudyCard('review'));
  document.querySelector('#got-right-btn').addEventListener('click', () => rateStudyCard('mastered'));
  document.querySelector('#study-again-btn').addEventListener('click', () => startStudy(state.study.deckId));
  document.querySelector('#study-done-home-btn').addEventListener('click', showHome);

  // Footer reset
  document.querySelector('#reset-data-btn').addEventListener('click', async () => {
    if (!confirm('Restore the starter HCI decks? Any custom changes will be overwritten.')) return;
    await flashcardModel.resetToStarterData();
    state.searchQuery = '';
    document.querySelector('#search-input').value = '';
    showHome();
  });

  // Modal events
  const modal = document.querySelector('#app-modal');
  document.querySelector('#modal-close-btn').addEventListener('click', flashcardView.closeModal);
  document.querySelector('#modal-cancel-btn').addEventListener('click', flashcardView.closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) flashcardView.closeModal();
  });
  document.querySelector('#modal-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (state.onModalSubmit) {
      state.onModalSubmit(new FormData(event.target));
    }
    flashcardView.closeModal();
  });
}

// Initializes the app once the DOM is ready.
async function initApp() {
  bindEvents();
  try {
    await flashcardModel.init();
    flashcardView.showError('');
  } catch (err) {
    flashcardView.showError('Could not load starter decks. Make sure you are running via an HTTP server.');
  }
  showHome();
}

document.addEventListener('DOMContentLoaded', initApp);
