define([
	"dojo/_base/lang",
	"parser/parser",
	"./newton-raphson",
	"./error-messages"
], function(lang, Parser, NewtonRaphson, messages){
	var solver = null;
	var equations = [];
	var variables = [];
	var maxAttempts = 4; // maximum number of times a system should be solved
	var epsilon = 10e-6;
	var solution = null;

	/**
	* Initialize the system of equations. Checks if an equation is provided
	* in the form of string or a parser object. Creates an object with lhs and rhs parsed
	* equations and pushes it in an array called equations. It updates the total number
	* of variables in the equations as well.
	* @param -  expressions - array of equations as strings or parser objects
	**/
	var _initialize = function(expressions){
		equations = [];
		variables = [];
		for(var index in expressions){
			var expression = expressions[index];
			var eq = {};
			if(typeof(expression) == "string" && expression.indexOf("=") > -1){
				var eqs = expression.split("=");
				if(eqs.length > 2)
					throw {
						type: "equation.incorrect.format",
						message: messages.get("equation.incorrect.format")
					};
				eq.lhs = Parser.parse(eqs[0]);
				eq.rhs = Parser.parse(eqs[1]);
			} else if(typeof(expression) == "string"){
				eq.lhs = Parser.parse(expression);
				eq.rhs = Parser.parse(0);
			} else if(typeof(expression) == "object" && expression.length == 2){ 
				eq.lhs = expression[0];
				eq.rhs = expression[1];
			} else if(typeof(expression) == "object"){
				eq.lhs = expression;
				eq.rhs = Parser.parse(0);
			}
			if(_isValid(eq)){
				equations.push(eq);
				_addVariables(eq);
			}
		}

		if(variables.length == 0)
			throw {
				type: "no.variables",
				message: messages.get("no.variables")
			};
	}

	/**
	* used to add unknown variables in the variables array created at the top.
	* @param -  expression - from which unknown variables are to be added
	**/
	var _addVariables = function(/* object */ expression){
		var update = function(variableArray){
			for(var index in variableArray){
				var variable = variableArray[index];
				if(variables.indexOf(variable) < 0)
					variables.push(variable);
			}
		};
		update(expression.lhs.variables());
		if(expression.rhs) update(expression.rhs.variables());
	};

	/**
	* Preprocessing of equations will be part of this function. Currently preprocessing
	* involves removing that equation which does not have any variable in it. 2 = 2 sort
	* of equations.
	* @param -  expression - equation which is to checked
	* @return - isValid - boolean to provide whether expression is correct or not.
	**/
	var _isValid = function(/* object */ expression){
		var isValid = true;
		if((!expression.lhs || expression.lhs.variables().length == 0) &&
			(!expression.rhs || expression.rhs.variables().length == 0))
			isValid = false;

		return isValid;
	};

	/**
	* for over determined system where number of equations are more than the number
	* of variables, this picks up a subset based on removing equations which do not
	* bring any new variables in the system. First they are labelled as redundant
	* and then the appropriate equations are removed.
	* @param -	expressions - array for system of equations to be solved
	*        	start - this is a search algorithm, index is the starting equation
	* @return -	excess - the index of equations that were removed from expressions array
	**/
	var _preprocess = function(/* Array */ expressions, /* integer */ start){
		var l = expressions.length;
		var excess = [];
		var checked = []; // ids that are part of the system
		var equationVariables = [];
		var _comparator = function(a, b){
			return a - b;
		};
		var index = start;
		
		for(var i in expressions){
			isRedundant = true;
			if(index == l)
				index = 0;
			var eq = expressions[index];
			var ids = lang.clone(eq.lhs.variables());
			ids = ids.concat(eq.rhs.variables());
			equationVariables[i] = ids.length;

			for(var j in ids){
				var id = ids[j];
				if(checked.indexOf(id) < 0){
					isRedundant = false;
					checked.push(id);
				}
			}

			if(isRedundant){
				excess.push(index);
			}
			index++;
		}
		// by pigeonhole principle this can not happen
		// but still for safety purposes
		if(excess.length < l-variables.length)
			throw{
				type: "inconsistent.system",
				message: messages.get("inconsistent.system")
			};

		if(start === 0 && excess.length > l - variables.length)
			for(i in excess)
				excess.sort(function(a, b){return equationVariables[a] - equationVariables[b];});

		excess = excess.slice(0, l-variables.length);
		excess.sort(_comparator);

		for(i = excess.length - 1; i >= 0; i--)
			expressions.splice(excess[i], 1);

		return excess;
	};


	/**
	* For over determined system, after a solution is found, check whether
	* the solution point solves the other equations
	* @param -	indexes - array of indexes which were removed from the system before solving
	*        	solution - the solution found using other equations in the system
	* @return -	boolean - whether the solution point solves the equation or not
	**/
	_checkEquations = function(/* Array */ indexes, /* Array */ solution){
		var values = {};
		for(var i in variables)
			values[variables[i]] = solution.get(i, 0);

		var _equations = lang.clone(equations);
		for(var index in indexes){
			var diff = _equations[indexes[index]].lhs.evaluate(values) - _equations[indexes[index]].rhs.evaluate(values);

			if(Math.abs(diff) > epsilon){
				return false;
			}
		}

		return true;
	}

	/**
	* Solving the system of equations, preprocessing the equations if the number of
	* equations are more than unknown variables. To add new solver algorithms, 
	* add a type in the switch case before the default case and call its solver function. 
	* @return -	solution - solution calculated by the solver
	**/
	var solve = function(type){
		var solution;
		var doloop = true;
		var _equations = [];
		var start = 0; // preprocess is a search method to remove equations, so where to start searching
		var indexes = []; // equations that are not part of the solved system
		var attempts = 0;
		var solutionFound = false;
		maxAttempts = variables.length / 2;
		while(doloop){
			_equations = lang.clone(equations);
			if(equations.length == variables.length) doloop = false;
			else if(equations.length > variables.length) indexes = _preprocess(_equations, start);
			else
				throw{
					type: "under.determined.system",
					message: messages.get("under.determined.system")
				};

			switch(type){
				default:
					solver = new NewtonRaphson(_equations, variables);
					solution = solver.solve();
			}

			attempts++;
			if(doloop){
				if(_checkEquations(indexes, solution)){
					start = indexes[indexes.length - 1]
					doloop = false;
				} else if(attempts >= maxAttempts)
					throw{
						type: "overedetermined.no.solution",
						message: messages.get("overdetermined.no.solution")
					};
			}
		}

		return solution;
	};

	/**
	* constructor for the solver, it wraps over any kind of solver. The properties for adding
	* any new solver is to create a solve function and add it as a case in switch in solve function
	* in this file. This object is for parsing the equations and checking whether a system is
	* solvable and doing preprocessing of any kind. Then it calls the actual algorithm to solve.
	* @param -	expressions - system equations to solve
	**/
	var Solver = function(/* Array */expressions){
		_initialize(expressions);
		this.xvars = variables;
		this.eqs = equations;
		this.result = solution;
	};

	Solver.prototype = {
		solve: solve
	};

	return Solver;
});
