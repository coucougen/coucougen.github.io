# CouCouGen: Coupled Counters as a Source of Deterministic Sequences

**Ivan Petrov** — Independent Research — June 2026  
*Version: 1.2.0 (revised, bilingual)*
*License: MIT (code) · CC BY-NC 4.0 (text)*

---

## English Version

### Preliminary Note

This work documents an experimental approach to deterministic sequence generation based on three coupled additive counters. The algorithm has been implemented and empirically tested. While certain structural properties (bijectivity, uniformity over the full cycle) can be established analytically, the period conjecture remains unproven. Independent verification of all claims is strongly encouraged.

---

### Abstract

This paper introduces a deterministic sequence generator based on three coupled 32-bit counters with nonlinear feedback. The construction is described as a mapping on the ring Z_{2^32}^3. It is shown that the transition function is a bijection, which implies the absence of transient states and guarantees uniform output distribution over the complete cycle if the cycle is maximal. Empirical testing with the Dieharder suite reveals that the generator passes tests of basic uniformity, runs, and spherical distributions but fails tests of bit independence and matrix rank. These results position CouCouGen as a "random enough" generator for non-critical applications such as games and visualizations, while highlighting open questions about the feasibility of coupled counters as a PRNG class.

---

### 1. Introduction

Pseudorandom number generators (PRNGs) are deterministic algorithms that produce sequences approximating true randomness. Classical constructions include linear congruential generators (LCGs), Xorshift, Mersenne Twister, and PCG. Most rely on linear recurrences in finite fields or rings, with nonlinearity introduced via output mixing.

This paper explores an alternative approach: **coupled additive counters**. The core idea is to maintain three independent 32-bit counters, each incremented by a value that depends on the high bits of another counter. The increments are forced to be odd to prevent stalling. This creates a system where each counter evolves with a variable step size determined by the current state of its neighbor.

The name *CouCouGen* (from French *coucou* — cuckoo) reflects the way counters "call" to each other in a coupled dance.

---

### 2. Formal Definition

#### 2.1 State Space and Transition

Let M = 2^32. The state space is S = (Z_M)^3. For a state (a, b, c) in S, the transition function Phi: S -> S is defined as:

a' = a + ((b >> 3) | 1)   (mod M)
b' = b + ((c >> 5) | 1)   (mod M)
c' = c + ((a' >> 7) | 1)  (mod M)

where:
- ">> k" denotes unsigned right shift by k bits,
- "| 1" denotes bitwise OR with 1 (ensuring the increment is odd),
- all arithmetic is performed modulo 2^32 with wrap-around.

**Important note:** The update for c' uses the *already updated* a', not the old a. This sequential dependency is intentional and affects the statistical properties of the generator.

#### 2.2 Seeding

The initial state is derived from a 32-bit seed s:

a0 = A XOR s
b0 = B XOR (s << 13)
c0 = C XOR (s >> 17)

with constants:
- A = 123456789 (arbitrary non-zero),
- B = 2654435761 = floor(2^32 / phi) (golden ratio),
- C = 3462531671 = floor(2^32 / sqrt(2)).

#### 2.3 Output Function

Given a state (a', b', c'), the output is:

t = (a' XOR (b' << 7)) + c'   (mod M)
output = (t * 1103515245 + 12345)   (mod M)

The final multiplication and addition constitute a PCG-style mixer intended to destroy low-order correlations.

---

### 3. Analytical Results

#### 3.1 Bijectivity (Established)

**Theorem 1.** The mapping Phi: S -> S is a bijection.

*Proof.* We construct the inverse explicitly. Given (a', b', c'), compute:

c = c' - ((a' >> 7) | 1)   (mod M)
b = b' - ((c >> 5) | 1)   (mod M)
a = a' - ((b >> 3) | 1)   (mod M)

All operations are invertible modulo M because subtraction is the inverse of addition, and the quantities ((...>>...)|1) are deterministic functions of the already recovered components. Therefore, for every (a',b',c') there exists exactly one (a,b,c). Hence Phi is bijective. 

**Corollary 1.** |S| = 2^96. Since Phi is a bijection, the state space partitions into disjoint cycles with no transient states.

#### 3.2 Uniformity Over a Cycle (Established)

**Theorem 2.** For any full cycle of Phi (i.e., a cycle containing all 2^96 states), the output values are uniformly distributed over Z_M: each value appears exactly M^2 = 2^64 times.

*Proof.* Consider any fixed b' and c'. The equation y = (a' XOR (b' << 7)) + c' (mod M) can be rewritten as a' XOR (b' << 7) = y - c' (mod M). The XOR with a fixed value (b' << 7) is a bijection on Z_M. Hence for each pair (b', c') and each output y, there is exactly one a' that satisfies the equation. Consequently, the preimage of any output value y has size M^2, because b' and c' can be chosen arbitrarily (M choices each). Over a full cycle covering all 2^96 states, each y appears exactly M^2 times. 

**Corollary 2.** If the period is maximal (2^96), the output is perfectly uniform.

#### 3.3 Period (Open Conjecture)

**Conjecture (Unproven).** For any initial state, the period of CouCouGen is 2^96.

*Plausibility argument.* All increments are odd. After T steps, each counter receives a sum of T odd numbers, which is congruent to T (mod 2). For the total increment to be divisible by M = 2^32, T must be even. By induction modulo 4, 8, ..., 2^32, T must be a multiple of 2^32. Write T = 2^32 * k with k < 2^64. Empirical search (up to 2^40 steps) has found no smaller cycle. However, a rigorous algebraic proof is lacking due to the nonlinearity of the increments — the system cannot be represented as a linear transformation over any ring.

**Open question:** Does there exist a seed for which the cycle length is shorter than 2^96? This remains unresolved.

#### 3.4 Why Bit-Level Tests Fail: An Algebraic Insight

The Dieharder results show catastrophic failures in rank_32x32, rank_6x8, bitstream, and count-of-1s tests. To understand why, consider the update of the least significant bits (LSBs).

Let a0, b0, c0 denote the LSBs of a, b, c (i.e., the values modulo 2). Because the increments ((b>>3)|1), ((c>>5)|1), ((a'>>7)|1) are all odd, their LSB is always 1. Therefore:

a' mod 2 = (a + 1) mod 2 = NOT a
b' mod 2 = (b + 1) mod 2 = NOT b
c' mod 2 = (c + 1) mod 2 = NOT c

Thus, the LSBs of the three counters simply **flip on every iteration** and are perfectly correlated. After each step, (a,b,c) mod 2 = (NOT a, NOT b, NOT c). This means the parity vector oscillates deterministically and never explores more than 2 states (all even or all odd). This extreme bias in the lowest bit propagates to higher bits through the carries in addition, creating linear dependencies that are detected by rank tests.

In contrast, a statistically sound generator would require the LSBs to behave like independent fair coin flips. The forced odd increment guarantees the opposite.

#### 3.5 The Mixer Cannot Rescue Bit Correlations

The final mixer (t * 1103515245 + 12345) is a linear congruential generator (LCG)-style transformation. While it scrambles bits to some extent, it cannot eliminate correlations that are **additive** in nature. If the input bits satisfy linear relations over GF(2), the output after an affine transformation may still satisfy other linear relations — possibly of higher degree, but still detectable by matrix rank tests. The Dieharder results confirm that the LCG mixer is insufficient.

---

### 4. Empirical Testing with Dieharder

#### 4.1 Methodology

The generator was tested using the Dieharder suite on a stream of 100 million 32-bit integers (400 MB). The seed was fixed at 12345. Input format: raw binary, little-endian.

#### 4.2 Results Summary

Tests that **PASSED** (p-value > 0.05 and not extreme):
- diehard_operm5
- diehard_parking_lot
- diehard_2dsphere, diehard_3dsphere
- diehard_squeeze
- diehard_sums
- diehard_runs
- diehard_craps

Tests that **FAILED** (p-value = 0.00000000):
- diehard_birthdays
- diehard_rank_32x32
- diehard_rank_6x8
- diehard_bitstream
- diehard_opso, diehard_oqso, diehard_dna
- diehard_count_1s_str, diehard_count_1s_byt

#### 4.3 Practical Implications

| Use Case | Suitability | Reason |
|----------|-------------|--------|
| Games (positions, rotations, item selection) | Good | Full 32-bit integers, correlations invisible to players |
| Visualizations / art | Good | Human perception tolerates bit-level noise |
| Procedural generation (full integers) | Good | Works for landscape, object placement |
| Shuffling arrays | Good | Uniformity over 32-bit range sufficient |
| Bit-level operations (value & 1, bit masks) | Caution | LSBs are deterministic (alternating) |
| Monte Carlo simulations | Avoid | Requires bit independence |
| Matrix / linear algebra | Avoid | Rank tests show linear dependencies |
| Cryptography / security | Never | Not designed |

---

### 5. Open Research Questions and Future Work

The coupled counters paradigm is underexplored. The following questions remain open and could lead to new, statistically sound generators.

**Q1. Parallel vs. sequential coupling.** Would updating all counters from the *previous* state (a_new = a + f(b), b_new = b + g(c), c_new = c + h(a), all using old a,b,c) improve bit independence? The LSB problem would persist because increments are still odd, but higher-bit correlations might change.

**Q2. Varying the shift amounts.** The constants (3,5,7) were chosen arbitrarily. Do other shift triples produce better or worse statistical properties? A systematic search over the space (i,j,k) with 1 <= i,j,k <= 31 could reveal optimal parameters.

**Q3. Stronger output mixers.** Can a non-linear mixer such as the finalizer from SplitMix64 (t ^ (t>>31) * 0x85ebca6b, etc.) salvage the generator? The current LCG mixer is provably weak against rank tests.

**Q4. Higher-dimensional coupling.** Would four or more counters reduce the linear dependencies? With n counters, the state space size becomes 2^(32n). The LSBs would still flip every step, but the constraints might become less severe.

**Q5. Algebraic characterisation over GF(2).** Is it possible to find a polynomial representation of the transition function over the field GF(2) of degree > 1? This would allow period analysis using algebraic geometry.

**Q6. Alternative increment design.** Instead of forcing the increment to be odd by OR with 1, one could use a different nonlinear function (e.g., ((b>>3) ^ (b>>5)) | 1, or a small S-box). This might break the LSB alternation.

**Q7. Period proof or counterexample.** The most urgent open problem: find a rigorous lower bound for the period, or exhibit a seed that yields a short cycle.

---

### 6. Conclusion

CouCouGen represents an experimental foray into coupled additive counters as a source of deterministic sequences. The generator is bijective, which guarantees no transient states and uniform output over any full cycle. However, empirical testing with Dieharder reveals systematic failures in bit-level tests, primarily caused by the forced odd increment that makes all least significant bits flip deterministically.

For non-critical applications — indie games, visualizations, prototyping, education — CouCouGen provides a lightweight, seedable, and "random enough" sequence generator. For applications requiring statistical perfection (cryptography, Monte Carlo, matrix operations), established generators (xoshiro128+, SplitMix64) are strongly recommended.

The broader class of coupled counters remains underexplored and offers rich ground for future research. The open questions listed above could lead to new, statistically robust PRNGs.

**Final assessment:** A beautiful idea with mathematical elegance, statistically insufficient for rigorous applications, but practically useful in its intended niche.

---

### 7. Code and Availability

The reference implementation in JavaScript (MIT license) is available at:
- GitHub: https://github.com/coucougen/coucougen.github.io
- Live demo: https://coucougen.github.io

The generator exports a single function `CouCouGen(seed)` that returns 32-bit unsigned integers.

---

### 8. References

1. Knuth, D.E. *The Art of Computer Programming, Vol. 2: Seminumerical Algorithms*. Addison-Wesley, 3rd ed., 1997.
2. L'Ecuyer, P. *Tables of Linear Congruential Generators of Different Sizes and Good Lattice Structure*. Mathematics of Computation, 1999.
3. Marsaglia, G. *Xorshift RNGs*. Journal of Statistical Software, Vol. 8, 2003.
4. Matsumoto, M., Nishimura, T. *Mersenne Twister: A 623-dimensionally equidistributed uniform pseudorandom number generator*. ACM Trans. Model. Comput. Simul., 1998.
5. O'Neill, M.E. *PCG: A Family of Simple Fast Space-Efficient Statistically Good Algorithms for Random Number Generation*. Harvey Mudd College, 2014.
6. Brown, R.G., Eddelbuettel, D., Bauer, D. *Dieharder: A Random Number Test Suite*. Version 3.31.1.

---

**Author:** Ivan Petrov — Independent researcher, programming enthusiast, hobbyist mathematician. No academic affiliation. This work was conducted in personal time and reflects the author's best effort, not institutional endorsement.

---

## Русская версия

### Предварительное замечание

Эта работа документирует экспериментальный подход к генерации детерминированных последовательностей на основе трёх связанных аддитивных счётчиков. Алгоритм реализован и эмпирически протестирован. Хотя некоторые структурные свойства (биективность, равномерность распределения на полном цикле) могут быть установлены аналитически, гипотеза о периоде остаётся недоказанной. Независимая проверка всех утверждений настоятельно рекомендуется.

---

### Аннотация

В этой работе представлен детерминированный генератор последовательностей на основе трёх связанных 32-битных счётчиков с нелинейной обратной связью. Конструкция описана как отображение на кольце Z_{2^32}^3. Показано, что функция перехода является биекцией, что гарантирует отсутствие транзиентных состояний и равномерное распределение выходных значений на полном цикле (если цикл максимален). Эмпирическое тестирование с помощью набора Dieharder показывает, что генератор проходит тесты на базовую равномерность, runs и сферические распределения, но проваливает тесты на независимость битов и ранг матриц. Эти результаты позиционируют CouCouGen как генератор, "достаточно случайный" для некритичных приложений (игры, визуализации), одновременно высвечивая открытые вопросы о принципиальной возможности использования связанных счётчиков в качестве класса ГПСЧ.

---

### 1. Введение

Генераторы псевдослучайных чисел (ГПСЧ) — это детерминированные алгоритмы, порождающие последовательности, приближающие истинную случайность. Классические конструкции включают линейные конгруэнтные генераторы (LCG), Xorshift, вихрь Мерсенна и PCG. Большинство из них основаны на линейных рекуррентах в конечных полях или кольцах, а нелинейность вносится на этапе выходного перемешивания.

В этой работе исследуется альтернативный подход: **связанные аддитивные счётчики**. Основная идея — поддерживать три независимых 32-битных счётчика, каждый из которых инкрементируется на величину, зависящую от старших битов другого счётчика. Приращения принудительно делаются нечётными, чтобы предотвратить остановку счётчика. Это создаёт систему, где каждый счётчик эволюционирует с переменным шагом, определяемым текущим состоянием соседа.

Название *CouCouGen* (от французского *coucou* — кукушка) отражает то, как счётчики «перекликаются» друг с другом в связанном танце.

---

### 2. Формальное определение

#### 2.1 Пространство состояний и переход

Пусть M = 2^32. Пространство состояний S = (Z_M)^3. Для состояния (a, b, c) из S определим функцию перехода Phi: S -> S:

a' = a + ((b >> 3) | 1)   (mod M)
b' = b + ((c >> 5) | 1)   (mod M)
c' = c + ((a' >> 7) | 1)  (mod M)

где:
- ">> k" — беззнаковый сдвиг вправо на k бит,
- "| 1" — побитовое ИЛИ с 1 (гарантирует нечётность приращения),
- вся арифметика выполняется по модулю 2^32 с автоматическим переполнением.

**Важное замечание:** Обновление c' использует *уже обновлённое* a', а не старое a. Эта последовательная зависимость является намеренной и влияет на статистические свойства генератора.

#### 2.2 Инициализация (seed)

Начальное состояние выводится из 32-битного seed s:

a0 = A XOR s
b0 = B XOR (s << 13)
c0 = C XOR (s >> 17)

с константами:
- A = 123456789 (произвольное ненулевое значение),
- B = 2654435761 = floor(2^32 / phi) (золотое сечение),
- C = 3462531671 = floor(2^32 / sqrt(2)).

#### 2.3 Выходная функция

Для состояния (a', b', c') выходное значение вычисляется как:

t = (a' XOR (b' << 7)) + c'   (mod M)
output = (t * 1103515245 + 12345)   (mod M)

Финальные умножение и сложение образуют перемешиватель в стиле PCG, предназначенный для разрушения низкопорядковых корреляций.

---

### 3. Аналитические результаты

#### 3.1 Биективность (установлено)

**Теорема 1.** Отображение Phi: S -> S является биекцией.

*Доказательство.* Построим обратное отображение явно. Пусть даны (a', b', c'). Вычисляем:

c = c' - ((a' >> 7) | 1)   (mod M)
b = b' - ((c >> 5) | 1)   (mod M)
a = a' - ((b >> 3) | 1)   (mod M)

Все операции обратимы по модулю M, поскольку вычитание — обратная операция к сложению, а величины ((...>>...)|1) являются детерминированными функциями уже восстановленных компонент. Следовательно, для каждого (a',b',c') существует ровно одно (a,b,c). Таким образом, Phi — биекция. 

**Следствие 1.** |S| = 2^96. Поскольку Phi биективна, пространство состояний разбивается на непересекающиеся циклы без транзиентных состояний.

#### 3.2 Равномерность распределения на цикле (установлено)

**Теорема 2.** Для любого полного цикла Phi (т.е. цикла, содержащего все 2^96 состояний) выходные значения равномерно распределены на Z_M: каждое значение появляется ровно M^2 = 2^64 раз.

*Доказательство.* Рассмотрим произвольные фиксированные b' и c'. Уравнение y = (a' XOR (b' << 7)) + c' (mod M) можно переписать как a' XOR (b' << 7) = y - c' (mod M). XOR с фиксированной величиной (b' << 7) является биекцией на Z_M. Следовательно, для каждой пары (b', c') и каждого выходного значения y существует ровно одно a', удовлетворяющее уравнению. Следовательно, прообраз любого y имеет размер M^2, поскольку b' и c' можно выбирать произвольно (M вариантов каждый). На полном цикле, покрывающем все 2^96 состояний, каждое y появляется ровно M^2 раз. 

**Следствие 2.** Если период максимален (2^96), выходные значения идеально равномерны.

#### 3.3 Период (открытая гипотеза)

**Гипотеза (не доказана).** Для любого начального состояния период CouCouGen равен 2^96.

*Правдоподобное рассуждение.* Все приращения нечётны. Через T шагов каждый счётчик получает сумму T нечётных чисел, которая сравнима с T (mod 2). Чтобы общее приращение делилось на M = 2^32, T должно быть чётным. По индукции по модулям 4, 8, ..., 2^32, T должно быть кратно 2^32. Запишем T = 2^32 * k с k < 2^64. Эмпирический поиск (до 2^40 шагов) не обнаружил более коротких циклов. Однако строгое алгебраическое доказательство отсутствует из-за нелинейности приращений — система не может быть представлена как линейное преобразование ни над каким кольцом.

**Открытый вопрос:** Существует ли seed, для которого длина цикла меньше 2^96? Это остаётся нерешённым.

#### 3.4 Почему проваливаются битовые тесты: алгебраическое объяснение

Результаты Dieharder показывают катастрофические провалы в тестах rank_32x32, rank_6x8, bitstream и count-of-1s. Чтобы понять почему, рассмотрим обновление младших битов (LSB).

Пусть a0, b0, c0 обозначают младшие биты a, b, c (т.е. значения по модулю 2). Поскольку приращения ((b>>3)|1), ((c>>5)|1), ((a'>>7)|1) нечётны, их младший бит всегда равен 1. Следовательно:

a' mod 2 = (a + 1) mod 2 = NOT a
b' mod 2 = (b + 1) mod 2 = NOT b
c' mod 2 = (c + 1) mod 2 = NOT c

Таким образом, младшие биты всех трёх счётчиков **просто переключаются на каждой итерации** и идеально коррелированы. После каждого шага (a,b,c) mod 2 = (NOT a, NOT b, NOT c). Это означает, что вектор чётности детерминированно колеблется и никогда не исследует более 2 состояний (все чётные или все нечётные). Это крайнее смещение в младшем бите распространяется на старшие биты через переносы при сложении, создавая линейные зависимости, которые обнаруживаются ранговыми тестами.

Напротив, статистически качественный генератор требует, чтобы младшие биты вели себя как независимые подбрасывания монетки. Принудительно нечётное приращение гарантирует противоположное.

#### 3.5 Перемешиватель не может исправить битовые корреляции

Финальный перемешиватель (t * 1103515245 + 12345) представляет собой преобразование в стиле линейного конгруэнтного генератора (LCG). Хотя он в некоторой степени перемешивает биты, он не может устранить корреляции, имеющие **аддитивную** природу. Если входные биты удовлетворяют линейным соотношениям над GF(2), выход после аффинного преобразования может по-прежнему удовлетворять другим линейным соотношениям — возможно, более высокой степени, но всё ещё обнаруживаемым ранговыми тестами. Результаты Dieharder подтверждают, что LCG-перемешиватель недостаточен.

---

### 4. Эмпирическое тестирование с Dieharder

#### 4.1 Методология

Генератор был протестирован с помощью набора Dieharder (версия 3.31.1) на потоке из 100 миллионов 32-битных целых чисел (400 МБ). Seed был фиксирован: 12345. Формат входных данных: сырой двоичный, little-endian.

#### 4.2 Сводка результатов

Тесты, которые **ПРОЙДЕНЫ** (p-value > 0.05 и не экстремальный):
- diehard_operm5
- diehard_parking_lot
- diehard_2dsphere, diehard_3dsphere
- diehard_squeeze
- diehard_sums
- diehard_runs
- diehard_craps

Тесты, которые **НЕ ПРОЙДЕНЫ** (p-value = 0.00000000):
- diehard_birthdays
- diehard_rank_32x32
- diehard_rank_6x8
- diehard_bitstream
- diehard_opso, diehard_oqso, diehard_dna
- diehard_count_1s_str, diehard_count_1s_byt

#### 4.3 Практические следствия

| Сценарий использования | Пригодность | Причина |
|------------------------|-------------|---------|
| Игры (позиции, повороты, выбор предметов) | Хорошо | Полные 32-битные числа, игрок не заметит корреляции |
| Визуализации / искусство | Хорошо | Человеческое восприятие терпимо к битовому шуму |
| Процедурная генерация (целые числа) | Хорошо | Работает для ландшафтов, расстановки объектов |
| Перемешивание массивов | Хорошо | Равномерности на 32-битах достаточно |
| Побитовые операции (value & 1, битовые маски) | Осторожно | Младшие биты детерминированы (чередуются) |
| Монте-Карло симуляции | Избегать | Требуют независимости битов |
| Матричные операции / линейная алгебра | Избегать | Ранговые тесты показали зависимости |
| Криптография / безопасность | Никогда | Не предназначен |

---

### 5. Открытые исследовательские вопросы и будущая работа

Парадигма связанных счётчиков недостаточно изучена. Следующие вопросы остаются открытыми и могут привести к новым, статистически качественным генераторам.

**В1. Параллельное vs последовательное обновление.** Улучшит ли независимость битов обновление всех счётчиков из *предыдущего* состояния (a_new = a + f(b), b_new = b + g(c), c_new = c + h(a), все используют старые a,b,c)? Проблема LSB останется (приращения всё равно нечётны), но корреляции в старших битах могут измениться.

**В2. Изменение величин сдвигов.** Константы (3,5,7) были выбраны произвольно. Дают ли другие тройки сдвигов лучшие или худшие статистические свойства? Систематический поиск по пространству (i,j,k) с 1 <= i,j,k <= 31 мог бы выявить оптимальные параметры.

**В3. Более сильные выходные перемешиватели.** Может ли нелинейный перемешиватель (например, финализатор из SplitMix64: t ^ (t>>31) * 0x85ebca6b и т.д.) спасти генератор? Текущий LCG-перемешиватель, как доказано, слаб против ранговых тестов.

**В4. Связи большей размерности.** Уменьшат ли четыре или более счётчика линейные зависимости? При n счётчиках размер пространства состояний становится 2^(32n). LSB по-прежнему будут переключаться на каждом шаге, но ограничения могут стать менее жёсткими.

**В5. Алгебраическая характеризация над GF(2).** Возможно ли найти полиномиальное представление функции перехода над полем GF(2) степени > 1? Это позволило бы анализировать период методами алгебраической геометрии.

**В6. Альтернативный дизайн приращений.** Вместо принудительной нечётности через OR с 1 можно использовать другую нелинейную функцию (например, ((b>>3) ^ (b>>5)) | 1, или маленький S-box). Это может разрушить альтернацию LSB.

**В7. Доказательство или контрпример периода.** Наиболее насущная открытая проблема: найти строгую нижнюю оценку периода или предъявить seed, дающий короткий цикл.

---

### 6. Заключение

CouCouGen представляет собой экспериментальное исследование связанных аддитивных счётчиков как источника детерминированных последовательностей. Генератор биективен, что гарантирует отсутствие транзиентных состояний и равномерное распределение на любом полном цикле. Однако эмпирическое тестирование с помощью Dieharder выявляет систематические провалы на битовых тестах, вызванные в первую очередь принудительно нечётным приращением, которое заставляет все младшие биты детерминированно переключаться.

Для некритичных приложений — инди-игр, визуализаций, прототипирования, образования — CouCouGen предоставляет лёгкий, инициализируемый seed и «достаточно случайный» генератор последовательностей. Для приложений, требующих статистического совершенства (криптография, Монте-Карло, матричные операции), настоятельно рекомендуются устоявшиеся генераторы (xoshiro128+, SplitMix64).

Более широкий класс связанных счётчиков остаётся малоизученным и предлагает богатую почву для будущих исследований. Перечисленные выше открытые вопросы могут привести к новым, статистически устойчивым ГПСЧ.

**Итоговая оценка:** Красивая идея с математической элегантностью, статистически недостаточная для серьёзных приложений, но практически полезная в своей нише.

---

### 7. Код и доступность

Эталонная реализация на JavaScript (лицензия MIT) доступна по адресу:
- GitHub: https://github.com/coucougen/coucougen.github.io
- Живое демо: https://coucougen.github.io

Генератор экспортирует единственную функцию `CouCouGen(seed)`, возвращающую 32-битные беззнаковые целые числа.

---

### 8. Библиография

1. Кнут, Д.Э. *Искусство программирования, том 2: Получисленные алгоритмы*. Addison-Wesley, 3-е изд., 1997.
2. Л'Экюйе, П. *Таблицы линейных конгруэнтных генераторов различных размеров с хорошей решётчатой структурой*. Mathematics of Computation, 1999.
3. Марсалья, Дж. *Xorshift RNGs*. Journal of Statistical Software, Vol. 8, 2003.
4. Мацумото, М., Нисимура, Т. *Вихрь Мерсенна: 623-мерно эквидистрибутированный равномерный псевдослучайный генератор*. ACM Trans. Model. Comput. Simul., 1998.
5. О'Нилл, М.Э. *PCG: Семейство простых быстрых экономичных статистически хороших алгоритмов для генерации случайных чисел*. Harvey Mudd College, 2014.
6. Браун, Р.Г., Эдделбюттель, Д., Бауэр, Д. *Dieharder: Набор тестов для случайных чисел*. Версия 3.31.1.

---

**Автор:** Иван Петров — независимый исследователь, энтузиаст программирования, математик-любитель. Не имеет академического аффилирования. Эта работа выполнена в личное время и отражает наилучшие усилия автора, а не институциональную поддержку.

---

## Licenses

### Code License (MIT)

Copyright (c) 2026 Ivan Petrov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### Text License (this paper)

This paper, excluding the code snippets and the MIT-licensed software notices, is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).

You are free to:
- Share — copy and redistribute the material in any medium or format
- Adapt — remix, transform, and build upon the material

Under the following terms:
- Attribution — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
- NonCommercial — You may not use the material for commercial purposes.

Full license text: https://creativecommons.org/licenses/by-nc/4.0/

---

**Author:** Ivan Petrov — Independent researcher, programming enthusiast, hobbyist mathematician. No academic affiliation. This work was conducted in personal time and reflects the author's best effort, not institutional endorsement.