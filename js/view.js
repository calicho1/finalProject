// View module for "My Flashcards". Renders views with template literals, manages the modal, and runs GSAP fade helpers.

const EDIT_ICON = '<i class="fa-regular fa-pen-to-square"></i>';
const DELETE_ICON = '<i class="fa-regular fa-trash-can"></i>';

// Escapes special HTML characters so user text renders safely inside template strings.
function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Runs a subtle GSAP fade-in animation if GSAP is loaded.
function animateFadeIn(target) {
  if (!target || typeof gsap === 'undefined') return;
  try {
    gsap.fromTo(
      target,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out', clearProps: 'transform,opacity' }
    );
  } catch (err) {
    // Fallback cleanly if GSAP fails
  }
}

export const flashcardView = {
  // Shows one active view ('home', 'study', or 'edit') and hides the others.
  showView(viewName) {
    const views = {
      home: document.querySelector('#view-home'),
      study: document.querySelector('#view-study'),
      edit: document.querySelector('#view-edit'),
    };

    Object.entries(views).forEach(([name, el]) => {
      if (name === viewName) {
        el.classList.remove('hidden');
        animateFadeIn(el);
      } else {
        el.classList.add('hidden');
      }
    });
  },

  // Shows or hides a load error message at the top of the page.
  showError(message) {
    const el = document.querySelector('#error-message');
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('hidden', !message);
  },

  // Renders the deck cards on the Home dashboard.
  renderHome(decks, getMasteryPercent) {
    const grid = document.querySelector('#decks-grid');
    const empty = document.querySelector('#home-empty');

    if (decks.length === 0) {
      grid.innerHTML = '';
      grid.classList.add('hidden');
      empty.classList.remove('hidden');
      return;
    }

    grid.classList.remove('hidden');
    empty.classList.add('hidden');

    grid.innerHTML = decks
      .map((deck) => {
        const mastery = getMasteryPercent(deck);
        const count = deck.cards.length;
        const safeTitle = escapeHtml(deck.title);

        return `
          <article class="deck-card">
            <div class="deck-card-header">
              <h2 class="deck-title">${safeTitle}</h2>
              <div class="deck-card-actions">
                <button type="button" class="icon-btn" data-action="edit-deck" data-deck-id="${escapeHtml(deck.id)}" title="Edit Deck">${EDIT_ICON}</button>
                <button type="button" class="icon-btn icon-btn--delete" data-action="delete-deck" data-deck-id="${escapeHtml(deck.id)}" title="Delete Deck">${DELETE_ICON}</button>
              </div>
            </div>
            <div class="deck-meta">
              <span class="deck-count">${count} ${count === 1 ? 'card' : 'cards'}</span>
              <span class="deck-mastery">${mastery}% mastery</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${mastery}%;"></div>
            </div>
            <div class="deck-card-footer">
              <button type="button" class="btn btn-primary" data-action="study-deck" data-deck-id="${escapeHtml(deck.id)}">Study Now</button>
            </div>
          </article>
        `;
      })
      .join('');
  },

  // Renders the Edit Deck view and its card table.
  renderEditDeck(deck) {
    document.querySelector('#edit-deck-title').textContent = deck.title;
    document.querySelector('#edit-cards-heading').textContent = `All Cards (${deck.cards.length})`;

    const tbody = document.querySelector('#cards-table-body');
    const empty = document.querySelector('#edit-empty');

    if (deck.cards.length === 0) {
      tbody.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    empty.classList.add('hidden');
    tbody.innerHTML = deck.cards
      .map(
        (card) => `
          <div class="card-row">
            <div class="card-question">${escapeHtml(card.question)}</div>
            <div class="card-answer">${escapeHtml(card.answer)}</div>
            <div class="card-actions">
              <button type="button" class="icon-btn" data-action="edit-card" data-card-id="${escapeHtml(card.id)}" title="Edit Card">${EDIT_ICON}</button>
              <button type="button" class="icon-btn icon-btn--delete" data-action="delete-card" data-card-id="${escapeHtml(card.id)}" title="Delete Card">${DELETE_ICON}</button>
            </div>
          </div>
        `
      )
      .join('');
  },

  // Renders the active study flashcard in Question or Answer mode.
  renderStudyCard({ deckTitle, card, index, total, isRevealed, animate = true }) {
    document.querySelector('#study-deck-title').textContent = deckTitle;
    document.querySelector('#study-progress').textContent = `Card ${index + 1} of ${total}`;
    document.querySelector('#study-stage').classList.remove('hidden');
    document.querySelector('#study-complete').classList.add('hidden');

    const cardBtn = document.querySelector('#study-card');
    cardBtn.classList.toggle('is-revealed', isRevealed);

    document.querySelector('#study-card-label').textContent = isRevealed ? 'Answer' : 'Question';
    document.querySelector('#study-card-text').textContent = isRevealed ? card.answer : card.question;
    document.querySelector('#study-reveal-hint').textContent = isRevealed
      ? 'Click to Show Question'
      : 'Click to Reveal Answer';

    if (animate) animateFadeIn(cardBtn);
  },

  // Renders the Study session completion summary.
  renderStudyComplete({ deckTitle, totalReviewed, rightCount }) {
    document.querySelector('#study-deck-title').textContent = deckTitle;
    document.querySelector('#study-progress').textContent = 'Session Complete';
    document.querySelector('#study-stage').classList.add('hidden');

    const completeEl = document.querySelector('#study-complete');
    completeEl.classList.remove('hidden');
    animateFadeIn(completeEl);

    document.querySelector('#study-summary-text').textContent = `You got ${rightCount} of ${totalReviewed} ${
      totalReviewed === 1 ? 'card' : 'cards'
    } right.`;
  },

  // Opens the modal with a single text input for creating or renaming a deck.
  openDeckModal({ title, submitLabel, initialTitle = '' }) {
    const modal = document.querySelector('#app-modal');
    document.querySelector('#modal-title').textContent = title;
    document.querySelector('#modal-submit-btn').textContent = submitLabel;
    document.querySelector('#modal-fields').innerHTML = `
      <div class="modal-field">
        <label for="modal-deck-title" class="modal-label">Deck Title</label>
        <input id="modal-deck-title" name="deckTitle" class="modal-input" type="text" value="${escapeHtml(initialTitle)}" placeholder="e.g., Interaction Design Principles" required>
      </div>
    `;
    modal.showModal();
    document.querySelector('#modal-deck-title').focus();
  },

  // Opens the modal with Question and Answer textareas for adding or editing a card.
  openCardModal({ title, initialQuestion = '', initialAnswer = '' }) {
    const modal = document.querySelector('#app-modal');
    document.querySelector('#modal-title').textContent = title;
    document.querySelector('#modal-submit-btn').textContent = 'Save Card';
    document.querySelector('#modal-fields').innerHTML = `
      <div class="modal-field">
        <label for="modal-card-question" class="modal-label">Question/Prompt</label>
        <textarea id="modal-card-question" name="question" class="modal-textarea" rows="4" placeholder="Enter the flashcard question..." required>${escapeHtml(initialQuestion)}</textarea>
      </div>
      <div class="modal-field">
        <label for="modal-card-answer" class="modal-label">Answer</label>
        <textarea id="modal-card-answer" name="answer" class="modal-textarea" rows="4" placeholder="Enter the answer..." required>${escapeHtml(initialAnswer)}</textarea>
      </div>
    `;
    modal.showModal();
    document.querySelector('#modal-card-question').focus();
  },

  // Closes the modal dialog.
  closeModal() {
    const modal = document.querySelector('#app-modal');
    if (modal.open) modal.close();
  },
};
