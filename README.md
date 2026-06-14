# CouCouGen.js

Lightweight 32-bit number generator based on three coupled additive counters with nonlinear feedback.

Not a statistically proven PRNG — see "Limitations" section.

- Period: less than or equal to 2^96 (~7.9 x 10^28)
- State: 96 bits (3 x 32 bits)
- Speed: ~5.6 ms per 100,000 numbers in modern JS
- Size: under 2 KB uncompressed
- Zero dependencies
- Reproducible sequence with the same seed

## Installation

### Browser

<script src="coucougen.js"></script>

### Node.js

var CouCouGen = require('./coucougen.js');
var num = CouCouGen();

## Quick Start

// 32-bit unsigned integer [0, 4294967295]
CouCouGen(); // e.g.: 2178238471

// Set seed for reproducible sequence
CouCouGen(42);

// Range [0, 100)
CouCouGen() % 100;

// Range [10, 50)
10 + (CouCouGen() % 40);

// Random array element
arr[CouCouGen() % arr.length];

// Shuffle array (Fisher-Yates)
for (let i = arr.length - 1; i > 0; i--) {
  const j = CouCouGen() % (i + 1);
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

// Seed with current time
CouCouGen(Date.now());

## Algorithm

Three coupled 32-bit counters with odd increments:

a_new = a + ((b >>> 3) | 1)   (mod 2^32)
b_new = b + ((c >>> 5) | 1)   (mod 2^32)
c_new = c + ((a >>> 7) | 1)   (mod 2^32)

temp = (a XOR (b << 7)) + c
output = (temp * 1103515245 + 12345) mod 2^32

## Basic Statistical Properties

| Metric                    | Value       |
|---------------------------|-------------|
| Mean                      | ~0.500036   |
| Standard deviation        | ~0.288673   |
| Chi-square (20 bins)      | 19.02       |
| Autocorrelation (lag 1)   | ~0.00245    |

## Dieharder Results (100M numbers)

| Test                       | p-value    | Assessment |
|----------------------------|------------|------------|
| diehard_birthdays          | 0.00000000 | FAILED     |
| diehard_operm5             | 0.70165042 | PASSED     |
| diehard_rank_32x32         | 0.00000000 | FAILED     |
| diehard_rank_6x8           | 0.00000000 | FAILED     |
| diehard_bitstream          | 0.00000000 | FAILED     |
| diehard_opso               | 0.00000000 | FAILED     |
| diehard_oqso               | 0.00000000 | FAILED     |
| diehard_dna                | 0.00000000 | FAILED     |
| diehard_count_1s_str       | 0.00000000 | FAILED     |
| diehard_count_1s_byt       | 0.00000000 | FAILED     |
| diehard_parking_lot        | 0.59033501 | PASSED     |
| diehard_2dsphere           | 0.38460354 | PASSED     |
| diehard_3dsphere           | 0.42381804 | PASSED     |
| diehard_squeeze            | 0.70683986 | PASSED     |
| diehard_sums               | 0.07155079 | PASSED     |
| diehard_runs               | 0.45027772 | PASSED     |
| diehard_craps              | 0.17341786 | PASSED     |

Passes: basic uniformity, distribution, runs, sphere tests.  
Fails: bit independence, matrix rank, bitstream tests.

## In Practice

✅ Good for

- Games (positions, rotations, item selection)
- Visualizations and art installations
- Procedural generation using full 32-bit integers
- Prototyping and testing
- Educational projects

⚠️ Use with caution for

- Bit-level operations (value & 1, bit masks)
- Applications where independent bits are critical

❌ NOT suitable for

- Cryptography, keys, tokens, security
- Monte Carlo simulations
- Matrix operations / linear algebra
- Scientific computing requiring statistical perfection
- Gambling, lotteries, betting systems

> For statistically perfect randomness, use xoshiro128+, SplitMix64, or the built-in Math.random() (in modern browsers).

## License

MIT © 2026 Ivan Petrov

## Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

NOT FOR CRYPTOGRAPHIC USE.
NOT A STATISTICALLY PROVEN PRNG.

Prohibited use in:
- cryptography, encryption, key and token generation
- security, authentication and authorization systems
- gambling, lotteries and betting systems
- critical infrastructure (aviation, medicine, nuclear power, military)
- any life support and safety systems

Permitted use cases: games, procedural content generation, visualizations, testing, education, research projects.

By using this library, you agree that:
1. You understand the limitations of the algorithm
2. You accept all risks
3. You will not use the library in prohibited areas
4. You do not expect PRNG-quality randomness from it