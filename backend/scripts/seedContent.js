/**
 * Idempotent content seed for PathPilot AI learning paths.
 * Run: npm run seed:content
 */
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const LearningPath = require('../models/LearningPath');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const Project = require('../models/Project');
const Resource = require('../models/Resource');

const PYTHON_FUNDAMENTALS = {
  path: {
    title: 'Python Fundamentals',
    slug: 'python-fundamentals',
    description:
      'A complete beginner-friendly journey from your first print statement to building a small calculator project with functions, data structures, and confidence checkpoints.',
    icon: 'python',
    category: 'programming-languages',
    difficulty: 'beginner',
    estimatedHours: 24,
    tags: ['python', 'beginner', 'fundamentals', 'programming'],
    topics: [
      'Computer Basics',
      'Variables and Data Types',
      'Operators',
      'Control Structures',
      'Loops',
      'Functions',
      'Arrays',
    ],
    isPublished: true,
    order: 1,
    certificateEnabled: true,
    portfolioReady: true,
  },
  modules: [
    {
      title: 'Introduction to Python',
      slug: 'introduction-to-python',
      order: 1,
      description: 'Understand what Python is, set up your environment, and run your first program.',
      lessons: [
        {
          title: 'What is Python?',
          slug: 'what-is-python',
          order: 1,
          topic: 'Computer Basics',
          durationMinutes: 8,
          content: `# What is Python?

Python is a high-level programming language known for readable syntax and a large ecosystem. It is widely used in web development, automation, data science, and education.

## Why beginners start with Python

- Readable syntax that looks close to plain English
- Huge community and learning resources
- One language for scripts, apps, and data projects

## What you will build in this path

By the end of this path you will understand variables, control flow, functions, lists, and you will build a **calculator project** you can add to a portfolio.`,
          exampleCode: {
            language: 'python',
            code: '# Python is often used for teaching and production software alike.\nprint("Welcome to PathPilot Python Fundamentals")',
          },
          practice: {
            prompt: 'In your own words, write two reasons why Python is popular for beginners.',
            hints: ['Think about readability', 'Think about community and jobs'],
          },
        },
        {
          title: 'Installation and Setup',
          slug: 'installation-and-setup',
          order: 2,
          topic: 'Computer Basics',
          durationMinutes: 12,
          content: `# Installation and Setup

Before writing Python code, you need Python installed and a place to edit files.

## Steps

1. Install Python 3 from the official website.
2. Verify installation with \`python --version\` or \`python3 --version\`.
3. Choose an editor such as VS Code or Cursor.
4. Create a project folder for this learning path.

## Terminal basics

You will run programs from a terminal. Practice moving between folders and running a file with:

\`\`\`bash
python hello.py
\`\`\``,
          exampleCode: {
            language: 'bash',
            code: 'python --version\npython hello.py',
          },
          practice: {
            prompt: 'Create a folder named `pathpilot-python` and verify Python runs in your terminal.',
            starterCode: '# hello.py\nprint("Setup complete")',
            hints: ['Save the file before running it', 'Check you are in the correct directory'],
          },
        },
        {
          title: 'Your First Program',
          slug: 'your-first-program',
          order: 3,
          topic: 'Computer Basics',
          durationMinutes: 10,
          content: `# Your First Program

The classic first program prints a message to the screen.

## The print function

\`print()\` sends output to the console. You can print text, numbers, and expressions.

## Common mistakes

- Forgetting quotes around text
- Misspelling \`print\`
- Running the wrong file from the terminal`,
          exampleCode: {
            language: 'python',
            code: 'print("Hello, PathPilot!")\nprint(2 + 3)',
          },
          practice: {
            prompt: 'Write a program that prints your name and your learning goal on two separate lines.',
            starterCode: 'print("Your name here")\nprint("Your goal here")',
            hints: ['Use two print statements', 'Each string needs quotes'],
          },
        },
      ],
    },
    {
      title: 'Python Basics',
      slug: 'python-basics',
      order: 2,
      description: 'Learn variables, data types, and operators — the building blocks of every program.',
      lessons: [
        {
          title: 'Variables',
          slug: 'variables',
          order: 1,
          topic: 'Variables and Data Types',
          durationMinutes: 14,
          hasQuiz: true,
          content: `# Variables

Variables store values so you can reuse and update them later.

## Creating a variable

\`\`\`python
name = "Asha"
age = 21
\`\`\`

## Naming rules

- Use descriptive names like \`total_score\`
- Start with a letter or underscore
- Avoid reserved words like \`for\` and \`if\`

## Updating values

Variables can be reassigned. The latest value is what Python uses.`,
          exampleCode: {
            language: 'python',
            code: 'score = 10\nscore = score + 5\nprint(score)',
          },
          practice: {
            prompt: 'Create variables for a product name, price, and quantity. Print the total cost.',
            starterCode: 'product = "Notebook"\nprice = 4.5\nquantity = 3\n# print total here',
            hints: ['Multiply price by quantity', 'Use print(total)'],
          },
        },
        {
          title: 'Data Types',
          slug: 'data-types',
          order: 2,
          topic: 'Variables and Data Types',
          durationMinutes: 15,
          content: `# Data Types

Python works with several core types.

| Type | Example |
|------|---------|
| str | \`"hello"\` |
| int | \`42\` |
| float | \`3.14\` |
| bool | \`True\` |

Use \`type()\` to inspect a value.`,
          exampleCode: {
            language: 'python',
            code: 'print(type("hello"))\nprint(type(42))\nprint(type(3.14))\nprint(type(True))',
          },
          practice: {
            prompt: 'Store one value of each core type and print both the value and its type.',
            hints: ['Call type(value) inside print', 'Booleans are True or False'],
          },
        },
        {
          title: 'Operators',
          slug: 'operators',
          order: 3,
          topic: 'Operators',
          durationMinutes: 12,
          content: `# Operators

Operators let you calculate and compare values.

## Arithmetic

\`+\`, \`-\`, \`*\`, \`/\`, \`//\`, \`%\`, \`**\`

## Comparison

\`==\`, \`!=\`, \`>\`, \`<\`, \`>=\`, \`<=\`

## Logical

\`and\`, \`or\`, \`not\``,
          exampleCode: {
            language: 'python',
            code: 'a = 10\nb = 3\nprint(a + b)\nprint(a > b)\nprint(a > 5 and b < 5)',
          },
          practice: {
            prompt: 'Check whether a score is passing using comparison and logical operators.',
            starterCode: 'score = 78\npassing = 70\n# print True if score is passing',
            hints: ['Use score >= passing'],
          },
        },
      ],
    },
    {
      title: 'Control Flow',
      slug: 'control-flow',
      order: 3,
      description: 'Make decisions and repeat work with conditionals and loops.',
      lessons: [
        {
          title: 'If Else Statements',
          slug: 'if-else',
          order: 1,
          topic: 'Control Structures',
          durationMinutes: 14,
          content: `# If Else Statements

Conditionals run code only when a condition is true.

\`\`\`python
if score >= 70:
    print("Pass")
else:
    print("Keep practicing")
\`\`\`

Use \`elif\` for multiple branches.`,
          exampleCode: {
            language: 'python',
            code: 'temperature = 18\nif temperature >= 30:\n    print("Hot")\nelif temperature >= 20:\n    print("Warm")\nelse:\n    print("Cool")',
          },
          practice: {
            prompt: 'Classify a user input age into child, teen, or adult.',
            starterCode: 'age = 16\n# write if/elif/else branches',
            hints: ['Pick clear age boundaries', 'Use elif for the middle case'],
          },
        },
        {
          title: 'Loops',
          slug: 'loops',
          order: 2,
          topic: 'Loops',
          durationMinutes: 16,
          content: `# Loops

Loops repeat code while a condition holds or for each item in a sequence.

## while loop

\`\`\`python
count = 0
while count < 3:
    print(count)
    count += 1
\`\`\`

## for loop

\`\`\`python
for letter in "abc":
    print(letter)
\`\`\``,
          exampleCode: {
            language: 'python',
            code: 'for number in range(1, 4):\n    print(number * number)',
          },
          practice: {
            prompt: 'Print the numbers 1 through 5 and their squares using a for loop.',
            hints: ['range(1, 6) stops before 6', 'Update the loop variable each iteration in while loops'],
          },
        },
      ],
    },
    {
      title: 'Functions and Data Structures',
      slug: 'functions-and-data-structures',
      order: 4,
      description: 'Organize code with functions and store collections with lists.',
      lessons: [
        {
          title: 'Defining Functions',
          slug: 'defining-functions',
          order: 1,
          topic: 'Functions',
          durationMinutes: 15,
          content: `# Defining Functions

Functions group reusable logic behind a name.

\`\`\`python
def greet(name):
    return f"Hello, {name}"
\`\`\`

Functions can take parameters and return values.`,
          exampleCode: {
            language: 'python',
            code: 'def add(a, b):\n    return a + b\n\nprint(add(2, 5))',
          },
          practice: {
            prompt: 'Write a function `is_even(number)` that returns True when the number is even.',
            starterCode: 'def is_even(number):\n    pass\n\nprint(is_even(4))\nprint(is_even(7))',
            hints: ['Use the modulo operator %', 'Return a boolean'],
          },
        },
        {
          title: 'Working with Lists',
          slug: 'working-with-lists',
          order: 2,
          topic: 'Arrays',
          durationMinutes: 14,
          content: `# Working with Lists

Lists store ordered collections.

\`\`\`python
scores = [88, 74, 91]
scores.append(83)
print(scores[0])
\`\`\`

Common operations: append, len, iteration, and slicing.`,
          exampleCode: {
            language: 'python',
            code: 'tasks = ["read", "code", "review"]\nfor task in tasks:\n    print(f"- {task}")',
          },
          practice: {
            prompt: 'Create a list of three study topics and print each with a numbered prefix.',
            hints: ['Use enumerate if you want indexes', 'Or track a counter manually'],
          },
        },
      ],
    },
  ],
  quiz: {
    lessonSlug: 'variables',
    title: 'Variables Checkpoint Quiz',
    passingScore: 70,
    questions: [
      {
        order: 1,
        prompt: 'What is the output of the following code?\n\nx = 5\nx = x + 2\nprint(x)',
        options: [
          { key: 'A', text: '5' },
          { key: 'B', text: '7' },
          { key: 'C', text: '52' },
          { key: 'D', text: 'x' },
        ],
        correctKey: 'B',
        explanation: 'The variable x is updated to 5 + 2, so the printed value is 7.',
      },
      {
        order: 2,
        prompt: 'Which variable name is valid in Python?',
        options: [
          { key: 'A', text: '2score' },
          { key: 'B', text: 'score-total' },
          { key: 'C', text: 'score_total' },
          { key: 'D', text: 'for' },
        ],
        correctKey: 'C',
        explanation: 'Variable names may use letters, numbers, and underscores, but cannot start with a number or use reserved words.',
      },
      {
        order: 3,
        prompt: 'What does type(3.14) return?',
        options: [
          { key: 'A', text: "<class 'int'>" },
          { key: 'B', text: "<class 'float'>" },
          { key: 'C', text: "<class 'str'>" },
          { key: 'D', text: "<class 'bool'>" },
        ],
        correctKey: 'B',
        explanation: '3.14 is a floating-point number, so its type is float.',
      },
      {
        order: 4,
        prompt: 'Which statement correctly creates a string variable?',
        options: [
          { key: 'A', text: 'name = Asha' },
          { key: 'B', text: 'name = "Asha"' },
          { key: 'C', text: 'string name = "Asha"' },
          { key: 'D', text: 'name := Asha' },
        ],
        correctKey: 'B',
        explanation: 'Text values in Python must be wrapped in quotes.',
      },
    ],
  },
  projects: [
    {
      title: 'Calculator App',
      slug: 'calculator-app',
      description:
        'Build a command-line calculator that accepts two numbers and an operator, then prints the result. This project reinforces variables, operators, conditionals, and functions.',
      difficulty: 'beginner',
      requirements: [
        'Ask the user for two numbers',
        'Ask the user for an operator (+, -, *, /)',
        'Use conditionals to perform the correct operation',
        'Handle division by zero gracefully',
        'Wrap the logic in at least one function',
      ],
      starterCode: 'def calculate(a, operator, b):\n    # your logic here\n    pass\n\n# Example usage:\n# print(calculate(10, "+", 5))',
      hints: [
        'Convert input strings to numbers with int() or float()',
        'Return a helpful message when dividing by zero',
        'Test all four operators',
      ],
      estimatedHours: 3,
      order: 1,
      topic: 'Functions',
      portfolioReady: true,
    },
  ],
  resources: [
    {
      title: 'Official Python Tutorial',
      slug: 'official-python-tutorial',
      description: 'The official Python documentation tutorial for beginners.',
      url: 'https://docs.python.org/3/tutorial/',
      type: 'documentation',
      category: 'programming-languages',
      programmingLanguage: 'python',
      difficulty: 'beginner',
      tags: ['python', 'docs', 'official'],
    },
    {
      title: 'Python Variables Cheat Sheet',
      slug: 'python-variables-cheat-sheet',
      description: 'Quick reference for variables, naming rules, and assignment.',
      url: 'https://docs.python.org/3/tutorial/introduction.html',
      type: 'cheat-sheet',
      category: 'programming-languages',
      programmingLanguage: 'python',
      difficulty: 'beginner',
      tags: ['variables', 'cheat-sheet'],
      lessonSlug: 'variables',
    },
    {
      title: 'Python Control Flow Practice Pack',
      slug: 'python-control-flow-practice',
      description: 'Short practice exercises for if/else and loops.',
      url: 'https://www.practicepython.org/',
      type: 'practice',
      category: 'programming-languages',
      programmingLanguage: 'python',
      difficulty: 'beginner',
      tags: ['conditionals', 'loops', 'practice'],
      lessonSlug: 'if-else',
    },
    {
      title: 'Build a CLI Calculator Walkthrough',
      slug: 'cli-calculator-walkthrough',
      description: 'Step-by-step tutorial for building a beginner calculator project.',
      url: 'https://realpython.com/python-data-types/',
      type: 'tutorial',
      category: 'programming-languages',
      programmingLanguage: 'python',
      difficulty: 'beginner',
      tags: ['project', 'calculator', 'functions'],
    },
  ],
};

async function upsertPath(pathData) {
  return LearningPath.findOneAndUpdate(
    { slug: pathData.slug },
    { $set: pathData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertModule(pathId, moduleData) {
  const { lessons, ...moduleFields } = moduleData;
  return Module.findOneAndUpdate(
    { pathId, slug: moduleFields.slug },
    { $set: { ...moduleFields, pathId, lessonCount: lessons.length } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertLesson(pathId, moduleId, lessonData) {
  return Lesson.findOneAndUpdate(
    { pathId, slug: lessonData.slug },
    { $set: { ...lessonData, pathId, moduleId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertQuiz(pathId, lessonId, quizData) {
  return Quiz.findOneAndUpdate(
    { lessonId },
    { $set: { ...quizData, pathId, lessonId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertProject(pathId, projectData) {
  return Project.findOneAndUpdate(
    { pathId, slug: projectData.slug },
    { $set: { ...projectData, pathId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function upsertResource(pathId, lessonId, resourceData) {
  const { lessonSlug, ...resourceFields } = resourceData;
  return Resource.findOneAndUpdate(
    { slug: resourceFields.slug },
    {
      $set: {
        ...resourceFields,
        pathId,
        lessonId: lessonId || null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function updatePathCounts(pathId) {
  const [lessonCount, quizCount, projectCount, resourceCount] = await Promise.all([
    Lesson.countDocuments({ pathId }),
    Quiz.countDocuments({ pathId }),
    Project.countDocuments({ pathId }),
    Resource.countDocuments({ pathId }),
  ]);

  await LearningPath.findByIdAndUpdate(pathId, {
    lessonCount,
    quizCount,
    projectCount,
    resourceCount,
  });

  return { lessonCount, quizCount, projectCount, resourceCount };
}

async function seedPythonFundamentals() {
  const { path, modules, quiz, projects, resources } = PYTHON_FUNDAMENTALS;
  const pathDoc = await upsertPath(path);
  const lessonIdBySlug = new Map();

  for (const moduleData of modules) {
    const moduleDoc = await upsertModule(pathDoc._id, moduleData);

    for (const lessonData of moduleData.lessons) {
      const lessonDoc = await upsertLesson(pathDoc._id, moduleDoc._id, lessonData);
      lessonIdBySlug.set(lessonData.slug, lessonDoc._id);
    }
  }

  const quizLessonId = lessonIdBySlug.get(quiz.lessonSlug);
  if (!quizLessonId) {
    throw new Error(`Quiz lesson slug not found: ${quiz.lessonSlug}`);
  }

  await upsertQuiz(pathDoc._id, quizLessonId, {
    title: quiz.title,
    passingScore: quiz.passingScore,
    questions: quiz.questions,
  });

  await Lesson.findByIdAndUpdate(quizLessonId, { hasQuiz: true });

  for (const projectData of projects) {
    await upsertProject(pathDoc._id, projectData);
  }

  for (const resourceData of resources) {
    const lessonId = resourceData.lessonSlug
      ? lessonIdBySlug.get(resourceData.lessonSlug)
      : null;
    await upsertResource(pathDoc._id, lessonId, resourceData);
  }

  const counts = await updatePathCounts(pathDoc._id);

  return {
    path: pathDoc,
    counts,
    lessonCount: lessonIdBySlug.size,
  };
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set. Copy backend/.env.example to backend/.env first.');
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB');

  const result = await seedPythonFundamentals();

  console.log('Seeded learning path:', result.path.title);
  console.log('Slug:', result.path.slug);
  console.log('Counts:', result.counts);
  console.log('Lessons upserted:', result.lessonCount);

  await mongoose.disconnect();
  console.log('Seed complete.');
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Seed failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  seedPythonFundamentals,
  PYTHON_FUNDAMENTALS,
};
