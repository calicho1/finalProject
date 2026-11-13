# My Flashcards (`finalProject`)

A **flashcard viewing, editing, and study website** built with **HTML**, **CSS**, and **JavaScript** for **INST 630**, designed to be hosted on **GitHub Pages**.

## Features

- **Deck Dashboard (`Homepage`)**: View decks in a responsive 2-column grid with card counts, mastery progress bars (`% mastery`), edit/delete actions, **+ New Deck**, and live search (`Search my flashcards`) matching both deck titles and card questions/answers.
- **Study Mode (`Study Now`)**: Step through a deck's cards with click-to-reveal answers and **Need Review** / **Got it Right** buttons that update mastery status and finish with a session summary (including a **Review Missed Cards** option).
- **Deck & Card Editor (`Edit Deck`)**: Rename decks, inspect all cards in a table (`Question`, `Answer`, `Actions`), and add, edit, or delete flashcards via an accessible modal.
- **Starter Data & Persistence**: Pre-loads 3 sample HCI decks on first visit and saves all changes and study progress in `localStorage` (with a footer **Reset Starter Decks** option).

## Architecture & INST 630 Learning Objectives

The app is structured using the **Model–View–Controller (MVC)** pattern with ES modules:

- **HTML & CSS**: Semantic landmarks, `:root` design tokens, CSS Grid & Flexbox, and responsive `@media` breakpoints matching the designs in `Mockups/`.
- **DOM & Array Methods**: Event-driven UI updates, XSS-safe DOM rendering (`textContent`), and `forEach`, `filter`, `map`, `find`, and `some` for search and mastery calculations.
- **Async Data & Persistence**: `async/await fetch('data/decks.json')` with `response.ok` checks, `try/catch` error handling, and `localStorage` persistence.
- **External Library Integration**: **GSAP** loaded via CDN with a `typeof gsap !== 'undefined'` check and `try/catch` fallback for smooth study card transitions.