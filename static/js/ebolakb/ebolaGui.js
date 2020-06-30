var divHeights = jQuery("#genomicsDiv").width() - 50;
jQuery("#publications_container").height(divHeights);
jQuery("#genes_container").height(divHeights);
jQuery("#specpublications_container").height(divHeights);
jQuery("#ligands_container").height(divHeights);
jQuery("#specligands_container").height(divHeights);
jQuery("#goTerms_container").height(divHeights);
jQuery("#specgoTerms_container").height(divHeights);
jQuery("#pubVizOffset").height(divHeights);
jQuery("#sigmaViz-parent").height(divHeights);
jQuery("#threedStructsdf").width(jQuery("#genomicsDiv").width())
jQuery("#threedStructsdf").height(divHeights - 50);

var randomPdbs = ["3FKE", "4LDB", "4LDD", "4LDI", "4IBC", "4IBB", "4IBD", "4IBE", "4IBF", "4IBG", "3JW2"];
viewStructure(randomPdbs[Math.floor((Math.random() * 10) + 1)]);

function display(displayType, data, resourceId, resourceName) {
    //console.log(displayType);
    //console.log(data);

    var selector = '#' + displayType + '_container';

    if (resourceId != "") {
        switch (displayType) {
            case 'publications':
                link = 'http://www.ncbi.nlm.nih.gov/pubmed/';
                title = "<h4>Publications about [" + resourceId + "] " + resourceName + "</h4>";
                break;
            case 'ligands':
                link = 'http://www.rcsb.org/pdb/ligand/ligandsummary.do?hetId=';
                title = "<h4>Ligands associated with [" + resourceId + "] " + resourceName + "</h4>";
                break;
            case 'goTerms':
                link = 'http://amigo.geneontology.org/amigo/term/GO:';
                title = "<h4>GO Terms associated with [" + resourceId + "] " + resourceName + "</h4>";
                break;
        }
    } else {
        switch (displayType) {
            case 'publications':
                link = 'http://www.ncbi.nlm.nih.gov/pubmed/';
                title = "<h4>All Publications</h4>";
                break;
            case 'ligands':
                link = 'http://www.rcsb.org/pdb/ligand/ligandsummary.do?hetId=';
                title = "<h4>All Ligands</h4>";
                break;
            case 'goTerms':
                link = 'http://amigo.geneontology.org/amigo/term/GO:';
                title = "<h4>All GO Terms</h4>";
                break;
        }
    }

    jQuery(selector).html(title);
    console.log(displayType)
    //console.log(displayType + "-" + data.length);
    d3.select(selector).append("table").attr("width", "100%").selectAll("tr").data(data).enter().append("tr")
        .style("border-bottom", "1px solid black")
        .html(function(d) {
            if (displayType == 'goTerms') {
                console.log(d);
            }
            var extraTerm = "";
            if (displayType == 'goTerms')
                text = d.title.value + " (" + d.namespace.value + ")";
            else {
                if (d[0].length > 1)
                    text = d[0].substring(1, d[0].length - 1);
                else
                    text = d[0]
            }
            if (d[2].length > 1)
                identifer = d[2].substring(1, d[2].length - 1);
            else
                identifer = d[2]
            if (displayType == 'ligands' && typeof(d[3]) !== "undefined") {
                drugbankUriParts = d[3].split(/[:#\/]/);
                drid = drugbankUriParts[drugbankUriParts.length - 1]
                if (drid.length > 0) {
                    drid = drid.substring(0, drid.length - 1)
                    extraTerm = "<a href='http://www.drugbank.ca/drugs/" + drid + "' target='_blank'><i class=\"icon-leaf icon-black\"></i></a>";
                }
            }
            return "<td align='left' style='border-right: 1px solid black'><a href='" + link + identifer + "' target='_blank'><i class=\"icon-share icon-black\"></i></a>" + extraTerm + "</td><td align='left'><a href=\"javascript:openTab('" + d[1] + "', '" + identifer + "', '" + displayType + "')\">[" + identifer.toUpperCase() + "] " + text + "</a></td>"
        });
    jQuery(".splashScreenExplorer").hide();
}

function publishTable() {
    var selector = "#genes_container";
    var html = "<h4><a href='javascript:getAll()'>Ebola Virus (EBOV) Genes and Protein Domains</a><span class='pull-right'><a href='http://www.ncbi.nlm.nih.gov/nuccore/NC_002549' target='_blank' title='Reference Genome'><i class='icon-share'></i></a></span></h4><h6>(683 Publications (P)) (1783 Ligands (L))</h6>"
    html += "<ul>";
    for (i in proteins) {
        html += "<li><a href='javascript:makeRequest(\"protein\",\"" + proteins[i].id + "\", \"" + proteins[i].proteinName + "\")'>[" + proteins[i].id + "] " + proteins[i].proteinName + "</a> (<b>P: </b>" + proteins[i].publications + ") (<b>L :</b>" + proteins[i].ligands + ")<ul>";
        for (j in proteins[i].domains) {
            html += "<li><a href='javascript:makeRequest(\"domain\",\"" + proteins[i].domains[j].id + "\", \"" + proteins[i].domains[j].signature + "\")'>[" + proteins[i].domains[j].id + "] " + proteins[i].domains[j].signature + "</a> (<b>P: </b>" + proteins[i].domains[j].publications + ") (<b>L :</b>" + proteins[i].domains[j].ligands + ")</li>";
        }
        html += "</ul></li>"
    }
    html += "</ul>";
    jQuery(selector).html(html);
}

function openTab(uri, identifier, displayType) {
    var selectorTab = "#spec" + displayType;
    var selector = selectorTab + "_container";
    jQuery(selectorTab).html(identifier);
    jQuery(selector).html("");

    getAddDetail(uri, identifier, "spec" + displayType);

    if (displayType == "publications") {
        getMeshDetail(uri, identifier);
    }
}

function openAnnotationTab(uri, identifier, resourceType, displayType, label) {
    var selectorTab = "#spec" + displayType;
    var selector = selectorTab + "_container";
    jQuery(selectorTab).html(identifier);
    jQuery(selector).html("<h4>[" + identifier + "] " + label + "</h4>");
    getAddAnnDetail(uri, identifier, resourceType, displayType);
}

function strip_quotes(x) {
    return x.substring(1, x.length-1)
}

function displaySpecAnn(resourceType, data, identifier, displayType) {
    var selector = "#spec" + displayType + "_container";
    if (resourceType == "specInterpro") {
        var link = "http://www.ebi.ac.uk/interpro/signature/";
        d3.select(selector).append("table").attr("width", "100%").attr("id", displayType + "_table").selectAll("tr").data(data).enter()
            .append("tr").style("border-bottom", "1px solid black")
            .html(function(d) {
                return "<th align='left'>" + strip_quotes(d[3]) + 
                        "</th><td align='left'>" + strip_quotes(d[1]) + 
                        "</td><td align='left'>" + strip_quotes(d[2]) + 
                        "</td><td align='left'><a href='" + link + strip_quotes(d[4]) + 
                        "' target='_blank'><i class=\"icon-share icon-black\"></i></a></td>";
            });
    } else {
        var link = "http://amigo.geneontology.org/amigo/term/GO:";
        d3.select(selector).append("table").attr("width", "100%").attr("id", displayType + "_table").selectAll("tr").data(data).enter()
            .append("tr").style("border-bottom", "1px solid black")
            .html(function(d) {
                return "<th align='left'>" + strip_quotes(d[0]) + "</th><td align='left'><a href='" + link + identifier + "' target='_blank'><i class=\"icon-share icon-black\"></i></a></td>";
            });
    }
}

function displaySpec(displayType, data, identifier) {
    var selector = "#" + displayType + "_container";
    var meshTerms = "";
    var authors = "";
    var pdbTerms = "";
    var pubmedTerms = "";

    d3.select(selector).append("table").attr("width", "100%").attr("id", displayType + "_table").selectAll("tr").data(data).enter()
        .append("tr").style("border-bottom", "1px solid black")
        .html(function(d) {
            var predicateTerms = d[1].split(/[:#\/]/);
            var predicate = predicateTerms[predicateTerms.length - 1];
            predicate = predicate.substring(0, predicate.length-1)
            objt = d[2].substring(1, d[2].length-1)
            if (predicate == "Mesh_Term") {
                meshTerms += objt + ", ";
                return "";
            } else if (predicate == "Author") {
                authors += objt + ", ";
                return "";
            } else if (predicate == "PDB_Structure") {
                var pdbparts = d[2].split(/[:#\/]/);
                var pdbIdentifier = pdbparts[pdbparts.length - 1].toUpperCase();
                pdbIdentifier = pdbIdentifier.substring(0, pdbIdentifier.length-1)
                pdbTerms += "<a href='javascript:viewStructure(\"" + pdbIdentifier + "\")'>" + pdbIdentifier + "</a>  <a href='http://www.rcsb.org/pdb/explore.do?structureId=" + pdbIdentifier + "' target='_blank'><i class=\"icon-share icon-black\"></i></a>, "
            } else if (predicate == "DrugBank_Drug") {
                var drugparts = d[2].split(/[:#\/]/);
                var drugIdentifier = drugparts[drugparts.length - 1].toUpperCase();
                drugIdentifier = drugIdentifier.substring(0, drugIdentifier.length-1)
                return "<th align='left'>" + predicate + "</th><td align='left'><a href='http://www.drugbank.ca/drugs/" + drugIdentifier + "' target='_blank'>" + drugIdentifier + "  <i class=\"icon-share icon-black\"></i></a>, "
            } else if (predicate == "PubMedRecord") {
                var pubparts = d[2].split(/[:#\/]/);
                var pubIdentifier = pubparts[pubparts.length - 1].toUpperCase();
                pubIdentifier = pubIdentifier.substring(0, pubIdentifier.length-1)
                pubmedTerms += "<a href=\"javascript:openTab('<http://bio2rdf.org/pubmed:" + pubIdentifier + ">','" + pubIdentifier + "','publications')\">" + pubIdentifier + "</a>  <a href='http://www.ncbi.nlm.nih.gov/pubmed/" + pubIdentifier + "' target='_blank'><i class=\"icon-share icon-black\"></i></a>, ";
            } else {
                return "<th align='left'>" + predicate + "</th><td align='left'>" + objt + "</td>"
            }
        });

    if (authors != "")
        jQuery("#" + displayType + "_table").append("<tr style='border-bottom:1px solid black'><th align='left'>Authors</th><td align='left'>" + authors + "et al</td></tr>");
    if (meshTerms != "")
        jQuery("#" + displayType + "_table").append("<tr style='border-bottom:1px solid black'><th align='left'>Mesh Terms</th><td align='left'>" + meshTerms + "</td></tr>");
    if (pdbTerms != "")
        jQuery("#" + displayType + "_table").append("<tr style='border-bottom:1px solid black'><th align='left'>PDB Structures</th><td align='left'>" + pdbTerms + "</td></tr><tr><th> <td> </tr>");
    if (pubmedTerms != "")
        jQuery("#" + displayType + "_table").append("<tr style='border-bottom:1px solid black'><th align='left'>PubMed Records</th><td align='left'>" + pubmedTerms + "</td></tr><tr><th> <td> </tr>");

    //jQuery('#' + displayType + 'tabIds a:last').tab('show');
}

function displayOther(displayType, data, resourceId) {
    var selector = "#goTerms_container";
    var goTerms = [];
    var interproTerms = [];

    var goTermLocator = [],
        interproTermLocator = [];

    if (resourceId != "")
        jQuery(selector).html("<h4>Annotations associated with " + resourceId + "</h4>")
    else
        jQuery(selector).html("<h4>All Annotations</h4>")
    d3.select(selector).append("table").attr("width", "100%").attr("id", displayType + "_table").selectAll("tr").data(data).enter()
        .append("tr").style("border-bottom", "1px solid black")
        .html(function(d) {
            var predicateTerms = d[1].split(/[:#\/]/);
            var predicate = predicateTerms[predicateTerms.length - 1];
            predicate = predicate.substring(0, predicate.length-1)

            var subjectTerms = d[0].split(/[:#\/]/);
            var subject = subjectTerms[subjectTerms.length - 1];
            var subjectType = subjectTerms[subjectTerms.length - 2];

            if (subjectType == "go") {
                if (goTermLocator[subject] != null) {
                    var goTerm = goTerms[goTermLocator[subject]];
                } else {
                    var goTerm = {
                        'uri': d[0],
                        'identifier': subject.substring(0, subject.length-1),
                        'namespace': '',
                        'label': ''
                    };
                    goTerms.push(goTerm);
                    goTermLocator[subject] = goTerms.length - 1;
                }
                if (predicate == "namespace")
                    goTerm.namespace = d[2].substring(1, d[2].length-1);
                else
                    goTerm.label = d[2].substring(1, d[2].length-1);
            } else if (subjectType == "interpro") {
                if (interproTermLocator[subject] != null) {
                    var interproTerm = interproTerms[interproTermLocator[subject]];
                    interproTerm.label = d[2];
                } else {
                    var interproTerm = {
                        'uri': d[0],
                        'identifier': subject.substring(0, subject.length-1),
                        'label': d[2].substring(1, d[2].length-1)
                    };
                    interproTerms.push(interproTerm);
                    interproTermLocator[subject] = interproTerms.length - 1;
                }
            }
        });
    var bp = "<tr style='border-bottom:1px solid black'><th colspan='2'>Biological Process Annotations </th></tr>",
        cc = "<tr style='border-bottom:1px solid black'><th colspan='2'>Cellular Component Annotations </th></tr>",
        mf = "<tr style='border-bottom:1px solid black'><th colspan='2'>Molecular Function Annotations </th></tr>";
    var link = "http://amigo.geneontology.org/amigo/term/GO:";
    var interproLink = "http://www.ebi.ac.uk/interpro/entry/";
    var interproRow = "<tr style='border-bottom:1px solid black'><th colspan='2'>Interpro Annotations </th></tr>";

    for (i in goTerms) {
        if (goTerms[i].namespace == "biological_process") {
            bp += "<tr style='border-bottom:1px solid black'><td style='border-right: 1px solid black'><a href='" + link + goTerms[i].identifier + "' target='_blank'><i class=\"icon-share icon-black\"></i></a></td><td align='left'><a href=\"javascript:openAnnotationTab('" + goTerms[i].uri + "', '" + goTerms[i].identifier + "', 'specGo', '" + displayType + "', '" + goTerms[i].label + "')\"> [" + goTerms[i].identifier + "] " + goTerms[i].label + "</a></td></tr>";
        } else if (goTerms[i].namespace == "cellular_component") {
            cc += "<tr style='border-bottom:1px solid black'><td style='border-right: 1px solid black'><a href='" + link + goTerms[i].identifier + "' target='_blank'><i class=\"icon-share icon-black\"></i></a></td><td align='left'><a href=\"javascript:openAnnotationTab('" + goTerms[i].uri + "', '" + goTerms[i].identifier + "', 'specGo', '" + displayType + "', '" + goTerms[i].label + "')\"> [" + goTerms[i].identifier + "] " + goTerms[i].label + "</a></td></tr>";
        } else {
            mf += "<tr style='border-bottom:1px solid black'><td style='border-right: 1px solid black'><a href='" + link + goTerms[i].identifier + "' target='_blank'><i class=\"icon-share icon-black\"></i></a></td><td align='left'><a href=\"javascript:openAnnotationTab('" + goTerms[i].uri + "', '" + goTerms[i].identifier + "', 'specGo', '" + displayType + "', '" + goTerms[i].label + "')\"> [" + goTerms[i].identifier + "] " + goTerms[i].label + "</a></td></tr>";
        }
    }
    for (i in interproTerms) {
        interproRow += "<tr style='border-bottom:1px solid black'><td style='border-right: 1px solid black'><a href='" + interproLink + interproTerms[i].identifier + "' target='_blank'><i class=\"icon-share icon-black\"></i></a></td><td align='left'><a href=\"javascript:openAnnotationTab('" + interproTerms[i].uri + "', '" + interproTerms[i].identifier + "', 'specInterpro', '" + displayType + "', '" + interproTerms[i].label + "')\"> [" + interproTerms[i].identifier + "] " + interproTerms[i].label + "</a></td></tr>";
    }

    jQuery("#" + displayType + "_table").html("<table width='100%'>" + interproRow + bp + cc + mf + "</table>");
}

function viewStructure(identifier) {
    var pdbFile = "http://www.rcsb.org/pdb/files/" + identifier + ".pdb";
    var divId = "threedStruct";
    jQuery("#threedStructsdf").html('');
    jQuery("#threedStructsdf_src").html('');
    jQuery("#threedId").html("<h4 align='center'>3D Structure View of " + identifier + "  <a href='http://www.rcsb.org/pdb/explore.do?structureId=" + identifier + "' target='_blank'><i class=\"icon-share icon-black\"></i></a></h4>");
    loadStructure(divId, pdbFile);
}