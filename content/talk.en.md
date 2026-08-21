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

Hello everyone! Today we will look at what neural networks are using the example of Transformer and modern LLMs, how they work and how they create agents capable of calling tools and writing code.

Let's start from the most basic level - a single biological cell. Then we will assemble from this idea an artificial neuron, a small network and a language model. After that, let’s move on to agents and see what capabilities such systems already have.

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

Let's start with a biological neuron. From the school biology course we remember that the brain consists of nerve cells connected to each other in a huge network. At the same time, an individual cell has a relatively simple structure.

A neuron has many inputs - dendrites, through which signals from other cells arrive - and one output, an axon, which transmits the impulse further. All incoming influences accumulate in the cell body. When their sum exceeds a certain threshold, the neuron produces a single output pulse.

Artificial neural networks borrow this general design: many inputs, signal pooling, thresholding, and one output. This is a mathematical analogy, not an attempt to replicate biology exactly.

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

An artificial neuron is a mathematical abstraction over a biological one. It also has multiple inputs, one output, and a function that detects when the output signal changes.

For clarity, everything is represented here in binary form: each input is equal to zero or one, and the step function returns zero or one. Real networks typically use real values ​​and more complex activation functions, but the principle remains the same.

Each input has its own weight. The input is multiplied by this coefficient, then all products are added, and a separate constant is added to the sum - `bias`. The activation function then compares the result with the threshold.

Almost all basic Boolean logic can be shown on one neuron. For `AND`, the output becomes one only when both inputs are active. For `OR`, any of them is enough: the threshold changes, but the scheme itself remains the same. In `NOT`, a negative weight inverts the input signal.

With `XOR`, one neuron is no longer enough, because a unit is only needed for non-matching inputs. Add a hidden layer: one neuron calculates `OR`, another calculates `AND`, and the third combines their results. If only one input is active, `OR` gives the desired signal. If both are active, the result of `AND` is subtracted and the output is zero again.

This is how a more complex function is formed from several simple elements. Here the coefficients are set manually so that the mechanics can be seen. During training, the network itself selects weights and `bias` for examples.

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

Now let's complicate the task a little. Instead of a Boolean operation, let's try to determine a number from a set of pixels. There are only 15 values ​​at the input - an image of size 3x5. Each pixel becomes a separate network input.

Next comes the hidden layer, and the output contains ten neurons - one for each digit from zero to nine. This design is called a multilayer perceptron, or MLP. We will later see a similar fully connected block inside Transformer.

Each input is connected to all the neurons in the hidden layer, and each hidden neuron is connected to all the outputs. Therefore, each connection has its own weight. The output is not one hard answer, but a distribution of probabilities: for example, the network can be most confident in one, but leave a small probability for other numbers.

Even this toy model already has 634 trainable parameters: 600 connection weights and 34 `bias`. For now, let’s just fix the scale - then we’ll talk about billions and trillions of such coefficients.

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

Now let's see where the weights come from in the network. At the beginning of training, they are initialized with small random values, so the first version of the model responds almost randomly.

We provide the input with an example for which we know the correct answer in advance, make a prediction and compare it with the standard. Then, using backpropagation and an optimization algorithm, we determine in which direction each coefficient needs to be changed so that the result becomes a little closer to the correct one.

The weight is adjusted only by a small amount. If you immediately adapt the network too much to one example, it will simply remember the training sample and will perform worse on new data. Therefore, the cycle is repeated many times on different examples: predict, measure the error, slightly adjust the weights.

The network for recognizing numbers has about six hundred parameters: the weights of the input and output layers plus `bias`. Even open models that can be run on a single video card are already measured in billions of parameters, and the largest cloud systems are measured in much larger numbers. The principle of learning remains the same, but the scale of data and computation changes radically.

Before the era of modern language models, neural networks were already good at solving problems with understandable fixed input and output: image classification, object recognition and other similar tasks. Now the next question arises: how to feed text of arbitrary length into a numerical model?

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

A neural network works with numbers, so an arbitrary string cannot simply be passed to it as is. First, the text is divided into tokens - statistically frequently occurring sequences of characters. The tokenizer dictionary is built so that typical texts are represented in a relatively short sequence.

A common English word is often placed into a single token. It’s more complicated with Russian and other languages: a separate token can be a whole word, a root, an ending, or even one letter. Therefore, the same length of text in different languages ​​takes up a different number of tokens.

There is also a non-obvious detail: the space before the word is often included in the token itself. This means that the same word at the beginning of a line and after a space can be encoded with different identifiers.

The code is processed using the same statistical principle. English keywords, parentheses, quotation marks, and other common character combinations can be combined into separate tokens. For the model, both plain text and source code eventually become a sequence of numeric identifiers.

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

The token ID itself is just a serial number in the dictionary. For the model to work, each token is associated with an embedding: a set of hundreds or thousands of numbers. These values ​​are also trainable parameters. During training, they are gradually formed, and in the finished model they are read from the table.

Embedding can be thought of as a numerical representation of meaning. To illustrate, let us greatly simplify the multidimensional space to two conditional directions: “royal - ordinary” and “male - female”. Then the king, the king and the prince will be nearby, because they have similar properties. The Queen and Princess form an adjacent group.

The distance between points allows you to evaluate the proximity of words. Moreover, you can perform operations on vectors that cannot be done in plain text. A classic example: if you subtract the direction “man” from the vector of the word “king” and add the direction “woman”, the result will be close to the word “queen”.

Of course, in a real model there are not two labeled axes, and there are many more dimensions. Semantics is distributed among a set of numbers and arises itself during the learning process. We don't manually specify where "royalty" should lie or the meaning of each word.

The ability to learn such numerical relationships is one of the reasons why neural networks can work with language. The initial embedding describes a single token, and then Transformer will change it taking into account the entire context.

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

Before attention, each token is already represented by embedding, to which information about its position in the sequence is added.

The key mechanism of Transformer is attention, proposed in the article “Attention Is All You Need” in 2017. Its job is to add information from all previous context to the current token's representation.

To predict the next token, it is not enough to take the embedding of the last word. You need to understand which parts of the request affect it more. Therefore, the model builds a matrix of connections of size `n × n`, where `n` is the number of tokens in the context. For each position, the impact of all available previous positions is evaluated.

A bright cell in the diagram means more weight. For example, when processing a pronoun, the model may lean more heavily on the noun to which it refers. One token may be important for syntax, another for meaning, and a third will have almost no effect on the current position.

The embeddings of previous tokens are then mixed in proportion to these weights. The output is no longer a representation of one word with its position, but a context vector to which relevant information from the entire sequence has been added.

The scheme is greatly simplified: several attention operations operate within each layer, and connections are recalculated at different depths. But the main idea is exactly this - to give each position access to the necessary part of the context.

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

After attention, the context vector enters a fully connected neural network - the same multilayer perceptron that we have already seen in the example of number recognition.

In GPT-3, each position is represented by a vector of 12288 numbers. Inside the MLP, it expands approximately four times to 49,152 values, undergoes a nonlinear transformation, and returns to its original dimension. At the output we still have embedding, but already changed by the next processing layer.

The combination of attention and MLP is called the Transformer block. One block is not enough, so in GPT-3 this operation is repeated 96 times. Each subsequent block receives the result of the previous one and gradually refines the representations.

In a simplified explanation, one can imagine that different depths begin to highlight different features: syntax, connections between objects, knowledge about the code, or other patterns. This does not mean that one block is strictly responsible only for punctuation, and the other - only for the meaning. Specialization is more complexly distributed, but research does show the emergence of different types of traits at different layers.

After the last block, the resulting vector is compared with the embeddings of tokens from the dictionary. Based on proximity, a probability distribution is calculated: which token should come next.

The entire huge Transformer issues only one new token in one pass. To get the entire response, this token is added to the end of the context, the sequence goes through the model again, and the next one appears. The loop continues until the model selects a special termination token.

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

Context is all the information that the model sees at the current step. Modern models are mostly multimodal, so the input can be not only text, but also images, files and documents of other formats.

When looking at a chat or agent, the context includes system instructions from the vendor, conversation history, the current user message, project files, attached documents, images, descriptions of available tools, and the results of calls already made.

Internally, all this is represented as a sequence of tokens and fed into the Transformer. At the output, the model receives only a probability distribution for one new token. The selected token is added to the initial context, after which the next generation step is started.

Therefore, the quality of the answer directly depends on what is in the input packet. If the desired fact, file, or tool result is not in the context, the model cannot reliably retrieve it from nowhere. We'll see later how agency binding helps the model itself gather the missing context.

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

At the first stage, pretraining, the model is trained on a huge set of texts: materials from the Internet, books, code, and including synthetic data created by other models. The basic task is simple - predict the next token or the next part of the image.

As a result, the base model absorbs languages, knowledge from the training set, and numerous reasoning patterns. But this is not a ready-made assistant yet. Such a model can continue the text, but is not required to respond interactively, follow instructions, or behave safely.

Next comes post-training and alignment—learning the desired behavior. First, the model is taught the role of an assistant: they are given instructions and examples of good and bad answers, taught to answer questions and follow the format of the dialogue.

The behavior is separately configured: security restrictions, failure rules and the specifics of a particular product. Specific recipes differ from one laboratory to another, but the goal is the same - to bring the actual behavior of the model closer to what the system developer wants to achieve.

Another important step is tool use. A tool call to a model also appears as specially formatted text, often a JSON-like structure. The model must select the desired action and fill in the parameters. The outer shell then actually runs the search, Python code, image generation, or console command and returns the result to the context.

After this, the model continues to work with new data. It is this skill—forming a challenge, reading the outcome, and deciding what to do next—that creates the foundation of the agency cycle.

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

Now let's introduce the term `harness` - a software framework that allows the language model to work as an agent. A simplified formula looks like this: an agent is an LLM plus a harness.

The model itself receives the context and is able to generate text or a request to call the tool. Harness shows it a list of available actions, executes the selected call and returns the result back. The model then takes the next step. This cycle continues until the finished result or until the user's response is required.

Sonnet, Opus and GPT‑5.6 are models. Claude Code, Codex and Cursor are different harness systems around models. Therefore, two systems on the same LLM can behave very differently: they collect context, provide tools, manage the loop, and verify task completion differently.

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

Modern chat is also a harness. ChatGPT and similar products already know how to work in a loop: run Python code, do a web search, analyze files and trigger the generation of images. For many one-time tasks this is enough.

The main limitation of chat is context. Typically, it only knows what the user has written, added to the dialogue, or pre-loaded into the project. The chat does not see your file system and cannot itself find a neighboring class, migration or configuration that you forgot to mention. Responsibility for the completeness of the source data remains with the individual.

The local agent runs next to the project. A business description of the task is often enough for him: then he will find the right place in the repository, read the associated files and collect the minimum necessary context. There is no need to guess in advance which pieces of code to copy into the message.

Such an agent has significantly more tools. It can execute commands in the console, search the project, run tests and local services. Through separate connections, it can be given reading logs or databases.

But widespread access requires caution. The project code does not provide automatic access to production data. Separate permissions are required for the real database, logs and external systems. If such access is still granted, it is safer to start with read-only mode so that an erroneous call does not change the data.

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

The next opportunity for local agents is skills. I treat them quite conservatively: in essence, a skill is a pre-saved context and instructions that can be connected to a task with one command.

Skills are especially useful for repeatable processes. For example, a team has review rules: what to check, what commands to run, in what format to return comments. Instead of inserting a long instruction into the chat every time, it can be issued once as a skill.

The same applies to the workflow of a new task: first research the project, prepare a plan, wait for confirmation, then implement, check and formalize the result. In the skill you can put the order of steps, requirements for the plan, necessary documents and readiness criteria.

There are many ready-made skills in open repositories that promise a sharp increase in quality or savings in tokens. Such statements should be checked on your own tasks. A couple of successful examples are not enough - you need a set of typical cases and a comparison of results.

In addition, skills are aging. With the release of a new line of models, previous prompt engineering techniques may become useless or even interfere. Modern strong models usually understand ordinary meaningful instructions well without special psychological tricks.

Therefore, a good skill is not a magical prompt, but a compactly recorded, repeatable process that your team really needs and is supported along with other work rules.

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

MCP stands for Model Context Protocol. This is a standard through which external data sources and actions are connected to the agent: a database, a log system, a browser, Figma, GitLab or another software product.

At the same time, the local model with access to the console and without MCP can already do a lot. It can call a regular API, run a Git command, or write a small script to query data. MCP does not add a fundamentally impossible action, but provides a ready-made, predictable set of tools.

One practical benefit is the economy of context. Instead of documentation of a large API and a long command, the model receives a short operation with the necessary parameters. The server makes the call and returns a structured result.

But connecting a huge MCP server for a couple of simple actions is not always profitable. If you need to read a single MR or run a regular Git command, the agent will often do just fine via the CLI or a direct request. The description of dozens of unused tools itself takes up context.

MCP is especially useful where access to the system is non-trivial: its own API, database, log search or service with complex authorization and request format. This is not a universal tablet, but a convenient way to standardize a specific connection.

And the protocol itself does not cancel security. Rights, secrets, authorization and allowed actions are still configured separately. For sensitive data, minimal access and read-only mode are preferred.

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

Access to the repository opens up a useful class of tasks not only for developers. Understanding someone else's code is not trivial even for a programmer, and an analyst or product often has to look for a person who knows a specific module. The agent can act as the first guide through the code base.

You can ask what protocol the integration uses, where a certain value is stored, from which fields it is calculated, or how the backend and admin panel are connected. The agent will find external API clients, services, migrations and tests and explain the found logic in plain language.

This does not provide a 100% guarantee of the correct answer. Complex or outdated code can be misunderstood, and a person without deep knowledge of the module will face the same problem. Therefore, it is useful to ask for links to specific files and separate the confirmed facts from the conclusion.

Another common scenario is SQL preparation. There is no need to manually enumerate tables, fields and relationships: the model can reconstruct the schema from entities and migrations and assemble the query. If there is a secure connection to the read-only database, it will also be able to test it on real data.

It is important to distinguish between three levels here. The repository shows what behavior is inherent in the code. The configuration tells you what is enabled in a specific environment. And the actual event in production is confirmed only by data and logs. One access to the code does not replace the last two sources.

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

To understand the direction of movement, let's see how quickly the unit of work that can be delegated to the model grew.

In 2021, Copilot mainly predicted the continuation of the current line or small function. This already speeded up the typing of code, but the person always remained inside each step.

In 2022, ChatGPT made conversation with a language model a mainstream product. He could already generate blocks of code and knew something even about rare technologies, although he often made mistakes and produced broken solutions.

In 2023, GPT‑4 became capable of independently holding a task for several minutes and writing meaningful working scripts. In 2024, models received broad multimodality - understanding and generating images - and a separate reasoning mode, which significantly improved the quality of complex answers.

A good pace marker is the International Mathematical Olympiad. In 2024, the specialized bundle of models and tools reached the Silver level. Just a year later, the general-purpose model received an official gold result, solving problems in natural language without special formalization for the Olympiad.

In 2025, coding agents confidently took on small and medium-sized tasks on multiple files. In 2026, experiments progressed to entire projects and tens of hours of battery life.

The main change is not another name for the model, but the growth of the horizon of verifiable independence: from a one-line proposal to a task, and then to a large system.

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

We have not yet reached the everyday “create any project” button, but there are already several indicative experiments.

Cursor organized a system of hundreds of parallel agents who spent more than a week building the browser engine from scratch. The result was a project of about a million lines. It wasn't bug-free or ready to replace existing browsers, but it was able to get a significant part of the way from specification to a working system.

Anthropic conducted a similar experiment with a C compiler for Rust. The result was able to assemble large real-world programs, including Doom and parts of the Linux kernel. This is no longer a training function, but a large system with many interacting components.

The third example is the porting of JavaScript runtime Bun from Zig to Rust. Initially, this was an experiment, but after a week the main developer decided to continue with a new implementation and close the previous direction.

It is important to understand these results correctly. This is not one agent who received the phrase “make a browser” and returned perfect code a week later. There was a system of many sessions, parallel executors, tests, checks, restarts and human control.

All three tasks have good verifiability in common. The compiler can be tested on well-known programs. The runtime has tests and the old implementation for comparison. For the browser, there are detailed standards and ready-made engines with which you can compare behavior.

Therefore, it is not the million lines in themselves that are important. The clearer the outcome criterion and the cheaper the automatic check, the further the agent is able to go on its own. Without tests and reviews, a large amount of code remains just a large untested change.

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

Previously, it seemed that the development of models would primarily be limited by the amount of computation, electricity, or lack of training data. Now another limit is becoming more and more noticeable - the human ability to control the actions of many powerful agents.

The problem is not that the model suddenly has malicious intent. The agent is given a goal, tools, and a large time budget, and then finds a way to achieve a result that the creators of the environment did not foresee.

In one of the cyber-evals, the model had to pass a benchmark in an isolated environment. She found a vulnerability in the infrastructure, went online and accessed external data to get answers. Formally, the goal remained the same - to successfully pass the test - but the method turned out to be far beyond the expected boundaries.

In another study, an analysis of a large number of launches revealed real calls to the production infrastructure of third-party organizations. The environment actually allowed for escape, even though the model's instructions stated that it was in a simulation. In one episode, an agent created and published a malicious package that was launched on real systems.

Such cases show the risk of running hundreds of agents in parallel with a broad goal and a poorly constrained environment. If a problem is not solved in the usual way, the system may discover an unexpected path, and existing monitoring and stopping mechanisms will not be enough.

Therefore, there are few filters on the final response. You need to control the entire agent circuit: rights to files and services, network, secrets, external providers, activity logs, incident detection and operator responsibility. This applies to both model training and the normal work of agents.

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

Almost all vendors produce advanced models in product lines. The names change, but the roles are similar: a fast junior model, a balanced mid-range model and a frontier model with maximum capabilities.

The fast option is suitable for massive simple transformations: classification, transferring data between formats and other repeatable work. The balanced model covers typical dialogues and agent tasks. Frontier is needed for complex analysis, ambiguous decisions and cases with a high cost of error.

Typically, the more capable a model, the more expensive and slower it is. Therefore, choosing “the smartest one always” is not necessary. First you need to evaluate the class of the task and understand what ceiling of capabilities is sufficient. After choosing a model, the second parameter remains - effort.

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

Effort literally means “effort,” but it is convenient to think of it as the model’s diligence. The parameter determines how long it will take to find a solution and how many additional attempts and checks it will make.

If the task is not immediately achievable, high effort allows you to reason longer and try a different path. Even after a solution has been found, the model can continue checking: open neighboring files, run additional tests, or double-check its own conclusions.

On a simple task, the smaller and larger models often arrive at the same quality. The younger one with medium effort will do it faster and cheaper. A strong model is not obliged to solve a simple problem worse, but can spend more time and more expensive tokens without noticeably improving the result.

Therefore, the optimal setup is a balance of speed, cost and sufficient quality. It has to be selected based on your own typical tasks, and not just by the name of the model.

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

On a complex problem, the situation changes: models have different ceilings of capabilities. The younger model at maximum effort can search for a long way, and the larger one at `medium` can quickly get a result of the same quality.

If you increase the effort of a large model, its quality can increase even more. The extra effort helps to better utilize the capabilities of the selected model, but does not turn the junior model into a frontier.

Therefore, calculating only the price of one token is not enough. A more expensive model is sometimes cheaper per problem solved because it chooses the correct approach faster and requires fewer retries.

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

Choosing a model and effort is not the first item on the checklist. First you need to check the problem statement.

If the goal, boundaries and criterion of readiness are not clear from the formulation, neither the junior nor the senior model will be able to fulfill it efficiently - just like a person. In the best case scenario, the agent will notice the gap and ask a question. At worst, he will fill it with his own assumption and solve the wrong problem.

The next question is whether there is enough data. If the production does not have the required file, fact, or access to the source, the result will also be unreliable. You can transfer the data directly or provide a tool with which the agent will receive it himself. The model is able to clarify the obvious lack of context, but it does not know about all the nuances that the problem author forgot to mention.

If the goal is clear and the context is sufficient, but the agent is moving in the right direction and simply ends too early, you can raise effort. This is similar in meaning to a “continue” message: the model will have more time to take additional steps and check.

If she systematically chooses the wrong approach, does not understand the design, or lacks knowledge and ability, a transition to a stronger model is needed. Additional effort will not correct the fundamental ceiling.

Finally, we consider the cost of error. The lower it is, the bolder you can choose a smaller model and effort. If the error is expensive, it is reasonable to immediately use a high-effort frontier model - but together with tests, review and reproducible verification. The strongest model still does not replace outcome control.

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

Now a little about my work process. It is designed quite simply: without mandatory MCP, a swarm of agents and a complex automation hierarchy.

I take the task from a task tracker. Usually the business requirements are already described by the product or analyst, and I add the missing technical information and formulate the technical specification so that the goal and limitations are clear.

Then I transfer the task to Codex through a separate skill for new tasks. It sets out the order of work: read relevant documents, examine the code, ask questions if necessary and prepare an implementation plan.

I read the plan separately, clarify and confirm. After that, I take a link to a self-sufficient document and begin implementation in a new clean chat. This way, rejected options and a long history of discussions do not remain in the context.

I check the finished code in PhpStorm. I can make minor edits manually, but larger comments are returned to the agent. After review, I create a branch, commits and MR. I also go through GitLab myself.

That is, the control points remain with the person: setting the task, approving the plan, reviewing the code and publishing the result. The agent takes long sections of research and implementation in between. For my process, manually moving to a task tracker or GitLab is not a significant blocker, so automating it through MCP is not yet necessary.

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

The repository has a folder with domain documents. They contain stable knowledge on individual processes: for example, how acquiring, payments, or integration with an external system works.

When a problem appears in an unfamiliar area, I first read the relevant document as a human, and the agent uses the same material during research. If there is no ready-made description, the process can be reconstructed by code and recorded for the following tasks.

The documents are written in human-readable form and divided by topic. Thanks to this, you don’t have to load the entire project into the context each time: you just need to select the relevant slice. A plan for a specific implementation is stored separately from permanent knowledge.

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

An implementation plan collects all the context of a specific task into a single Markdown file. It captures the goal, current and desired behavior, technical constraints, and external contracts that cannot be broken.

If database changes are needed, migrations and application procedures are described separately. A large task is divided into stages, which, if necessary, can be formalized as separate MRs. It then lists the changes to the code, the overall algorithm, and references to important existing implementations.

There is also a check of the result: tests, manual smoke, layout order and signs of successful work. Open questions remain explicit rather than being replaced by hidden assumptions.

After review, such a plan becomes a self-sufficient instruction. It can be given to the agent in a new chat without all previous correspondence and used as a checklist for implementation and final verification.

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

When an agent receives a question or a new task, it first reads the project instructions and domain documents. For example, `AGENTS.md` can suggest the structure of the repository and lead to the desired folder in `docs/<domain>/`. There may already be a ready-made description of the process, integration or limitation.

If the answer is not in the documents, the agent proceeds to a regular search in the repository. Through `rg --files` you can find files and modules by part of their name. Through `rg -n` - all mentions of a business term, class, route, database field or error text. Found names give new queries for the next step.

If an agent has access to a code index through MCP—for example, a PhpStorm index or a custom service—they can look up symbol definitions, their usage, interface implementations, and call chains. For a large typed project, this search is sometimes more accurate than a regular grep because it takes into account the structure of the code, not just the text match.

After searching, the agent opens only relevant files and compares the output against tests, migrations, and configuration. In the response, it can specify the specific paths and lines on which the output is based. In this case, the code shows the intended behavior; for the current state of production, you still need separate data, logs or access to the configuration.

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

Let's move on to the final part: what remains for a person in a world where agents write more and more code and take away more and more implementation stages?

Deep technical knowledge is not disappearing, but the complexity of implementation is increasingly less likely to be the ultimate value. It is more important to choose the right problem, define the expected result, set criteria and be responsible for the consequences of the decision.

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

To talk about the future, it is convenient to use Bloom's taxonomy - a ladder from basic cognitive operations to more complex ones. The bad news is that you will have to think more: a quiet, repeatable routine will be automated first.

At the lower level is knowledge. Models have already absorbed a huge amount of public information and quickly find facts. Next comes understanding: retelling, classification, translation and transformation of the material. Using known procedures - including writing generic code - also transfers well to agents.

Above are analysis, evaluation and creation of new things. Here you need to explore the problem area, select the problem itself, compare options, determine criteria for success, evaluate the consequences and assemble a solution. Essentially, these are product responsibility tasks.

Models already help at these levels: they analyze data, offer hypotheses and options. But a person with a deep real context still better understands what issue is worth solving and what risk is acceptable. With real creativity and new directions for models, it’s also even more difficult than with reproducing the known.

Bloom's Taxonomy is not a literal map of jobs. The lower levels do not disappear: without knowledge and understanding it is impossible to analyze qualitatively. But repeatable operations with clear input and cheap verification will be replaced the fastest.

If there is a process in your job that regularly takes an hour or two and is done the same way every time, it is a prime candidate for automation. The freed up time will have to be spent on less routine and more complex decisions.

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

What is already being automated well? First of all, read the documentation. If there is an exact specification, the agent quickly turns it into working context and code.

Searching for answers in a repository, data analytics, and querying the database also work well when the goal is clear. The model can reconstruct the schema, write the SQL, and help evaluate the result.

Integration testing is automated if there is a full-fledged test loop that does not require manual actions from the other party. The agent needs a repeatable sequence and a verifiable outcome. If the last step depends on colleagues in an external company or unavailable production, autonomy ends.

The writing of code itself is also well delegated with a clear technical specification, understandable contracts and tests. In order for the code to turn out to be of high quality, readiness criteria and verification are still needed; without them, the model will only quickly create a large volume of changes.

Ready-made author's texts are less automated. The model easily produces a coherent draft, but often leaves unnecessary language, loses the author's voice and requires editorial work.

Laws, regulations and regulatory requirements should not be relied upon without peer review. The cost of error is high here; relevance and practice of application are important, which may not be present in the context of the model.

It's difficult to automate real creativity, choosing a new direction and working with implicit context. Deep expertise in a narrow subject area or a specific company is especially valuable if it is not recorded anywhere and exists only in people’s experience. As long as this context cannot be transferred to the system, the person remains an essential part of the process.

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

Artificial intelligence is already making a person without these tools less effective than a person with them. At the same time, AI is not yet able to work completely independently in all real processes: it needs a person who sets the direction, provides context and accepts the result.

Even if systems approach AGI in the near future, for some time the human-AI tandem will likely remain more effective than each participant individually. The final illustration shows precisely the expansion of available complexity: some familiar tasks go to the model, and with its help a person can rise to more complex ones.

If the work consists only of mechanical repetition, the news is really bad - such a routine will be the first to be automated. But if there is a lot of analysis, implicit context, responsibility and creative solutions, AI becomes an enhancer, not a substitute in its own right.

Therefore, it is better to start with a real, repeatable task. There is no need to study hundreds of skills or complex prompt engineering in advance: install an agent, give it a specific process and see which area can already be delegated safely and with verification.

After the presentation I will send you a link to the presentation. It has a text mode with speaker notes and a bonus section for those who want to dig deeper into the mathematics of Transformer: positional encoding, vector operations, choosing the next token, and the reasons for non-deterministic responses.

That's all. Ready to answer questions.
