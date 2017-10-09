"use strict";

var canvas;
var gl;

var mvMatrix, pMatrix, nMatrix;
var matrixStack = new Array();

var lineProgram;
var sphereProgram;

var axis;
var floor;
var segment;
var sphere;

var root;
var pause;
var frameData;
var currentFrame;
var frameSpeed;
// Viewing
var aspect = 1.0;

// Data
var bvh;

var LineProgram = function() {
  this.program = initShaders(gl, 'line-vshader', 'line-fshader');
  gl.useProgram(this.program);

  this.vertexLoc = gl.getAttribLocation(this.program, 'vPosition');
  this.colorLoc = gl.getAttribLocation(this.program, 'vColor');

  this.mvMatrixLoc = gl.getUniformLocation(this.program, 'mvMatrix');
  this.pMatrixLoc = gl.getUniformLocation(this.program, 'pMatrix');
  this.nMatrixLoc = gl.getUniformLocation(this.program, 'nMatrix');
};

var SphereProgram = function() {
  this.program = initShaders(gl, 'sphere-vshader', 'sphere-fshader');
  gl.useProgram(this.program);

  this.vertexLoc = gl.getAttribLocation(this.program, 'vPosition');
  this.normalLoc = gl.getAttribLocation(this.program, 'vNormal');
  this.colorLoc = gl.getAttribLocation(this.program, 'vColor');

  this.mvMatrixLoc = gl.getUniformLocation(this.program, 'mvMatrix');
  this.pMatrixLoc = gl.getUniformLocation(this.program, 'pMatrix');
  this.nMatrixLoc = gl.getUniformLocation(this.program, 'nMatrix');
};

var radius = 150.0;
var theta = radians(45);
var up = vec3(0.0, 1.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);
var thetaY = radians(30.0);
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const fovy = 40.0;
  const near = 0.01;
  const far = 1000;
  var eye = vec3(radius * Math.sin(theta),
                 radius * Math.sin(thetaY),
                 radius * Math.cos(theta));
  at = vec3(frameData[0], frameData[1], frameData[2]);
  pMatrix = perspective(fovy, aspect, near, far);
  mvMatrix = lookAt(eye, at, up);

  pushMatrix();
  mvMatrix = mult(mvMatrix, scalem(50.0, 50.0, 50.0));
  renderFloor();
  popMatrix();

  mvMatrix = mult(mvMatrix, translate(frameData[0], frameData[1], frameData[2]));
  traverseBVHTree(vec3(0.0, 0.0, 0.0), root);
}

var reader = new FileReader();
reader.onload = function(e) {
  var text = reader.result;
};

function tick() {
    requestAnimFrame(tick);
    render();
    if (!pause) {
      animate();
    }

}

var lastTime = 0;
function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;
          updateFrame(frameSpeed);
    }
    lastTime = timeNow;
}

/**
 * Parses a BVH file and places the result in the bvh variable.
 */
function parse(input) {
  var antlr4 = require('antlr4/index');
  var BVHLexer = require('parser/BVHLexer');
  var BVHListener = require('parser/BVHListener');
  var BVHParser = require('parser/BVHParser');
  require('./BVH');

  var chars = new antlr4.InputStream(input);
  var lexer = new BVHLexer.BVHLexer(chars);
  var tokens = new antlr4.CommonTokenStream(lexer);
  var parser = new BVHParser.BVHParser(tokens);
  parser.buildParseTrees = true;
  var tree = parser.mocap();

  bvh = new BVH();
  antlr4.tree.ParseTreeWalker.DEFAULT.walk(bvh, tree);

  // Construct the hierarchical tree
  root = Root();
  currentFrame = 0;
  frameData = bvh.frames[currentFrame];
}

function keyDown(e) {
  switch (e.keyCode) {
  case 37:
    // left
    theta = theta - radians(3);
    break;
  case 38:
    // up
    //thetaY += radians(5);
    radius = radius - 1.5;
    break;
  case 39:
    // right
    theta = theta + radians(3);
    break;
  case 40:
    // down
    //thetaY -= radians(5);
    radius = radius + 1.5;
    break;
  case 32:
    // spacebar
    pause = !pause;
    break;
  case 73:
    // i
    //radius = radius - 0.5;
    frameSpeed++;
    break;
  case 79:
    // o
    //radius = radius + 0.5;
    frameSpeed--;
    if (frameSpeed < 0) {
      frameSpeed = 0;
    }
    break;
  case 'F'.charCodeAt(0):
    // F or f
    break;
  default:
    // To see what the code for a certain key is, uncomment this line,
    // reload the page in the browser and press the key.
    //console.log("Unrecognized key press: " + e.keyCode);
    break;
  }
  requestAnimFrame(render);
}

/**
 * Init function
 */
window.onload = function init() {
  document.onkeydown = keyDown;

  canvas = document.getElementById('gl-canvas');

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) { alert("WebGL isn't available"); }

  gl.viewport(0, 0, canvas.width, canvas.height);
  aspect = canvas.width / canvas.height;

  // Init some GL stuff
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  //  Load shaders and initialize attribute buffers
  lineProgram = new LineProgram();
  sphereProgram = new SphereProgram();

  floor = new Floor();
  axis = new Axis();
  segment = new Segment();
  sphere = new Sphere(1, 20, 20);

  // Listen for a file to be loaded and parse
  var fileInput = document.getElementById('fileInput');
  fileInput.addEventListener('change', function(e) {
    var file = fileInput.files[0];
    if (file && file.name) {
      if (file.name.match(/.*\.bvh/)) {
        var reader = new FileReader();
        reader.onload = function(e) {
          parse(reader.result);
        };
        reader.readAsText(file);
      } else {
        console.log('File not supported! ' + file.type);
      }
    }
  });

  pause = true;
  frameSpeed = 2;

  // Set up listeners
  canvas.addEventListener('mousemove', mouse_move, false);
  canvas.addEventListener('wheel', mouse_wheel, false);
  // Parse a default file.
  // TODO: change this to testData1 when you're ready to start rendering
  // animation. These strings are defined in test1.bvh.js and test2.bvh.js.
  parse(testData1);

  tick();
};

function mouse_move(event) {
  if (event.buttons & 1) {
    theta = theta + (event.movementX * -0.005);
    thetaY = thetaY + (event.movementY * 0.005);
  }
}

function mouse_wheel(event) {
  radius = radius + (0.5 * event.deltaY);
}
// Stack stuff
var matrixStack = new Array();
function pushMatrix() {
  matrixStack.push(mat4(mvMatrix));
}
function popMatrix() {
  mvMatrix = matrixStack.pop();
}

var Root = function() {
  return bvh.roots[0];
};

var currentChannel = 0;
function traverseBVHTree(parentCoordinates, node) {
  var currentCoordinates = vec3();
  currentCoordinates[0] = parentCoordinates[0] + parseFloat(node.offsets[0]);
  currentCoordinates[1] = parentCoordinates[1] + parseFloat(node.offsets[1]);
  currentCoordinates[2] = parentCoordinates[2] + parseFloat(node.offsets[2]);

  pushMatrix();
  mvMatrix = mult(mvMatrix, translate(node.offsets));

  var segmentVector = subtract(parentCoordinates, currentCoordinates);
  var segmentLength = length(segmentVector);
  if (segmentLength > 0) {
    // calculate rotation angle and axis for drawing the line segment
    var v1 = normalize(vec3(1.0, 0.0, 0.0));
    var v2 = normalize(vec3(segmentVector));
    var angle = Math.acos(dot(vec3(v1), vec3(v2)));
    var axis = normalize(cross(vec3(v1), vec3(v2)));

    pushMatrix();
    mvMatrix = mult(mvMatrix, rotate(degrees(angle), axis));
    mvMatrix = mult(mvMatrix, scalem(vec3(segmentLength, 0.0, 0.0)));
    renderSegment();
    popMatrix();
  }

  pushMatrix();
  mvMatrix = mult(mvMatrix, scalem(0.5, 0.5, 0.5));
  renderSphere();
  popMatrix();

  for (var i = 0; i < node.channels.length; i++) {
    if (node.channels[i] == 'Zrotation') {
      mvMatrix = mult(mvMatrix, rotateZ(frameData[node.channelOffset + i]));
    }
    else if (node.channels[i] == 'Yrotation') {
      mvMatrix = mult(mvMatrix, rotateY(frameData[node.channelOffset + i]));
    }
    else if (node.channels[i] == 'Xrotation') {
      mvMatrix = mult(mvMatrix, rotateX(frameData[node.channelOffset + i]));
    }
  }

  // traverse this node's children
  for (var i = 0; i < node.children.length; i++) {
    traverseBVHTree(currentCoordinates, node.children[i]);
  }
  popMatrix();
}

function updateFrame(numFrames) {
  currentFrame += numFrames;
  if (currentFrame > bvh.frames.length - 1) {
    currentFrame = 0;
    pause = true;
  }
  frameData = bvh.frames[currentFrame];
}
