document.getElementById("fileinput").addEventListener("change", handleFileSelect, false);

function handleFileSelect(event) {
	var files = event.target.files;
	d3.select("svg").selectAll("*").remove();
	visualize("data/" + files[0].name);
}

var width = 1200
var height = 550
var svg = d3.select("body").append("svg")
	.attr("width", width)
	.attr("height", height);
var color = d3.scale.category10()

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
			.transition()
			.duration(5000)
			.style("opacity", 100)
			.style("text-anchor", "end")
			.text("Twitter Ego-Network No."
					+ filename.replace(/^.*[\\\/]/, '').slice(0, -5)
					+ ": User(" + graph.nodes.length
					+ "), Friendship(" + graph.links.length
					+ "), Cluster(" + nClusters + ")");
		
		var k = Math.sqrt(graph.nodes.length / (width * height));
		
		var force = d3.layout.force()
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
			.style("stroke-width", function(d) { return d.value })
		
		var node = svg.selectAll(".node")
			.data(graph.nodes)
			.enter()
			.append("g")
			.attr("class", "node")
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
			.style("stroke-opacity", function(d) {
				if (d.group === -1) return .7;
				else return 1;
			})
			
		node.append("text")
			.attr("dx", 12)
			.attr("dy", ".35em")
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