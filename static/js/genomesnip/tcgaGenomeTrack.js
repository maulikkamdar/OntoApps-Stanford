var cancerCodeList = [];
var cancerCodes;
var patients = [];
var patientNodeLocator = [];
var patientSelector = {"meth": false, "exon": false};

d3.json("data/tcgaCancerGraphs.json", function(cancerCodesData) {
	cancerCodes = cancerCodesData;	
	for(i in cancerCodesData) {
		cancerCodeList[cancerCodes[i].id] = {"methNode" : cancerCodesData[i].methNode, "exonNode" : cancerCodesData[i].exonNode, "patients": []};
		populatePatients(cancerCodesData[i].id);
	}
});

function updatePatientsList(trackNum, id, conGene, trackCanvas){
	jQuery("#patientList"+trackNum).multiselect("destroy");
	d3.select("#patientList"+trackNum).remove();
	d3.select("#tcgaBar"+trackNum).append("select").attr("id", "patientList"+trackNum)
		.attr("multiple", "multiple").selectAll("option").data(cancerCodeList[id].patients)
	    .enter().append("option").text(function(d) {return d.patientCode; })
	    .attr("value", function(d){ return d.patientCode;});
	jQuery("#patientList"+trackNum).multiselect({
		buttonText: function(options) {
			if (options.length == 0) {
				return 'None selected <b class="caret"></b>';
		    }
		    else if (options.length > 1) {
		        return options.length + ' selected  <b class="caret"></b>';
		    }
		    else {
		    	var selected = '';
		        options.each(function() {
		        	selected += jQuery(this).text() + ', ';
		        });
		        return selected.substr(0, selected.length -2) + ' <b class="caret"></b>';
		    }
		},
		includeSelectAllOption: true,
		maxHeight: 200,
		onChange:function(element, checked){
				var patient = patients[patientNodeLocator[element.val()]];
				var gene = conGene;
				if(typeof patient != "undefined") {
					if(cancerCodeList[patient.tumor].methNode != null && cancerCodeList[patient.tumor].methNode != "")
						populateMethTracks(patient,gene, trackNum, trackCanvas);
				//	if(cancerCodeList[patient.tumor].exonNode != null && cancerCodeList[patient.tumor].exonNode != "")
				//		populateExonTracks(patient,gene, trackNum, trackCanvas);
				}
	     }
	});
}

function populateMethTracks(patient, gene, trackNum, trackCanvas) {
	d3.text("makeRequest.php?dataset=methData&chromosomeNo="+gene.chromosome.substring(3,gene.chromosome.length)+
			"&geneStart="+gene.start+"&geneStop="+gene.stop+"&patientNo="+patient.patientUri+"&graph="+ patient.tumor + 
			"&endpoint=" + cancerCodeList[patient.tumor].methNode, function(json){
		var dataParts = json.split('<body>');
		var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
		var circularData = [];
		var maximum = 0, minimum = 1;
		for(i in data.results.bindings){
			var binding = data.results.bindings[i];
			var dataPoint = {"result": binding["result"].value, "position": binding["pos"].value, "value": binding["value"].value, "normalizedValue": 1};
			if(binding["value"].value > maximum)
				maximum = binding["value"].value;
			if(binding["value"].value < minimum)
				minimum = binding["value"].value;
			circularData.push(dataPoint);
		}
		
		var currentTrack = {"name": patient.patientCode+"_"+patient.tumor+"_meth_"+trackNum, "height": 50};
		currentTracks[gene.externalName + "_" +trackNum].push(currentTrack);
		
		plotLinearData(origData(circularData, maximum, minimum, 50, 25), gene, trackNum, trackCanvas, currentTrack);	
	});
}

function populateExonTracks(patient, gene) {
	d3.text("makeRequest.php?dataset=exonData&chromosomeNo="+gene.chromosome.substring(3,gene.chromosome.length)+"&patientNo="+patient.patientUri+"&graph="+ patient.tumor + "&endpoint=" + cancerCodeList[patient.tumor].exonNode, function(json){
		var dataParts = json.split('<body>');
		var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
		var barData = [];
		var maximum = 0, minimum = 1000;
		for(i in data.results.bindings){
			var binding = data.results.bindings[i];
			var value = parseInt(binding["value"].value);
			var dataPoint = {"result": binding["result"].value, "start": binding["start"].value, "stop": binding["stop"].value, "value": binding["value"].value, "normalizedValue": 1};
			if(value > maximum)
				maximum = value;
			if(value < minimum)
				minimum = value;
			barData.push(dataPoint);
		}
		var currentTrack = {"name": patient.patientCode+"_"+patient.tumor+"_exon", "height": 100};
		currentTracks.push(currentTrack);
		plotBarData(normalizeData(barData, maximum, minimum, 100, 1), gene.chromosome);	
	});
}

function populatePatients(tumorChecked){
	d3.text("makeRequest.php?dataset=patientList&graph="+ tumorChecked + "&endpoint=" + cancerCodeList[tumorChecked].methNode, function(json){
		var dataParts = json.split('<body>');
		var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
		for (i in data.results.bindings) {
		   var binding = data.results.bindings[i];
		   var patientUri = binding["patient"].value;
		   var patientCode = binding["s"].value;
		   var patientCount = patients.length;
		   if(patientNodeLocator[patientCode] == null) {
			   var patient = {"id": patientCount, "patientCode": patientCode, "patientUri": patientUri, "tumor": tumorChecked};
			   patients.push(patient);
			   cancerCodeList[tumorChecked].patients.push(patient);
			   patientNodeLocator[patientCode] = patientCount;
		   }
		}
	});
}