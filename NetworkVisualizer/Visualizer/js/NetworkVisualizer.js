document.getElementById("fileinput").addEventListener("change", handleFileSelect, false);

var force;
var curGraph;
var curFilename = "";
var width = window.innerWidth - 2;
var height = window.innerHeight - 92;

var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);
var color = d3.scale.category10()
d3.select("svg").append("text")
    .attr("transform", "translate(" + (width / 2) + ", " + (height / 2) + ")")
	.style("text-anchor", "middle")
    .style("font", '10pt "Helvetica Neue", Arial, Helvetica, Geneva, sans-serif')
    .text("No network file.")

function handleFileSelect(event) {
    var files = event.target.files;
    if (curFilename !== files[0].name) {
        d3.select("svg").selectAll("*").remove();
        curFilename = files[0].name;
        visualize("data/" + curFilename);
    }

    // Button click function to save d3 rendering as SVG format
    d3.select("#save_as_svg").on("click", function () {
        var doctype = '<?xml version="1.0" standalone="no"?>'
            + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
        var serializer = new XMLSerializer();
        var source = serializer.serializeToString(d3.select("svg").node());
        var blob = new Blob([doctype + source], { type: "image/svg+xml" });
        saveAs(blob, getFilenameWithoutExtension(curFilename) + ".svg");
    });

    // Button click function to save d3 rendering as PNG format
    d3.select("#save_as_png").on("click", function () {
        var doctype = '<?xml version="1.0" standalone="no"?>'
            + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
        var serializer = new XMLSerializer();
        var source = serializer.serializeToString(d3.select("svg").node());
        var blob = new Blob([doctype + source], { type: "image/svg+xml" });
        var url = window.URL.createObjectURL(blob);

        var canvas = document.querySelector("canvas");
        canvas.setAttribute("width", width);
        canvas.setAttribute("height", height);
        var context = canvas.getContext("2d");

        var image = new Image;
        image.src = url;
        image.onload = function () {
            context.drawImage(image, 0, 0);
            var a = document.createElement("a");
            a.download = getFilenameWithoutExtension(curFilename) + ".png";
            a.href = canvas.toDataURL("image/png");
            a.click();
        };
    });
}

function visualize(filename) {
	d3.json(filename, function(error, graph) {
		// Graph information
		var nClusters = d3.nest().key(function(d) {
			if (d.group > 0)
				return d.group;
			return 0;
			}).entries(graph.nodes).length - 1;
		
		// Show graph information
		svg.append("text")
			.attr("class", "graphinfo")
			.attr("transform", "translate(" + (width - 10) + ", " + (height - 10) + ")")
			.style("opacity", 0)
            .style("font", '9pt "Helvetica Neue", Arial, Helvetica, Geneva, sans-serif')
            .style("dominant-baseline", "middle")
			.transition()
			.duration(5000)
			.style("opacity", 100)
			.style("text-anchor", "end")
			.text("Twitter Ego-Network No."
					+ getFilenameWithoutExtension(filename)
					+ ": User(" + graph.nodes.length
					+ "), Friendship(" + graph.links.length
					+ "), Cluster(" + nClusters + ")");
		
		var k = Math.sqrt(graph.nodes.length / (width * height));
		
		curGraph = graph;
		force = d3.layout.force()
			.gravity(100 * k)				// Gravity between nodes
			.size([width, height])
			.nodes(graph.nodes)
			.links(graph.links)
			.linkStrength(function(link, i) {
				var sourceNode = link.source
				var targetNode = link.target
				var strength = Math.sqrt(link.value / graph.links.length)
				if (sourceNode.group === targetNode.group)
					strength = strength * 5;
				return strength;
			})
			.charge(function(node) {	// Force to charge(push) each other
				if (node.group === 0)
					return -30 / k;
				else
					return -15 / k;
			})
			.start()
		
		var link = svg.selectAll(".link")
			.data(graph.links)
			.enter()
			.append("line")
			.attr("class", "link")
			.style("stroke-width", function (d) { return d.value })
            .style("stroke", "#aaa")
	        .style("stroke-opacity", 0.3)
		
		var node = svg.selectAll(".node")
			.data(graph.nodes)
			.enter()
			.append("g")
			.attr("class", "node")
            .style("stroke-width", 1.5)
			.on("mouseover", mouseover)
			.on("mouseout", mouseout)
			.call(force.drag)
			
		node.append("circle")
			.attr("r", 8)
			.style("fill", function(d) {
				if (d.group === -1) return "#fff";
				else return color(d.group);
			})
			.style("opacity", function(d) {
				if (d.group === -1) return .7;
				else return 1;
			})
			.style("stroke", function(d) {
				if (d.group === -1) return "#aaa";
				else return color(d.group);
			})
            .style("stroke-width", 1.5)
			.style("stroke-opacity", function(d) {
				if (d.group === -1) return .7;
				else return 1;
			})
			
		node.append("text")
			.attr("dx", 12)
			.attr("dy", ".35em")
            .style("font", '10px "Helvetica Neue", Arial, Helvetica, Geneva, sans-serif')
			.text(function(d) { return d.name })
			
		force.on("tick", function() {
			link.attr("x1", function(d) { return d.source.x })
				.attr("y1", function(d) { return d.source.y })
				.attr("x2", function(d) { return d.target.x })
				.attr("y2", function(d) { return d.target.y })
			node.attr("transform", function(d) {
				return "translate(" + d.x + "," + d.y + ")"
			})
		})
		
		// Mouse actions
		function mouseover() {
			d3.select(this).select("circle").transition().duration(500).attr("r", 16)
		}
		function mouseout() {
			d3.select(this).select("circle").transition().duration(500).attr("r", 8)
		}
	})
}

// Action on window resize
function updateWindow() {
    width = window.innerWidth - 2;
    height = window.innerHeight - 92;
    svg.attr("width", width).attr("height", height);

    force.graph = curGraph;
    var newK = Math.sqrt(force.graph.nodes.length / (width * height));
    force.size([width, height])
        .gravity(100 * newK)		    // Gravity between nodes
		.charge(function (node) {	    // Force to charge(push) each other
			if (node.group === 0)
			    return -30 / newK;
			else
			    return -15 / newK;
		})
        .resume();
}
window.onresize = updateWindow;

// Get JSON file name without file extension(.json)
function getFilenameWithoutExtension(filename) {
    return filename.replace(/^.*[\\\/]/, '').slice(0, -5);
}