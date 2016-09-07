output = [];
ontologyList = [];
typeList = [];
typeList["A"] = "Preferred Label";
typeList["E"] = "Exact Synonym";
typeList["R"] = "Related Synonym";
typeList["U"] = "Other Synonym";
currentStr = "";

d3.json("../static/data/ontologyDescriptions.json", function(response){
    ontologyDescriptions = response["results"]["bindings"];
    for (k in ontologyDescriptions) {
        ontologyList[ontologyDescriptions[k]["acr"]["value"]] = ontologyDescriptions[k]["name"]["value"];
    }
    //console.log(ontologyList);
});

function printTable(type) {
    var typeStr = ""
    for (k in type) {
        if (k == 0)
            typeStr = "Degree " + type[k] + ": "  
        else
            typeStr = typeStr + typeList[type[k]] + " - "
    }
    typeStr = typeStr + "Matching"
    jQuery('#outputTable tr:last').after('<tr style="border-bottom:1px solid black; background-color:#cccccc"><th colspan="6">'+typeStr+'</th></tr>');
    for (k in output[type]) {
        iris = output[type][k]["compositeParams"][0];
        ontologies = output[type][k]["compositeParams"][1].split(":-:");
        newOntologies = [];
        for (m in ontologies) {
            newOntologies.push("<a href='http://bioportal.bioontology.org/ontologies/"+ontologies[m]+"' target='_blank'>" + (typeof ontologyList[ontologies[m]] === "undefined"? ontologies[m] : ontologyList[ontologies[m]]) + "</a>")
        }
        labels = output[type][k]["compositeParams"][2].split(":-:").join(", ");
        var exact = "", related = "", other = "";
        if (output[type][k]["compositeParams"].length > 3) exact = output[type][k]["compositeParams"][3].split(":-:").join(", ");
        if (output[type][k]["compositeParams"].length > 4) related = output[type][k]["compositeParams"][4].split(":-:").join(", ");
        if (output[type][k]["compositeParams"].length > 5) other = output[type][k]["compositeParams"][5].split(":-:").join(", ");
        jQuery('#outputTable tr:last').after('<tr style="border-bottom:1px solid black"><td><a href="' + iris + '" target="_blank">' + iris + '</a></td><td>' + newOntologies.join("<br>") + '</td><td>' + labels + '</td><td>' + exact + '</td><td>' + related + '</td><td>' + other + '</td></tr>');
    }
}

function query() {
    jQuery.ajax({
        url: '/ontoreuse/similarTerms',
        data: jQuery('#formSim').serialize(),
        type: 'POST',
        success: function(response) {
            jQuery('#outputTable').html('<tr><th width="16%">IRI</th><th width="16%">Ontologies</th><th width="16%">Labels</th><th width="18%">Exact Synonyms</th><th width="17%">Related Synonyms</th><th width="17%">Other Synonymns</th></tr>');
            output = JSON.parse(response);
            //console.log(output);
            for (var item in output) {
                printTable(item);
            }
        },
        error: function(error) {
            console.log(error);
        }
    });
}

function queryGraph(dataStr) {
    console.log(dataStr);
    clearCanvas("termOverlapView");
    jQuery.ajax({
        url: '/ontoreuse/similarTermsGraph',
        data: dataStr,
        type: 'POST',
        success: function(response) {
            output = JSON.parse(response);
            initVisualization(output.nodes, output.links, "termOverlapView", "termOverlap", ["search", "iri", "onto"], ["RR", "AA", "O", "AE", "EE", "ER", "AR"])
        },
        error: function(error) {
            console.log(error);
        }
    });
}

jQuery('#btnCheck').click(function() {
    query();
});

jQuery("#termString").keydown(function(event) {
    if (event.which == 13){  // enter
        event.preventDefault();
      query();
      queryGraph(jQuery('#formSim').serialize());
    }
  });

jQuery("#termOverlapTab").click(function() {
    if(jQuery("#termString").val() != "" && jQuery("#termString").val()!=currentStr) { 
        var dataStr = jQuery('#formSim').serialize();
        //dataStr.push({"degree": 2})
        currentStr = jQuery("#termString").val();
        queryGraph(dataStr); 
    }
});