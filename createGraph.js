var dataObject = {};      //enthält später die Objekte "nodes" und "links"
var thisAuthor = "";
var thisAuthorName = "";  //Name des aktuell angezeigten Autors als String 	
var thisAuthorLastName = ""; //Falls nur foaf:name vorhanden ist
var nodes = [];           //Knoten, die Autoren darstellen
var links = [];           //Verknüpfungen zwischen den Knoten
var contributorIds = [];  //Array der Autoren-IDs aus den bibliographicResources
var contributorNames = []; //Array mit den Autoren-Namen (aus Abfrage der contributorIds via Schnittstelle)
var queryString = "";      //String mit Autoren-IDs, mit dem die Multi-Autoren-Schnittstelle abgefragt wird

//Autoren-IDs zum Ausprobieren
//c7a1a5c2-903c-3524-a839-4e87fccbd7f1
//0bac9e1d-fb46-36db-80e5-a918ab485f6f
//825b0ab5-c490-38e8-af50-4ed444e87b44
//5b590f17-2263-309f-bf3a-6c21e1970ad9
//4ca6d8e1-694e-3fea-9cde-bc09a7b7f61c
//51119347-fb51-37d9-ba90-af15b9b8aeff
//514ac9b2-4204-3bd1-b7e1-bf6a58d81530 (Cucca, viele Co-Autoren, Name in foaf:name)
//05908eeb-56e9-37ed-b58d-5732d6a4e42f 
//51119347-fb51-37d9-ba90-af15b9b8aeff
//4ca699c9-5d74-3a9b-a24d-9d295f34508e
 
//Abfrage der Ein-Autoren-Schnittstelle, welcher Autoren-Infos inkl. bibliographicResources zurückgibt
$.getJSON("http://193.5.58.96/sbrd/Ajax/Json?lookfor=http://data.swissbib.ch/person/514ac9b2-4204-3bd1-b7e1-bf6a58d81530&method=getAuthor&searcher=Elasticsearch", function (data) {
	var thisAuthor = data.person[0]['_source']['@id'];  //id des aktuellen Autors als URI	
	
	//Name des aktuellen Autors als String
	thisAuthorName = data.person[0]['_source']['foaf:firstName'] + " " + data.person[0]['_source']['foaf:lastName']
	thisAuthorLastName = data.person[0]['_source']['foaf:name']
	
	
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
						name = value['_source']['foaf:name'];	
						if (firstName) {	
							contributorNames.push (firstName + " " + lastName);
						}
						else {							
							contributorNames.push (name);
						}
					});	
					
					//Array, in dem die Namen der Co-Autoren stehen
					console.log(contributorNames);
					
					//Das erste Objekt des node-Arrays soll dem aktuellen Autor entsprechen	
					if (thisAuthorName !== 'undefined undefined') {
						nodes.push({"name": thisAuthorName, "group": 1});
					}
					else {
						nodes.push({"name": thisAuthorLastName, "group": 1});
					}

					$.each(contributorNames, function (key, value) {
						nodes.push ({
							//Alle ausser dem aktuellen Autor sind in group 2
							"name": value, "group":2
						});				
						
						links.push ({
							//Ausgangspunkt ist immer der Autor in der Mitte
							"source": key+1, "target": 0, "value": 5
						});
						
					});
					//Vorbereitung des Datenobjekts für den Graphen

					dataObject.nodes = nodes;
					dataObject.links = links;

					//console.log(dataObject);		
					
					//Erzeugung des eigentlichen Graphen
					
					var palette = {
						"sbgreen": "#009973",
						"sbgreen2": "#004d39",
						"lightergreen": "#00cc99",
						"lightgreen": "#00ffbf",
						"darkergreen": "#008060",
						"darkgreen": "#004d39",
						"darkgreen2": "#001a13"
					}

					var width = 960,
						height = 500
						circleWidth = 10;

					var force = d3.layout.force()
						.nodes(nodes)
						.links(links)
						.gravity(0.1)
						.charge(-1000)						
						.size([width, height]);

					var svg = d3.select("#vis").append("svg")
						.attr("width", width)
						.attr("height", height);
						 

					var graph = dataObject;  

				  force
					  .nodes(graph.nodes)
					  .links(graph.links)
					  .start();

				  var link = svg.selectAll("line")
					  .data(graph.links)
					.enter().append("line")
					  .attr("class", "link")
					  .attr("stroke", palette.darkgreen)
					  .style("stroke-width", "1.5");
					 
					var node = svg.selectAll("circle")
					  .data(graph.nodes)
					  .enter().append("g")	
					  .attr("class", "node")
					  .call(force.drag);  					  
					
					node.append("circle")					  
					  .attr("cx", graph.nodes.x)
					  .attr("cy", graph.nodes.y)				  
					  .attr("r", function (d, i) {
						if (i == 0) { return "20"}
						else { return circleWidth }
						})
					  .attr("fill", palette.sbgreen);	
					  
					  console.log(graph.nodes);
					  
					node.append("text")
						.text(function(d) { return d.name})
						.attr("font-family", "sans-serif")
						.attr("fill", palette.darkgreen)
						.attr("x", circleWidth)
						.attr("y", circleWidth)
						.attr("text-anchor", "beginning")
						.attr("font-size",  "1em")
						.attr("font-family", "Calibri")					
						
				  force.on("tick", function() {
					link.attr("x1", function(d) { return d.source.x; })
						.attr("y1", function(d) { return d.source.y; })
						.attr("x2", function(d) { return d.target.x; })
						.attr("y2", function(d) { return d.target.y; });

					node.attr("transform", function(d, i) {
						return "translate(" + d.x + ", " + d.y + ")";
						/*
					node.attr("cx", function(d) { return d.x; })
						.attr("cy", function(d) { return d.y; });	*/
					});								
				});
		}
	});
});
	


	
		


