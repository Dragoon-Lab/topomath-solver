# System of Equation Solver
It is a dojo based system of equation solver, which needs [equation parser](https://silentmatt.com/javascript-expression-evaluator/).
The internal algorithms for solving and it's implemetation details can be checked at [equation-solver.md](https://github.com/Dragoon-Lab/topomath-solver/blob/master/equation-solver.md).
To include this in your code check [demo.html](https://github.com/Dragoon-Lab/topomath-solver/blob/master/demo.html). It also provides ways to test different
parts of the solver.

## Sub-modules

It provides a [matrix class](https://github.com/Dragoon-Lab/topomath-solver/blob/master/matrix.js), with basic matrix functionalities, like addition, subtraction,
multiplication, division, inversion, get any element, get a row-vector, get column vector
and many more. [Newton-Raphson](https://github.com/Dragoon-Lab/topomath-solver/blob/master/newton-raphson.js) method is used for finding the solution of the system of
equations. A [solver-wrapper](https://github.com/Dragoon-Lab/topomath-solver/blob/master/solver-wrapper.js) is used to create a layer over solver algorithms, which makes it easier
to add new algorithms to this module. Just implement the algorithm (it should contain a solve function)
and call that in solver-wrapper in the solve function. [TopoMath](https://github.com/Dragoon-Lab/topomath), an Intelligent
Tutoring System for teaching high school arithmetic, uses this solver to show the solution to students.
