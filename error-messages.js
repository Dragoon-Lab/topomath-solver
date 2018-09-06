define([], function(){
	var errorCodes = {
		"decomposition": "Singular Matrix provided",
		"matrix.missing": "Matrix not provided",
		"matrix.initialization.incorrect": "Wrong initialization parameters used for Matrix initialization",
		"matrix.varying.size": "Number of columns in each row are changing",
		"size.mismatch": "Matrix sizes do not match",
		"size.mismatch.rows": "Rows do not match",
		"size.mismatch.cols": "Columns do not match",
		"equation.incorrect.format": "Incorrect equation format. Equations must have one '=' and at least one variable.",
		"variable.mismatch": "Number of equations do not match the number of variables",
		"no.variables": "There are no variables to solve in the equation",
		"inconsistent.system": "It is an overdetermined system, and the solver is not able to balance the number of variables and equations to solve",
		"under.determined.system": "The number of equations are less than the number of variables, hence the system is not solvable.",
		"overdetermined.no.solution": "The number of equations are more than number of variables, and no single solution solves all of them."
	};

	return {
		get: function(code){
			return errorCodes.hasOwnProperty(code) ? errorCodes[code] : "";
		}
	};
});
