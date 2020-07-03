if (!storage.getItem("user")) {
  jQuery.getJSON("http://jsonip.com/?callback=?", function (data) {
      jQuery.ajax({
        url: "/create_user?ip=" + data["ip"],
        type: 'GET',
        beforeSend: function(){
            jQuery('.splashScreenExplorer').show();
        },
        complete: function(){
            jQuery('.splashScreenExplorer').hide();
        },
        success: function(response) {     
            output = JSON.parse(response);
            storage.setItem("user", output["user_id"]);
        },
        error: function(error) {
            console.log(error);
        }
    });
  });
} else {
  jQuery.getJSON("http://jsonip.com/?callback=?", function (data) {
      jQuery.ajax({
        url: "/check_user?ip=" + data["ip"] + "&user=" + storage.getItem("user"),
        type: 'GET',
        beforeSend: function(){
            jQuery('.splashScreenExplorer').show();
        },
        complete: function(){
            jQuery('.splashScreenExplorer').hide();
        },
        success: function(response) { 
            output = JSON.parse(response);  
            if (output["to_set"] == 1) {
              storage.setItem("user", output["user_id"]);
            }
        },
        error: function(error) {
            console.log(error);
        }
    });
  });
}


function retrieve_data(form_id, url, redirurl) {
    console.log(jQuery("#" + form_id).serialize());
    jQuery.ajax({
        url: url,
        method: 'POST',
        data: jQuery("#" + form_id).serialize(),
        success: function(response) {
          output = JSON.parse(response);
          if (output["success"] == 1) {jQuery(location).attr('href', redirurl);}
          else {alert("Please fill out all options :)")}
        },
        error: function(error) {
            console.log(error);
            //window.location.replace("cedar/h2");
        }
    });
}



jQuery("#start").click(function(){
  jQuery(location).attr('href', "cedar/h1");
});



///----------------- For H1

function present_dsetlist() {
  jQuery.get("/cedar/h1questions", function(data) {
    //console.log(data);
    d3.select("#main_plot div").selectAll("div").data(data).enter().append("div").html(function(d){ 
      //console.log(d)
      tabheader = '<form><table width="100%"><tr style="border-bottom: 2px solid black"><th width="25%" align="left" class="no-border">Ontology Term</th><th width="5%">Ontology Acronym</th><th>Absolutely Inappropriate</th><th>Inappropriate</th><th>Slightly Inappropriate</th><th>Neutral</th><th>Slightly Appropriate</th><th>Approriate</th><th>Absolutely Appropriate</th></tr>'
      tabcontent = ''
      ccount = 0;
      for (o in d.options) {
        opt = d.options[o];
        if (ccount % 2 == 0) {bgcolor = "#e6e6e6";}
        else {bgcolor = "#ffffff"};
        ccount += 1;
        tabcontent += '<tr style="border-bottom: 0.5px solid grey; background-color: '+bgcolor+'""><td width="25%" align="left" class="no-border"><b>' + opt["label"] + '</b><td align="center" width="5%" >' + opt["acr"] + '</td>' + 
                      '<td align="center" width="10%" ><input type="radio" name=q' + d.qid + "_o" + opt["optid"] + ' value="-3" required>' + 
                      '<td align="center" width="10%" ><input type="radio" name=q' + d.qid + "_o" + opt["optid"] + ' value="-2" required>' + 
                      '<td align="center" width="10%" ><input type="radio" name=q' + d.qid + "_o" + opt["optid"] + ' value="-1" required>' + 
                      '<td align="center" width="10%" ><input type="radio" name=q' + d.qid + "_o" + opt["optid"] + ' value="0" required>' + 
                      '<td align="center" width="10%" ><input type="radio" name=q' + d.qid + "_o" + opt["optid"] + ' value="1" required>' + 
                      '<td align="center" width="10%" ><input type="radio" name=q' + d.qid + "_o" + opt["optid"] + ' value="2" required>' + 
                      '<td align="center" width="10%" ><input type="radio" name=q' + d.qid + "_o" + opt["optid"] + ' value="3" required>' + 
                      '</tr>';
      }
      tabfooter = '</table><br><hr><br>'
      return "<h3>Select how appropriate is each ontology term to describe the text: <span style='color: #008000;'>" + d.text + "</span></h3><hr><br><br>" + tabheader + tabcontent + tabfooter
    });
  }, 'json');
}


jQuery("#h1submit").click(function(){
  retrieve_data("h1form", "/cedar/h1submit", "/cedar/h2");
});

jQuery("#user_id_h1").val(storage.getItem("user"));

present_dsetlist();

///----------------- For H2


function present_dseqlist() {
  jQuery.get("/cedar/h2questions", function(data) {
    //console.log(data);
    d3.select("#main_plot_h2 div").selectAll("div").data(data).enter().append("div").html(function(d){ 
      //console.log(d)
      tabheader = '<form><table width="100%"><tr style="border-bottom: 2px solid black"><th width="25%" align="left" class="no-border">Ontology Term</th><th width="5%">Ontology Acronym</th><th>Absolutely Inappropriate</th><th>Inappropriate</th><th>Slightly Inappropriate</th><th>Neutral</th><th>Slightly Appropriate</th><th>Approriate</th><th>Absolutely Appropriate</th></tr>'
      tabcontent = '';
      ccount = 0;
      for (o in d.options) {
        opt = d.options[o];
        if (ccount % 2 == 0) {bgcolor = "#e6e6e6";}
        else {bgcolor = "#ffffff"};
        ccount += 1;
        tabcontent += '<tr style="border-bottom: 0.5px solid grey; background-color: '+bgcolor+'"><td width="25%" align="left" class="no-border"><b>' + opt["label"] + '</b><td align="center" width="5%" >' + opt["acr"] + '</td>' + 
                      '<td align="center" width="10%" ><input type="radio" name=q' + d.qid + "_o" + opt["optid"] + ' value="-3" required>' + 
                      '<td align="center" width="10%" ><input type="radio" name=q' + d.qid + "_o" + opt["optid"] + ' value="-2" required>' + 
                      '<td align="center" width="10%" ><input type="radio" name=q' + d.qid + "_o" + opt["optid"] + ' value="-1" required>' + 
                      '<td align="center" width="10%" ><input type="radio" name=q' + d.qid + "_o" + opt["optid"] + ' value="0" required>' + 
                      '<td align="center" width="10%" ><input type="radio" name=q' + d.qid + "_o" + opt["optid"] + ' value="1" required>' + 
                      '<td align="center" width="10%" ><input type="radio" name=q' + d.qid + "_o" + opt["optid"] + ' value="2" required>' + 
                      '<td align="center" width="10%" ><input type="radio" name=q' + d.qid + "_o" + opt["optid"] + ' value="3" required>' + 
                      '</tr>';
      }
      tabfooter = '</table><br><hr><br>'
      return "<h3>Select how appropriate is each ontology term to describe the text: <span style='color: #008000;'>" + d.text + "</span></h3><hr><br><br>" + tabheader + tabcontent + tabfooter
    });
  }, 'json');
}

jQuery("#h2submit").click(function(){
  retrieve_data("h2form", "/cedar/h2submit", "/cedar/thankyou");
});

jQuery("#user_id_h2").val(storage.getItem("user"));


present_dseqlist();