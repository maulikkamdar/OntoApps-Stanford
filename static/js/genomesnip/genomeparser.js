var chromosomes = [];
var geneLocator = [];
var enhPromLocator = [];
var enhPromIdLocator = []
var cancerGenes = [];
var communities = [];
var communityLocator = [];
/*var diseaseLocator = [];
var pubmedLocator = [];
var pubmedConnectors = [];*/
var mutSequences = [];
var snpSequences = [];

var chromConnectors = [], midValues = [], ideoConnectors = [], totalConnectors = [];
var genomeLength = 0;
var totalChromosomes = 0;
var totalGenes = 0;

var chordCounter = 0;
var genomeParsed = false, geneConReceived = false, 
	mutReceived = false, snpReceived = false, chromConParsed = false, ideoReceived = false;
var disConLevel = 10, pathConLevel = 4; pubConLevel = 1;
var species = "hsa";
//jQuery(".splashScreenExplorer").hide();

d3.tsv('static/data/genomesnip/hgTables.txt', function (data){
	var currentChromosomeLength = 0;
	for(i in data) {
		var ideStart = parseInt(data[i].chromStart);
		var ideEnd = parseInt(data[i].chromEnd);
		var newIdeogram = {"start" : ideStart, "stop" : ideEnd, "name": data[i].name, "gieStain": data[i].gieStain, "chromosome": data[i].chrom, "genes": [], "enhproms": []};
		if(chromosomes[data[i].chrom] == null) {
			genomeLength += currentChromosomeLength;
			var newChromosome = {"chromosome":data[i].chrom, "ideograms" : [], "genes" : [], "length": ideEnd, "enhproms" : []};
			newChromosome.ideograms.push(newIdeogram);
			chromosomes[data[i].chrom] = newChromosome;
			currentChromosomeLength = ideEnd;
			totalChromosomes++;
		} else {
			chromosomes[data[i].chrom].ideograms.push(newIdeogram);
			chromosomes[data[i].chrom].length = ideEnd;
			currentChromosomeLength = ideEnd;
		}
	}
	genomeLength += currentChromosomeLength;   //EOF exception
	
	getAllGenes(species);
//	drawChromosomeLayer();
//	genomeParsed = true;
});

function getAllGenes(species) {
//	var geneList = "http://ws.bioinfo.cipf.es/cellbase/rest/latest/" + species + "/feature/gene/list?biotype=protein_coding"; //CellBase GeneList
	var geneList = "static/data/genomesnip/list.txt";
	d3.tsv(geneList, function (data){
		totalGenes = data.length;
		for(i in data) {
			var chromosomeId = "chr" + data[i].chromosome;
			var geneStart = parseInt(data[i].start);
			var geneEnd = parseInt(data[i].end);
			var gene = {"chromosome":chromosomeId,"start": geneStart, "stop": geneEnd, "ensemblId": data[i]['#Ensembl gene'], "description": data[i].description, "externalName": data[i]['external name'], "externalNameSrc": data[i]['external name source'], "source": data[i].source};
			if(chromosomes[chromosomeId] != null) {
				chromosomes[chromosomeId].genes.push(gene);
				var currentGeneCounter = 0;
				for(k in chromosomes[chromosomeId].ideograms){
					var ideogram = chromosomes[chromosomeId].ideograms[k];
					if(geneEnd > ideogram.start && geneStart < ideogram.stop)
						ideogram.genes.push(data[i]['external name']);
				}
			}
		}
		for(i in chromosomes){
			chromosomes[i].genes.sort(function(a,b){return parseFloat(a.start - b.start);})
			for(j in chromosomes[i].genes){
				geneLocator[chromosomes[i].genes[j].externalName] = i + "_gene" + j;
			}
		}
		drawChromosomeLayer();
		genomeParsed = true;
		getCancerGenes(); // Cancer Gene Census Data
	//	getLocalGenPubmedMap(); // Pubmed
	//	getOmimGeneMap(); // OMIM
	//	getChromConMap(); // Chromosome Similarity Files
		getEnhPromInfo();
	}, function (error, rows){
		console.log(rows); // do something here when internet out
		drawChromosomeLayer();
		genomeParsed = true;
	});
}

function getEnhPromInfo() {
	d3.json('/genomesnip/nodes', function (data){
		for (node in data) {
			reg = data[node]["name"];
			regParts = reg.split("_");
			startEnh = parseInt(regParts[2])
			stopEnh = parseInt(regParts[3])
			var enhProm = {"name": regParts[0], "id": "enhprom" + data[node]["id"], "chromosome": regParts[1], "start": startEnh, "stop": stopEnh}
			//console.log(enhProm);
			chromosomes[enhProm["chromosome"]]["enhproms"].push(enhProm);
			for(k in chromosomes[regParts[1]].ideograms){
				var ideogram = chromosomes[regParts[1]].ideograms[k];
				if(stopEnh > ideogram.start && startEnh < ideogram.stop)
					ideogram.enhproms.push(regParts[0]);
			}
		}
		for(i in chromosomes){
			chromosomes[i].enhproms.sort(function(a,b){return parseFloat(a.start - b.start);})
			for(j in chromosomes[i].enhproms){
				enhPromLocator[chromosomes[i].enhproms[j].name] = i + "_enhProm_" + j;
				enhPromIdLocator[chromosomes[i].enhproms[j].id] = i + "_enhProm_" + j;
			}
		}
		getCommunities();
	});
}

function getCommunities() {
	console.log("invoking communities")
	d3.json('/genomesnip/communities?iter=-1', function(data) {
		communities = data;
		for (k in communities) {
			communityLocator[communities[k]["id"]] = k
		}
		plotCommunities();
	})
}

function getnetworkarcs(id, name, regposX, regposY, gene1Mid, ideoArcCenter, chromosomalArcCenter, conIdeogram, midPoints, chromoMidPoints, ideoInnerLayerRadius, repOuterRadius, repInnerRadius, newOuterRadius, newInnerRadius) {
	numericId = id.substring(7);
	d3.json('/genomesnip/regRegionCom?id=' + numericId, function(data) {
		var connectorGroup = new Kinetic.Group()
		specCom = data["communities"];
		//console.log(specCom);
		var conIdeogramStartAngle = ideoArcCenter - Math.PI/2 + Math.PI*conIdeogram.start/chromosomes[enhPromLocator[name].split("_")[0]].length;
		var conIdeogramEndAngle = ideoArcCenter - Math.PI/2 + Math.PI*conIdeogram.stop/chromosomes[enhPromLocator[name].split("_")[0]].length;
		var conIdeogramMid = (conIdeogramStartAngle+conIdeogramEndAngle)/2;
		
		var midPointsSec = [];
		var chromoMidPointsSec = [];
		for(i in midPoints){
			if(gene1Mid < conIdeogramMid) {
				if(gene1Mid < midPoints[i].angle && midPoints[i].angle < conIdeogramMid)
					midPointsSec.push(midPoints[i]);
			} else {
				if(gene1Mid > midPoints[i].angle && midPoints[i].angle > conIdeogramMid)
					midPointsSec.push(midPoints[i]);
			}
		}
		if(gene1Mid > conIdeogramMid)
			midPointsSec.reverse();
		
		for(i in chromoMidPoints){
			if(conIdeogramMid < ideoArcCenter) {
				if(conIdeogramMid < chromoMidPoints[i].angle && chromoMidPoints[i].angle < ideoArcCenter)
					chromoMidPointsSec.push(chromoMidPoints[i]);
			} else {
				if(conIdeogramMid > chromoMidPoints[i].angle && chromoMidPoints[i].angle > ideoArcCenter)
					chromoMidPointsSec.push(chromoMidPoints[i]);
			}
		}
		if(conIdeogramMid > ideoArcCenter)
			chromoMidPointsSec.reverse();
		
		var ideoCenterRadius = (ideoInnerLayerRadius + repOuterRadius)/2;
		var chromoCenterRadius = (repInnerRadius + newOuterRadius)/2;
		
		for (k in specCom) {
			//console.log(specCom);
			var comCirc = stage.find("#" + specCom[k])[0];
			comCirc.setOpacity(1);
			comCircPos = comCirc.getAbsolutePosition();
			var chordPoints = [];
			chordPoints.push({"x": center.x + ideoInnerLayerRadius*Math.cos(gene1Mid), "y": center.y + ideoInnerLayerRadius*Math.sin(gene1Mid)});
			chordPoints.push({"x": center.x + ideoCenterRadius*Math.cos(gene1Mid), "y": center.y + ideoCenterRadius*Math.sin(gene1Mid)});
			for (i in midPointsSec){
				chordPoints.push({"x": midPointsSec[i].x, "y": midPointsSec[i].y});
			}
			chordPoints.push({"x": center.x + ideoCenterRadius*Math.cos(conIdeogramMid), "y": center.y + ideoCenterRadius*Math.sin(conIdeogramMid)});
			chordPoints.push({"x": center.x + chromoCenterRadius*Math.cos(conIdeogramMid), "y": center.y + chromoCenterRadius*Math.sin(conIdeogramMid)});
			for (i in chromoMidPointsSec){
				chordPoints.push({"x": chromoMidPointsSec[i].x, "y": chromoMidPointsSec[i].y});
			}
			chordPoints.push({"x": center.x + chromoCenterRadius*Math.cos(chromosomalArcCenter), "y": center.y + chromoCenterRadius*Math.sin(chromosomalArcCenter)});
			chordPoints.push({"x": center.x + newInnerRadius*Math.cos(chromosomalArcCenter), "y": center.y + newInnerRadius*Math.sin(chromosomalArcCenter)});
			
			chordPoints.push({"x": comCircPos.x, "y": comCircPos.y})
			
			currentCommunity = communities[communityLocator[specCom[k]]];

			edgeWidth = 0;
			for (m in data["edges"]) {
				edgeNode = data["edges"][m];
				if (currentCommunity["nodes"].indexOf(edgeNode) > -1) edgeWidth++;
			}
			var chord = getSpline(chordPoints, "#000000", id + "_link", Math.log(edgeWidth), 0.1); 
			connectorGroup.add(chord)

			/*for (m in data["edges"]) {
				edgeNode = data["edges"][m];
				if (currentCommunity["nodes"].indexOf(edgeNode) > -1 && repEnhProms.indexOf(edgeNode) == -1) {
					var loc = enhPromIdLocator["enhprom"+edgeNode];
					var conChromosome = chromosomes[loc.split("_")[0]];
					var enhProm = conChromosome["enhproms"][loc.split("_")[2]];
					var pointer = (enhProm.start + enhProm.stop)/2;
					var enhPromAngle = conChromosome.startAngle + pointer*(conChromosome.endAngle - conChromosome.startAngle)/conChromosome.length;
					var enhpromCoords = {"x": center.x + newInnerRadius*Math.cos(enhPromAngle), "y": center.y + newInnerRadius*Math.sin(enhPromAngle)};
					console.log(enhpromCoords);
					var subCord = new Kinetic.Line({
						points: [comCircPos.x, comCircPos.y, enhpromCoords.x, enhpromCoords.y],
						tension: 1,
						stroke: "#000",
						strokeWidth: 1,
						opacity: 0.5
					});
					connectorGroup.add(subCord)
				}
			}*/
		}
		enhPromConnectorGroup.add(connectorGroup);
		doneConEnhProms++;
	})
}


function parseRows(data, gene, type, ideoArcCenter, conIdeogram, midPoints, chromoMidPoints, ideoInnerLayerRadius, repOuterRadius, repInnerRadius, newOuterRadius, newInnerRadius) {
	var rows = data.split("<br>");
	var gene1id = geneLocator[gene];
	var gene1 = chromosomes[gene1id.split("_")[0]].genes[gene1id.split("_")[1].substring(4)];
	var gene1StartAngle = ideoArcCenter - Math.PI/2 + Math.PI*(gene1.start-conIdeogram.start)/(conIdeogram.stop-conIdeogram.start);
	var gene1EndAngle = ideoArcCenter - Math.PI/2 + Math.PI*(gene1.stop-conIdeogram.start)/(conIdeogram.stop-conIdeogram.start);	
	var gene1Mid = (gene1StartAngle+gene1EndAngle)/2;
	var conIdeogramStartAngle = ideoArcCenter - Math.PI/2 + Math.PI*conIdeogram.start/chromosomes[gene1id.split("_")[0]].length;
	var conIdeogramEndAngle = ideoArcCenter - Math.PI/2 + Math.PI*conIdeogram.stop/chromosomes[gene1id.split("_")[0]].length;
	var conIdeogramMid = (conIdeogramStartAngle+conIdeogramEndAngle)/2;
	
	var midPointsSec = [];
	var chromoMidPointsSec = [];
	for(i in midPoints){
		if(gene1Mid < conIdeogramMid) {
			if(gene1Mid < midPoints[i].angle && midPoints[i].angle < conIdeogramMid)
				midPointsSec.push(midPoints[i]);
		} else {
			if(gene1Mid > midPoints[i].angle && midPoints[i].angle > conIdeogramMid)
				midPointsSec.push(midPoints[i]);
		}
	}
	if(gene1Mid > conIdeogramMid)
		midPointsSec.reverse();
	
	for(i in chromoMidPoints){
		if(conIdeogramMid < ideoArcCenter) {
			if(conIdeogramMid < chromoMidPoints[i].angle && chromoMidPoints[i].angle < ideoArcCenter)
				chromoMidPointsSec.push(chromoMidPoints[i]);
		} else {
			if(conIdeogramMid > chromoMidPoints[i].angle && chromoMidPoints[i].angle > ideoArcCenter)
				chromoMidPointsSec.push(chromoMidPoints[i]);
		}
	}
	if(conIdeogramMid > ideoArcCenter)
		chromoMidPointsSec.reverse();
	
	var ideoCenterRadius = (ideoInnerLayerRadius + repOuterRadius)/2;
	var chromoCenterRadius = (repInnerRadius + newOuterRadius)/2;
	
	
	for(i in rows){
		var relation = rows[i].split("\t");
		if(relation.length > 2) {		
			var gene2id = geneLocator[relation[1]];
			if(typeof gene2id != "undefined") {
				var gene2 = chromosomes[gene2id.split("_")[0]].genes[gene2id.split("_")[1].substring(4)];
				var gene2Mid = (gene2.startAngle+gene2.endAngle)/2;
				var weight = parseInt(relation[2]);
				var id = relation[0];
				
				var chordPoints = [];
				chordPoints.push({"x": center.x + ideoInnerLayerRadius*Math.cos(gene1Mid), "y": center.y + ideoInnerLayerRadius*Math.sin(gene1Mid)});
				chordPoints.push({"x": center.x + ideoCenterRadius*Math.cos(gene1Mid), "y": center.y + ideoCenterRadius*Math.sin(gene1Mid)});
				for (i in midPointsSec){
					chordPoints.push({"x": midPointsSec[i].x, "y": midPointsSec[i].y});
				}
				chordPoints.push({"x": center.x + ideoCenterRadius*Math.cos(conIdeogramMid), "y": center.y + ideoCenterRadius*Math.sin(conIdeogramMid)});
			//	chordPoints.push({"x": center.x + repOuterRadius*Math.cos(conIdeogramMid), "y": center.y + repOuterRadius*Math.sin(conIdeogramMid)});
			//	chordPoints.push({"x": center.x + repInnerRadius*Math.cos(conIdeogramMid), "y": center.y + repInnerRadius*Math.sin(conIdeogramMid)});
				chordPoints.push({"x": center.x + chromoCenterRadius*Math.cos(conIdeogramMid), "y": center.y + chromoCenterRadius*Math.sin(conIdeogramMid)});
				for (i in chromoMidPointsSec){
					chordPoints.push({"x": chromoMidPointsSec[i].x, "y": chromoMidPointsSec[i].y});
				}
				
				for(i = 0; i < 24; i ++) {
					if(renderedConnections[gene1id.split("_")[0]][i].pair == gene2id.split("_")[0])
						var segmentedAngle = (renderedConnections[gene1id.split("_")[0]][i].start+renderedConnections[gene1id.split("_")[0]][i].stop)/2
				}
				
				chordPoints.push({"x": center.x + chromoCenterRadius*Math.cos(segmentedAngle), "y": center.y + chromoCenterRadius*Math.sin(segmentedAngle)});
				
				var point1 = {"x": center.x + newInnerRadius*Math.cos(segmentedAngle), "y": center.y + newInnerRadius*Math.sin(segmentedAngle)};
				
				var point3 = {"x": center.x + newInnerRadius*Math.cos(gene2Mid), "y": center.y + newInnerRadius*Math.sin(gene2Mid)};
			//	chordPoints.push({"x": center.x, "y": center.y});
				var point2 = {"x": (center.x + 2*(point1.x + point3.x)/2)/3, "y": (center.y + 2*(point1.y + point3.y)/2)/3};
				chordPoints.push(point1);
				chordPoints.push(point2);
				chordPoints.push(point3);
				switch(type){
					case "pathway" : color = "#00ff00"; layer = pathwayConLayer; weight = weight*pathConLevel/20; break;
					case "publication" : color = "#0000ff"; layer = pubConLayer; weight = weight*pubConLevel/20; break;
					case "disease" : color = "#ff0000"; layer = diseaseConLayer; weight = weight*disConLevel/2; break;
				}
				var chord = getSpline(chordPoints, color, id, weight); 
				layer.add(chord);
			}
			// Calls back to GenomeWheel.js need to somehow make it independent but without timers
		}
	}
	chordCounter++;
}

/**
 * Retrieves all the cancer genes from Cancer Gene Census
 * 
 */
function getCancerGenes(){
	d3.tsv('static/data/genomesnip/cancer_gene_census.tsv', function (data){
		for(i in data){
			var geneId = geneLocator[data[i].Symbol];
			if(typeof geneId != "undefined"){
				var cancerGene = chromosomes[geneId.split("_")[0]].genes[geneId.split("_")[1].substring(4)];
				if(data[i]["Cancer Somatic Mut"] == "yes")
					cancerGene.somaticMut = true;
				if(data[i]["Cancer Germline Mut"] == "yes")
					cancerGene.germlineMut = true;
				cancerGenes.push(geneId);
			}
		}
	});
}