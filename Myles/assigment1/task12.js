"use strict"


// ----------------------------------------------------------------------------
//*** TODO_A1 : Insert your credentials below ***
var lastname = 'Myles';
var firstname = 'Santapaga';
var studentnum = '31458433';
// ----------------------------------------------------------------------------


// ----------------------------------------------------------------------------
var vertexShaderSrc = `
attribute vec2 a_position;
attribute vec3 a_color;
varying vec3 v_color;
void main()
{
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_color = a_color;
}`;


// ----------------------------------------------------------------------------
var fragmentShaderSrc = `    
precision mediump float;
varying vec3 v_color;
uniform float u_alpha;
void main() 
{
    gl_FragColor = vec4(v_color, u_alpha);
}`;



// ----------------------------------------------------------------------------
function createCircleGeometry(radius, segments) {

    var pi2 = 2 * Math.PI;
    var step = pi2 / segments;


    var points = [vec2(0.0 , 0.0)];
    var colors = [vec3(1.0, 1.0, 1.0)];

    // for the amount of segments we add
    // another vector for the trianlge_fan
    for(var i = 0; i <= segments + 1; i++){
        points.push(vec2(radius * Math.cos(i* step), (radius * Math.sin(i * step))));
        colors.push(vec3(hsvToRgb( i/100, 1.0, 1.0)));
    }

    
    // *** TODO_A1 : Task 2a
    // Create a circle geometry which can be rendered using a TRIANGLE_FAN. 
    // Use the arguments of the function to specify the radius of the circle 
    // and the number of linear segments to approximate it. 
    //
    // Interpolate the color values on the circle linearly using the HUE of
    // the HSV color-space (function hsvToRgb(.,.,.)). 

    // code here

    return flattenArrays(points, colors);
}


// ----------------------------------------------------------------------------
// Main function of the WebGL program. 
// It contains further functions as nested functions used for redering.
// This avoids the usage of global variables: all variables can be 
// defined in the main function. 
function main() {

    // ----------------------------------------------------------------------------
    // Init WebGL context

    // Get the html-canvas element 
    var canvas = document.getElementById('canvas');
    // Get WebGL context
    var gl = canvas.getContext('webgl');
    if (!gl) {
        console.log("WebGL not supported by your browser.");
        throw "WebGL not supported by your browser.";
    }
    // Ouput WebGL version in the console
    console.log(gl.getParameter(gl.VERSION));
    // Ouput GLSL version in the console
    console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));


    // ----------------------------------------------------------------------------
    // Compile shaders and link the GLSL program for our simple scene. 

    // Compile the GLSL vertex shader. 
    var vertexShader = compileShader(gl, vertexShaderSrc, gl.VERTEX_SHADER);
    // Compile the GLSL fragment shader. 
    var fragmentShader = compileShader(gl, fragmentShaderSrc, gl.FRAGMENT_SHADER);
    // Setup the GLSL program from shaders on the GPU.  
    var program = createProgram(gl, vertexShader, fragmentShader);


    // ----------------------------------------------------------------------------
    // "Lookups" for our attributes and uniforms in the shader program. We 
    // create "Location" handles for these, which we can later use to access them. 

    // Lookup shader attribute for vertex positions.
    var positionAttribLocation = gl.getAttribLocation(program, "a_position");
    // Lookup shader attribute for vertex colors. 
    var colorAttribLocation = gl.getAttribLocation(program, "a_color");
    // Lookup uniform for the alpha value
    var alphaLocation = gl.getUniformLocation(program, "u_alpha");


    // ----------------------------------------------------------------------------
    // Vertex buffer object (VBO) initialization. Since we have only one VBO and
    // it is mostly static (exept subdivision), we init it here. 

    // Create geometric object/scene
    var geometry = createCircleGeometry(0.7, 3);
    // Create a buffer for the positions in GPU memory.
    var triangleVertexBufferObject = gl.createBuffer();
    // Bind the buffer that we created just now to be the active buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);
    // Specify the data on the active buffer. The array in RAM is passed to GPU memory.         
    gl.bufferData(
        gl.ARRAY_BUFFER,                // The target of the buffer
        new Float32Array(geometry),     // We pass is as a 32 bit float. 
        gl.STATIC_DRAW                  // Static_draw means we are sending the value once from CPU to GPU and we are not gonna change it.
    );


    // ----------------------------------------------------------------------------
    // Initalization calls. If scene is static these need to be called only once. 
    // If the scene is dynamic, we will have to call them in the render function.

    // Screen mapping: sets the gl viewport to the canvas size.
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Tell it to use the program (pair of shaders). If scene is static needs to be called only on init. 
    gl.useProgram(program);
    // Sets the color we want to use as background. 
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    // Enable depth testing for hidden-surface removal
    gl.enable(gl.DEPTH_TEST);
    // Init uniforms
    gl.uniform1f(alphaLocation, 1.0);

    // Bind the position and color buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexBufferObject);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionAttribLocation);
    // Tell the position attribute how to get data out of triangleVertexBuffer (ARRAY_BUFFER)
    var size = 2;						                // number of elements per attribute, it is a vec2 thus 2.
    var type = gl.FLOAT;				                // type of elements, each are 32 bit float thus type is float.
    var normalize = gl.FALSE;			                // whether or not the data is normalized. It is false for positions.  
    var stride = 5 * Float32Array.BYTES_PER_ELEMENT;	// size of an individual vertex (5 floats = 2 pos, 3 color)
    var offset = 0;                                     // offset from beginning of the single vertex to this attribute
    gl.vertexAttribPointer(positionAttribLocation, size, type, normalize, stride, offset);

    // Turn on the color attribute
    gl.enableVertexAttribArray(colorAttribLocation);
    // Tell the color attribute how to get data out of triangleVertexBuffer (ARRAY_BUFFER)
    var size = 3;						                // number of elements per attribute
    var type = gl.FLOAT;				                // type of elements, each are 32 bit float thus type is float.
    var normalize = gl.FALSE;			                // whether or not the data is normalized. it is false for colors  
    var stride = 5 * Float32Array.BYTES_PER_ELEMENT;	// size of an individual vertex and its color
    var offset = 2 * Float32Array.BYTES_PER_ELEMENT;    // offset from beginning of the single vertex to this attribute
    gl.vertexAttribPointer(colorAttribLocation, size, type, normalize, stride, offset);


    // ----------------------------------------------------------------------------
    // Register the event for update of recursion depth with the UI slider. 
    document.getElementById("rangeSlider").onchange = function (event) {
        // subdivide geometry
        geometry = createCircleGeometry(0.7, Number(event.target.value));
        // refill the buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry), gl.STATIC_DRAW);
        // call render to update the scence
        render();
    }

    // Register the event for update of the alpha value with the UI slider. 
    document.getElementById("alphaSlider").onchange = function (event) {
        // set uniforms
        gl.uniform1f(alphaLocation, Number(event.target.value));
        // call render to update the scene
        render();
    }


    // ----------------------------------------------------------------------------
    // call render function for the first time and draw the scene
    render();



    // ============================================================================    
    // Nested render loop function. It performs the acutual drawing of the scence and needs
    // to be called each time anything has changes and needs to be updated. 
    function render() {
        // Clears the colorbuffer with the color specified above. 
        gl.clear(gl.COLOR_BUFFER_BIT);

         //*** TODO_A1 : Task 2b
         //Adapt the rendering function to render the cirle geometry using a TRIANGLE_FAN. 
         //Use the same geometry to render a black outline of the circle 
         //using a LINE_STRIP.
        
        //

         //Take care of proper management of the attributes using 
         gl.enableVertexAttribArray(colorAttribLocation);

         gl.drawArrays(gl.TRIANGLE_FAN, 0, geometry.length / 5);

         gl.disableVertexAttribArray(colorAttribLocation);

         gl.drawArrays(gl.LINE_STRIP, 1, geometry.length / 5);

        //
        // You can override the attribute with one constant value using
        // gl.vertexAttrib4f(colorAttribLocation, r, g , b, a); 



        // code here
    }

}


