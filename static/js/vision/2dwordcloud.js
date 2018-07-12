function render_wordcloud(canvasId, word_dict) {
  var fill = d3.scale.category20();
  d3.select("#" + canvasId).html("");
  var layout = d3.layout.cloud()
                .size([jQuery("#" + canvasId).width(), 400])
                .words(word_dict.map(function(d) {
                  return {text: d.label, size: d.magnitude*4, rotation: 0, term_id: d.term_id, col: d.color, opacity: d.opacity};
                }))
                .padding(5)
                .rotate(function(d) { return d.rotation; })
                .font("Impact")
                .fontSize(function(d) { return d.size; })
                .on("end", draw);

  layout.start();

  function draw(words) {
    d3.select("#" + canvasId).append("svg")
        .attr("width", layout.size()[0])
        .attr("height", layout.size()[1])
      .append("g")
        .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
      .selectAll("text")
        .data(words)
      .enter().append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Impact")
        .style("fill", function(d) { return fill(d.col); })
        .attr("fill-opacity", function(d) { return d.opacity;})
        .on('mouseover', function() {document.body.style.cursor = 'pointer';})
        .on('mouseout', function() {document.body.style.cursor = 'default';})
        .on('click', function(d) {console.log(d);})
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
  }
}

function retrieve_wcdata(form_id) {
  jQuery.ajax({
        url: '/gen_2d_time',
        type: 'POST',
        data: jQuery(form_id).serialize(),
        beforeSend: function(){
            jQuery('.splashScreenExplorer').show();
        },
        complete: function(){
            jQuery('.splashScreenExplorer').hide();
        },
        success: function(response) {
            output = JSON.parse(response);
            render_wordcloud("time_plot_1", output["prev"]);
            render_wordcloud("time_plot_2", output["curr"])
        },
        error: function(error) {
            console.log(error);
        }
    });
}