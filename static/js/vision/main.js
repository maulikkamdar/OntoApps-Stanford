var cur_plot = "na";
var _div_scatter_dataset = false;
var _div_scatter_input = false;
var _div_volcano_input = false;
var _div_volcano_dataset = false;

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
            storage.setItem("ontology", output["onto_name"]);
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
              storage.setItem("ontology", output["onto_name"]);
            }
            if (storage.getItem("ontology")) {
              launch_scatter();
              jQuery("#int_ontos").val(storage.getItem("ontology"))
            }
        },
        error: function(error) {
            console.log(error);
        }
    });
  });
}



var ontologies = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  prefetch: '/get_onto_list'
});
 
ontologies.initialize();
 
$('#autoComSearch .typeahead').typeahead({
    hint: false,
    highlight: true
  },
  {
    name: 'ontologies',
    displayKey: 'name',
    source: ontologies.ttAdapter(),
    templates: {
      //header: '<h3 class="categoryName"></h3>'
    }
  }
);

$('#autoComSearch').bind('typeahead:selected', function(obj, datum, name) { 
  jQuery.ajax({
        url: "/set_ontology?onto_name=" + datum["acronym"] + "&user_id=" + storage.getItem("user"),
        type: 'GET',
        beforeSend: function(){
            jQuery('.splashScreenExplorer').show();
        },
        complete: function(){
            jQuery('.splashScreenExplorer').hide();
        },
        success: function(response) {     
            output = JSON.parse(response);
            storage.setItem("ontology", output["onto_name"]);
            cur_plot = "na";
            launch_scatter();
        },
        error: function(error) {
            console.log(error);
        }
    });
  //$("#sel_onto_in_scatter").val(datum["acronym"]);     
});

function launch_scatter() {
  if (cur_plot == "scatter") {return false;}
  $("#" + cur_plot + "_launch").removeClass('active');
  $("#scatter_launch").addClass('active');
  cur_plot = "scatter";
  _div_scatter_input = true;
  _div_scatter_dataset = true;
  jQuery("#main_plot").load("/scatter-plot", function() {
    scatterPlot = new ScatterPlot("scatter2d_count", "scatter")
    scatterPlot.load_base_canvas();
    jQuery("#user_id_scatter").val(storage.getItem("user"));
    jQuery.get('/get_depth_range?user_id=' + storage.getItem("user"), function(data){
        scatterPlot.update_slider(data["mind"], data["maxd"]);
    },'json');
    scatterPlot.retrieve_data("scatter_form", "/gen_2d_scatter");
    jQuery("#scatter_dselect").css("right", "300px");
    jQuery("#scatter_dselect").draggable();
    jQuery("#scatter_params").draggable();
    jQuery("#legend_info").click(function(){
        scatterPlot.show_hide_legend();
    });
    jQuery("#boxselect").click(function(){
        scatterPlot.show_hide_selection_box("boxselect");
    });
    jQuery("#zoom_in").click(function(){
        scatterPlot.zoom_in("zoom_in");
    });
    jQuery("#drag_scatter").click(function() {
        scatterPlot.drag("drag_scatter");
    })
    jQuery("#zoom_out").click(function(){
        scatterPlot.zoom_out("zoom_out");
    });
    jQuery("#refresh_scatter").click(function(){
        scatterPlot.retrieve_data("scatter_form", "/gen_2d_scatter");
    });
    jQuery("#dresh_scatter").click(function(){
        scatterPlot.retrieve_data("scatter_form", "/gen_2d_scatter");
    });
    jQuery("#datasets_btn").click(function() {
      show_hide_div("scatter_dselect", "_div_scatter_dataset");
    });
    jQuery("#inputs_btn").click(function() {
      show_hide_div("scatter_params", "_div_scatter_input");
    })
    jQuery.get('/get_quantiles', function(data){
        for (k in data) {
            jQuery("#cselect-widget").append($('<option>', {value:data[k], text:k}));
            jQuery("#sselect-widget").append($('<option>', {value:data[k], text:k}));
        }
    },'json');
  });
}

function launch_volcano() {
  if (cur_plot == "volcano") {return false;}
  $("#" + cur_plot + "_launch").removeClass('active');
  $("#volcano_launch").addClass('active');
  cur_plot = "volcano";
  _div_volcano_input = true;
  _div_volcano_dataset = true;
  jQuery("#main_plot").load("/volcano-plot", function() {
    volcanoPlot = new ScatterPlot("scatter2d_volcano", "volcano")
    volcanoPlot.load_base_canvas();
    jQuery("#user_id_volcano").val(storage.getItem("user"));
    jQuery("#volcano_dselect").css("right", "300px");
    jQuery("#volcano_dselect").draggable();
    jQuery("#volcano_params").draggable();
    jQuery.get('/get_depth_range?user_id=' + storage.getItem("user"), function(data){
        volcanoPlot.update_slider(data["mind"], data["maxd"]);
    },'json');
    volcanoPlot.retrieve_data("volcano_form", "/gen_2d_volcano");
    jQuery("#refresh_volcano").click(function(){
        volcanoPlot.retrieve_data("volcano_form", "/gen_2d_volcano");
    });
    jQuery("#dresh_volcano").click(function(){
        volcanoPlot.retrieve_data("volcano_form", "/gen_2d_volcano");
    });
    jQuery("#legend_info_volcano").click(function(){
        volcanoPlot.show_hide_legend();
    });
    jQuery("#datasets_volcano").click(function() {
      show_hide_div("volcano_dselect", "_div_volcano_dataset");
    });
    jQuery("#inputs_volcano").click(function() {
      show_hide_div("volcano_params", "_div_volcano_input");
    })
    jQuery("#boxselect_volcano").click(function(){
        volcanoPlot.show_hide_selection_box("boxselect_volcano");
    });
    jQuery("#zoom_in_volcano").click(function(){
        scatterPlot.zoom_in("zoom_in_volcano");
    });
    jQuery("#drag_volcano").click(function() {
        volcanoPlot.drag("drag_volcano");
    })
    jQuery("#zoom_out_volcano").click(function(){
        scatterPlot.zoom_out("zoom_out_volcano");
    });
    jQuery.get('/get_quantiles', function(data){
        for (k in data) {
            jQuery("#cselect-widget-volcano").append($('<option>', {value:data[k], text:k}));
            jQuery("#sselect-widget-volcano").append($('<option>', {value:data[k], text:k}));
        }
    },'json');
  });
}

function launch_time() {
  if (cur_plot == "time") {return false;}
  $("#" + cur_plot + "_launch").removeClass('active');
  $("#time_launch").addClass('active');
  cur_plot = "time";
  jQuery("#main_plot").load("/time-plot", function() {
    jQuery("#time_dselect").css("right", "300px");
    jQuery("#time_dselect").draggable();
    jQuery("#time_params").draggable();
    jQuery("#user_id_time").val(storage.getItem("user"));
    retrieve_wcdata("#time_form");
    jQuery("#refresh_time").click(function(){
        retrieve_wcdata("#time_form");
    });
    jQuery("#dresh_time").click(function(){
        retrieve_wcdata("#time_form");
    });
  });
}

function launch_landscape() {
  if (cur_plot == "landscape") {return false;}
  $("#" + cur_plot + "_launch").removeClass('active');
  $("#landscape_launch").addClass('active');
  cur_plot = "landscape";
  jQuery("#main_plot").load("/landscape-plot", function() {
    jQuery.ajax({
        url: '/gen_2d_landscape',
        type: 'POST',
        data: jQuery("#landscape_params").serialize(),
        beforeSend: function(){
            jQuery('.splashScreenExplorer').show();
        },
        complete: function(){
            jQuery('.splashScreenExplorer').hide();
        },
        success: function(response) {
            output = JSON.parse(response);
        },
        error: function(error) {
            console.log(error);
        }
    });
  });
}

function launch_bugplot() {
  jQuery("#path_plot").load("/bug-plot", function() {
    jQuery.ajax({
        url: '/gen_bugs',
        type: 'POST',
        data: "user_id=" + storage.getItem("user"),
        beforeSend: function(){
            jQuery('.splashScreenExplorer').show();
        },
        complete: function(){
            jQuery('.splashScreenExplorer').hide();
        },
        success: function(response) {
            output = JSON.parse(response);
            vizBugs("bug_plot_canvas", output);
        },
        error: function(error) {
            console.log(error);
        }
    });
  });
}

function plotGraph(term_list) {
  console.log(term_list);
  jQuery.ajax({
    url: '/gen_sigma_graph',
    type: 'POST',
    data: "term_list=" + term_list + "&user_id=" + storage.getItem("user"),
    beforeSend: function(){
        jQuery('.splashScreenExplorer').show();
    },
    complete: function(){
        jQuery('.splashScreenExplorer').hide();
    },
    success: function(response) {
        output = JSON.parse(response);
        console.log(output);
        initVisualization(output["nodes"], output["edges"], "ontograph")
    },
    error: function(error) {
        console.log(error);
    }
  });
}

jQuery("#scatter_launch").click(function (){
  launch_scatter();
});

jQuery("#volcano_launch").click(function (){
  launch_volcano();
})

jQuery("#time_launch").click(function (){
  launch_time();
})

jQuery("#landscape_launch").click(function (){
  launch_landscape();
})

jQuery("#bug_launch").click(function (){
  launch_bugplot();
})

jQuery('.splashScreenExplorer').hide();

function removeDiv(div_id, div_indicator) {
  jQuery("#"+div_id).hide();
  div_indicator = false;
}

function show_hide_div (div_id, div_indicator) {
    if(!this[div_indicator]) {
        $("#" + div_id).show();
        this[div_indicator] = true;
    } else {
        this[div_indicator] = false;
        $("#" + div_id).hide();
    }
}

jQuery("#pathTab").click(function() {
  launch_bugplot();
});

//launch_bugplot()


