export interface Comment {
  id: string;
  highlightId: string;
  author: string;
  text: string;
  timestamp: Date;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface HighlightedSection {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
}

export interface LinkedIssue {
  id: string;
  identifier: string;
  title: string;
  url: string;
  status: "backlog" | "todo" | "in-progress" | "in-review" | "done" | "canceled";
  priority?: "urgent" | "high" | "medium" | "low" | "none";
  labels?: string[];
}

export interface Document {
  id: string;
  title: string;
  author: string;
  readTime: string;
  content: string;
  highlights: HighlightedSection[];
  comments: Comment[];
  questions: Question[];
  linkedIssues?: LinkedIssue[];
}

export const documents: Document[] = [
  {
    id: "1",
    title: "The Art of Deep Work",
    author: "Sarah Mitchell",
    readTime: "8 min read",
    content: `# The Art of Deep Work

In an age of constant distraction, the ability to focus without interruption on cognitively demanding tasks has become increasingly rare—and increasingly valuable.

## What is Deep Work?

**Deep work** is professional activity performed in a state of distraction-free concentration that pushes your cognitive capabilities to their limit. These efforts create new value, improve your skill, and are hard to replicate.

> "The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy."

### The Shallow Alternative

In contrast, **shallow work** consists of logistical-style tasks, often performed while distracted. These efforts tend to not create much new value in the world and are easy to replicate.

## Why Deep Work Matters

1. **Deep work is valuable** — In our economy, there are three groups who will thrive: those who can work creatively with intelligent machines, those who are the best at what they do, and those with access to capital.

2. **Deep work is rare** — Network tools fragment our attention. The constant switching between tasks reduces our ability to focus deeply.

3. **Deep work is meaningful** — Craftsmen derive meaning from the practice of their craft. Deep work offers similar rewards.

## Strategies for Deep Work

The monastic philosophy of deep work scheduling attempts to maximize deep efforts by eliminating or radically minimizing shallow obligations. Practitioners of this philosophy tend to have a well-defined and highly valued professional goal.

### The Rhythmic Philosophy

This philosophy argues that the easiest way to consistently start deep work sessions is to transform them into a simple regular habit. The goal is to generate a rhythm that removes the need for you to invest energy in deciding if and when you're going to go deep.

\`\`\`
Morning routine:
- Wake at 5:30 AM
- Deep work: 6:00 - 9:00 AM
- Shallow work: 9:00 AM onwards
\`\`\`

## Conclusion

The deep work hypothesis states that the ability to concentrate without distraction on demanding tasks is a skill that must be trained. Like any skill, it becomes more powerful with practice.`,
    highlights: [
      {
        id: "h1",
        text: "Deep work is professional activity performed in a state of distraction-free concentration",
        startOffset: 0,
        endOffset: 0,
      },
      {
        id: "h2",
        text: "the ability to focus without interruption on cognitively demanding tasks",
        startOffset: 0,
        endOffset: 0,
      },
      {
        id: "h3",
        text: "The rhythmic philosophy",
        startOffset: 0,
        endOffset: 0,
      },
    ],
    comments: [
      {
        id: "c1",
        highlightId: "h1",
        author: "John D.",
        text: "This is the core definition to remember for the exam. Cal Newport coined this term in his 2016 book.",
        timestamp: new Date("2024-01-15"),
      },
      {
        id: "c2",
        highlightId: "h2",
        author: "Emily R.",
        text: "Notice how this connects to the concept of 'flow state' from Csikszentmihalyi's research.",
        timestamp: new Date("2024-01-16"),
      },
      {
        id: "c3",
        highlightId: "h3",
        author: "Prof. Smith",
        text: "Students often confuse this with the monastic philosophy. Key difference: rhythmic allows for shallow work periods.",
        timestamp: new Date("2024-01-17"),
      },
    ],
    questions: [
      {
        id: "q1",
        question: "What is the primary characteristic of deep work?",
        options: [
          "Working for long hours",
          "Distraction-free concentration on cognitively demanding tasks",
          "Multitasking efficiently",
          "Working in isolation",
        ],
        correctAnswer: 1,
      },
      {
        id: "q2",
        question: "According to the text, which of the following is NOT a reason why deep work matters?",
        options: [
          "Deep work is valuable",
          "Deep work is rare",
          "Deep work is easy to learn",
          "Deep work is meaningful",
        ],
        correctAnswer: 2,
      },
      {
        id: "q3",
        question: "What is the main goal of the rhythmic philosophy?",
        options: [
          "To eliminate all shallow work",
          "To work only in the mornings",
          "To create a regular habit that removes decision-making about when to do deep work",
          "To work in complete isolation",
        ],
        correctAnswer: 2,
      },
    ],
  },
  {
    id: "2",
    title: "Understanding Neural Networks",
    author: "Dr. Alex Chen",
    readTime: "12 min read",
    content: `# Understanding Neural Networks

Neural networks are computing systems inspired by biological neural networks that constitute animal brains. They are the foundation of modern artificial intelligence.

## The Basic Building Block: The Neuron

An artificial neuron receives one or more inputs and sums them to produce an output. Usually each input is separately weighted, and the sum is passed through a non-linear function known as an **activation function**.

### Mathematical Representation

The output of a single neuron can be represented as:

\`\`\`
y = f(Σ(wi * xi) + b)
\`\`\`

Where:
- \`xi\` represents inputs
- \`wi\` represents weights
- \`b\` is the bias
- \`f\` is the activation function

## Types of Neural Networks

### Feedforward Neural Networks

The simplest type of artificial neural network. Information moves in only one direction—forward—from the input nodes, through the hidden nodes, and to the output nodes.

### Convolutional Neural Networks (CNNs)

Particularly effective for image recognition tasks. They use a mathematical operation called convolution to extract features from input data.

> "CNNs have revolutionized computer vision, enabling applications from facial recognition to autonomous vehicles."

### Recurrent Neural Networks (RNNs)

Unlike feedforward networks, RNNs have connections that form directed cycles. This allows them to maintain a 'memory' of previous inputs, making them ideal for sequential data like text or time series.

## Training Neural Networks

Neural networks learn through a process called **backpropagation**:

1. **Forward pass**: Input data flows through the network to produce an output
2. **Loss calculation**: The difference between predicted and actual output is computed
3. **Backward pass**: Gradients are calculated and propagated back through the network
4. **Weight update**: Weights are adjusted to minimize the loss

## Conclusion

Neural networks represent a powerful paradigm for machine learning, capable of learning complex patterns from data. As computational resources grow, so does the potential of these systems.`,
    highlights: [
      {
        id: "h4",
        text: "activation function",
        startOffset: 0,
        endOffset: 0,
      },
      {
        id: "h5",
        text: "backpropagation",
        startOffset: 0,
        endOffset: 0,
      },
    ],
    comments: [
      {
        id: "c4",
        highlightId: "h4",
        author: "Teaching Assistant",
        text: "Common activation functions include ReLU, sigmoid, and tanh. ReLU is most commonly used in modern networks due to its computational efficiency.",
        timestamp: new Date("2024-02-01"),
      },
      {
        id: "c5",
        highlightId: "h5",
        author: "Dr. Chen",
        text: "This algorithm was popularized in the 1986 paper by Rumelhart, Hinton, and Williams. It's fundamental to understanding how neural networks learn.",
        timestamp: new Date("2024-02-02"),
      },
    ],
    questions: [
      {
        id: "q4",
        question: "What biological system inspired artificial neural networks?",
        options: [
          "The human heart",
          "Animal brains",
          "Plant root systems",
          "Cellular mitosis",
        ],
        correctAnswer: 1,
      },
      {
        id: "q5",
        question: "Which type of neural network is best suited for image recognition?",
        options: [
          "Feedforward Neural Networks",
          "Recurrent Neural Networks",
          "Convolutional Neural Networks",
          "Simple Perceptrons",
        ],
        correctAnswer: 2,
      },
      {
        id: "q6",
        question: "What is the correct order of steps in backpropagation?",
        options: [
          "Backward pass, Forward pass, Weight update, Loss calculation",
          "Forward pass, Loss calculation, Backward pass, Weight update",
          "Loss calculation, Forward pass, Backward pass, Weight update",
          "Weight update, Forward pass, Loss calculation, Backward pass",
        ],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: "3",
    title: "The Psychology of Habit Formation",
    author: "Maya Johnson",
    readTime: "6 min read",
    content: `# The Psychology of Habit Formation

Habits shape our lives far more than we realize. Research suggests that about 40% of our daily actions are not actual decisions, but habits.

## The Habit Loop

Every habit follows a neurological loop consisting of three elements:

1. **Cue**: A trigger that tells your brain to go into automatic mode
2. **Routine**: The behavior itself (physical, mental, or emotional)
3. **Reward**: Something that helps your brain figure out if this loop is worth remembering

> "First we make our habits, then our habits make us." — John Dryden

## The Science Behind Habits

When we first learn a new behavior, the prefrontal cortex—responsible for decision-making—is highly active. However, as the behavior becomes habitual, activity shifts to the basal ganglia, freeing up mental resources.

### The 21-Day Myth

Contrary to popular belief, habits don't form in 21 days. Research by Phillippa Lally found that it takes an average of **66 days** for a new behavior to become automatic, with a range of 18 to 254 days depending on the complexity.

## Strategies for Building Better Habits

### Habit Stacking

Link a new habit to an existing one:
- "After I pour my morning coffee, I will meditate for one minute"
- "After I sit down at my desk, I will write my three priorities for the day"

### Environment Design

Make good habits obvious and bad habits invisible. Place your running shoes by the door. Remove unhealthy snacks from visible areas.

### The Two-Minute Rule

When starting a new habit, it should take less than two minutes to do. This reduces the friction of getting started.

## Breaking Bad Habits

To break a habit, you must identify and address each component of the habit loop:

- **Make the cue invisible**: Remove triggers from your environment
- **Make the routine unattractive**: Reframe your mindset about the behavior
- **Make the reward unsatisfying**: Create accountability or negative consequences

## Conclusion

Understanding the psychology of habits gives us the power to reshape our behaviors. By working with—not against—our brain's natural tendencies, we can build the habits that lead to the life we want.`,
    highlights: [
      {
        id: "h6",
        text: "40% of our daily actions are not actual decisions, but habits",
        startOffset: 0,
        endOffset: 0,
      },
      {
        id: "h7",
        text: "66 days",
        startOffset: 0,
        endOffset: 0,
      },
    ],
    comments: [
      {
        id: "c6",
        highlightId: "h6",
        author: "Study Group",
        text: "This statistic comes from Duke University research. It highlights why habit formation is so important for behavioral change.",
        timestamp: new Date("2024-02-10"),
      },
      {
        id: "c7",
        highlightId: "h7",
        author: "Maya Johnson",
        text: "Important correction to the common '21 days' myth. The original study was published in the European Journal of Social Psychology (2009).",
        timestamp: new Date("2024-02-11"),
      },
    ],
    questions: [
      {
        id: "q7",
        question: "What percentage of our daily actions are habits according to research?",
        options: ["20%", "30%", "40%", "50%"],
        correctAnswer: 2,
      },
      {
        id: "q8",
        question: "What are the three elements of the habit loop?",
        options: [
          "Start, Middle, End",
          "Cue, Routine, Reward",
          "Input, Process, Output",
          "Trigger, Action, Result",
        ],
        correctAnswer: 1,
      },
      {
        id: "q9",
        question: "According to research, how long does it typically take for a new behavior to become automatic?",
        options: ["21 days", "30 days", "66 days", "90 days"],
        correctAnswer: 2,
      },
    ],
  },
];
