/**
 * NOVA-3D Academic Knowledge Core
 * Sub-millisecond verified academic repository designed for maximum speed & accuracy.
 * Created by student developers for students worldwide.
 */

const ACADEMIC_TOPICS = [
  {
    id: "calculus_derivatives",
    title: "Derivatives & Rate of Change",
    subject: "Mathematics",
    keywords: ["derivative", "rate of change", "slope", "calculus", "tangent", "differentiation", "power rule"],
    core: "A derivative measures the sensitivity to change of a function value with respect to a change in its argument. Geometrically, it is the exact slope of the tangent line to the function graph at any given point.",
    formulas: [
      "\\frac{df}{dx} = \\lim_{\\Delta x \\to 0} \\frac{f(x + \\Delta x) - f(x)}{\\Delta x}",
      "\\frac{d}{dx}[x^n] = n x^{n-1} \\quad \\text{(Power Rule)}",
      "\\frac{d}{dx}[u \\cdot v] = u'v + uv' \\quad \\text{(Product Rule)}",
      "\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x) \\quad \\text{(Chain Rule)}"
    ],
    steps: [
      "1. **Identify the Function Type**: Determine whether the function is polynomial, trigonometric, exponential, or a composite.",
      "2. **Decompose Composite Structures**: For nested functions like \\sin(3x^2), set the outer function u(v) and inner function v(x).",
      "3. **Differentiate Systematically**: Differentiate the outer function with respect to the inner, then multiply by the inner function's derivative.",
      "4. **Evaluate at the Point**: Substitute the target x-coordinate to find instantaneous velocity, acceleration, or slope."
    ],
    analogy: "Think of a road trip: your total distance divided by hours is your *average speed*. But the exact number showing on your speedometer at 2:14:03 PM is the *derivative*—the instantaneous rate of change right now.",
    pitfalls: "Students frequently confuse the derivative of \\frac{1}{x} (which is -x^{-2}) with \\ln(x). Also, forgetting to multiply by the inner derivative in Chain Rule problems is the #1 lost mark on AP & college calculus exams!",
    quiz: {
      question: "What is the derivative of f(x) = \\sin(4x) with respect to x?",
      options: ["\\cos(4x)", "4 \\cos(4x)", "-4 \\cos(4x)", "\\frac{1}{4} \\cos(4x)"],
      correct: 1,
      explanation: "By the Chain Rule: \\frac{d}{dx}[\\sin(u)] = \\cos(u) \\cdot u'. Here u = 4x, so u' = 4. Result: 4\\cos(4x)."
    },
    graph: { fn: "Math.sin(x)", label: "f(x) = sin(x)", color: "#38bdf8" }
  },
  {
    id: "calculus_integrals",
    title: "Definite & Indefinite Integrals",
    subject: "Mathematics",
    keywords: ["integral", "integration", "area under curve", "antiderivative", "riemann sum", "fundamental theorem"],
    core: "Integration is the continuous mathematical accumulation of discrete quantities, representing the signed area bounded between a curve and the horizontal axis. It serves as the inverse operation to differentiation.",
    formulas: [
      "\\int_{a}^{b} f(x) \\, dx = \\lim_{n \\to \\infty} \\sum_{i=1}^{n} f(x_i^*) \\Delta x = F(b) - F(a)",
      "\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C \\quad (n \\neq -1)",
      "\\int \\frac{1}{x} \\, dx = \\ln|x| + C"
    ],
    steps: [
      "1. **Antiderivative Search**: Find a primitive function F(x) such that F'(x) = f(x).",
      "2. **Apply Integration Techniques**: Use u-substitution for composite integrands, or Integration by Parts (\\int u \\, dv = uv - \\int v \\, du).",
      "3. **Compute Boundary Values**: For definite integrals, evaluate F(upper bound) - F(lower bound).",
      "4. **Add Integration Constant**: For indefinite integrals, always maintain the arbitrary constant + C."
    ],
    analogy: "If a leaky pipe drips water at varying rates each minute, differentiation tells you how fast it's dripping at this exact second; integration measures the total gallons of water that pooled up in the bucket over the whole night.",
    pitfalls: "Forgetting the absolute value signs in \\int \\frac{1}{x} dx = \\ln|x| + C, or forgetting to adjust the upper and lower integration limits when doing u-substitution.",
    quiz: {
      question: "Evaluate \\int_{0}^{2} 3x^2 \\, dx.",
      options: ["6", "8", "12", "16"],
      correct: 1,
      explanation: "The antiderivative of 3x^2 is x^3. Evaluating from 0 to 2 yields: 2^3 - 0^3 = 8."
    },
    graph: { fn: "x * x", label: "f(x) = x²", color: "#a855f7" }
  },
  {
    id: "linear_algebra_eigen",
    title: "Eigenvalues & Eigenvectors",
    subject: "Mathematics",
    keywords: ["eigenvalue", "eigenvector", "matrix", "linear algebra", "characteristic equation", "transformation", "pca"],
    core: "An eigenvector of a linear transformation is a non-zero vector that changes at most by a scalar factor (the eigenvalue) when that linear transformation is applied to it. In essence, it maintains its original spatial direction.",
    formulas: [
      "A \\mathbf{v} = \\lambda \\mathbf{v} \\iff (A - \\lambda I)\\mathbf{v} = \\mathbf{0}",
      "\\det(A - \\lambda I) = 0 \\quad \\text{(Characteristic Polynomial)}",
      "\\text{Trace}(A) = \\sum_{i} \\lambda_i, \\quad \\det(A) = \\prod_{i} \\lambda_i"
    ],
    steps: [
      "1. **Form the Characteristic Equation**: Construct the matrix (A - \\lambda I) and compute its determinant \\det(A - \\lambda I) = 0.",
      "2. **Solve for Eigenvalues (\\lambda)**: Find the roots of the resulting polynomial of degree n.",
      "3. **Find the Null Space**: For each eigenvalue \\lambda, substitute back into (A - \\lambda I)\\mathbf{v} = \\mathbf{0}.",
      "4. **Extract Basis Vectors**: Row-reduce to determine the non-trivial eigenvectors spanning the eigenspace."
    ],
    analogy: "Imagine stretching a square rubber sheet diagonally. Most arrows drawn on the rubber will rotate and change angle. But the arrows lying precisely along the diagonal stretch direction don't rotate at all—they just stretch longer. Those special arrows are the eigenvectors, and how much longer they stretch is the eigenvalue!",
    pitfalls: "Assuming all matrices have distinct real eigenvalues (many have repeated or complex eigenvalues), or forgetting that the zero vector \\mathbf{0} is strictly forbidden from being an eigenvector by definition.",
    quiz: {
      question: "If a 2x2 matrix has eigenvalues \\lambda_1 = 3 and \\lambda_2 = 5, what is its determinant?",
      options: ["8", "15", "2", "225"],
      correct: 1,
      explanation: "The determinant of any square matrix equals the product of its eigenvalues: \\det(A) = \\lambda_1 \\cdot \\lambda_2 = 3 \\cdot 5 = 15."
    }
  },
  {
    id: "physics_newton",
    title: "Newton's Laws of Classical Mechanics",
    subject: "Physics",
    keywords: ["newton", "force", "acceleration", "f=ma", "inertia", "gravity", "mechanics"],
    core: "Sir Isaac Newton's three laws of motion establish the classical relationship between physical bodies, forces acting upon them, and the resulting kinetic trajectories.",
    formulas: [
      "\\sum \\mathbf{F} = \\mathbf{0} \\implies \\mathbf{v} = \\text{const} \\quad \\text{(Inertia)}",
      "\\mathbf{F}_{\\text{net}} = m \\mathbf{a} = \\frac{d\\mathbf{p}}{dt} \\quad \\text{(Force = Mass \\times Acceleration)}",
      "\\mathbf{F}_{12} = -\\mathbf{F}_{21} \\quad \\text{(Action = Reaction)}"
    ],
    steps: [
      "1. **Free-Body Diagram (FBD)**: Isolate the target object and draw every external force vector acting on it (gravity, normal force, friction, tension).",
      "2. **Decompose Orthogonally**: Resolve vectors into perpendicular axes (typically x-axis along motion and y-axis perpendicular).",
      "3. **Apply \\sum F = ma**: Formulate \\sum F_x = m a_x and \\sum F_y = m a_y.",
      "4. **Solve System of Equations**: Compute acceleration, tension, or coefficient of friction."
    ],
    analogy: "A heavy bowling ball sitting on smooth ice won't move until you push it (1st Law). When you push it, the harder you push, the faster it speeds up, but if it were a massive boulder with 10x the mass, it would speed up 10x slower (2nd Law). And when your hand pushes the ball, you feel the ball pressing equally hard back into your palm (3rd Law).",
    pitfalls: "Action-reaction pairs **never** act on the same object! Gravitational pull on a book and the normal force from the desk are NOT an action-reaction pair (they happen to balance, but the reaction to Earth pulling the book is the book pulling Earth).",
    quiz: {
      question: "A 5 kg mass accelerates at 4 m/s² on a frictionless surface. What net force was applied?",
      options: ["1.25 N", "9.8 N", "20 N", "40 N"],
      correct: 2,
      explanation: "F = m * a = 5 kg * 4 m/s² = 20 Newtons."
    },
    graph: { fn: "4 * x", label: "v(t) = 4t", color: "#22c55e" }
  },
  {
    id: "physics_electromagnetism",
    title: "Maxwell's Equations & Electromagnetism",
    subject: "Physics",
    keywords: ["maxwell", "electromagnetism", "magnetic field", "electric field", "gauss", "faraday", "ampere", "light"],
    core: "Maxwell's four differential equations unify electricity, magnetism, and light into a single coherent classical field theory, demonstrating that light itself is a propagating transverse electromagnetic wave.",
    formulas: [
      "\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0} \\quad \\text{(Gauss's Law for Electricity)}",
      "\\nabla \\cdot \\mathbf{B} = 0 \\quad \\text{(Gauss's Law for Magnetism - No Monopoles)}",
      "\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t} \\quad \\text{(Faraday's Law of Induction)}",
      "\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t} \\quad \\text{(Ampere-Maxwell Law)}",
      "c = \\frac{1}{\\sqrt{\\mu_0 \\varepsilon_0}} \\approx 3 \\times 10^8 \\, \\text{m/s}"
    ],
    steps: [
      "1. **Electric Charges Produce Divergence**: Stationary charges create electric flux proportional to enclosed charge.",
      "2. **Continuous Magnetic Lines**: Magnetic field lines form closed loops with zero divergence; isolated magnetic monopoles do not exist.",
      "3. **Dynamic Induction**: A changing magnetic field curls an electric field into existence (powering generators and transformers).",
      "4. **Displacement Current**: A changing electric field produces a curling magnetic field, allowing electromagnetic waves to travel through the vacuum of space at the speed of light c."
    ],
    analogy: "Electricity and magnetism are two dance partners passing a ball back and forth: an oscillating electric field sparks a magnetic field, which immediately collapses to regenerate the electric field. This endless leapfrog through empty space is what we call sunlight!",
    pitfalls: "Students often forget Maxwell's addition to Ampere's Law: the \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t} displacement current term. Without this term, electromagnetic radiation could not self-propagate in a vacuum!",
    quiz: {
      question: "Which equation proves that isolated magnetic monopoles have never been observed?",
      options: ["\\nabla \\cdot \\mathbf{E} = \\rho / \\varepsilon_0", "\\nabla \\cdot \\mathbf{B} = 0", "\\nabla \\times \\mathbf{E} = -\\partial B / \\partial t", "V = IR"],
      correct: 1,
      explanation: "\\nabla \\cdot \\mathbf{B} = 0 (divergence of B is zero) states that magnetic field lines never originate or terminate on single magnetic charges; they always form closed loops."
    }
  },
  {
    id: "cs_quicksort",
    title: "QuickSort & Divide-and-Conquer Analysis",
    subject: "Computer Science",
    keywords: ["quicksort", "sorting", "algorithm", "divide and conquer", "pivot", "big o", "complexity"],
    core: "QuickSort is a cache-friendly, comparison-based sorting algorithm that operates in-place. It partitions an array around a chosen pivot element such that all smaller values precede the pivot and all larger values follow it, recurring on sub-arrays.",
    formulas: [
      "T(n) = 2T(n/2) + O(n) \\implies O(n \\log n) \\quad \\text{(Average / Best Case)}",
      "T(n) = T(n-1) + O(n) \\implies O(n^2) \\quad \\text{(Worst Case)}",
      "\\text{Auxiliary Space: } O(\\log n) \\quad \\text{(Stack depth with tail-call optimization)}"
    ],
    steps: [
      "1. **Pivot Selection**: Select an element using Lomuto, Hoare, or Median-of-Three sampling to minimize imbalance.",
      "2. **Two-Pointer Partition**: Scan from both ends; swap inverted elements until pointers cross.",
      "3. **Pivot Placement**: Place the pivot at its exact sorted terminal index in O(n) time.",
      "4. **Divide & Conquer**: Recursively sort the left sub-array and right sub-array independently."
    ],
    analogy: "Imagine organizing students by height: pick one student in the middle. Everyone shorter runs to the left side of the gym; everyone taller runs to the right. That chosen student is now permanently in their correct spot forever! Now repeat the same game with the left and right groups.",
    pitfalls: "Never pick the first or last element as the pivot in production code! If the input list is already sorted, picking the first element creates recursive stacks of depth n, leading to catastrophic O(n^2) runtime and call-stack overflow.",
    quiz: {
      question: "What is the average time complexity of QuickSort on an array of length n?",
      options: ["O(n)", "O(n log n)", "O(n^2)", "O(2^n)"],
      correct: 1,
      explanation: "On average, each partitioning step halves the problem size, yielding a recursion tree of height log n with O(n) work per level, totaling O(n log n)."
    }
  },
  {
    id: "cs_neural_networks",
    title: "Neural Networks & Backpropagation",
    subject: "Computer Science / AI",
    keywords: ["neural network", "backpropagation", "gradient descent", "deep learning", "activation function", "weights", "biases"],
    core: "Artificial neural networks are universal function approximators composed of interconnected layers of artificial neurons. They learn parameters (weights W and biases b) by minimizing a loss function via stochastic gradient descent and reverse-mode automatic differentiation (backpropagation).",
    formulas: [
      "\\mathbf{z}^{[l]} = W^{[l]} \\mathbf{a}^{[l-1]} + \\mathbf{b}^{[l]}, \\quad \\mathbf{a}^{[l]} = \\sigma(\\mathbf{z}^{[l]})",
      "\\mathcal{L}(y, \\hat{y}) = -\\left[ y \\log(\\hat{y}) + (1-y)\\log(1-\\hat{y}) \\right] \\quad \\text{(Cross-Entropy)}",
      "\\frac{\\partial \\mathcal{L}}{\\partial W^{[l]}} = \\frac{\\partial \\mathcal{L}}{\\partial \\mathbf{z}^{[l]}} (\\mathbf{a}^{[l-1]})^T \\quad \\text{(Chain Rule of Calculus)}",
      "W := W - \\alpha \\frac{\\partial \\mathcal{L}}{\\partial W} \\quad \\text{(Weight Update)}"
    ],
    steps: [
      "1. **Forward Pass**: Feed inputs through each layer with matrix multiplication and non-linear activation (ReLU, GELU, Sigmoid).",
      "2. **Loss Computation**: Measure the discrepancy between predictions and ground-truth targets.",
      "3. **Backward Pass (Backprop)**: Propagate gradients backward from the output layer through each neuron using the multivariable chain rule.",
      "4. **Optimizer Step**: Update weights against the gradient vector scaled by learning rate \\alpha."
    ],
    analogy: "Think of a soundboard with thousands of volume knobs. A song plays, but the bass is too loud and distorted. Backpropagation is like having a supervisor listen to the distortion, calculate exactly how much each specific knob contributed to the mistake, and nudge each knob slightly in the right direction until the music sounds perfect.",
    pitfalls: "Vanishing and exploding gradients! In deep architectures with Sigmoid activations, derivatives become tiny (< 0.25), causing early layers to stop learning completely. Using ReLU/LeakyReLU, LayerNorm, and Residual Connections (ResNets) solves this.",
    quiz: {
      question: "Which mathematical rule powers the backpropagation algorithm?",
      options: ["Pythagorean Theorem", "Chain Rule of Calculus", "L'Hôpital's Rule", "Bayes' Rule"],
      correct: 1,
      explanation: "Backpropagation is simply the recursive application of the multivariable Chain Rule of Calculus to compute partial derivatives of loss with respect to all internal network weights."
    }
  },
  {
    id: "bio_dna_replication",
    title: "DNA Replication & Semiconservative Synthesis",
    subject: "Biology",
    keywords: ["dna", "replication", "helicase", "polymerase", "okazaki", "double helix", "adenine", "thymine", "genetics"],
    core: "DNA replication is the semiconservative biochemical process by which an organism duplicates its genetic code prior to cell division, producing two identical DNA molecules each comprising one conserved parental strand and one newly synthesized daughter strand.",
    formulas: [
      "\\text{Chargaff's Rule: } [A] = [T] \\quad (2 \\text{ H-bonds}), \\quad [G] = [C] \\quad (3 \\text{ H-bonds})",
      "5' \\to 3' \\text{ Direction of Nucleic Acid Polymerization}"
    ],
    steps: [
      "1. **Helicase Unzipping**: Helicase hydrolyzes ATP to separate complementary base pairs at replication origins.",
      "2. **RNA Priming**: Primase synthesizes RNA primers, providing the required 3'-OH anchor for DNA Polymerase.",
      "3. **Leading vs Lagging Strand**: The leading strand elongates continuously toward the fork; the lagging strand is built discontinuously in Okazaki fragments.",
      "4. **Ligation**: Exonuclease replaces RNA primers with DNA, and DNA Ligase seals the phosphodiester nicks."
    ],
    analogy: "Imagine an architectural master blueprint that cannot leave the office vault. Workers unbolt the two pages (Helicase), clamp down carbon paper (Primers), trace along the lines (Polymerase), and tape the finished sheets together (Ligase) so each of two job sites gets an exact blueprint copy.",
    pitfalls: "A classic misconception is that DNA Polymerase can synthesize from scratch without a primer. It **strictly requires** an existing 3'-OH group to attach the next incoming deoxynucleotide!",
    quiz: {
      question: "Why is the lagging DNA strand synthesized discontinuously in Okazaki fragments?",
      options: [
        "DNA Polymerase can only synthesize in the 5' to 3' direction",
        "Helicase only unzips half the DNA at a time",
        "RNA primers can only bind to thymine bases",
        "Ligase runs out of ATP"
      ],
      correct: 0,
      explanation: "Because the two DNA strands run antiparallel (5' to 3' and 3' to 5') and DNA Polymerase can only add nucleotides in the 5' to 3' direction, the lagging strand must be synthesized backward in discontinuous bursts as the fork opens."
    }
  },
  {
    id: "chem_thermodynamics",
    title: "Gibbs Free Energy & Reaction Spontaneity",
    subject: "Chemistry",
    keywords: ["gibbs", "free energy", "enthalpy", "entropy", "spontaneous", "exothermic", "endothermic", "thermodynamics"],
    core: "Gibbs Free Energy (\\Delta G) predicts whether a chemical or physical transformation will occur spontaneously at constant temperature and pressure by balancing enthalpy (heat changes) against entropy (dispersion of energy).",
    formulas: [
      "\\Delta G = \\Delta H - T \\Delta S",
      "\\Delta G < 0 \\implies \\text{Spontaneous (Exergonic)}",
      "\\Delta G = 0 \\implies \\text{Dynamic Equilibrium}",
      "\\Delta G > 0 \\implies \\text{Non-Spontaneous (Endergonic)}",
      "\\Delta G^\\circ = -RT \\ln(K_{\\text{eq}})"
    ],
    steps: [
      "1. **Calculate Enthalpy (\\Delta H)**: Determine whether the reaction releases heat (\\Delta H < 0, exothermic) or absorbs heat (\\Delta H > 0, endothermic).",
      "2. **Calculate Entropy (\\Delta S)**: Determine if disorder/microstates increase (\\Delta S > 0) or decrease (\\Delta S < 0).",
      "3. **Incorporate Absolute Temperature (T in Kelvin)**: Scale \\Delta S by T in Kelvin.",
      "4. **Evaluate \\Delta G**: If \\Delta H - T\\Delta S < 0, the reaction proceeds forward spontaneously without continuous external energy input."
    ],
    analogy: "Enthalpy is like money in your wallet (nature prefers spending energy to relax), and Entropy is like your dorm room's natural tendency to get messy without cleaning. If a reaction gives off heat and creates a glorious mess, the universe lets it happen instantly with zero resistance (\\Delta G < 0)!",
    pitfalls: "Spontaneous does **NOT** mean fast! A reaction can have a hugely negative \\Delta G (like diamond transforming into graphite), but take billions of years because of an immense kinetic activation energy barrier ($E_a$).",
    quiz: {
      question: "If a reaction has \\Delta H > 0 (endothermic) and \\Delta S > 0 (entropy increases), under what conditions is it spontaneous?",
      options: ["At all temperatures", "Only at high temperatures where T*\\Delta S > \\Delta H", "Only at low temperatures", "Never spontaneous"],
      correct: 1,
      explanation: "Since \\Delta G = \\Delta H - T\\Delta S, when both terms are positive, \\Delta G only becomes negative when the temperature T is high enough that T*\\Delta S surpasses \\Delta H."
    }
  },
  {
    id: "study_feynman",
    title: "The Feynman Technique & Active Recall",
    subject: "Study Strategy",
    keywords: ["feynman", "study", "active recall", "spaced repetition", "learning", "exam", "memory", "revision"],
    core: "The Feynman Technique is a mental learning model formulated by Nobel laureate physicist Richard Feynman. It asserts that true understanding of any topic is proven when you can explain it simply and intuitively to a complete novice without using technical jargon.",
    formulas: [
      "R = e^{-t / S} \\quad \\text{(Ebbinghaus Forgetting Curve: Retention decays exponentially without recall)}",
      "\\text{Mastery} = \\text{Simplicity} \\times \\text{Analogy} \\times \\text{Zero Jargon}"
    ],
    steps: [
      "1. **Choose a Target Concept**: Write the concept at the top of a blank page.",
      "2. **Explain to a 12-Year-Old**: Write an explanation using simple language, everyday analogies, and clear diagrams. Avoid copying textbook phrases.",
      "3. **Identify Gaps & Bottlenecks**: When you get stuck or resort to buzzwords, stop! That is your blind spot.",
      "4. **Targeted Review & Refine**: Return to primary sources to re-learn that specific gap, then simplify your explanation until it flows effortlessly."
    ],
    analogy: "If you can't teach a dog to fetch a stick, you don't know where the stick is. If you have to hide behind complicated $10 words to explain how a battery works, you don't actually understand how the battery works—you just memorized the textbook glossary.",
    pitfalls: "The 'Illusion of Competence': Re-reading notes or highlighting text creates false familiarity. Your brain recognizes the words, but cannot generate them independently on an exam. Always test yourself with **closed-book active recall**!",
    quiz: {
      question: "According to cognitive science, which revision technique yields the highest long-term retention?",
      options: [
        "Re-reading highlighted textbook chapters multiple times",
        "Active recall and spaced testing without looking at notes",
        "Cramming 8 hours the night before the exam",
        "Listening to lectures passively while sleeping"
      ],
      correct: 1,
      explanation: "Active recall forces the brain to retrieve information from neural pathways, which strengthens synaptic connections far more than passive re-reading."
    }
  }
];

/**
 * High-speed topic finder (< 2ms lookup)
 */
function findAcademicTopic(query) {
  if (!query || typeof query !== "string") return null;
  const q = query.toLowerCase().trim();

  // 1. Direct ID or title match
  for (const topic of ACADEMIC_TOPICS) {
    if (q === topic.id || q === topic.title.toLowerCase()) return topic;
  }

  // 2. Keyword exact match
  for (const topic of ACADEMIC_TOPICS) {
    for (const kw of topic.keywords) {
      if (q.includes(kw)) {
        return topic;
      }
    }
  }

  // 3. Substring scoring match
  let bestMatch = null;
  let highestScore = 0;

  for (const topic of ACADEMIC_TOPICS) {
    let score = 0;
    const words = q.split(/\s+/);
    for (const word of words) {
      if (word.length < 3) continue;
      if (topic.title.toLowerCase().includes(word)) score += 3;
      if (topic.core.toLowerCase().includes(word)) score += 1;
      for (const kw of topic.keywords) {
        if (kw.includes(word)) score += 2;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = topic;
    }
  }

  if (highestScore >= 3) return bestMatch;
  return null;
}

// Export to window
window.ACADEMIC_TOPICS = ACADEMIC_TOPICS;
window.findAcademicTopic = findAcademicTopic;
