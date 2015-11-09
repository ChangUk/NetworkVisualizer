// File selection
document.getElementById("fileinput").addEventListener("change", handleFileSelect, false);
function handleFileSelect(event) {
    var files = event.target.files;
    if (curFilename !== files[0].name) {
        d3.select(".helptable")
            .style("visibility", "hidden")
        reDraw(files[0].name);
    }

    // Button click function to save d3 rendering as SVG format
    d3.select("#save_as_svg").on("click", saveSVG);

    // Button click function to save d3 rendering as PNG format
    d3.select("#save_as_png").on("click", savePNG);
}

// Keyboard shortcut
document.addEventListener("keyup", shortcutHandler, false);
function shortcutHandler(event) {
    switch (event.keyCode) {
        case 76:    // l
            hideLabel();
            return;
        case 79:    // o
            resetZoom();
            return;
        case 80:    // p
            savePNG();
            return;
        case 82:    // r
            reDraw(curFilename);
            return;
        case 83:    // s
            saveSVG();
            return;
    }
}

// Current indicator
var force;
var curFilename = "";

// Canvas size
var width = window.innerWidth - 2;
var height = window.innerHeight - 92;

// Color setting
var color = d3.scale.category10();
var color_node_stroke = "#aaa";
var color_node_stroke_selected = "#555";
var color_text_label = "#aaa";
var color_text_label_selected = "#555";
var color_link_stroke = "#aaa";
var color_link_stroke_selected = "#555";
var color_link_opacity = .3;
var color_link_opacity_selected = 1;

// Zoom
var zoom = d3.behavior.zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", function () {
        svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
    });

// svg
var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height)
    .style("cursor", "move")
    .call(zoom)
    .append("g");

// Help message
d3.tsv("data/help.tsv", function (error, data) {
    var shortcut = []
    var functions = []
    for (var i = 0; i < data.length; i++) {
        shortcut.push(data[i].shortcut);
        functions.push(data[i].function);
    }

    function tubulate(data) {
        var columns = ["shortcut", "function"];
        var table = d3.select("body").append("div")
            .attr("class", "helptable")
            .style("width", window.innerWidth)
            .append("table")
            .attr("align", "center");
        var thead = table.append("thead");
        var tbody = table.append("tbody");
        thead.append("tr")
            .selectAll("th")
            .data(columns)
            .enter()
            .append("th")
            .text(function (column) { return column; });

        var rows = tbody.selectAll("tr")
            .data(data)
            .enter()
            .append("tr");

        var cells = rows.selectAll("td")
            .data(function (row) {
                return columns.map(function (column) {
                    return { column: column, value: row[column] };
                });
            })
            .enter()
            .append("td")
            .style("text-anchor", "middle")
            .style("dominant-baseline", "middle")
            .style("font", '10pt "Helvetica Neue", Arial, Helvetica, Geneva, sans-serif')
            .html(function (d) { return d.value; });

        return table;
    }

    tubulate(data);
});

// Redraw image
function reDraw(filename) {
    d3.select("svg").select("g").selectAll("*").remove();
    d3.select(".graphinfo").remove();
    resetZoom();

    curFilename = filename;
    visualize("data/" + curFilename);
}

// Save rendering image as SVG file
function saveSVG() {
    var doctype = '<?xml version="1.0" standalone="no"?>'
        + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
    var serializer = new XMLSerializer();
    d3.select(".graphinfo").style("visibility", "hidden")
    var source = serializer.serializeToString(d3.select("svg").node());
    d3.select(".graphinfo").style("visibility", "visible")
    var blob = new Blob([doctype + source], { type: "image/svg+xml" });
    saveAs(blob, getFilenameWithoutExtension(curFilename) + ".svg");
}

// Save rendering image as PNG file
function savePNG() {
    var doctype = '<?xml version="1.0" standalone="no"?>'
        + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
    var serializer = new XMLSerializer();
    d3.select(".graphinfo").style("visibility", "hidden")
    var source = serializer.serializeToString(d3.select("svg").node());
    d3.select(".graphinfo").style("visibility", "visible")
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
}

// Turn on / off label
var showLabel = true;
function hideLabel() {
    svg.selectAll(".node").select("text").style("visibility", function () {
        if (showLabel)
            return "hidden";
        else
            return "visible";
    });
    showLabel = !showLabel;
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
	    d3.select("svg")
            .append("text")
			.attr("class", "graphinfo")
			.attr("transform", "translate(" + (width - 10) + ", " + (height - 10) + ")")
			.style("opacity", 0)
            .style("font", '9pt "Helvetica Neue", Arial, Helvetica, Geneva, sans-serif')
            .style("fill", color_text_label_selected)
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

	    // Link styling
	    var link = svg.selectAll(".link")
			.data(graph.links)
			.enter()
			.append("line")
			.attr("class", "link")
			.style("stroke-width", function (d) { return d.value })
            .style("stroke", "#aaa")
	        .style("stroke-opacity", .3)

	    // Link connection
	    var linked = {};
	    graph.links.forEach(function (l) {
	        linked[l.source.index + ", " + l.target.index] = 1;
	    });
		
	    // Node styling
		var node = svg.selectAll(".node")
			.data(graph.nodes)
			.enter()
			.append("g")
			.attr("class", "node")
            .style("stroke-width", 1.5)
			.on("mouseover", function (d) {
			    d3.select("svg").style("cursor", "auto");
			    node.select("circle")
                    .style("stroke", function (d2) {
			            if (isConnected(d, d2))
			                return color_node_stroke_selected;
			            else
			                return color_node_stroke;
			        });
			    d3.select(this).select("circle")
                    .style("stroke", color_node_stroke_selected);

			    node.select("text")
                    .style("fill", function (d2) {
			            if (isConnected(d, d2))
			                return color_text_label_selected;
			            else
			                return color_text_label;
			        });
			    d3.select(this).select("text")
                    .style("fill", color_text_label_selected);

			    link.style("stroke", function (l) {
			        if (l.source === d || l.target === d)
			            return color_link_stroke_selected;
			        else
			            return color_link_stroke;
			    }).style("stroke-opacity", function (l) {
			        if (l.source === d || l.target === d)
			            return color_link_opacity_selected;
			        else
			            return color_link_opacity;
			    })
			})
            .on("mousedown", function (d) {
                d3.event.stopPropagation();     // Prevent svg panning
            })
			.on("mouseout", function (d) {
			    d3.select("svg").style("cursor", "move");

			    node.select("circle")
                    .style("stroke", color_node_stroke);
			    node.select("text")
                    .style("fill", color_text_label);

			    link.style("stroke", color_link_stroke).style("stroke-opacity", color_link_opacity);
			})
			.call(force.drag)
			
		node.append("circle")
			.attr("r", 10)
			.style("fill", function(d) {
				if (d.group === -1) return "#fff";
				else return color(d.group);
			})
			.style("stroke", color_node_stroke)
            .style("stroke-width", 1.5)
			.style("stroke-opacity", function(d) {
				return 1;
			})
			
        // Show node id
		node.append("text")
			.attr("dx", 12)
			.attr("dy", ".35em")
            .style("font", '10px "Helvetica Neue", Arial, Helvetica, Geneva, sans-serif')
            .style("fill", color_text_label)
			.text(function(d) { return d.name })

        // Check if noad A and node B are connected each other
		function isConnected(a, b) {
		    return linked[a.index + ", " + b.index] || linked[b.index + ", " + a.index];
		}

		force.on("tick", function() {
			link.attr("x1", function(d) { return d.source.x })
				.attr("y1", function(d) { return d.source.y })
				.attr("x2", function(d) { return d.target.x })
				.attr("y2", function(d) { return d.target.y })
			node.attr("transform", function(d) {
				return "translate(" + d.x + "," + d.y + ")"
			})
		})
	})
}

// Action on window resize
function updateWindow() {
    width = window.innerWidth - 2;
    height = window.innerHeight - 92;
    d3.select("svg").attr("width", width).attr("height", height);
    d3.select(".helptable").style("width", window.innerWidth);
    d3.select(".graphinfo")
        .attr("transform", "translate(" + (width - 10) + ", " + (height - 10) + ")");

    var newK = Math.sqrt(force.nodes().length / (width * height));
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

// Reset svg attribute values
function resetZoom() {
    zoom.scale(1);
    zoom.translate([0, 0]);
    svg.transition().duration(300).attr('transform', 'translate(' + zoom.translate() + ') scale(' + zoom.scale() + ')')
}

// Get JSON file name without file extension(.json)
function getFilenameWithoutExtension(filename) {
    return filename.replace(/^.*[\\\/]/, '').slice(0, -5);
}