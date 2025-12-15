import type { Note, Flashcard, Quiz } from "./types"

export const mockNotes: Omit<Note, "id" | "createdAt" | "updatedAt">[] = [
  {
    userId: "demo-user",
    title: "Introduction to Machine Learning",
    content: `# Introduction to Machine Learning

Machine Learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.

## Key Concepts

### Supervised Learning
- Uses labeled training data
- Algorithm learns to map inputs to outputs
- Examples: Classification, Regression

### Unsupervised Learning
- Works with unlabeled data
- Finds hidden patterns or structures
- Examples: Clustering, Dimensionality Reduction

### Reinforcement Learning
- Learns through trial and error
- Receives rewards or penalties
- Examples: Game playing, Robotics`,
    tags: ["Machine Learning", "AI", "Computer Science"],
    isFavorite: true,
  },
  {
    userId: "demo-user",
    title: "Python Basics",
    content: `# Python Programming Basics

Python is a high-level, interpreted programming language known for its simplicity and readability.

## Variables and Data Types
- Integers: whole numbers
- Floats: decimal numbers
- Strings: text data
- Booleans: True/False

## Control Flow
- if/elif/else statements
- for loops
- while loops`,
    tags: ["Python", "Programming"],
    isFavorite: false,
  },
]

export const mockFlashcards: Omit<Flashcard, "id" | "createdAt">[] = [
  {
    noteId: "note1",
    userId: "demo-user",
    question: "What is Machine Learning?",
    answer:
      "A subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.",
    difficulty: "easy",
    reviewCount: 0,
  },
  {
    noteId: "note1",
    userId: "demo-user",
    question: "What is Supervised Learning?",
    answer:
      "A type of machine learning that uses labeled training data where the algorithm learns to map inputs to outputs.",
    difficulty: "medium",
    reviewCount: 0,
  },
]

export const mockQuizzes: Omit<Quiz, "id" | "createdAt">[] = [
  {
    noteId: "note1",
    userId: "demo-user",
    title: "Machine Learning Fundamentals Quiz",
    questions: [
      {
        id: "q1",
        question: "Which type of learning uses labeled training data?",
        options: ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Deep Learning"],
        correctAnswer: 0,
        explanation: "Supervised learning uses labeled data where each input has a corresponding output label.",
      },
      {
        id: "q2",
        question: "What is the main characteristic of unsupervised learning?",
        options: ["Uses rewards", "Uses labeled data", "Finds hidden patterns", "Requires human feedback"],
        correctAnswer: 2,
        explanation: "Unsupervised learning works with unlabeled data to find hidden patterns or structures.",
      },
    ],
  },
]
