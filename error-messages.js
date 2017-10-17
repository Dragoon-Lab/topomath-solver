define([], function(){
	var errorCodes = {
		"decomposition": "Singular Matrix provided",
		"matrix.missing": "Matrix not provided",
		"matrix.initialization.incorrect": "Wrong initialization parameters used for Matrix initialization",
		"matrix.varying.size": "Number of columns in each row are changing",
		"size.mismatch": "Matrix sizes do not match",
		"size.mismatch.rows": "Rows do not match",
		"size.mismatch.cols": "Columns do not match",
		"equation.incorrect.format": "Equations provided in an incorrect format"
	};

	return {
		get: function(code){
			return errorCodes[code];
		}
	};
});
