---
id: transformer-route
track: bonus
section: Transformer route
kicker: Bonus track · 01
title: How the context turns into the next token
subtitle: The entire sequence → numbers → connections → probabilities → one new token
visual: deep-route
minutes: 1
---
Let's analyze the decoder-only Transformer in GPT style: the entire input sequence passes through the model, and the desired position gives the probability distribution of the next token.

First, the entire road. Then each block will be expanded separately [2].

<!-- notes -->

This is a bonus route map. There is no need to understand the internals of each stage yet: it is important to see that Transformer is a sequence of specific transformations, and not one giant black box.

===
---
id: token-ids
track: bonus
section: Transformer input
kicker: Bonus track · 02
title: At the input - token numbers
subtitle: The text ends. Then the model works with numbers
visual: deep-token-ids
minutes: 1
---
The tokenizer splits the string into dictionary elements and replaces each element with an entire ID.

The number itself does not mean anything: similar IDs do not have to designate similar fragments [4]. The mark `␠` (in some fonts `SP`) means a space before the fragment. After this slide, the subword parts will be combined into conditional word positions so that the diagrams remain readable.

<!-- notes -->

Show that a token is not necessarily a word. This could be part of a word, a space, a punctuation mark, or a piece of code. ID is needed only as the address of an entry in the model dictionary.

===
---
id: embedding-lookup
track: bonus
section: Transformer input
kicker: Bonus track · 03
title: ID turns into vector
subtitle: Token number selects a row from a trained table
visual: deep-embedding-lookup
minutes: 1
---
The Embedding table stores one vector for each dictionary element.

Lookup retrieves the trained string of numbers [5].

<!-- notes -->

During training, the values of this table change along with the rest of the model's weights. The tutorial diagram shows several coordinates; in a real model there are usually thousands of them.

===
---
id: context-matrix
track: bonus
section: Transformer input
kicker: Bonus Track 04
title: The context becomes the matrix
subtitle: One row per position, one column per vector coordinate
visual: deep-context-matrix
minutes: 1
---
A sequence of `N` tokens turns into a matrix of the form `N × d_model`: `N` is the number of positions, `d_model` is the number of coordinates of each internal vector.

Transformer processes not just one vector, but this entire table of representations [2].

<!-- notes -->

Fix two independent axes: the length of the context goes down, the width of the internal representation goes to the right. Then this form will go through all the blocks of the model.

===
---
id: word-order
track: bonus
section: Transformer position
kicker: Bonus track · 05
title: Word order changes meaning
subtitle: The tokens may be the same, but the sentence can mean something different
visual: deep-word-order
minutes: 1
---
Without position information, self-attention would see the permutation of tokens as the same set of elements.

The model needs a separate order signal [2].

<!-- notes -->

Compare the two sentences on the right. All cards are the same, but the position labels are different. It is the position that distinguishes the subject from the object in this example.

===
---
id: position-encoding
track: bonus
section: Transformer position
kicker: Bonus Track 06
title: Vector gets position
subtitle: Contents of the token + information about its position
visual: deep-position-encoding
minutes: 1
---
The original Transformer added positional encoding to embedding. In many modern architectures, position influences attention through RoPE [2][24].

<!-- notes -->

No need to dive into sines and complex numbers. The main idea: the same token in different positions should participate in the calculation in different ways. The exact implementation varies by model.

===
---
id: isolated-tokens
track: bonus
section: Transformer · attention task
kicker: Bonus track · 07
title: While tokens are isolated
subtitle: Everyone has content and position, but no context yet
visual: deep-isolated-tokens
minutes: 1
---
After input encoding, each line contains its own token and position, but does not yet know anything about its neighbors.

We need a mechanism that will allow tokens to exchange information.

<!-- notes -->

This is a task statement for self-attention. The word vector “she” does not yet contain information about who the pronoun refers to in a particular sentence.

===
---
id: attention-intuition
track: bonus
section: Transformer · attention
kicker: Bonus track · 08
title: Attention routes context
subtitle: Each token selects which previous positions are currently useful
visual: deep-attention-intro
minutes: 1
---
For the selected position, the model calculates the weights of the connections with the available tokens.

The result is a new vector that mixes relevant information from the [2] context.

<!-- notes -->

Click on the tokens in the diagram. The distribution of connections changes for each position. This is an instructional illustration: actual weights vary by layer, head, and specific model.

===
---
id: qkv
track: bonus
section: Transformer · attention
kicker: Bonus track · 09
title: One vector becomes Q, K and V
subtitle: Three trainable projections perform three different roles
visual: deep-qkv
minutes: 1
---
The same input vector is multiplied by three weight matrices and turned into Query, Key and Value.

These representations are trained along with the entire [2][27] model.

<!-- notes -->

Don't call Q, K and V separate databases. These are three temporary representations of one token inside a specific attention layer.

===
---
id: query
track: bonus
section: Transformer · attention
kicker: Bonus track · 10
title: Query: what do I need now?
subtitle: Querying the current position to the rest of the context
visual: deep-query
minutes: 1
---
The Query encodes what information the selected item is trying to find in the available context.

Each position and each attention head will have its own Query.

<!-- notes -->

This is a useful analogy, not a text search query. Query is a vector of numbers whose direction is compared with the Key of other tokens.

===
---
id: key
track: bonus
section: Transformer · attention
kicker: Bonus track · 11
title: Key: when can I be useful?
subtitle: Description of the role of the token for mapping to Query
visual: deep-key
minutes: 1
---
The Key of each position is involved in comparison with the Query of the selected token.

The better the match, the more weight that position can receive.

<!-- notes -->

Key is not passed directly into the final result. It is needed to calculate addressing: determine where to get information from.

===
---
id: value
track: bonus
section: Transformer · attention
kicker: Bonus track · 12
title: Value: what exactly will I convey?
subtitle: Useful contents that will end up in the new mixture
visual: deep-value
minutes: 1
---
After calculating the weights, the model mixes the Value vectors of the available positions.

Key is responsible for selection, Value is responsible for transferred information [2].

<!-- notes -->

The analogy with address and content helps avoid confusing roles. In reality, Key and Value are obtained by linear transformations of one input vector.

===
---
id: qk-scores
track: bonus
section: Transformer · attention
kicker: Bonus track · 13
title: Query meets all Keys
subtitle: A separate score is obtained for each available position
visual: deep-qk-scores
minutes: 1
---
One Query is compared with the Key of all tokens that are allowed to be seen.

The output is a string of raw relevance scores [27].

<!-- notes -->

There is only one dedicated Query, but there are many comparisons. With full self-attention, this calculation is repeated for each position, forming a square matrix of scores.

===
---
id: dot-product
track: bonus
section: Transformer · attention
kicker: Bonus track · 14
title: Q and K get connectivity score
subtitle: A large positive dot product strengthens the corresponding connection
visual: deep-dot-product
minutes: 1
---
A large positive dot product means a strong agreement between the Q and K components. The result is influenced by both the directions and lengths of the vectors - this is not cosine similarity.

Before softmax, scores are scaled by `1 / √d_k`, where `d_k` is the dimension of the Q/K vector [2][27].

<!-- notes -->

Scaling keeps the values in a range where the softmax does not become too sharp when the vectors are large.

===
---
id: causal-mask
track: bonus
section: Transformer · attention
kicker: Bonus track · 15
title: The future is masked
subtitle: When predicting a token, you cannot use tokens on the right
visual: deep-causal-mask
minutes: 1
---
The decoder-only model uses a causal mask: the position sees itself and everything to the left, but not future positions.

Forbidden scores get `−∞` up to softmax and turn into [2][27] zeros.

<!-- notes -->

The triangular shape of the matrix is a direct consequence of causality. During training, the correct continuation is already in the data, so the mask does not allow the model to copy the answer.

===
---
id: softmax-attention
track: bonus
section: Transformer · attention
kicker: Bonus track · 16
title: Softmax turns scores into weights
subtitle: All allowed values become positive, their sum is equal to one
visual: deep-softmax
minutes: 1
---
Raw scores can have any sign and scale. After the mask, softmax turns them into attention distribution.

A large difference between scores gives a more concentrated distribution of [2].

<!-- notes -->

Here softmax is used inside attention, and not for selecting the next token. The mathematical operation is similar, but the distribution is based on the allowed positions of the context.

===
---
id: weighted-values
track: bonus
section: Transformer · attention
kicker: Bonus track · 17
title: Values add up with weights
subtitle: The result of one head is a weighted sum of information
visual: deep-weighted-sum
minutes: 1
---
Each Value is multiplied by its attention weight. The resulting vectors are added.

The current position receives the contextualized representation [2].

<!-- notes -->

This is where information actually transfers between positions. A high weight enhances the Value contribution, a low weight almost eliminates it from the mix.

===
---
id: attention-parallel
track: bonus
section: Transformer · attention
kicker: Bonus track · 18
title: All positions are computed in parallel
subtitle: One row of the attention matrix for each Query
visual: deep-attention-parallel
minutes: 1
---
Instead of sequentially traversing the tokens, Transformer builds the `QKᵀ` matrix for all positions at once.

During training, this allows you to effectively use parallel hardware [2].

<!-- notes -->

Parallelism refers to the computation of positions within a known sequence. With autoregressive generation, the next token still cannot be calculated before selecting the previous one.

===
---
id: attention-heads
track: bonus
section: Transformer · multi-head
kicker: Bonus track · 19
title: One way to look is not enough
subtitle: Different heads receive independent Q, K and V projections
visual: deep-heads-purpose
minutes: 1
---
Several attention heads can simultaneously highlight different types of relationships.

These are not rigidly assigned rules: specialization arises in the learning process [2].

<!-- notes -->

The examples on the right are useful intuitions, not a guarantee that a particular head is always responsible only for syntax or quotes.

===
---
id: multi-head
track: bonus
section: Transformer · multi-head
kicker: Bonus track · 20
title: Heads work in parallel
subtitle: Divide → calculate attention → glue → project
visual: deep-multi-head
minutes: 1
---
Each head generates its own attention output. The results are combined and passed through the output projection.

The result again has the width `d_model` [2].

<!-- notes -->

The model maintains the same width of the residual stream before and after attention. This allows the result to be added to the original input.

===
---
id: residual
track: bonus
section: Transformer block
kicker: Bonus track · 21
title: The original signal takes a short route
subtitle: Residual connection adds the change to the previous state
visual: deep-residual
minutes: 1
---
Attention is not required to rewrite the entire vector. It calculates a correction that is added to the residual stream.

This way, information and gradients pass through the deep network more steadily [2].

<!-- notes -->

It is convenient to think of the residual stream as a common work board. Each sublayer reads its contents and writes its change without destroying everything else.

===
---
id: layernorm
track: bonus
section: Transformer block
kicker: Bonus track · 22
title: Normalization stabilizes the flow
subtitle: Values are brought to a convenient scale before the next conversion
visual: deep-layernorm
minutes: 1
---
Layer Normalization normalizes the view's coordinates within a position.

The exact location of normalization differs between architectures; The diagram uses the common pre-norm option.

<!-- notes -->

There is no need to explain the mean and variance in detail. It’s enough for the route: the values ​​can spread out in scale, and normalization returns them to a stable working range.

===
---
id: mlp-token
track: bonus
section: Transformer · MLP
kicker: Bonus track · 23
title: MLP calculates the correction for each position
subtitle: Attention mixed positions - MLP separately decides what to change in each line
visual: deep-mlp-token
minutes: 1
---
The same feed-forward network calculates `ΔMLP` for each position independently.

The Residual step adds this amendment to the initial state: `x + ΔMLP`. MLP does not directly read neighboring positions - the exchange has already received attention [2].

<!-- notes -->

This links the bonus track to the earlier slide about the neural network. MLP - regular fully connected layers applied to all positions with common weights.

===
---
id: mlp-inside
track: bonus
section: Transformer · MLP
kicker: Bonus track · 24
title: Inside MLP the space is expanding
subtitle: Narrow vector → wide hidden layer → same width
visual: deep-mlp-inside
minutes: 1
---
Classic Transformer MLP expands the dimension, applies nonlinearity and compresses the result back.

In GPT‑3 it is `12 288 → 49 152 → 12 288` [3].

<!-- notes -->

The wide inner layer provides many independent nonlinear features. After the second projection, the result can again be added to the residual stream.

===
---
id: transformer-block
track: bonus
section: Transformer block
kicker: Bonus track · 25
title: One entire Transformer block
subtitle: Norm → attention → residual → Norm → MLP → residual
visual: deep-block
minutes: 1
---
All familiar elements are collected into a repeatable block.

A matrix of the same shape remains at the input and output: `N × d_model` [2].

<!-- notes -->

On this slide you should follow the route with your finger. Each sublayer changes the values, but not the context length or the width of the residual stream.

===
---
id: block-depth
track: bonus
section: Transformer depth
kicker: Bonus track · 26
title: The next block sees a new context
subtitle: Representations are refined layer by layer
visual: deep-layers
minutes: 1
---
The first block receives embeddings, the second receives the result of the first, and so on.

Depth allows you to build new features on top of already calculated connections.

<!-- notes -->

Don't assign strict human roles to layers. We can talk about an increase in the complexity of representations, but specific functions are distributed throughout the network and depend on the model.

===
---
id: residual-stream
track: bonus
section: Transformer depth
kicker: Bonus track · 27
title: Residual stream runs through the entire model
subtitle: Dozens of blocks read and modify a common data backbone
visual: deep-residual-stream
minutes: 1
---
A matrix of contextualized representations moves between the blocks.

Attention and MLP of each layer add their own changes to it.

<!-- notes -->

This circuit is more useful than a set of isolated boxes: it emphasizes that the original signals can be stored through many residual connections.

===
---
id: gpt3-scale-deep
track: bonus
section: Transformer scale
kicker: Bonus track · 28
title: GPT‑3 repeats the block 96 times
subtitle: Width 12,288, 96 attention heads, 175 billion parameters
visual: deep-gpt3-scale
minutes: 1
---
GPT-3 175B uses 96 Transformer blocks. In each block, attention and wide MLP work with a stream of width 12,288 [3].

<!-- notes -->

It's a return to scale after understanding the details. Now the 96 blocks are not abstract rectangles: the audience knows what calculations are repeated within each one.

===
---
id: logits
track: bonus
section: Transformer exit
kicker: Bonus track · 29
title: The last vector turns into logits
subtitle: One raw number for every token in the vocabulary
visual: deep-logits
minutes: 1
---
After the last block, a representation of the desired position is taken and projected onto the size of the dictionary.

Logits are not probabilities yet: they can be negative and do not have to sum to the unit [2].

<!-- notes -->

For the next token, we are interested in the last position of the current context. Output projection compares its state with all variants of the dictionary tokens.

===
---
id: probabilities
track: bonus
section: Transformer exit
kicker: Bonus track · 30
title: Logits become distribution
subtitle: Softmax and sampling parameters form the next step options
visual: deep-probabilities
minutes: 1
---
Softmax converts logits to probabilities. Temperature changes the sharpness of the distribution, and top‑k and top‑p can cut off the tail.

These options do not add to the knowledge model.

<!-- notes -->

Move temperature. With a low value, the leader dominates; with a high value, the probability is distributed over a larger number of candidates.

===
---
id: generation
track: bonus
section: Transformer generation
kicker: Bonus track · 31
title: The answer is generated one token at a time
subtitle: Probabilities → choice → new context → next step
visual: generation
minutes: 2
---
The model does not write the entire answer. It selects the next token, adds it to the sequence, and repeats the calculation.

Temperature affects random selection, so interactivity can actually give different continuations.

<!-- notes -->

The probabilities shown are illustrative and are not derived from a specific frontier model. The loop itself is precise: one next token per step. Therefore, a long answer is usually longer and more expensive than a short answer.

===
---
id: sampling-randomness
track: bonus
section: Transformer generation
kicker: Bonus track · 32
title: One prompt - several continuations
subtitle: Sampling selects an option from the distribution, rather than always taking the maximum
visual: deep-randomness
minutes: 1
---
The same context can generate different responses if sampling is not deterministic.

Seed captures the source of randomness, but changing the model or environment can still change the outcome.

<!-- notes -->

Greedy decoding always takes the most likely token. Sampling sometimes selects less likely options, which increases diversity and the risk of bias.

===
---
id: kv-cache
track: bonus
section: Transformer generation
kicker: Bonus track · 33
title: The old Key and Value can be saved
subtitle: KV cache speeds up each next generation step
visual: deep-kv-cache
minutes: 1
---
With autoregressive generation, the past K and V do not change. They are saved and reused, counting new vectors only for the fresh token [26].

<!-- notes -->

Without cache, the model would recalculate the same K and V of old positions at each step. Cache saves computation, but takes up memory and grows with the context.

===
---
id: context-cost
track: bonus
section: Transformer constraints
kicker: Bonus track · 34
title: Long context has a price
subtitle: Attention links positions, KV cache stores history
visual: deep-context-cost
minutes: 1
---
For full attention on a prefill, the number of potential connections grows approximately as `N²`, and the size of the KV cache grows linearly with the number of tokens.

Architectures and implementations optimize these costs, but do not make long context free [26][27].

<!-- notes -->

Don't turn the diagram into an exact cost calculator: real costs depend on the batch size, number of layers, heads, precision and the specific implementation of attention.

===
---
id: next-token-training
track: bonus
section: Transformer training
kicker: Bonus track · 35
title: Training
subtitle: At each position the model learns to predict the next element
visual: deep-training
minutes: 1
---
The training text is used both as input and as a set of target next tokens.

The error is calculated for all allowed positions, then the weights are updated via backpropagation [2][3].

<!-- notes -->

Show the shift of the lines: under “Masha” the correct goal becomes “set”, under “put” - “cup”. Causal mask does not allow you to see the target on the right in advance.

===
---
id: train-infer
track: bonus
section: Transformer training
kicker: Bonus track · 36
title: Training and inference go differently
subtitle: We learn in parallel from the finished text, generate sequentially
visual: deep-train-infer
minutes: 1
---
During training, the entire correct sequence is known, so losses of different positions are calculated in parallel.

On inference, the next pass depends on the token selected in the previous step.

<!-- notes -->

This explains the apparent paradox: Transformer is parallel, but text generation is still sequential. Parallelism exists within one pass through a known context.

===
---
id: attention-limits
track: bonus
section: Transformer · boundaries explained
kicker: Bonus track · 37
title: Attention map is not a decoding of thoughts
subtitle: Weights show the route of one mechanism, but not the entire causality of the model
visual: deep-attention-limits
minutes: 1
---
Attention weights are useful for exploring relationships between positions, but are not a complete explanation of a decision.

The result also depends on Values, MLP, residual stream, all other heads and [25] layers.

<!-- notes -->

Don't end the bonus track with a promise to read the model's thoughts using a beautiful heatmap. Attention is one of the internal mechanisms, and not a ready-made interpreter of behavior.

===
---
id: transformer-summary
track: bonus
section: Transformer · summary
kicker: Bonus track · 38
title: The full computation chain
visual: deep-summary
minutes: 1
---
Tokens become vectors, attention mixes the context, MLP transforms each position, blocks are repeated, logits give the distribution - and the loop creates one new token.

Transformer is complex in scale, but its route consists of clear, repeatable steps [2][3].

<!-- notes -->

The final circuit should go from left to right in one motion. If the audience understands where the next token came from and why the next step requires a new pass, the goal of the bonus route has been achieved.
