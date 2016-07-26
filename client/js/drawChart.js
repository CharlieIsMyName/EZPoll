function drawPoll(){    //the main function that draws svg into "#resultPanel" using poll data
    var canvas=d3.select("#resultPanel").append("svg")
                    .attr('width','100%')
                    .attr('height','100%');
    var data=poll.optionList;
    
    var colorScale=d3.scale.category20();
    
    var width=$("#resultPanel").width();
    
    var arc=d3.svg.arc()
        .innerRadius(width/4)
        .outerRadius(width/2);
        
    var pie=d3.layout.pie()
            .value(function(d){ return d.voterIP.length})
    
    var group=canvas.append("g")
                .attr("transform","translate("+width/2+","+width/2+")");
    
    var arcs=group.selectAll(".arc")
            .data(pie(data))
            .enter()
                .append("g")
                .attr("class","arc")
    
    arcs.append('path')
        .attr("d",arc)
        .attr("fill",function(d){return colorScale(d.data.option)})
        
    arcs.append('text')
        .attr('transform',function(d){return "translate("+arc.centroid(d)+")"})
        .text(function(d){if(d.data.voterIP.length!=0)return d.data.option+ ": "+d.data.voterIP.length});
    
    
    
    
}
$(document).ready(function(){
    drawPoll();
});
