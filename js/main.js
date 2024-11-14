//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

    //pseudo-global variables
    var attrArray = ["FIPS", "Math_scores", "Percent_Children_in_poverty", "Percent_High_school_completion", "Percent_Kids_in_Single_Parent_Houses","Reading _scores"]; //list of attributes
    var expressed = attrArray[2]; //initial attribute
    var domainArray = [];
    console.log(expressed)
    //begin script when window loads

    window.onload = setMap();

    //Example 1.3 line 4...set up choropleth map
    function setMap() {
        //map frame dimensions
        var width = window.innerWidth * .5,
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

            //place graticule on the map
            setGraticule(map,path)

            //translate TopoJSONs
            var usCounties = topojson.feature(usEducation, usEducation.objects.CountyData).features;
            var CountriesTopo = topojson.feature(Countries, Countries.objects.Countries);
            //console.log(csv)

            //add countries to map
            var countries = map.append("path")
            .datum(CountriesTopo)
            .attr("class", "countries")
            .attr("d", path);

            //join csv data to GeoJSON enumeration units
            var counties = joinData(usCounties, csv);

            //create the color scale
            var colorScale = makeColorScale(csv);

            //console.log(colorScale)
            
            //add enumeration units to the map
            setEnumerationUnits(counties, map, path,colorScale);
            //console.log(domainArray)

            //add cooridinated visualization
            setChart(csv,colorScale)

            
        }};

 function setGraticule(map, path){
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
};

function joinData(counties,csv){
                
    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csv.length; i++){ //csv.length
        var csvCounty = csv[i]; //the current region
        //console.log(csvCounty)
        var csvKey = csvCounty.FIPS; //the CSV primary key
        //console.log(csvKey)
        //loop through geojson regions to find correct region
        for (var a=0; a<counties.length; a++){
            //console.log(counties.length)
            var geojsonProps = counties[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.FIPS; //the geojson primary key
            
            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){
                //console.log(geojsonKey)
                //assign all attributes and values
                attrArray.forEach(function(attr){
                    //console.log(parseFloat(csvCounty[attr]));
                    var val =  parseFloat(csvCounty[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    
                });
            };
            //console.log(geojsonProps)
        };
    }
    return counties;
};

function setEnumerationUnits(usCounties, map, path,colorScale){
   
   //add us counties to map
   var counties = map.selectAll(".county")
    .data(usCounties)
    .enter()
    .append("path")
    .attr("class", function(d){
        return "county " + d.properties.county;
    })
    .attr("d", path)
        .style("fill", function(d){            
            var value = d.properties[expressed];
            //console.log(value)          
            if(value) {
                console.log(colorScale);                
                return colorScale(d.properties[expressed]);            
            } else {                
                return "#ccc";            
            }
        });
};
 
//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);
    //build array of all values of the expressed attribute

    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
        //console.log(val)
    };
    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);
    //console.log(colorScale)
    return colorScale;

};

//function to create coordinated bar chart
function setChart(csv, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 100]);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csv)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.FIPS;
        })
        .attr("width", (chartInnerWidth / csv.length))
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csv.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return colorScale(d[expressed]);
        });

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of Variable " + expressed[3] + " in each region");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
};
})();