# CouCouGen.js

Lightweight 32-bit pseudorandom number generator based on three coupled additive counters with nonlinear feedback.

- Period: less or equal 2^96 (~7.9 x 10^28)
- State: 96 bits (3 x 32-bit)
- Speed: ~5.6 ms / 100,000 numbers
- Size: less than 2 KB uncompressed
- Zero dependencies

## Installation

### Browser

Put this in your HTML:
<script src="coucougen.js"></script>

### Node.js

var CouCouGen = require('./coucougen.js');
var num = CouCouGen();

## Quick Start

// Generate a random 32-bit integer [0, 4294967295]
CouCouGen(); // example: 2178238471

// Seed for reproducible sequences
CouCouGen(42);

// Random number in range [0, 100)
CouCouGen() % 100;

// Random number in range [10, 50)
10 + (CouCouGen() % 40);

// Random array element
arr[CouCouGen() % arr.length];

// Fisher-Yates shuffle
for (let i = arr.length - 1; i > 0; i--) {
  const j = CouCouGen() % (i + 1);
  [arr[i], arr[j]] = [arr[j], arr[i]];
}

// Seed with current time
CouCouGen(Date.now());

## Algorithm

Three coupled 32-bit counters with guaranteed odd increments:

a_new = a + ((b >>> 3) | 1)   (mod 2^32)
b_new = b + ((c >>> 5) | 1)   (mod 2^32)
c_new = c + ((a_new >>> 7) | 1)  (mod 2^32)

Output mixing:
output = ((a XOR (b << 7)) + c) * 1103515245 + 12345

## Statistical Properties

| Metric              | Value       |
|---------------------|-------------|
| Mean                | ~0.500036   |
| Std. deviation      | ~0.288673   |
| Chi-square (20 bins)| 19.02       |
| Autocorrelation     | ~0.00245    |

## License

MIT (c) 2026 Ivan Petrov

## Disclaimer

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

NOT FOR CRYPTOGRAPHIC USE. This generator has not undergone cryptanalysis
and is not designed to be cryptographically secure. Do not use for:

- Cryptography, encryption, key generation
- Security and authentication systems
- Gambling, lotteries, betting
- Critical infrastructure (aviation, medicine, nuclear power, military)
- Any life support or safety-critical systems

Use for: games, procedural generation, visualizations, testing, education,
and research projects.

By using this library, you agree that:
 1. You understand the limitations of the algorithm
 2. You accept all risks
 3. You will not use the library in prohibited areas