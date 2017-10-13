define([
	"dojo/ready",
	"dojo/dom",
	"dojo/on",
	"dojo/query",
	"dojo/NodeList-dom",
	"dojo/_base/array",
	"dojo/dom-construct",
	"./matrix",
	"./newton-raphson"
], function(ready, dom, on, query, nodeList, array, domConstruct, Matrix, Solver){
	ready(function(){
		var domIDs = {
			randomCheckbox : 'randomMatrices',
			matA: 'matrixA',
			matB: 'matrixB',
			button: 'calculateButton',
			size: 'size',
			print: 'printMatrices',
			printRadio: 'print',
			operationRadio: 'operation',
			result: 'result-wrapper',
			solveButton: 'solveButton',
			equations: 'equations'
		};
		var random = dom.byId(domIDs.randomCheckbox);
		var matA = dom.byId(domIDs.matA);
		var matB = dom.byId(domIDs.matB);
		var button = dom.byId(domIDs.button);
		var matSize = dom.byId(domIDs.size);
		var printCheckbox = dom.byId(domIDs.print);
		var operations = query("input[type=radio][name="+domIDs.operationRadio+"]");
		var formats = query("input[type=radio][name="+domIDs.printRadio+"]");
		var doPrint = true;
		var operator = "add";
		var format = "js";
		var operatorTitle = "A + B";
		var solveButton = dom.byId(domIDs.solveButton);
		var equation = dom.byId(domIDs.equations);

		on(random, 'change', function(){
			if(random.checked){
				matA.disabled = true;
				matB.disabled = true;
				matSize.disabled = false;
			} else {
				matA.disabled = false;
				matB.disabled = false;
				matSize.disabled = true;
			}
		});


		on(operations, 'change', function(){
			array.forEach(operations, function(operation){
				if(operation.checked){
					operator = operation.value;
					operatorTitle = operation.labels[0].innerText;
					console.log("operator changed " + operator);
				}
			});
		});

		on(formats, 'change', function(){
			array.forEach(formats, function(f){
				if(f.checked){
					format = f.value;
					console.log("print format now is " + format);
				}
			});
		});

		on(printCheckbox, 'change', function(){
			doPrint = printCheckbox.checked;
			if(doPrint){
				array.forEach(formats, function(f){
					f.disabled = false;
				});
			} else {
				array.forEach(formats, function(f){
					f.disabled = true;
				});
			}
		});

		on(button, 'click', function(){
			_clearError();
			var _matA; var _matB; var _matR;
			if(random.checked){
				var size = Number.parseInt(matSize.value) || 5;
				_matA = createRandomMatrix(size);
				if(operator != "inv")
					_matB = createRandomMatrix(size);
			} else {
				if(matA.value)
					_matA = new Matrix(_parseValues(matA.value));
				else
					_throwError("No Matrix A provided");
				if(operator != "inv"){
					if(matB.value)
						_matB = new Matrix(_parseValues(matB.value));
					else
						_throwError("No Matrix B provided");
				}
			}
			try {
				_matR = Matrix.operations[operator](_matA, _matB);
			} catch (e){
				_throwError(e.message);
			}

			var html = "";
			if(doPrint){
				html += printMatrix(_matA, format, "Matrix A");
				html += operator != "inv" ? printMatrix(_matB, format, "Matrix B") : "";
			}

			html += printMatrix(_matR, format, operatorTitle);
			domConstruct.place("<div class = 'result'>" + html + "</div>", domIDs.result, "first");
		});

		on(solveButton, 'click', function(){
			_clearError();
			html = "<b>Solution</b><br/>";
			var _equations = _parseEquations(equation.value);
			var point;
			var s;
			try{
				s = new Solver(_equations);
				point = s.solve();
			}catch(e){
				_throwError(e.message);
			}
			html += "Equations - " + equations.value + "<br/>";
			html += "Params - " + JSON.stringify(s.xvars) + "<br/>";
			html += "Solutions - " + JSON.stringify(point.m) + "<br/>";
			domConstruct.place("<div class = 'result'>" + html + "</div>", domIDs.result, "first");
		});
	});
	var createRandomMatrix = function(size){
		var a = Matrix.square(size, 0);

		for(var i = 0; i < a.rows; i++)
			for(var j = 0; j < a.cols; j++){
				a.m[i][j] = Math.random() * 10 - 5;
			}

		return a;
	};

	var printMatrix = function(mat, _format, title){
		return "<p>" + title + "</p><pre>" + mat.getHTML(_format == "js") + "</pre>";
	};

	var _throwError = function(message){
		var _errorDiv = dom.byId("errorMessage");
		_errorDiv.innerHTML = message;
		throw Error(message);
	};

	var _clearError = function(){
		var _errorDiv = dom.byId("errorMessage");
		_errorDiv.innerHTML = "";
	};

	var _parseValues = function(dataString){
		var data = [];

		dataString = dataString.replace(/(\r\n|\n|\r)/gm, "");
		dataString = dataString.slice(2, -2);
		var arr = dataString.split("],[");
		var rows = arr.length;
		var cols; 
		for(var i = 0; i < rows; i++){
			data[i] = [];
			var colArray = arr[i].split(",");
			cols = colArray.length;
			for(var j = 0; j < cols; j++){
				data[i][j] = Number.parseFloat(colArray[j]);
			}
		}

		return data;
	};

	var _parseEquations = function(dataString){
		var equations = [];

		dataString = dataString.replace(/(\r\n|\n|\r)/gm, "||");
		equations = dataString.split("||");
		var length = equations.length;
		for(var i = 0; i < length; i++){
			if(equations[i] == "" || equations[i].indexOf("=") < 0){
				equations.splice(i, 1);
			}
		}

		return equations;
	};
});
