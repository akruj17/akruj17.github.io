document.onload = (function(d3, saveAs, Blob, undefined){
  "use strict";

  var consts = {
    defaultTitle: "random variable"
  };
  var settings = {
    appendElSpec: "#graph"
  };
  // define graphcreator object
  var GraphCreator = function(svg, nodes, edges){
    var thisGraph = this;
        thisGraph.idct = 0;

    thisGraph.nodes = nodes || [];
    thisGraph.edges = edges || [];

    thisGraph.state = {
      selectedNode: null,
      mouseDownNode: null,
      mouseDownLink: null,
    };

    // define arrow markers for graph links
    var defs = svg.append('svg:defs');
    defs.append('svg:marker')
      .attr('id', 'end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', "40")
      .attr('markerWidth', 3.0)
      .attr('markerHeight', 3.0)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr("fill", "rgb(50,125,255)")
      .attr('d', 'M0,-5L10,0L0,5');

    defs.append('svg:clipPath')
        .attr('id', 'profileClip')
        .append('svg:circle')
        .attr('r', '90')
        .attr('cx', '20')
        .attr('cy', '20');

    thisGraph.svg = svg;
    thisGraph.svgG = svg.append("g")
          .classed(thisGraph.consts.graphClass, true);
    var svgG = thisGraph.svgG;

    // svg nodes and edges
    thisGraph.paths = svgG.append("g").selectAll("g");
    thisGraph.circles = svgG.append("g").selectAll("g");

    // listen for resize
    window.onresize = function(){thisGraph.updateWindow(svg);};
  };

  GraphCreator.prototype.setIdCt = function(idct){
    this.idct = idct;
  };

  GraphCreator.prototype.consts =  {
    selectedClass: "selected",
    connectClass: "connect-node",
    circleGClass: "conceptG",
    graphClass: "graph",
    BACKSPACE_KEY: 8,
    DELETE_KEY: 46,
    ENTER_KEY: 13,
    LOGO_SIZE: 80
  };

  /* PROTOTYPE FUNCTIONS */

  GraphCreator.prototype.replaceSelectNode = function(d3Node, nodeData){
    var thisGraph = this;
    d3Node.classed(this.consts.selectedClass, true);
    if (thisGraph.state.selectedNode){
      thisGraph.removeSelectFromNode();
    }
    thisGraph.state.selectedNode = nodeData;
  };

  GraphCreator.prototype.removeSelectFromNode = function(){
    var thisGraph = this;
    thisGraph.circles.filter(function(cd){
      return cd.id === thisGraph.state.selectedNode.id;
    }).classed(thisGraph.consts.selectedClass, false);
    thisGraph.state.selectedNode = null;
  };

  // mousedown on node
  GraphCreator.prototype.circleMouseDown = function(d3node, d){
    var thisGraph = this,
        state = thisGraph.state;
    d3.event.stopPropagation();
    state.mouseDownNode = d;
    if (d3.event.shiftKey){
      state.shiftNodeDrag = d3.event.shiftKey;
      // reposition dragged directed edge
      thisGraph.dragLine.classed('hidden', false)
        .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
      return;
    }
  };

  // mouseup on nodes
  GraphCreator.prototype.circleMouseUp = function(d3node, d){
    var thisGraph = this,
        state = thisGraph.state,
        consts = thisGraph.consts;
    // reset the states
    state.shiftNodeDrag = false;
    d3node.classed(consts.connectClass, false);
    document.getElementById("popup-header").innerHTML = names[parseInt(d.id,10)]
    document.getElementById("popup-detailed").innerHTML = descriptions[parseInt(d.id, 10)]
    let popup = document.getElementById("popup-text")
    document.getElementById("popup-text").style.display = "block";
    var width = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth,
    height =  window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;
    let dRect = d3node[0][0].getBoundingClientRect()
    let popupRect = popup.getBoundingClientRect()
    let midX = dRect.x + (dRect.width / 2.0)
    let midY = dRect.y + (dRect.height / 2.0)
    let x = 0;
    let y = 0;
    if (midX < (width / 2.0)) {
        x = midX;
    } else {
        x = midX - popupRect.width
    }

    if (midY < (height / 2.0)) {
        y = midY;
    } else {
        y = midY - popupRect.height
    }

    popup.style.left = "" + x + "px";
    popup.style.top = "" + y + "px";
    
    var mouseDownNode = state.mouseDownNode;

    if (!mouseDownNode) return;

    if (mouseDownNode === d){
      // we're in the same node
      if (!state.justDragged) {
        // clicked, not dragged
        if (!d3.event.shiftKey){
          var prevNode = state.selectedNode;

          if (!prevNode || prevNode.id !== d.id){
            thisGraph.replaceSelectNode(d3node, d);
          } else{
            thisGraph.removeSelectFromNode();
          }
        }
      }
    }
    state.mouseDownNode = null;
    return;

  }; // end of circles mouseup

  

  // call to propagate changes to graph
  GraphCreator.prototype.updateGraph = function(){

    var thisGraph = this,
        consts = thisGraph.consts,
        state = thisGraph.state;

    thisGraph.paths = thisGraph.paths.data(thisGraph.edges, function(d){
      return String(d.source.id) + "+" + String(d.target.id);
    });
    var paths = thisGraph.paths;
    // update existing paths
    paths.style('marker-end', 'url(#end-arrow)')
      .classed(consts.selectedClass, function(d){
        return d === state.selectedEdge;
      })
      .attr("d", function(d){
        return "M" + (d.source.x) + "," + (d.source.y) + "L" + (d.target.x) + "," + (d.target.y);
      });

    // add new paths

    var gradient = paths.enter().append("linearGradient")
    .attr("id", function(d) {return "gradient" + d.source.title + d.source.target;})
    .attr("x1", "0")
    .attr("x2", "1")
    .attr("y1", "0")
    .attr("y2", "1");

    gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "rgb(50,125,255)");

    gradient.append("stop")
    .attr("offset", "50%")
    .attr("stop-color", "#FFFFFF")
    .attr("stop-opacity", "0.5");

    gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "rgb(50,125,255)");

    paths.enter()
      .append("path")
      .style('marker-end','url(#end-arrow)')
      .classed("link", true)
      .attr("d", function(d){
        return "M" + (d.source.x) + "," + (d.source.y) + "L" + (d.target.x) + "," + (d.target.y);
      })
      .attr("stroke", function(d) {return "url(#gradient" + d.source.title + d.source.target + ")";})
      .on("mousedown", function(d){
        thisGraph.pathMouseDown.call(thisGraph, d3.select(this), d);
        }
      )
      .on("mouseup", function(d){
        state.mouseDownLink = null;
      });

    // remove old links
    paths.exit().remove();

    // update existing nodes
    thisGraph.circles = thisGraph.circles.data(thisGraph.nodes, function(d){ return d.id;});
    thisGraph.circles.attr("transform", function(d){return "translate(" + d.x + "," + d.y + ")";});

    // add new nodes
    var newGs= thisGraph.circles.enter()
          .append("g")
          .attr("id", function(d) { return d.title});
    
    newGs.classed(consts.circleGClass, true)
      .attr("transform", function(d){return "translate(" + d.x + "," + d.y + ")";})
      .on("mouseover", function(d){
        if (state.shiftNodeDrag){
          d3.select(this).classed(consts.connectClass, true);
        }
      })
      .on("mouseout", function(d){
        d3.select(this).classed(consts.connectClass, false);
      })
      .on("mousedown", function(d){
        thisGraph.circleMouseDown.call(thisGraph, d3.select(this), d);
      })
      .on("mouseup", function(d){
        thisGraph.circleMouseUp.call(thisGraph, d3.select(this), d);
      });

      var gradient = newGs.append("linearGradient")
      .attr("id", function(d) {return "gradient" + d.title;})
      .attr("x1", "0")
      .attr("x2", "1")
      .attr("y1", "0")
      .attr("y2", "1");

      gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#FFFFFF")
      .attr("stop-opacity", "0.5");

      gradient.append("stop")
      .attr("offset", "50%")
      .attr("stop-color", "rgb(50,125,255)");

      gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#FFFFFF")
      .attr("stop-opacity", "0.5");

      newGs
      .append("circle")
      .attr("r", function(d) {return ((d.id == ME) ? "120" : "70");})
      .attr("stroke", function(d) {return "url(#gradient" + d.title + ")";})
      .attr("stroke-width",  function(d) {return (d.id != ME) ? '10' : '20';})

      newGs
      .append("image")
      .attr("width", function(d) {return (d.id != ME) ? '90' : '220';})
      .attr("height", function(d) {return (d.id != ME) ? '90' : '220';})
      .attr("x", function(d) {return (d.id != ME) ? '-45' : '-110';})
      .attr("y", function(d) {return (d.id != ME) ? '-45' : '-110';})
      .attr("stroke", "none")
      .attr("xlink:href", function(d) {return "static/experiences/" + d.title;})

    // remove old nodes
    thisGraph.circles.exit().remove();
  };

  GraphCreator.prototype.zoomed = function(){
    this.state.justScaleTransGraph = true;
    d3.select("." + this.consts.graphClass)
      .attr("transform", "scale(" + d3.event.scale + ")");
  };

  GraphCreator.prototype.updateWindow = function(svg){
    var docEl = document.documentElement,
        bodyEl = document.getElementsByTagName('body')[0];
    var x = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth;
    var y = window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;
    svg.attr("width", x).attr("height", y);
    let minWidth = 1434.5;
    let minHeight = 780;
    let scale = 1.0
    scale = x / minWidth
    scale = Math.min(scale, y / minHeight)
    scale = Math.min(scale, 2.0)
    d3.select("." + this.consts.graphClass)
      .attr("transform", "scale(" + scale + ")");

    let gRect = document.getElementById('me.png').getBoundingClientRect()
    let svgRect = document.getElementsByTagName('svg')[0].getBoundingClientRect()
    let middleX = gRect.x + (gRect.width / 2.0)
    let middleY = gRect.y + (gRect.height / 2.0)
    let newMiddleX = parseInt(svgRect.x + svgRect.width, 10) / 2.0
    let newMiddleY = parseInt(svgRect.y + svgRect.height, 10) / 2.0
    let translateAmountX = (newMiddleX - middleX) / scale
    let translateAmountY = (newMiddleY - middleY) / scale

    let currTransform = d3.select("." + this.consts.graphClass).attr('transform')
    d3.select("." + this.consts.graphClass)
      .attr("transform", currTransform + " translate(" + translateAmountX + "," + translateAmountY + ")");
    document.getElementById("popup-text").style.transform = "scale(" + scale + ")";
    document.getElementById('popup-text').style.display = 'none'
  };

  /**** MAIN ****/

  var docEl = document.documentElement,
      bodyEl = document.getElementsByTagName('body')[0];

  var width = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth,
      height =  window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;
  
  var xLoc = 720,
      yLoc = 295;

  const AWS = 0;
  const BLOG = 1;
  const CONVERGENT = 2;
  const FREETAIL = 3;
  const HOMEDEPOT = 4;
  const IPHONE = 5;
  const SHARINGXCHANGE = 6;
  const UT = 7
  const CS50 = 8;
  const ME = 9;

  // initial node data
  var nodes = [
                {title: "aws.png", id: AWS, x: xLoc - 250, y: yLoc + 200},
                {title: "blog.png", id: BLOG, x: xLoc - 580, y: yLoc + 250},
                {title: "convergent.png", id: CONVERGENT, x: xLoc - 550, y: yLoc - 125},
                {title: "freetailhackers.svg", id: FREETAIL, x: xLoc - 20, y: yLoc - 200},
                {title: "homedepot.png", id: HOMEDEPOT, x: xLoc + 170, y: yLoc + 220},
                {title: "iphone.jpg", id: IPHONE, x: xLoc + 500, y: yLoc + 170},
                {title: "sharingxchange.png", id: SHARINGXCHANGE, x: xLoc + 580, y: yLoc - 190},
                {title: "utaustin.png", id: UT, x: xLoc - 300, y: yLoc - 50},
                {title: "cs50.png", id: CS50, x: xLoc + 300, y: yLoc},
                {title: "me.png", id: ME, x: xLoc, y: yLoc + 20}
            ];

  var edges = [
            {source: nodes[BLOG], target: nodes[AWS]},
            {source: nodes[CONVERGENT], target: nodes[AWS]},
            {source: nodes[FREETAIL], target: nodes[CONVERGENT]},
            {source: nodes[FREETAIL], target: nodes[UT]},
            {source: nodes[IPHONE], target: nodes[UT]},
            {source: nodes[UT], target: nodes[IPHONE]},
            {source: nodes[UT], target: nodes[FREETAIL]},
            {source: nodes[UT], target: nodes[AWS]},
            {source: nodes[UT], target: nodes[HOMEDEPOT]},
            {source: nodes[CS50], target: nodes[UT]},
            {source: nodes[CS50], target: nodes[SHARINGXCHANGE]},
            {source: nodes[CS50], target: nodes[FREETAIL]},
            ];

            

  /** MAIN SVG **/
  var svg = d3.select(settings.appendElSpec).append("svg")
        .attr("width", width)
        .attr("height", height);
  var graph = new GraphCreator(svg, nodes, edges);
      graph.setIdCt(nodes.length);
  graph.updateGraph();
  graph.updateWindow(svg);
})(window.d3, window.saveAs, window.Blob);

  function closeClicked() {
    document.getElementById("popup-text").style.display = "none";
}

// experiences information
let names = ['AWS Internship', 'Blog', 'Convergent', 'Freetail Hackers', 'Home Depot', 'IOS Development',
  'SharingXchange', 'UT Austin', 'CS50', 'Welcome!']

let descriptions = ["My most recent internship was at Amazon Web Services as part of the DynamoDB Global Tables team, which is responsible for replicating user data between different AWS regions across the world. I created an internal control plane service for performing on-demand or periodic chaos engineering attacks on clusters of EC2 instances to simulate network latencies, process suspensions, and memory/disk/CPU failures in a distributed system. <strong>I used a variety of different AWS services for orchestration, including Systems Manager, S3, DynamoDB, CloudWatch, IAM, and Secure Token Service.</strong> In my final presentation, I was able to trigger attacks on data replication components and show how item replication latency and data convergence could be affected.",
                  'For my software engineering class in college, I kept a weekly Medium blog to discuss my experiences both in the class and outside. I definitely gained comfort with writing about myself for others to see, something I have always felt weird in doing. My Medium profile is @junkunj01; feel free to read!',
                'Texas Convergent is an organization focused on bridging business and computer science to create and market new products. My freshman year, I joined a team building a chatbot that could answer questions related to finding university-specific resources. <strong>I got my first exposure to AWS (Lambda specifically) as well as systems design.</strong> I helped format our backend data into a response that could be sent with Twilio as a text message. My sophomore year, I worked on building a voice-automated juice blender by bridging an Amazon Alexa with an Arduino that could interact with drink pumps. <strong>I specifically wrote an Alexa skill and Lambda function for recognizing voice commands and retrieving drink recipe information that our Arduino could use.</strong>',
              'Freetail Hackers is my university’s organization responsible for putting on annual hackathons. I joined as an organizer for the tech team, which is responsible for creating and maintaining the registration system. Through my involvement, <strong>I have learned much about backend web development, including how requests are made, working with external APIs to send mass emails, and implementing security features like OAuth. I learned new tools and frameworks including Flask, Node JS, Heroku, and SendGrid.</strong>',
            'The second semester of my sophomore year, I was a software engineering intern at Home Depot for the Dynamic Recommendations API team. I gained experience with both frontend and backend development through various tasks. Using React JS, I made UI modifications to an internal recommendation model creation tool, and I helped add a file upload component for passing in lists of item IDs to either whitelist or blacklist. On the backend, <strong>I learnt about Spring Boot in order to modify API responses to return additional metadata information concerning recommendation models, and I added parsing code for uploaded files.</strong>',
          'One of my favorite series of personal projects has been <strong>learning about iOS development with Swift, Objective-C, and Xcode</strong>. The first app I made was a history visualization tool called Timeline which allows users to create color coordinated timelines with a seamless background collage in order to show how time can tell a story. Through the process, <strong>I learnt about the iOS file system, the Realm Swift offline database storage solution, and the Google Palette API for capturing dominant colors in images.</strong> It was the first project where I worked with Swift, and also the first where I really was able to test my <strong>object-oriented programming skills.</strong> I later created a brick-breaker app called Colorful Escape that gave me exposure to <strong>Objective-C, Sprite Kit, CoreGraphics and animations, as well as writing asynchronous completion handlers.</strong>',
        'My freshman year summer, I was a software intern for SharingXchange, a startup focused on expanding upon the sharing economy idea by offering home, ride, and boat share all conveniently through one platform. I tested web features on the development website as well as identified issues needing fixing, such as making async requests to the Google Maps API and logging in with Facebook’s OAuth. While I did not write any code for this internship, <strong>I learnt much about the development cycle, issues tracking, and user stories</strong> – things that would later be useful for my college course in software engineering.',
      'I am a third-year undergraduate BS Computer Science student at the University of Texas at Austin. <strong>Through my coursework over the past two years, I have done so much: analyzing the pros and cons of different data structures, creating a toy operating system, designing the user interface for a React website, implementing basic reinforcement learning models, learning how to quickly sift through documentation.</strong> There is so much more, just not enough space to list it all!',
    'Before starting college, I primarily learned computer science through Harvard’s online CS50 course. Even being just an introductory course, it touched on so many things: <strong>programming concepts, data structures, web languages, cryptography, graphics, basic security.</strong> I have taken the course several times now, and with the modifications to the projects each year, I feel like I’m always learning something new. Recently, they opened new courses for teaching <strong>full-stack web development and React-Native,</strong> both of which I thoroughly enjoyed as well.',
  'Welcome to my personal website! I strongly believe that you grow and learn from any experience, so I designed this site as a graph to show how my different experiences are interconnected. The nodes represent different parts of my CS experience: formal education, personal projects, organizations, and internships experiences. And edges represent times where I used skills from one experience in another. I hope this graph continues to become more populated and dense as I continue to grow!']