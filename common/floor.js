var Floor = function() {
  var pointsArray = [];
  var colorsArray = [];
  var y = 0.0;
  var lo = -1.0;
  var hi = 1.0;
  var inc = 0.1;
  for (var x = lo; x <= hi; x += inc) {
    pointsArray.push(vec4(x, y, hi));
    pointsArray.push(vec4(x, y, lo));
    colorsArray.push(vec4(0.0, 0.0, 0.0, 1.0));
    colorsArray.push(vec4(0.0, 0.0, 0.0, 1.0));
  }
  for (var z = lo; z <= hi; z += inc) {
    pointsArray.push(vec4(lo, y, z));
    pointsArray.push(vec4(hi, y, z));
    colorsArray.push(vec4(0.0, 0.0, 0.0, 1.0));
    colorsArray.push(vec4(0.0, 0.0, 0.0, 1.0));
  }

  this.vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  this.colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

  this.numPoints = pointsArray.length;
};

function renderFloor() {
  gl.useProgram(lineProgram.program);

  gl.enableVertexAttribArray(lineProgram.vertexLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, floor.vertexBuffer);
  gl.vertexAttribPointer(lineProgram.vertexLoc, 4, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(lineProgram.colorLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, floor.colorBuffer);
  gl.vertexAttribPointer(lineProgram.colorLoc, 4, gl.FLOAT, false, 0, 0);

  gl.uniformMatrix4fv(lineProgram.mvMatrixLoc, false, flatten(mvMatrix));
  gl.uniformMatrix4fv(lineProgram.pMatrixLoc, false, flatten(pMatrix));

  gl.drawArrays(gl.LINES, 0, floor.numPoints);
}
