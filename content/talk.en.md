---
id: cover
section: Introduction
kicker: Interactive talk
brand: LLM / AGENTS
title: From neuron to agent
subtitle: How a “stochastic parrot” reads projects, calls tools, and completes tasks
visual: hero
minutes: 1
---
**LLM generates tokens - the agent solves problems.**

Let's get under the hood and figure out where the model ends and the system around it begins.

<!-- notes -->

Hello everyone. Today we will talk about agents, LLMs, and neural networks: how they work, how models have evolved, and what modern agents can already do. We will start with a neuron, then cover tokens, context, and the Transformer. After that we will move to the harness, skills, MCP, model choice, my workflow, and the future of automation.

===
---
id: biological-neuron
section: From neuron to network
kicker: BIOLOGICAL PROTOTYPE
title: Neuron
visual: biological-neuron
minutes: 1
---
Dendrites receive signals, the cell body integrates incoming influences, and the axon carries the impulse to the next cells through the synaptic terminals [23].

An artificial neuron borrows this general idea, but does not attempt to accurately simulate biology.

<!-- notes -->

The artificial neuron was inspired by a biological cell. A neuron has many input dendrites. Signals accumulate in the cell body, and when a threshold is crossed, an impulse travels through the axon to other cells. An artificial neuron borrows this general pattern—multiple inputs, signal aggregation, a threshold, and one output—but it is not a precise simulation of the brain.

===
---
id: neuron
section: From neuron to network
kicker: Mathematical model
title: Artificial Neuron
subtitle: Inputs × weights + bias → sum → step function → output
visual: neuron
minutes: 2
---
The perceptron first calculates **z = Σ(wᵢxᵢ) + b**. The weights are on the connections, and a separate `bias` is added to the sum and shifts the threshold.

The step function produces `0` if `z < 0`, and `1` if `z ≥ 0`. So one can emulate the logical operations AND, OR and NOT [1].

**XOR requires a hidden layer:** two neurons find OR and AND, the third one combines their results.

<!-- notes -->

An artificial neuron multiplies every input by its weight, adds the results and a bias, then applies a threshold function. One neuron can implement AND, OR, and NOT. XOR requires a network: one neuron computes OR, another AND, and a third combines them. Here the coefficients are set manually; during training, the network learns them.

===
---
id: digits
section: From neuron to network
kicker: SCALE UP
title: 15 pixels > 10 digits
visual: digit
minutes: 2
---
The network is trained on 3x5 digit patterns and their noisy variants.

The output is a probability distribution over ten classes.

It contains **634 trainable parameters**: 600 weights on connections and 34 `bias`.

For scale: GPT‑3 has 175 billion parameters [3].

<!-- notes -->

Now we scale the idea and recognize a digit from a 3-by-5 image with 15 pixels. A hidden layer sits in the middle, and the output has ten neurons, one per digit. The network returns a probability distribution rather than a rigid answer. Even this toy example has hundreds of weights and biases; modern language models have billions of parameters, but the principle is the same.

===
---
id: learning
section: From neuron to network
kicker: Where do the weights come from?
title: Training
subtitle: Predict > Compare with correct answer > Adjust weights
compare with the correct answer →
adjust weights →
repeat
visual: learning
minutes: 2
---
The developer specifies the network structure, examples, and how to measure the error.

**Training learns the weights**: a wrong prediction nudges millions or billions of numbers in a useful direction [3].

After training, the weights are fixed and no longer change.

<!-- notes -->

At first, the weights are random, so the answers are almost random. We provide an example with a known result, compare the prediction with the target, and use backpropagation to adjust the coefficients slightly. The loop repeats across a large dataset: predict, measure error, update weights. The developer defines the architecture, data, and metric; training discovers the parameter values.

===
---
id: tokens
section: From text to LLM
kicker: Model input
title: Tokens
visual: tokens
minutes: 2
---
A token is a frequently occurring set of characters. A word can be one token or several; space is often included in the next token [4].

The same tokenizer “cuts” English, Russian and code differently.

<!-- notes -->

A neural network works with numbers, so text is split into tokens—frequent sequences of characters. A common English word may fit into one token, while Russian words are more often divided into parts. Code is processed the same way: keywords, brackets, and common patterns become tokens. Both prose and source code end up as sequences of numeric identifiers.

===
---
id: embeddings
section: From text to LLM
kicker: Representation
title: Embedding
visual: embeddings
minutes: 2
---
Embedding is a vector of numbers. The token ID selects the trained row from the initial view table [2].

In a simplified 2D projection, each word is a point between `0` and `1` in two conventional directions.

Thanks to this representation, mathematical operations on words are possible:

**king - man + woman ≈ queen**.

<!-- notes -->

A token ID selects an embedding, a vector containing hundreds or thousands of learned values. In this simplified two-dimensional view, words with related meanings appear close together. Vector operations become possible: “king minus man plus woman” lands near “queen.” No one defines the meaning of each coordinate in advance; semantic relationships emerge from data and are distributed across the vector.

===
---
id: context-relations
section: From text to LLM
kicker: CONNECTIONS IN CONTEXT
title: Attention
subtitle: The model iterates through all context tokens and evaluates their influence on each other
visual: context-relations
minutes: 1
---
Transformer builds a table of connections: **which previous tokens are important for each position now** [2].

A bright cell means more weight in one attention operation.

<!-- notes -->

The last token embedding is not enough to predict what comes next. Attention estimates which tokens in the context matter for each position and builds a matrix of relationships. The token representation is then mixed with contextual information using those weights. The result is no longer a static embedding of a word, but its meaning in this particular sentence.

===
---
id: transformer
section: From text to LLM
kicker: Scale
title: Transformer
subtitle: Any modern LLM is a set of similar blocks
visual: transformer
minutes: 1
---
In GPT-3 175B, each embedding is represented by **12288 numbers**. It arrives at the input and is processed by a wide part of the block of **49152 neurons** [3]. At the output we get the same 12288 numbers.

The same general step is repeated **96 times**: mix information between tokens > transform each position with a neural network.

<!-- notes -->

After attention, the vector passes through a feed-forward network, a larger version of the digit example. A Transformer contains many such blocks. Each transforms the current representation and adds its result. During training, layers capture syntax, punctuation, facts, code patterns, and other relationships. After the final block, the output vector is compared with the vocabulary to select the next token.

===
---
id: context
section: From text to LLM
kicker: WORKING MATERIAL
title: Context
visual: context
minutes: 2
---
Context - a package of input data: service instructions (`system prompt`), dialogue, files, documents, images, descriptions of available actions and the results of their execution.

<!-- notes -->

Context is everything the model receives: system instructions, conversation history, files, images, tool definitions, and tool results. An LLM generates one token per pass. That token is appended to the context, and the model runs again. A long answer is therefore a sequence of individual predictions, with every next step depending on the context accumulated so far.

===
---
id: post-training
section: From model to assistant
kicker: After pretraining
title: Alignment
subtitle: Each stage teaches the model a new type of behavior
visual: training
minutes: 2
---
Pretraining teaches you to predict the next token. [3].

Post-training teaches you to follow instructions, engage in dialogue, and choose preferred behavior [20]. Separately, the model is additionally trained to generate tool calls and use their results [21].

<!-- notes -->

Pre-training on large collections of text and code teaches a base model to predict the next token. Alignment then teaches it to act as an assistant, follow instructions, respect safety boundaries, and use tools. Even after that, it is still an LLM that consumes context and generates tokens. To act in a real environment, it needs a system around it.

===
---
id: model-product
section: From model to agent
kicker: DISTINGUISHING THE CONCEPTS
title: Harness
visual: model-product
minutes: 1
---
**Agent = LLM + Harness**

**Sonnet, Opus, GPT-5.6 - models**

**Claude Code, Codex, Cursor - harness**

Two systems on the same model can behave completely differently[6].

<!-- notes -->

The system around the model is the harness. It exposes tools, executes selected actions, and returns their results to context. The model asks to read a file, proposes a change, runs tests, and sees the result. This creates a loop: reasoning, tool call, observation, next step. The model selects actions; the harness provides access, execution, limits, and state.

===
---
id: harness
section: From model to agent
kicker: Data access
title: Chat or agent?
subtitle: The agent itself reads the working environment and context, the chat depends on the person
visual: harness
minutes: 1
---
Both the chat and the agent are harnessed around the model. The difference is in the length of the work cycle, available data and actions.

<!-- notes -->

The line between chat and agent is blurry: a chat can also search, analyze files, and run code. The practical difference is the environment. A chat mostly sees what the user uploads. An agent reads the file system, executes commands, edits the project, and runs tests. It can move beyond explaining a solution and carry a change through verification.

===
---
id: agent-skills
section: From model to agent
kicker: Repeatable process
title: Skills
subtitle: Ready-made instructions for a specific type of task
visual: agent-skills
minutes: 1
---
Skill combines instructions, materials and, if necessary, scripts so that the agent **consistently repeats one workflow** [61].

<!-- notes -->

A skill is a set of instructions for repeatable work: what to read, which sequence to follow, and how to verify the result. It is useful when you repeatedly explain the same process, such as investigating a task, reviewing code, preparing a document, or releasing a change. The workflow is written once and invoked by name, with optional templates, examples, and scripts.

===
---
id: agent-mcp
section: From model to agent
kicker: External systems
title: MCP
subtitle: Instrument and Data Connection Standard
visual: agent-mcp
minutes: 1
---
MCP connects the model with external context and actions: **documentation, browser, Figma, logs or database** [62].

<!-- notes -->

MCP, the Model Context Protocol, is a standard way to connect an agent to an external database, service, editor, or task tracker. It is not mandatory: Git, curl, APIs, and local commands work directly. MCP is most useful for structured integrations, authenticated access, and specialized operations. Built-in agent capabilities are usually enough to begin.

===
---
id: agent-use-cases
section: From model to agent
kicker: Code access
title: What can you find out from the repository?
subtitle: Problems where the answer relies on code and data schema
visual: agent-use-cases
minutes: 2
---
<!-- notes -->

Repository access is useful beyond development. You can ask an agent how an integration works, where data is stored, how a value is calculated, or where a rule is configured. It can find API clients, migrations, services, and tests and show the evidence. It can also prepare SQL or analysis, but current production state still requires separate data, logs, and permissions.

===
---
id: retrospective
section: Capabilities today
kicker: Five years of progress
title: Retrospective
subtitle: Models evolve faster than our mental models of their capabilities
visual: retrospective
minutes: 2
---
In 2021, Copilot guessed the following line of code [52]. In 2022, ChatGPT turned the model's response into a mass product [53]. Three years later, the general-purpose model has already received the official IMO gold result [11].

**The main change is the scale of delegation.** The horizon for verifiable independent work has increased from approximately 4 minutes for GPT‑4 to 12 hours for Claude Opus 4.6 [14], and teams of agents are already putting together projects of hundreds of thousands of lines [47][48][49].

<!-- notes -->

In 2021, Copilot mainly completed the current line of code. In 2022, ChatGPT made conversation with a model a mass-market product. GPT-4 could already handle small tasks across several files. Then came multimodality and reasoning. By 2025, agentic IDEs were completing repository-level tasks, and in 2026 experiments are already measured in whole projects.

===
---
id: capability-artifacts
section: Capabilities today
kicker: LONG EXPERIMENTS
title: A million lines is not the limit
subtitle: Browser, compiler and javascript runtime built by agent systems
visual: capability-artifacts
minutes: 2
---
Cursor was written by the browser engine [47].

Anthropic wrote a C compiler for Rust [48].

Bun (JS Runtime) moved from Zig to Rust [49].

<!-- notes -->

Recent experiments involve parallel agents, hundreds of thousands of lines, and weeks spent on a browser engine, compiler, or runtime port. The common factor is cheap verification: compare the result with an existing implementation and reuse established tests. This is not full autonomy or line-by-line review, but a strong verification harness moves human involvement up to goals and acceptance.

===
---
id: security-control
section: Capabilities today
kicker: SECURITY
title: Model control
subtitle: Content and capability keep growing; control over model actions still lags behind
visual: security-control
minutes: 2
---
**Filters on answers are not enough.** You will have to restrict the entire agent circuit: rights, network, secrets, access to the model and responsibility.

<!-- notes -->

Compute, electricity, and data were expected to limit scaling, but control is becoming more visible. The longer a model acts and the more tools it has, the harder unintended behavior is to anticipate. A sandbox alone is not enough; we need observability, limits, inspectable intermediate states, and a stop mechanism. This is an engineering problem in the harness and monitoring, not an independent model goal.

===
---
id: model-lines
section: Practice
title: Model lines
visual: model-lines
minutes: 2
kicker: CHOOSE A MODEL
---
**Fast** - massive simple conversions. **Balanced** - typical dialogues and agent work. **Frontier** - complex analysis, ambiguity and costly error.

A strong model is usually slower and more expensive. You need to select according to the set of tasks and checks [7].

<!-- notes -->

Vendors offer model families: fast and inexpensive models, mid-range options, and frontier models. They differ in knowledge, speed, price, and the complexity they can sustain. A large model is often unnecessary for a simple transformation, but capability matters for repository research or ambiguous decisions. Besides the model, there is another setting: effort.

===
---
id: effort-simple
section: Practice
kicker: CHOOSE REASONING DEPTH
title: Effort
subtitle: The model selects the capability curve. Effort determines how deeply it explores that curve
visual: effort-simple
minutes: 1
---
**Model** determines how complex a problem the system is in principle capable of solving. **Effort** affects how much reasoning, trying, and checking she will spend in this run.

Modern effort is a separate parameter of the model, and the limit on the number of tokens is [8][9].

If the task is simple for both models, with the same effort they usually produce comparable quality. A large model can spend more tokens and time on additional checks, and each of its tokens costs more than [19][22].

<!-- notes -->

Effort describes how much time and how many tokens the model spends reasoning and checking. A small model at low effort is usually enough for a simple task such as converting JSON. It can provide comparable quality faster and more cheaply than a frontier model at maximum reasoning. If the task is clear, the context is small, and verification is easy, start light.

===
---
id: effort-complex
section: Practice
kicker: CHOOSE REASONING DEPTH
title: Effort
visual: effort-complex
minutes: 1
---
On a complex problem, a larger model at `medium` can provide the quality of a smaller one at `max` - sometimes with a lower total solution cost [19][22].

Increasing effort forces the model to reason, test, and try longer, but does not move it onto the curve of a more capable model.

<!-- notes -->

If a small model lacks the knowledge, context capacity, or ability to build a long solution, more effort will not add that missing capability. A stronger model at medium effort may be better and cheaper because it avoids repeatedly following the wrong path. Effort lets a model work longer within its abilities; a wrong direction is a signal to switch models.

===
---
id: chooser
section: Practice
kicker: QUICK SELECTION
title: Checklist
subtitle: Context, model, and effort solve different problems
visual: chooser
minutes: 2
---
**The goal is unclear?** Clarify the task and readiness criterion.

**Lack of facts?** Give data or tool.

**Context is sufficient, but work finished too early?** Raise effort.

**Hit your ability ceiling?** Take the stronger model [7]

<!-- notes -->

First check the task wording. If it is unclear to a person, the model will not guess the outcome. Then make sure the required data is available. If the model is moving correctly but stops early, raise effort or ask it to continue. If it chooses the wrong files and approach, use a stronger model. The higher the cost of error, the more capability and verification you need.

===
---
id: setup-flow
section: My setup
kicker: My workflow
title: From task to MR
visual: setup-flow
minutes: 2
---
Maximum control: I manually formulate the technical specifications from the task, give approval to the implementation plan, review and correct the code and create MR.

Without MCP, swarms of agents and complex hierarchy of skills.

<!-- notes -->

I take a task from the tracker and add missing technical detail. Codex investigates the documents and code and prepares a plan. I review it, resolve questionable decisions, and only then ask for implementation. I review the resulting code as well, with several feedback cycles when needed. For now, I create the branch, commits, merge request, and perform the final GitLab review myself.

===
---
id: setup-docs
section: My setup
kicker: Context in the repository
title: Domain knowledge and plans
visual: setup-docs
minutes: 1
---
Domain documents explain the individual business functions of the system.

The task plan captures a specific change: boundaries, files, tests, rollouts, and open issues.

The agent reads only the relevant slice and updates the documentation if it discovers a new stable rule during research.

<!-- notes -->

The project stores persistent context in domain documents: integrations, tests, business rules, and constraints. General information lives in a short top-level AGENTS.md or an equivalent file. Task plans are stored alongside it. The agent does not load the whole project; it reads the common rules, selects the relevant domain slice, and fills gaps by investigating the code.

===
---
id: setup-plan
section: My setup
kicker: Plan to code
title: Plan
subtitle: Example: synchronizing tickets from an external support system
visual: setup-plan
minutes: 2
---
A good plan describes the transition from current behavior to the desired one: **where we change, what we save, how we divide the work, check and roll out**.

After my review, this file becomes instructions for implementation and a checklist for final testing.

<!-- notes -->

A plan collects the context for a change: goal, current and desired behavior, components, database changes, and external contracts. A large task can be split into stages or merge requests; the plan also defines the algorithm, tests, rollout, and verification. If discussion has accumulated rejected alternatives, I start implementation in a fresh chat with the final self-contained file.

===
---
id: agent-search
section: My setup
kicker: Gathering context
title: How an agent searches for information
subtitle: Project search examples
visual: agent-search
minutes: 2
---
First, the agent looks for a ready-made answer in **domain documents**. If it is not there, it looks for files, symbols and connections in the code.

<!-- notes -->

An agent is like a new developer: it does not know the whole project in advance. It first searches domain documents. If the answer is missing, it searches file names and terms in the code, opens relevant locations, and builds context. An MCP or IDE index can improve symbol search, but ordinary file search is often enough. Conclusions are checked against tests, migrations, and configuration.

===
---
id: outcome-over-implementation
section: Future
kicker: WHAT REMAINS FOR PEOPLE
visual: outcome-over-implementation
minutes: 1
subtitle: Do we have a place in the new world?
---
<!-- notes -->

The final section is about the human role as agents take over more implementation work. The central shift is from mechanical execution to choosing the problem and defining the outcome. As code and other artifacts become cheaper to produce, real-world context, judgment, and responsibility for consequences become more valuable.

===
---
id: work-future
section: Future
kicker: What remains for people
title: Routine disappears first
visual: work-future
minutes: 2
---
The first in line for automation are not people or professions, but repetitive tasks with a verifiable result: clear input, known procedure, cheap verification [15].

Tasks where you need to choose a problem and criteria, take into account the real context and **be responsible for the consequences** [16] remain sustainable.

<!-- notes -->

Bloom's taxonomy places remembering, understanding, and applying known procedures at the lower levels. Models automate these first: search, summarization, translation, classification, and routine code. Higher levels involve analysis, evaluation, and creation—choosing problems, options, and risks. Models help there too, but accountability and deep context remain human. Repeatable, verifiable routine disappears first.

===
---
id: automation-boundary
section: Future
kicker: Practical limit
visual: automation-boundary
minutes: 2
subtitle: What is being automated?
---
<!-- notes -->

Documentation, code search, analysis, SQL, and integrations with reproducible test environments automate well. Coding increasingly depends less on typing and more on context and task definition. Polished authorial writing remains harder, while legal and regulatory conclusions require expert review. Genuine creative direction and narrow domain knowledge that has never been documented are also difficult to automate.

===
---
id: human-ai-complexity
section: Future
kicker: TANDEM
title: Expanding opportunities
subtitle: AI takes away familiar tasks and opens up access to more complex ones
visual: human-ai-complexity
minutes: 1
---
<!-- notes -->

AI already outperforms people on individual tasks, but the strongest arrangement is a partnership: the person provides direction and context, while the model removes routine and opens access to more complex work. The entry barrier is low; you do not need to master MCP or dozens of skills first. Start the agent in the project and give it a concrete task. Built-in capabilities are enough to begin.
