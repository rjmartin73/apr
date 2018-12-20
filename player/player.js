var stepped = 0,
	chunks = 0,
	rows = 0;
var start, end;
var parser;
var pauseChecked = false;
var printStepChecked = false;
var dataObject = [];
var fileName = '';
var fileList = [];
var parseButton = document.querySelector('#submit-parse');

$(function() {
		$('#submit-parse').click(function() {
		stepped = 0;
		chunks = 0;
		rows = 0;

		var txt = $('#input').val();
		var localChunkSize = $('#localChunkSize').val() || 0;
		var remoteChunkSize = $('#remoteChunkSize').val() || 0;
		var files = $('#files')[0].files;
		var config = buildConfig();
		let ele = document.querySelector('#results');
		let newEle = document.createElement('div');
		newEle.setAttribute('id', 'results');
		newEle.setAttribute('class', 'container-fluid');

		// NOTE: Chunk size does not get reset if changed and then set back to empty/default value
		if (localChunkSize) Papa.LocalChunkSize = localChunkSize;
		if (remoteChunkSize) Papa.RemoteChunkSize = remoteChunkSize;

		pauseChecked = $('#step-pause').prop('checked');
		printStepChecked = $('#print-steps').prop('checked');

		if (files.length > 0) {
			if (!$('#stream').prop('checked') && !$('#chunk').prop('checked')) {
				for (var i = 0; i < files.length; i++) {
					fileList.push(files[i].name);
					if (files[i].size > 1024 * 1024 * 10) {
						alert(
							"A file you've selected is larger than 10 MB; please choose to stream or chunk the input to prevent the browser from crashing."
						);
						return;
					}
				}
			//	console.log(fileList.toString());
			}

			start = performance.now();

			if (ele) {
				try {
					ele.remove();
					document.querySelector('#result-container').appendChild(newEle);
				} catch (e) {
					document.querySelector('#result-container').innerHTML = 'An error occured';
				}
			}

			$('#files').parse({
				config: config,
				before: function(file, inputElem) {
					console.warn('Parsing file:', file);
					fileName = file.name;
				},
				complete: function() {
					console.info('Done with all files.');
				}
			});
		} else {
			start = performance.now();
			var results = Papa.parse(txt, config);
			console.log('Synchronous parse results:', results);
		}
		//fileName = file.name();
		//console.log(fileName);
	});

	$('#submit-unparse').click(function() {
		var input = $('#input').val();
		var delim = $('#delimiter').val();
		var header = $('#header').prop('checked');

		var results = Papa.unparse(input, {
			delimiter: delim,
			header: header
		});

		// console.log('Unparse complete!');
		// console.log('--------------------------------------');
		// console.log(results);
		// console.log('--------------------------------------');
	});

	$('#insert-tab').click(function() {
		$('#delimiter').val('\t');
	});
});

function buildConfig() {
	return {
		delimiter: ',', //$('#delimiter').val(),
		newline: '',// getLineEnding(),
		header: $('#header').prop('checked'),
		dynamicTyping: $('#dynamicTyping').prop('checked'),
		preview: parseInt($('#preview').val() || 0),
		step: $('#stream').prop('checked') ? stepFn : undefined,
		encoding: $('#encoding').val(),
		worker: $('#worker').prop('checked'),
		comments: $('#comments').val(),
		complete: completeFn,
		error: errorFn,
		download: $('#download').prop('checked'),
		fastMode: $('#fastmode').prop('checked'),
		skipEmptyLines: $('#skipEmptyLines').prop('checked'),
		chunk: $('#chunk').prop('checked') ? chunkFn : undefined,
		beforeFirstChunk: undefined
	};

	function getLineEnding() {
		if ($('#newline-n').is(':checked')) return '\n';
		else if ($('#newline-r').is(':checked')) return '\r';
		else if ($('#newline-rn').is(':checked')) return '\r\n';
		else return '';
	}
}

function stepFn(results, parserHandle) {
	stepped++;
	rows += results.data.length;

	parser = parserHandle;

	if (pauseChecked) {
		console.info(results, results.data[0]);
		parserHandle.pause();
		return;
	}

	if (printStepChecked) console.log(results, results.data[0]);
}

function chunkFn(results, streamer, file) {
	if (!results) return;
	chunks++;
	rows += results.data.length;

	parser = streamer;

	if (printStepChecked) console.log('Chunk data:', results.data.length, results);

	if (pauseChecked) {
		console.info('Pausing; ' + results.data.length + ' rows in chunk; file:', file);
		streamer.pause();
		return;
	}
}

function errorFn(error, file) {
	console.error('ERROR:', error, file);
}

function completeFn() {
	end = performance.now();
	if (!$('#stream').prop('checked') && !$('#chunk').prop('checked') && arguments[0] && arguments[0].data)
		rows = arguments[0].data.length;

  dataObject = [ ...arguments[0].data ];
  
	var container = document.querySelector('#results');
	var hot = new Handsontable(container, {
    data: dataObject,	
    //label: "test"	,
    title: "test"
	});

	// console.log('Finished input (async). Time:', end - start, arguments);
	// console.log(arguments[0]);

	//dataToTable(arguments[0]);
	console.warn('Rows:', rows, 'Stepped:', stepped, 'Chunks:', chunks);
	//document.querySelector('#results')
}

/*
Next steps:
get array data into a json formatted array, using column headers as keys
*/

// dataToTable = (args) => {
// 	let $results = document.querySelector('#results');
// 	let $length = args.data.length - 1;
// 	let $size = args.data[0].length;
// 	let $table = document.createElement('table');
// 	let $thead = document.createElement('thead');
// 	let $tbody = document.createElement('tbody');
// 	let $tcaption = document.createElement('caption');
// 	let $cspan = document.createElement('span');
// 	$cspan.className = 'alert alert-primary';
// 	$cspan.innerHTML = fileName;
// 	$tcaption.appendChild($cspan);
// 	$tcaption.setAttribute('style', 'caption-side:top');

// 	for (i = 0; i < $length; i++) {
// 		let $tr = document.createElement('tr');
// 		if (i == 0) {
// 			for (j = 0; j < $size; j++) {
// 				let $th = document.createElement('th');
// 				let cellText = document.createTextNode(args.data[i][j]);
// 				$th.appendChild(cellText);
// 				$th.setAttribute('scope', 'col');
// 				$tr.appendChild($th);
// 				$thead.appendChild($tr);
// 			}
// 		} else {
// 			for (j = 0; j < $size; j++) {
// 				let $td = document.createElement('td');
// 				let cellText = document.createTextNode(args.data[i][j]);
// 				$td.appendChild(cellText);
// 				$tr.appendChild($td);
// 				$tbody.appendChild($tr);
// 			}
// 		}

// 		$table.append($tcaption);
// 		$table.append($thead);
// 		$table.appendChild($tbody);
// 		$table.className = 'table table-condensed table-hover';
// 		$table.setAttribute('id', 'resultTable');
// 	}
// 	//$results.appendChild($resultTitle);

// 	$results.append($table);
// };
