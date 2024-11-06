//begin script when window loads
window.onload = setMap();

//Example 1.3 line 4...set up choropleth map
function setMap() {
    //map frame dimensions
    var width = 960,
    height = 460;

    //create new svg container for the map
    var map = d3.select("body")
    .append("svg")
    .attr("class", "map")
    .attr("width", width)
    .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAzimuthalEqualArea()
    .center([-5, 37.5])
    .rotate([90, 0, 0])
    .scale(900)
    .translate([width / 2, height / 2]);

    var path = d3.geoPath()
    .projection(projection)
    
    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/County_Health_Data_2022_Education.csv")); //load attributes from csv    
    promises.push(d3.json("data/CountyData.topojson")); //load choropleth spatial data
    promises.push(d3.json("data/Countries.topojson")); //load background spatial data   

    Promise.all(promises).then(callback);

    function callback(data){               
        
        var csv = data[0];
        var usEducation = data[1];
        var Countries = data[2];
        //console.log(csv);
        console.log(usEducation);

        //translate europe TopoJSON
        var usCounties = topojson.feature(usEducation, usEducation.objects.CountyData).features;
        var CountriesTopo = topojson.feature(Countries, Countries.objects.Countries);
        console.log(usCounties)

        //create graticule generator
        var graticule = d3.geoGraticule()
        .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
    
        //create graticule background
        var gratBackground = map.append("path")
        .datum(graticule.outline()) //bind graticule background
        .attr("class", "gratBackground") //assign class for styling
        .attr("d", path) //project graticule
    
        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
        .data(graticule.lines()) //bind graticule lines to each element to be created
        .enter() //create an element for each datum
        .append("path") //append each element to the svg as a path element
        .attr("class", "gratLines") //assign class for styling
        .attr("d", path); //project graticule lines

        var countries = map.append("path")
        .datum(CountriesTopo)
        .attr("class", "countries")
        .attr("d", path);

       //add us counties to map
       var counties = map.selectAll(".counties")
           .data(usCounties)
           .enter()
           .append("path")
           .attr("class", function(d){
               return "county " + d.properties.county;
           })
           .attr("d", path)
           


    };
};
