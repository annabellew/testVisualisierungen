/* Dieses Skript fragt in mehreren verschachtelten AJAX-Calls die Multi-Autoren-
Schnittstelle von linked.swissbib ab. Der Ablauf funktioniert erst teilweise;
folgende Schritte (vereinfacht beschrieben) sollten Ablaufen:
Mit einer ersten Autoren-ID (Autor in der Mitte) wird die Schnittstelle abgefragt.
Aus dem Resultat wird der Name des Autors sowie die IDs seiner Co-Autoren herausgelesen.
Mit den IDs wird, verschachtelt, eine zweite Abfrage der Schnittstelle gemacht.
Aus dem Resultat werden die Namen der Co-Autoren herausgelesen und in "nodes" 
geschrieben. Verbindungsinformationen werden in "links" geschrieben.
Mit jeder Co-Autoren ID werden die bisherigen Schritte wiederholt, sodass zwei Bezie-
hungsgrade enthalten sind. Dieser letzte Schritt funktioniert noch nicht.

Annabelle Wiegart 24.07.2016

*/

//Variablen

var dataObject = {};      //enthält später die Objekte "nodes" und "links"
var thisAuthor = "http://data.swissbib.ch/person/4ca699c9-5d74-3a9b-a24d-9d295f34508e";	  //enthält ID des zentralen Autors
var dataObject = {};      //enthält später die Objekte "nodes" und "links"
var thisAuthorName = "";  //Name des aktuell angezeigten Autors als String 	
var thisAuthorLastName = ""; //Falls nur foaf:name vorhanden ist
var contributorNames = []; //Array mit den Autoren-Namen 
var contributorIds = [];  //Array der Autoren-IDs aus den bibliographicResources
var nodes = [];           //Knoten, die Autoren darstellen
var links = [];           //Verknüpfungen zwischen den Knoten
var queryString = "";      //String mit Autoren-IDs, mit dem die Multi-Autoren-Schnittstelle abgefragt wird
var counter = 0; 		   //Die counter werden für das Füllen von "links" gebraucht
var counter2 = 0; 		
var palette = {
					"sbgreen": "#009973",
					"sbgreen2": "#004d39",
					"lightergreen": "#00cc99",
					"lightgreen": "#00ffbf",
					"darkergreen": "#008060",
					"darkgreen": "#004d39",
					"darkgreen2": "#001a13"
				}

//Funktionen

//Abfrage der (Multi-)Autorenschnittstelle mit 1 Autor-ID: Hauptautor
var getAuthorName = function (authorId) {		
	$.ajax({
		url: "http://193.5.58.96/sbrd/Ajax/Json?method=getAuthorMulti&searcher=Elasticsearch",
		type: "POST",					
		data: {"lookfor": authorId},
		success: function (result) {			
			getContributors(result)
		}
	});
}

//Abfrage der (Multi-)Autorenschnittstelle mit 1 Autor-ID: weitere Autoren
var innerGetAuthorName = function (authorId) {	
	$.ajax({
		url: "http://193.5.58.96/sbrd/Ajax/Json?method=getAuthorMulti&searcher=Elasticsearch",
		type: "POST",					
		data: {"lookfor": authorId},
		success: function (result) {			
			innerGetContributors(result)
		}
	});
}

//Abfrage der (Multi-)Autorenschnittstelle mit mehreren contributor-IDs 1. Durchgang
var getAuthorNames = function (authorIds) {	
	$.ajax({
		url: "http://193.5.58.96/sbrd/Ajax/Json?method=getAuthorMulti&searcher=Elasticsearch",
		type: "POST",					
		data: {"lookfor": authorIds},
		success: function (result) {
			createContribNodesLinks(result)	
		}
	});
}

//Abfrage der (Multi-)Autorenschnittstelle mit mehreren contributor-IDs 2. Durchgang
var innerGetAuthorNames = function (authorIds) {	
	$.ajax({
		url: "http://193.5.58.96/sbrd/Ajax/Json?method=getAuthorMulti&searcher=Elasticsearch",
		type: "POST",					
		data: {"lookfor": authorIds},
		success: function (result) {
			innerCreateContribNodesLinks(result)	
		}
	});
}

//Verarbeitung der JSON-Daten zu Hauptautor Mitte
var getContributors = function (json) {	
	writeNameArray(json);	
	writeNodes(contributorNames, "noLinks");
	writeContributorArray(json);
	writeQueryString(contributorIds);
	getAuthorNames(queryString);
}

//Verarbeitung der JSON-Daten zu Hauptautor Peripherie
var innerGetContributors = function (json) {	
	writeNameArray(json);	
	writeNodes(contributorNames, "noLinks");
	writeContributorArray(json);
	writeQueryString(contributorIds);
	innerGetAuthorNames(queryString);
}

//Verarbeitung der Infos zu contributors
var createContribNodesLinks = function (json) {
	writeNameArray(json);	
	writeNodes(contributorNames, "links");
	//console.log("contributorIds: " + contributorIds);
	reiterateContributors(contributorIds);
}

//Verarbeitung der Infos zu äusseren contributors, Erzeugung des Graphen
var innerCreateContribNodesLinks = function (json) {
	writeNameArray(json);	
	writeNodes(contributorNames, "links");	
}

//contributorIds in Array schreiben
var writeContributorArray = function (json) {
	contributorIds = []; //Array zuerst leeren
	$.each(json.bibliographicResource, function (key, value) {
		
		var authorId = value['_source']["dct:contributor"];
		//console.log(authorId);
		
		//Schleife, falls der Wert ein Array ist		
		$.each(authorId, function (key, value){
			//Prüfen, ob die ID die des aktuellen Autors ist
			if (value !== thisAuthor) {
				contributorIds.push (value);
			}
		});
		//console.log(contributorIds);
		//console.log(thisAuthor);
	});
}

//String aus contributorIds für erneute Abfrage der Schnittstelle
var writeQueryString = function (ids) {
	$.each(ids, function (key, value) {
		if (key == 0) {
			queryString = queryString + value;
		}
		else {
			queryString = queryString + "," + value;
		}
	});		
	//console.log(queryString);
}

//Autorennamen in Array schreiben
var writeNameArray = function (json) {
	contributorNames = []; //Array zuerst leeren	
	$.each(json['person'], function (key, value) {
		var firstName = value['_source']['foaf:firstName'];
		var lastName = value['_source']['foaf:lastName'];
		var name = value['_source']['foaf:name'];			
		if (firstName) {	
			contributorNames.push (firstName + " " + lastName);
		}
		else {							
			contributorNames.push (name);
		}
	});
	//console.log("contributorNames: " + contributorNames);
}

//Namen aus contributorNames in "nodes" schreiben
var writeNodes = function (names, checkLinks) {
	$.each(names, function (key, value) {
		nodes.push ({
			//group hat momentan keine Bedeutung
			"name": value, "group":1			
		});	
		counter++; //jedesmal, wenn in nodes ein Objekt hinzukommt		
		if (checkLinks !== "links") {return};
		writeLinks(counter2);		
	});
	//console.log("Nodes: "+nodes);
}

//Beziehungsinfo in "links" schreiben: alle sind mit mainAuthor verbunden
var writeLinks = function (mainAuthor) {	
	links.push ({		
		"source": counter-1, "target": mainAuthor, "value": 5
	});		
	//console.log("Links: "+links);
}

//Für jeden contributor des mittleren Autors das Prozedere wiederholen
//Funktioniert noch nicht
var reiterateContributors = function (idArray) {	
	$.each(idArray, function (key, id) {
		counter2++;
		//console.log("counter2: " + counter2);
		thisAuthor = id;
		//console.log("thisAuthor: " + thisAuthor);
		innerGetAuthorName(thisAuthor);
	});	
	
	//Vorbereitung des Datenobjekts für den Graphen

	dataObject.nodes = nodes;
	dataObject.links = links;
	
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
	  
	  //console.log(graph.nodes);
		  
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
		
			});								
	});
}

//Programmablauf
getAuthorName(thisAuthor);
