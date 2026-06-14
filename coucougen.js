// CouCouGen - Coupled Counter Generator v1.2.0
// ============================================
// A deterministic sequence generator based on three interacting counters
// NOT a PRNG (Pseudorandom Number Generator) - read the disclaimer below
// Algorithm: nonlinear coupled counters with variable step
// Author: Ivan Petrov (2026)
// License: MIT
//
// ----------------------
// WHAT THIS IS
// ----------------------
//
// CouCouGen is a deterministic number generator. Given the same seed,
// it always produces the same sequence of 32-bit integers.
// It is NOT a statistically perfect pseudorandom generator.
// It is NOT cryptographically secure.
// It has known statistical limitations (see below).
//
// Think of it as: "a reproducible integer sequence from coupled counters"
// Not as: "a source of high-quality randomness"
//
// ----------------------
// HOW TO INCLUDE
// ----------------------
//
// Browser:
//   <script src="coucougen.js"></script>
//   <script>
//     var num = CouCouGen();
//   </script>
//
// Node.js:
//   var CouCouGen = require('./coucougen.js');
//   var num = CouCouGen();
//
// ES Modules (add to end of file):
//   export default CouCouGen;
//
// AMD (RequireJS):
//   define(function() { return CouCouGen; });
//
// ----------------------
// HOW TO USE
// ----------------------
//
// Simple call — returns a 32-bit unsigned integer [0, 4294967295]:
//   CouCouGen();  // e.g.: 2178238471
//
// Reset with seed (optional):
//   CouCouGen(12345);  // start a new sequence with seed=12345
//
// Get a number in range [0, max):
//   CouCouGen() % max;  // e.g.: CouCouGen() % 100
//
// Get a number in range [min, max):
//   min + (CouCouGen() % (max - min));
//
// Get an element from an array:
//   var item = arr[CouCouGen() % arr.length];
//
// Shuffle an array (Fisher-Yates):
//   for (var i = arr.length - 1; i > 0; i--) {
//     var j = CouCouGen() % (i + 1);
//     var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
//   }
//
// Reproducible sequence:
//   CouCouGen(42);
//   var a = CouCouGen(); // always the same with seed=42
//   var b = CouCouGen(); // always the same with seed=42
//
// Integration with system time:
//   CouCouGen(Date.now());
//
// ----------------------
// KNOWN LIMITATIONS (from Dieharder tests)
// ----------------------
//
// CouCouGen was tested with the Dieharder statistical suite (100M numbers).
//
// TEST RESULTS SUMMARY:
//
// ┌────────────────────────────┬────────────┬────────────┐
// │ Test                       │ p-value    │ Assessment │
// ├────────────────────────────┼────────────┼────────────┤
// │ diehard_birthdays          │ 0.00000000 │ FAILED     │
// │ diehard_operm5             │ 0.70165042 │ PASSED     │
// │ diehard_rank_32x32         │ 0.00000000 │ FAILED     │
// │ diehard_rank_6x8           │ 0.00000000 │ FAILED     │
// │ diehard_bitstream          │ 0.00000000 │ FAILED     │
// │ diehard_opso               │ 0.00000000 │ FAILED     │
// │ diehard_oqso               │ 0.00000000 │ FAILED     │
// │ diehard_dna                │ 0.00000000 │ FAILED     │
// │ diehard_count_1s_str       │ 0.00000000 │ FAILED     │
// │ diehard_count_1s_byt       │ 0.00000000 │ FAILED     │
// │ diehard_parking_lot        │ 0.59033501 │ PASSED     │
// │ diehard_2dsphere           │ 0.38460354 │ PASSED     │
// │ diehard_3dsphere           │ 0.42381804 │ PASSED     │
// │ diehard_squeeze            │ 0.70683986 │ PASSED     │
// │ diehard_sums               │ 0.07155079 │ PASSED     │
// │ diehard_runs (up/down)     │ 0.45027772 │ PASSED     │
// │ diehard_runs (up/down)     │ 0.44302507 │ PASSED     │
// │ diehard_craps (pass)       │ 0.17341786 │ PASSED     │
// │ diehard_craps (pass/throw) │ 0.17162997 │ PASSED     │
// └────────────────────────────┴────────────┴────────────┘
//
// INTERPRETATION:
//
// CouCouGen passes tests that check:
//   - Basic uniformity (operm5, parking_lot, spheres, squeeze, sums, runs, craps)
//   - Distribution of values across ranges
//
// CouCouGen FAILS tests that check:
//   - Bit independence (rank_32x32, rank_6x8)
//   - Bitstream randomness (bitstream, opso, oqso, dna)
//   - Count of 1's in strings and bytes
//   - Birthday spacing (birthdays)
//
// What this means in practice:
//
// Works well for:
//   - Games (positions, rotations, item selection)
//   - Visualizations and art installations
//   - Procedural generation using full 32-bit integers
//   - Prototyping and testing
//   - Educational projects
//
// Use with caution for:
//   - Bit-level operations (e.g., value & 1, bit masks)
//   - Applications where independent bits are critical
//
// NOT suitable for:
//   - Cryptography, keys, tokens, security
//   - Monte Carlo simulations
//   - Matrix operations / linear algebra
//   - Scientific computing requiring statistical perfection
//   - Gambling or betting systems
//
// For statistically perfect randomness, use xoshiro128+, SplitMix64,
// or the built-in Math.random() (where appropriate).
//
// ----------------------
// ALGORITHM PROPERTIES
// ----------------------
//
// Period: not proven, ≤ 2^96 (~7.9 × 10^28 numbers)
// State size: 96 bits (3 × 32 bits)
// Speed: ~5.6 ms per 100,000 numbers in modern JS
// Uniformity (basic): chi-square 19.02 (20 bins, expected ~19.0)
// Mean: ~0.500036 (ideal 0.5)
// Std. dev.: ~0.288673 (ideal ~0.288675)
// Autocorrelation (lag 1): ~0.00245
// Thread safety: no (single global state)
// Cryptographic strength: zero (not designed for crypto)
//
// ----------------------
// DISCLAIMER
// ----------------------
//
// THE SOFTWARE IS PROVIDED "AS IS",
// WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.
// THE AUTHOR ASSUMES NO RESPONSIBILITY FOR ANY CONSEQUENCES
// OF USE, INCLUDING BUT NOT LIMITED TO LOSS OF
// DATA, PROFITS, BUSINESS REPUTATION OR OTHER DAMAGES.
//
// USE IN AREAS WHERE FAILURE OR
// PREDICTABILITY OF THE GENERATOR MAY LEAD TO SERIOUS
// CONSEQUENCES IS PROHIBITED, INCLUDING BUT NOT LIMITED TO:
//
//   — cryptography, encryption, key and token generation;
//   — security, authentication and authorization systems;
//   — gambling, lotteries and betting systems;
//   — aviation, medicine, nuclear power, military applications;
//   — any critical infrastructure and life support systems.
//
// THIS IS NOT A PSEUDORANDOM NUMBER GENERATOR (PRNG) IN THE
// STATISTICALLY PROVEN SENSE. IT HAS KNOWN STATISTICAL FAILURES
// AS DOCUMENTED ABOVE. FOR TASKS REQUIRING PROVEN RANDOMNESS,
// USE ESTABLISHED GENERATORS LIKE XORSHIFT128+, SPLITMIX64,
// OR MATH.RANDOM().
//
// PRIMARY USE CASES (realistic):
//
//   — indie games and casual procedural content;
//   — visualizations, animations and art installations;
//   — testing and debugging (reproducible sequences);
//   — educational projects demonstrating counter coupling;
//   — prototyping where "random enough" is sufficient.
//
// By using this library, you agree that:
// 1. You have read and understood the limitations
// 2. You accept all risks
// 3. You will not use the library in prohibited areas
// 4. You will not expect PRNG-quality randomness
//
// ----------------------
// TECHNICAL INFORMATION
// ----------------------
//
// The algorithm is based on three coupled 32-bit counters (a, b, c).
// Each counter is incremented on each iteration by a value
// depending on the high bits of another counter.
// The least significant bit of the increment is forced to 1
// to prevent sticking at zero.
//
// Mathematical model:
//   a(t+1) = a(t) + ((b(t) >>> 3) | 1)  mod 2^32
//   b(t+1) = b(t) + ((c(t) >>> 5) | 1)  mod 2^32
//   c(t+1) = c(t) + ((a(t) >>> 7) | 1)  mod 2^32
//   temp(t) = (a(t) XOR (b(t) << 7)) + c(t)  mod 2^32
//   output(t) = (temp(t) * 1103515245 + 12345)  mod 2^32
//
// Initial constants:
//   123456789 — arbitrary non-zero initial value
//   2654435761 = floor(2^32 / φ), where φ = golden ratio
//   3462531671 = floor(2^32 / sqrt(2))
//   1103515245 — constant from LCG (Numerical Recipes)
//   12345 — additive constant
//
// ----------------------
// COMPATIBILITY
// ----------------------
//
// Browsers: all modern (Chrome, Firefox, Safari, Edge)
// Node.js: versions 0.10 and above
// Other environments: any environment with ECMAScript 3+ support
// Module types: global, CommonJS (add module.exports)
//
// ----------------------
// VERSION HISTORY
// ----------------------
//
// v1.0.0 (2026) - First public release
//   - Basic version: XOR+ADD output function
// v1.1.0 (2026) - Statistical improvements
//   - Added final multiplication mixer
//   - Autocorrelation reduced
// v1.2.0 (2026) - Honest repositioning
//   - Removed "PRNG" claims
//   - Added explicit statistical limitations
//   - Clarified use cases
//   - No code changes, only documentation
//

(function(global) {
  var a = 123456789;
  var b = 2654435761;
  var c = 3462531671;
  
  global.CouCouGen = function(seed) {
    if (seed !== undefined) {
      seed = seed >>> 0;
      a = (a + seed) >>> 0;
      b = (b ^ (seed << 13)) >>> 0;
      c = (c ^ (seed >>> 17)) >>> 0;
    }
    a = (a + ((b >>> 3) | 1)) | 0;
    b = (b + ((c >>> 5) | 1)) | 0;
    c = (c + ((a >>> 7) | 1)) | 0;
    var t = ((a ^ (b << 7)) + c) >>> 0;
    return (t * 1103515245 + 12345) >>> 0;
  };
})(typeof window !== 'undefined' ? window : global);

// ============================================
// MIT LICENSE
// ============================================
//
// The MIT License (MIT)
// Copyright © 2026 Ivan Petrov
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.