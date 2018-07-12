function present_dsetlist() {
  jQuery.get("/bionic/statsdsets", function(data) {
    d3.select("#main_plot table").selectAll("tr").data(data).enter().append("tr").html(function(d){ 
       return "<td><b>" + d.onto_name + "</b>" + 
            "<td align='right'><a href=../" + d.filepath + "> (" + d.size + ") <span class='icon icon-th' aria-hidden='true'></span></a>" + 
            "<td align='right'><a href=../" + d.rdf_file_path + "> (" + d.rdf_size + ") <span class='icon icon-hdd' aria-hidden='true'></span></a>" +
            "<td align='center'><a href=http://bioportal.bioontology.org/ontologies/" + d.onto_id + "><span class='icon icon-share' aria-hidden='true'></span></a>"
       });
  }, 'json');
}

function present_dseqlist() {
  jQuery.get("/bionic/seqsdsets", function(data) {
    d3.select("#path_plot table").selectAll("tr").data(data).enter().append("tr").html(function(d){ 
       return "<td><b>" + d.onto_name + "</b>" + 
            "<td align='right'><a href=../" + d.filepath + "> (" + d.size + ") <span class='icon icon-th' aria-hidden='true'></span></a>" + 
            "<td align='right'><a href=../" + d.rdf_file_path + "> (" + d.rdf_size + ") <span class='icon icon-hdd' aria-hidden='true'></span></a>" +
            "<td align='center'><a href=http://bioportal.bioontology.org/ontologies/" + d.onto_id + "><span class='icon icon-share' aria-hidden='true'></span></a>"
       });
  }, 'json');
}


jQuery("#pathTab").click(function (){
  present_dseqlist();
});

jQuery("#countTab").click(function (){
  present_dsetlist();
})


present_dsetlist();