
// let data = {};
let surpriseData = {};
let temp = {};

//our data ranges from 2016 to 2021
var maxYear = 2021;
var minYear = 2016;
var curYear = minYear;

//2016 was a boom year
var boomYear = 2016 - minYear;


var uniform = {};
var covid = {};
var bust = {};

//2020 was a bust year
var bustYear = 2020 - minYear;

//US States GeoJSON
var map;

var mapWidth = 500;
var mapHeight = 300;

var smallMapW = 200;
var smallMapH = 100;

var projection = d3.geo.albersUsa()
      .scale(500)
      .translate([mapWidth/2,mapHeight/2]);

var smallProj = d3.geo.albersUsa()
  .scale(200)
  .translate([smallMapW/2,smallMapH/2]);

var path = d3.geo.path().projection(projection);

var smallPath = d3.geo.path().projection(smallProj);

var rate = d3.scale.quantile()
    .domain([0, 12])
    .range(colorbrewer.RdPu[9]);

var surprise = d3.scale.quantile()
    .domain([-.02, .02])
    .range(colorbrewer.RdBu[11].reverse());

var diff = d3.scale.quantile()
  .domain([-12, 12])
  .range(colorbrewer.RdYlBu[9].reverse());

var belief = d3.scale.quantile()
.domain([-1, 1])
.range(colorbrewer.RdYlBu[9]);

var y = d3.scale.linear()
  .domain([0,1])
  .range([0,smallMapH]);

var x = d3.scale.linear()
  .domain([0, maxYear - minYear])
  .range([0, smallMapW]);

function makeMaps(){

  calcSurprise();
  //Make both our density and surprise maps
  makeBigMap(rate,temp, "Unemployment", "rates");
  makeBigMap(surprise, surpriseData, "Surprise", "surprise");

  makeSmallMap("uniformE", d3.select("#uniform"));
  makeSmallMap("uniformEO", d3.select("#uniform"));
  makeAreaChart(uniform.pM, "uniformB", d3.select("#uniform"));

  makeSmallMap("boomE", d3.select("#boom"));
  makeSmallMap("boomEO", d3.select("#boom"));
  makeAreaChart(boom.pM, "boomB", d3.select("#boom"));

  makeSmallMap("bustE", d3.select("#bust"));
  makeSmallMap("bustEO", d3.select("#bust"));
  makeAreaChart(bust.pM, "bustB", d3.select("#bust"));

  update();
}

function makeSmallMap(id, parent){
  var smallMap = parent.append("svg").attr("id", id);
  smallMap.selectAll("path")
    .data(map.features)
    .enter()
    .append("path")
    .attr("d", smallPath)
    .attr("fill", "#333");

}

function makeAreaChart(data, id, parent){
  var areaChart = parent.append("svg").attr("id", id);

  areaChart.selectAll("rect")
    .data(temp)
    .enter()
    .append("rect")
    .attr("x",function(d,i){ return x(i);})
    .attr("y",function(d){ return smallMapH - y(d);})
    .attr("width",x(1) - x(0))
    .attr("height",function(d){ return y(d);})
    .attr("fill",function(d, i){ return belief(d); });
}

function makeBigMap(theScale, theData, theTitle, id){
  //Make a "big" map. Also merges given data with our map data
  var mainMap = d3.select("#main").append("svg")
  .attr("id", id).attr("height", mapHeight);

  mainMap.append("g").selectAll("path")
  .data(map.features)
  .enter()
  .append("path")
  .datum(function(d){ d[id] = theData[d.properties.NAME]; return d;})
  .attr("d",path)
  .attr("fill","#333")
  .append("svg:title")
  .text(function(d){ return d.properties.NAME; });

  var scale = mainMap.append("g");

  scale.append("text")
  .attr("x",mapWidth / 2)
  .attr("y", 15)
  .attr("font-family", "Futura")
  .attr("text-anchor", "middle")
  .attr("font-size", 12)
  .text(theTitle);

  var legend = scale.selectAll("rect")
  .data(theScale.range())
  .enter();

  legend.append("rect")
  .attr("stroke", "#fff")
  .attr("fill",function(d){ return d;})
  .attr("y", 35)
  .attr("x", function(d, i){ return mapWidth/2 - (45) + 10 * i; })
  .attr("width", 10)
  .attr("height", 10)

  legend.append("text")
  .attr("x",function(d, i){ return mapWidth / 2 - (40) + 10 * i; })
  .attr("y", 30)
  .attr("font-family", "Futura")
  .attr("text-anchor", "middle")
  .attr("font-size", 8)
  .text(function(d, i){
        var label = "";
        if(i == 0){
          label = d3.format(".2n")(theScale.invertExtent(d)[0]);
        }
        else if(i == theScale.range().length-1){

          label = d3.format(".2n")(theScale.invertExtent(d)[1]);
        }
        return label;
  });

   mainMap.selectAll("path")
   .attr("fill",function(d){ 
       if(!d[id]){
           return;
       }
       return theScale(d[id][curYear - minYear]);
    });
}

function update(){
  //Update our big maps, our difference maps, and model maps.
  curYear = +d3.select("#year").node().value;

  d3.select("#yearLabel").text(curYear);

  d3.select("#rates").selectAll("path")
  .attr("fill",function(d){ 
    if(!d.rates){
        return;
    }
      return rate(d.rates[curYear - minYear]);
    });

  d3.select("#surprise").selectAll("path")
  .attr("fill",function(d){ 
    if(!d.surprise){
        return;
    }
      return surprise(d.surprise[curYear - minYear]);
    });

  var avg = average();
  d3.select("#uniformE").selectAll("path")
  .attr("fill",rate(avg));

  d3.select("#uniformEO").selectAll("path")
  .attr("fill",function(d){ 
    if(!d.rates){
        return;
    }
      return diff( d.rates[curYear - minYear] - avg);
    });

  d3.select("#boomE").selectAll("path")
  .attr("fill",function(d){ 
    if(!d.rates){
        return;
    }
      return rate(d.rates[boomYear]);
    });

  d3.select("#boomEO").selectAll("path")
  .attr("fill",function(d){ 
        if(!d.rates){
            return;
        }
      return diff(d.rates[curYear-minYear] - d.rates[boomYear]);
    });

  d3.select("#bustE").selectAll("path")
  .attr("fill", function(d){ 
        if(!d.rates){
            return;
        }
      return rate(d.rates[bustYear]);
    });

  d3.select("#bustEO").selectAll("path")
  .attr("fill", function(d){ 
    if(!d.rates){
        return;
    }
      return diff(d.rates[curYear - minYear] - d.rates[bustYear]);
    });

  d3.select("#uniformB").selectAll("rect")
  .attr("fill-opacity", function(d, i){ return i == (curYear - minYear) ? 1 : 0.3;});

  d3.select("#boomB").selectAll("rect")
  .attr("fill-opacity", function(d, i){ return i == (curYear-minYear) ? 1 : 0.3;});

  d3.select("#bustB").selectAll("rect")
  .attr("fill-opacity", function(d, i){ return i == (curYear-minYear) ? 1 : 0.3;});
}


function sumU(i){
    //Sum unemployement for the current year.
    var index = i ? i : curYear - minYear;
    var sum = 0;
    for(var prop in temp){
      sum+= temp[prop][index];
    }
    return sum;
  }
  
  
function getData(){
    d3.csv("./data/Unemployment-2016-2021.csv", function(row){
        // district of columbia -> washington
        //LA -> california
        // console.log(row);
        let newYork = {}; // 2016 : {New York: [Labor Force Total, Unemployement Total], New York city : [ Labor Force Total, Unemployement Total] }, 2
        //2016: 
        let cali = {};
        //# of unemployed/ total ppl in work force
        // NYS = nyc (# of unemployed) + nys (# of unemployed)/ total ppl in work force in both of them (Labor Force Total, Unemployement Total)
        for(let i = 0; i < row.length; i++){
            // console.log(row[i]);
            if(row[i]["State"] != "New York city" && row[i]["State"] != "New York" && row[i]["State"] != "California" && row[i]["State"] != "Los Angeles County"){
                if(!temp[row[i]["State"]]){
                    temp[row[i]["State"]] = [];
                }
                temp[row[i]["State"]].push(parseInt(row[i]["Unemployment Rate"]));
            }
            else{
                if(row[i]["State"] == "New York city" || row[i]["State"] == "New York" ){
                    if(!newYork[row[i]["Year"]]){
                        newYork[row[i]["Year"]] = {};
                    }
                    newYork[row[i]["Year"]][row[i]["State"]] = [row[i]["Labor Force Total"], row[i]["Unemployment Total"]];
                }
                else{
                    if(!cali[row[i]["Year"]]){
                        cali[row[i]["Year"]] = {};
                    }
                    cali[row[i]["Year"]][row[i]["State"]] = [row[i]["Labor Force Total"], row[i]["Unemployment Total"]];
                }
            }
        }
        let newYorkUnemployement = [];
        let caliUnemployement = []
        for (const year in newYork) {
            let unemployement_total = parseInt(newYork[year]["New York"][1].replace(/,/g, '')) + parseInt(newYork[year]["New York city"][1].replace(/,/g, ''));
            let labor_total = parseInt(newYork[year]["New York"][0].replace(/,/g, '')) + parseInt(newYork[year]["New York city"][0].replace(/,/g, ''));
            let unemployementRate = Math.round((unemployement_total/labor_total) * 100);
            newYorkUnemployement.push(unemployementRate);
        }
        for (const year in cali) {
            // console.log(cali);
            let unemployement_total = parseInt(cali[year]["California"][1].replace(/,/g, '')) + parseInt(cali[year]["Los Angeles County"][1].replace(/,/g, ''));
            let labor_total = parseInt(cali[year]["California"][0].replace(/,/g, '')) + parseInt(cali[year]["Los Angeles County"][0].replace(/,/g, ''));
            let unemployementRate = Math.round((unemployement_total/labor_total) * 100);
            caliUnemployement.push(unemployementRate);
        }          
        temp["New York"] = newYorkUnemployement;
        temp["California"] = caliUnemployement;
        // console.log("this is temp ", temp);
        var rates = [];
        console.log(temp);
        for(var state in temp){
            // console.log(temp[state])
            for(let i = 0; i < temp[state].length; i++){
                // console.log(temp[state][i], state)
                rates.push(+temp[state][i].toString())

            }
            // }
        }
        console.log(rates);
        calcSurprise();
       return;
        // var rates = [];
        // for(var i = minYear;i <= maxYear;i++){
        //   rates.push(+row[i.toString()]);
        // }
        // data[row.State] = rates;
        // return;
       }
     );    
    
}

function statesData(){
    d3.json("./data/states.json", function(d){
        map = d;
        makeMaps();
});
}

function average(i){
    //Average unemployement for the current year.
    var index = i ? i : curYear - minYear;
    //console.log(index);
    var sum = 0;
    var n = 0;
    for(var prop in temp){
      sum+= temp[prop][index];
      n++;
    }
    return sum / n;
  }
  

function calcSurprise(){
    for(var prop in temp){
      surpriseData[prop] = [];
      for(var i = 0;i<maxYear - minYear;i++){
        surpriseData[prop][i] = 0;
      }
    }
    // Start with equiprobably P(M)s
    // For each year:
    // Calculate observed-expected
    // Estimate P(D|M)
    // Estimate P(M|D)
    // Surprise is D_KL ( P(M|D) || P(M) )
    // Normalize so sum P(M)s = 1
  
    //0 = uniform, 1 = covid, 2 = bust
  
    //Initially, everything is equiprobable.
    var pMs =[(1/3), (1/3), (1/3)];
  
    uniform.pM = [pMs[0]];
    covid.pM = [pMs[1]];
    bust.pM = [pMs[2]];
  
    var pDMs = [];
    var pMDs = [];
    var avg;
    var total;
    //Bayesian surprise is the KL divergence from prior to posterior
    var kl;
    var diffs = [0, 0, 0];
    var sumDiffs = [0, 0, 0];
    for(var i = 0;i<=maxYear - minYear;i++){
      sumDiffs = [0, 0, 0];
      avg = average(i);
      total = sumU(i);
      //Calculate per state surprise
      for(var prop in temp){
  
        //Estimate P(D|M) as 1 - |O - E|
        //uniform
        diffs[0] = ((temp[prop][i] / total) - (avg / total));
        pDMs[0] = 1 - Math.abs(diffs[0]);
        //covid
        diffs[1] = ((temp[prop][i] / total) - (temp[prop][boomYear] / total));
        pDMs[1] = 1 - Math.abs(diffs[1]);
        //bust
        diffs[2] = ((temp[prop][i] / total) - (temp[prop][bustYear] / total));
        pDMs[2] = 1 - Math.abs(diffs[2]);
  
        //Estimate P(M|D)
        //uniform
        pMDs[0] = pMs[0] * pDMs[0];
        pMDs[1] = pMs[1] * pDMs[1];
        pMDs[2] = pMs[2] * pDMs[2];
  
        // Surprise is the sum of KL divergance across model space
        // Each model also gets a weighted "vote" on what the sign should be
        kl = 0;
        var voteSum = 0;
        for(var j = 0;j < pMDs.length;j++){
          kl+= pMDs[j] * (Math.log( pMDs[j] / pMs[j]) / Math.log(2));
          voteSum += diffs[j] * pMs[j];
          sumDiffs[j]+= Math.abs(diffs[j]);
        }
  
        surpriseData[prop][i] = voteSum >= 0 ? Math.abs(kl) : -1*Math.abs(kl);
      }
  
      //Now lets globally update our model belief.
  
      for(var j = 0;j < pMs.length;j++){
        pDMs[j] = 1 - (0.5 * sumDiffs[j]);
        pMDs[j] = pMs[j] * pDMs[j];
        pMs[j] = pMDs[j];
      }
  
      //Normalize
      var sum = pMs.reduce(function(a, b) { return a + b; }, 0);
      for(var j = 0;j < pMs.length;j++){
        pMs[j] /= sum;
      }
  
      uniform.pM.push(pMs[0]);
      covid.pM.push(pMs[1]);
      bust.pM.push(pMs[2]);
    }
    // console.log("Surprise Data ", surpriseData)
}

function main(){
    let data = {};
    data = getData();
    statesData();
    // console.log(data);
    // calcSurprise();
    // console.log("here", surpriseData);

}

main();