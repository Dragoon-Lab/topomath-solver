define(["parser/parser", "./matrix", "./error-messages"], function(Parser, Matrix, messages){
	// tracks if equations are in f(x) = 0 format or not
	var equations = [];
	var variables = [];
	var epsilon = 1e-6;
	var stoppingCriterion = 1e-3;
	var precision = 12;
	var n = 1;
	var m = 0;
	var fX;
	/**
	* Initialize the system of equations. Checks if an equation is provided
	* in the form of string or a parser object. Creates an object with lhs and rhs parsed
	* equations and pushes it in an array called equations. It updates the total number
	* of variables in the equations as well.
	* @param -	_equations - array of equations as parser objects
	*        	_variables - array of unknown variables in the equations
	**/
	var _initialize = function(/* Array */ _equations, /* Array */ _variables){
		equations = _equations;
		variables = _variables;
	};

	/**
	* Newton-Raphson solver algorithm flow is this. It takes equations from equation
	* array created in initialization function.
	* @return -	X - solution point for the system of equations
	**/
	var solve = function(){
		if(equations.length !== variables.length)
			throw {
				type: "variable.mismatch",
				message: messages.get("variable.mismatch")
			};
		// TODO: handle the case where equations are more. Need to find a subset that
		// we can solve.

		var X = _getInitialPoint();
		console.log("starting point ", X);
		fX = _calculateFunctionalValue(X);
		var change = 1;
		var iter = 0;
		while(change > stoppingCriterion){
			iter++;
			var jacobian = _createJacobian(X);
			// error handling if the jacobian is non invertible meaning
			// system of equations is not solvable.
			var jacobian_inv; var X_new;
			try{
				jacobian_inv = Matrix.operations.inv(jacobian);
				X_new = Matrix.operations.sub(X, Matrix.operations.mul(jacobian_inv, fX));
			} catch (e){
				throw e;
			}
			var fX_new = _calculateFunctionalValue(X_new);
			change = _calculateValueChange(fX_new, fX);
			fX = fX_new;
			X = X_new;
		}
		X.toFixed(precision);
		console.log("total iterations "+ iter);
		console.log("solution ", X);

		return X;
	};

	/**
	* gets the starting point for the system of equations. Randomly creates a
	* column matrix which acts as the initial point.
	* @return -	point - Matrix object - which is the starting point for solve function
	**/
	var _getInitialPoint = function(){
		var point = new Matrix(variables.length, 1, 0);
		for(var index in variables){
			var value = Math.random()*n + m;
			point.set(index, 0, value);
		}

		return point;
	};

	/**
	* evaluates each equation at the point given. Creates a column matrix of those values
	* @param -	X - point at which the equation values are to be evaluated
	* @return -	_fX - Matrix object which has the equation value at the point
	**/
	var _calculateFunctionalValue = function(/* Matrix */ X){
		var _fX = new Matrix(equations.length, 1, 0);
		var index = 0;
		for(var i in equations){
			_fX.set(index++, 0, _evaluateExpression(equations[i], X.m));
		}
		return _fX;
	};

	/**
	* calculates the stopping criterion for the solver. Subtracts the old and new
	* functional value matrices and returns the highest absolute value for the function
	* @param -	fX - old functional value
	*        	fX_new - new functional value
	* @return -	change - max absolute change in the functional values
	**/
	var _calculateValueChange = function(/* Matrix */ fX, /* Matrix */ fX_new){
		var result = Matrix.operations.sub(fX_new, fX);
		var numberOfEqs = equations.length;
		var change = Number.MIN_VALUE;
		for(var i = 0; i < numberOfEqs; i++){
			var val = Math.abs(result.get(i, 0));
			if(val > change)
				change = val;
		}

		return change;
	};

	/**
	* jacobian matrix is first order derivative matrix for the equation with respect
	* to each variable at a particular point in the N Dimensional plane.
	* @param -	X - point at which the first order derivative is to be calculated
	* @return -	jacobian - Matrix object for the jacobian value
	**/
	var _createJacobian = function(/* Array */ X){
		var noOfVars = variables.length;
		var jacobian = new Matrix(noOfVars, noOfVars, 0);
		var eqCount = 0;

		for(var index in equations){
			var expression = equations[index];
			for(var i = 0; i < noOfVars; i++){
				if(_isPresent(expression, variables[i])){
					var XDelta = _addDelta(X, i);
					var fXDelta = _evaluateExpression(expression, XDelta.m);
					jacobian.set(eqCount, i, ((fXDelta - fX.get(eqCount, 0))/epsilon));
				}
			}
			eqCount++;
		}

		return jacobian;
	};

	/**
	* adds epsilon to a particular value in the point to calculate gradient change
	* with respect to that point.
	* @param -	X - Matrix object for the point at which gradient is to be calculated
	*        	index - index of variable in which delta is to be added
	* @reutrn -	XDelta - new point with the delta change in the point at the provided index
	**/
	var _addDelta = function(/* Array */ X, /* number */ index){
		var XDelta = Matrix.copy(X);
		XDelta.set(index, 0, (XDelta.get(index, 0) +epsilon));
		return XDelta;
	};

	/**
	* evaluates the equation at a give point. calculates the lhs and rhs and subtracts
	* the two values to get the functional evaluation.
	* @param -	expression - equation to be evaluated
	*        	X - the point at which the expression is to be evaluated
	* @return - evaluated value is returned.
	**/
	var _evaluateExpression = function(/* object */ expression, /* Array */ X){
		var obj = _getValueObject(X);
		var lhs = expression.lhs.evaluate(obj);
		var rhs = expression.rhs ? expression.rhs.evaluate(obj) : 0;

		return lhs - rhs;
	};

	/**
	* checks if a variable is present in the expression.
	* @param -	expression - expression in which the variable is to be checked
	*        	variable - variable that is to be checked
	* @return - boolean value whether the variable is present or not.
	**/
	var _isPresent = function(/* object */ expression, /* string */ variable){
		return expression.lhs.variables().indexOf(variable) >= 0 ||
				(expression.rhs && expression.rhs.variables().indexOf(variable) >= 0);
	};

	/**
	* creates a value object of the form obj.id = value. where id is the variable name.
	* it is used by the parser to evaluate equations.
	* @param -	point - Array object whose values are to be converted to the value object
	* @return -	obj - Object in the format mentioned above.
	**/
	var _getValueObject = function(/* Array */ point){
		var obj = {};
		var index = 0;
		for(var index in variables){
			var variable = variables[index];
			obj[variable] = point[index++];
		}

		return obj;
	};

	/**
	* constructor for the solver. takes expressions in string or object forms and
	* initializes equation object. String format is to be used for demo and object
	* form may be provided by topomath equations.
	* @param -	eqs - equations that are to be solved.
	*        	vars - array of variables to be solved
	**/
	var Solver = function(eqs, vars){
		_initialize(eqs, vars);
		this.xvars = variables;
		this.eqs = equations;
		this.result = fX;
	};

	Solver.prototype = {
		solve: solve
	};

	return Solver;
});
