// Model module for "My Flashcards". Handles starter JSON loading, localStorage persistence, and deck/card CRUD.

const STORAGE_KEY = 'my_flashcards';
const STARTER_DATA = 'data/decks.json';

let decks = [];

// Generates a unique ID with a prefix.
function makeId(prefix) {
  return `${prefix}-${Date.now()}`;
}

// Saves the current decks array to localStorage.
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ decks }));
}

// Fetches starter decks from data/decks.json.
async function fetchStarterDecks() {
  const response = await fetch(STARTER_DATA);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.decks;
}

export const flashcardModel = {
  // Loads decks from localStorage, or fetches starter data on first visit.
  async init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.decks)) {
        decks = parsed.decks;
        return decks;
      }
    }

    decks = await fetchStarterDecks();
    save();
    return decks;
  },

  // Reloads the starter decks from data/decks.json and overwrites localStorage.
  async resetToStarterData() {
    decks = await fetchStarterDecks();
    save();
    return decks;
  },

  // Returns decks matching the search query by title or card content.
  getDecks(searchQuery = '') {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return decks;
    }

    return decks.filter((deck) => {
      const titleMatch = deck.title.toLowerCase().includes(query);
      const cardMatch = deck.cards.some(
        (card) =>
          card.question.toLowerCase().includes(query) ||
          card.answer.toLowerCase().includes(query)
      );
      return titleMatch || cardMatch;
    });
  },

  // Finds and returns a single deck by its ID.
  getDeckById(deckId) {
    return decks.find((deck) => deck.id === deckId) || null;
  },

  // Calculates the rounded percentage of mastered cards in a deck.
  getMasteryPercent(deck) {
    if (!deck || deck.cards.length === 0) return 0;
    const mastered = deck.cards.filter((card) => card.status === 'mastered').length;
    return Math.round((mastered / deck.cards.length) * 100);
  },

  // Creates a new empty deck and saves it.
  createDeck(title) {
    const newDeck = {
      id: makeId('deck'),
      title: title.trim(),
      cards: [],
    };
    decks.push(newDeck);
    save();
    return newDeck;
  },

  // Renames an existing deck and saves the change.
  renameDeck(deckId, newTitle) {
    const deck = this.getDeckById(deckId);
    if (!deck) return null;
    deck.title = newTitle.trim();
    save();
    return deck;
  },

  // Deletes a deck by ID and saves the change.
  deleteDeck(deckId) {
    decks = decks.filter((deck) => deck.id !== deckId);
    save();
  },

  // Adds a new flashcard to a deck and saves it.
  addCard(deckId, question, answer) {
    const deck = this.getDeckById(deckId);
    if (!deck) return null;
    const newCard = {
      id: makeId('card'),
      question: question.trim(),
      answer: answer.trim(),
      status: 'new',
    };
    deck.cards.push(newCard);
    save();
    return newCard;
  },

  // Updates an existing flashcard's question and answer.
  updateCard(deckId, cardId, question, answer) {
    const deck = this.getDeckById(deckId);
    const card = deck?.cards.find((item) => item.id === cardId);
    if (!card) return null;
    card.question = question.trim();
    card.answer = answer.trim();
    save();
    return card;
  },

  // Deletes a flashcard from a deck and saves the change.
  deleteCard(deckId, cardId) {
    const deck = this.getDeckById(deckId);
    if (!deck) return;
    deck.cards = deck.cards.filter((item) => item.id !== cardId);
    save();
  },

  // Updates a flashcard's study status ('new', 'review', or 'mastered').
  setCardStatus(deckId, cardId, status) {
    const deck = this.getDeckById(deckId);
    const card = deck?.cards.find((item) => item.id === cardId);
    if (!card) return null;
    card.status = status;
    save();
    return card;
  },
};
