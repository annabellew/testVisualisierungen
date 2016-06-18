var dataObject = {};      //enthält später die Objekte "nodes" und "links"
var thisAuthor = "";
var thisAuthorName = "";  //Name des aktuell angezeigten Autors als String 	
var nodes = [];           //Knoten, die Autoren darstellen
var links = [];           //Verknüpfungen zwischen den Knoten
var contributorIds = [];  //Array der Autoren-IDs aus den bibliographicResources
var contributorNames = []; //Array mit den Autoren-Namen (aus Abfrage der contributorIds via Schnittstelle)
var queryString = "";      //String mit Autoren-IDs, mit dem die Multi-Autoren-Schnittstelle abgefragt wird

//Abfrage der Ein-Autoren-Schnittstelle, welcher Autoren-Infos inkl. bibliographicResources zurückgibt
$.getJSON( "http://193.5.58.96/sbrd/Ajax/Json?lookfor=http://data.swissbib.ch/person/0bac9e1d-fb46-36db-80e5-a918ab485f6f&method=getAuthor&searcher=Elasticsearch", 
function (data) {
	var thisAuthor = data.person[0]['_source']["@id"];  //id des aktuellen Autors als URI	
	
	//Alle Autoren-IDs aus den bibliographicResources (ausser thisAuthor) sollen ins Array contributorIds geschrieben werden
	$.each(data.bibliographicResource, function (key, value) {
		
		var authorId = value['_source']["dct:contributor"];
		//console.log(authorId);
		
		//Prüfen, ob der Wert ein Array ist
		if($.isArray(authorId)) {
			$.each(authorId, function (key, value){
				//Prüfen, ob die ID die des aktuellen Autors ist
				if (value !== thisAuthor) {
					contributorIds.push (value);
				}
			});			
		} 
		else {
			//Prüfen, ob die ID die des aktuellen Autors ist
			if (authorId !== thisAuthor) {				 
				contributorIds.push (authorId);
			}
		}
		
	});
	
	//String mit durch Kommata getrennten Autoren-IDs, lookfor-Wert für nachfolgenden AJAX-Request
	$.each(contributorIds, function (key, value) {
		if (key == 0) {
			queryString = queryString + value;
		}
		else {
			queryString = queryString + "," + value;
		}
	});		
	
	//Abfrage der Mehr-Autoren-Schnittstelle: Ermittlung der Co-Autoren-Namen 	
	$.ajax({
			url: "http://193.5.58.96/sbrd/Ajax/Json?method=getAuthorMulti&searcher=Elasticsearch",
			type: "POST",					
			data: {"lookfor": queryString},
			success: function(result){
					// Zugriff auf JSON über "result"
					$.each(result['person'], function (key, value) {
						firstName = value['_source']['foaf:firstName'];
						lastName = value['_source']['foaf:lastName'];					
						contributorNames.push (firstName + " " + lastName);
					});				
			},  
			error: function(e) {console.log(e);}			
	});
	//Array, in dem die Namen der Co-Autoren stehen
	console.log(contributorNames);
});
	
/*
$.each(contributorNames, function (key, value) {
	nodes.push ({
		//Alle ausser dem aktuellen Autor sind in group 2
		"name": value, "group":2
	});				
	
	links.push ({
		//Ausgangspunkt ist immer der Autor in der Mitte
		"source": 0, "target": value, "value": 1
	});
	
	dataObject.push ({
		//aktueller Autor: group 1
		"nodes": [{"name": thisAuthorName, "group": 1}, nodes],
		"links": links
	});
	
	//console.log(key +" : " + value._source["dct:contributor"]);
	
});


var width = 960,
    height = 500;

var color = d3.scale.category20();

var force = d3.layout.force()
    .gravity(0.1)
    .charge(-1000)
    .linkDistance(30)
    .size([width, height]);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

d3.json(dataObject, function(error, graph) {
  if (error) throw error;

  force
      .nodes(graph.nodes)
      .links(graph.links)
      .start();

  var link = svg.selectAll(".link")
      .data(graph.links)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", function(d) { return Math.sqrt(d.value); });

  var node = svg.selectAll(".node")
      .data(graph.nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", 5)
      .style("fill", function(d) { return color(d.group); })
      .call(force.drag);

  node.append("title")
      .text(function(d) { return d.name; });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
  });
});
*/
