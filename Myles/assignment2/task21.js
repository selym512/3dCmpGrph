"use strict"
const glsl = x => x;

const vertexShaderSrc = glsl`
attribute vec3 a_position;
attribute vec3 a_color;
uniform vec3 u_color;
uniform float u_alpha;
uniform mat4 u_model;
varying vec4 v_color;
void main()
{        
    // *** TODO_A2 *** Taks 3 (4 points)
    //
    // Use the uniform vec3 u_color to combine it with the provided
    // attribute vec3 a_color in order to create shading for the planet. 
    // Be creative! There is no "right" way to create this color, so invent it in order to obtain 
    // a color for planets which satisfies you. 
    //
    // The attribute vec3 a_color contains noise values sampled from 
    // Perlin Noise distribution. The noise is given in the range between [0..1] 
    // and is the same in all three channels of a_color. 
    //
    // Remark: if you are interested how the sphere is created and the noise is sampled, 
    // check the function sphereGeometry(...) below. 
    
    // *** code here ***
    v_color = vec4(u_color + 0.5 * (a_color - 0.5), u_alpha);
    
    gl_Position = u_model * vec4(a_position, 1.0);      
}`;

const fragmentShaderSrc = glsl`    
precision mediump float;
varying vec4 v_color;
void main() 
{
    gl_FragColor = v_color;    
}`;



// ----------------------------------------------------------------------------
// Generates a uv-sphere geometry for a given number of segments. 
function sphereGeometry(heightSegments = 12, widthSegments = 24, radius = 1.0) {

    noise.seed(Math.random());
    const pi = Math.PI;
    const pi2 = 2 * pi;
    let vertices = [];
    let indices = [];

    // Generate the individual vertices in our vertex buffer.
    for (let y = 0; y <= heightSegments; y++) {
        for (let x = 0; x <= widthSegments; x++) {
            // Generate a vertex based on its spherical coordinates
            const u = x / widthSegments;
            const v = y / heightSegments;
            const theta = u * pi2;
            const phi = v * pi;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            const ux = cosTheta * sinPhi;
            const uy = cosPhi;
            const uz = sinTheta * sinPhi;
            vertices.push(radius * ux, radius * uy, radius * uz);

            const w = (2 * Math.cos(3 * phi));
            const c = (1 + noise.simplex3(ux * w, uy * w, uz * w)) / 2;
            vertices.push(c, c, c);
        }
    }

    // Generate the index buffer
    const numVertsAround = widthSegments + 1;
    for (let x = 0; x < widthSegments; x++) {
        for (let y = 0; y < heightSegments; y++) {
            // Make first triangle of the quad.
            indices.push(
                (y + 0) * numVertsAround + x,
                (y + 0) * numVertsAround + x + 1,
                (y + 1) * numVertsAround + x);
            // Make second triangle of the quad.
            indices.push(
                (y + 1) * numVertsAround + x,
                (y + 0) * numVertsAround + x + 1,
                (y + 1) * numVertsAround + x + 1);
        }
    }
    return { vertices, indices }
}



// ----------------------------------------------------------------------------
// Main function of the WebGL program. 
// It contains further functions as nested functions used for redering.
// This avoids the usage of global variables: all variables can be 
// defined in the main function. 
function main() {

    // ----------------------------------------------------------------------------  
    // Get the html-canvas element 
    const canvas = document.getElementById('canvas');
    // Get WebGL context
    const gl = canvas.getContext('webgl');
    if (!gl) {
        console.log("WebGL not supported by your browser.");
        throw "WebGL not supported by your browser.";
    }

    // ----------------------------------------------------------------------------  
    // Output WebGL version in the console
    console.log(gl.getParameter(gl.VERSION));
    // Output GLSL version in the console
    console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
    // Output GLSL max supported attributes
    console.log(gl.getParameter(gl.MAX_VERTEX_ATTRIBS));

    // ----------------------------------------------------------------------------  
    // Compile the GLSL vertex shader. 
    const vertexShader = compileShader(gl, vertexShaderSrc, gl.VERTEX_SHADER);
    // Compile the GLSL fragment shader. 
    const fragmentShader = compileShader(gl, fragmentShaderSrc, gl.FRAGMENT_SHADER);
    // Setup the GLSL program from shaders on the GPU.  
    const program = createProgram(gl, vertexShader, fragmentShader);

    // ----------------------------------------------------------------------------  
    // Lookup uniforms 
    let alphaLocation = gl.getUniformLocation(program, "u_alpha");
    let colorLocation = gl.getUniformLocation(program, "u_color");
    let modelMatLocation = gl.getUniformLocation(program, "u_model");

    // ----------------------------------------------------------------------------  
    // Lookup shader attribute for vertex positions.
    let positionAttribLocation = gl.getAttribLocation(program, "a_position");
    // Lookup shader attribute for vertex colors. 
    let colorAttribLocation = gl.getAttribLocation(program, "a_color");

    // ----------------------------------------------------------------------------
    // Create geometric object/scene      
    let geometry = sphereGeometry(50.0, 100.0);
    let vertexBuffer;
    let indexBuffer;
    setupBuffers(geometry);
    bindBuffers(geometry);

    // ----------------------------------------------------------------------------
    // Register the event for update of recursion depth with the UI slider. 
    document.getElementById("rangeSlider").oninput = function (event) {
        // subdivide geometry
        speed = Number(event.target.value);
    }
    // Register the X-rotate slider
    document.getElementById("rotXSlider").oninput = function (event) {
        worldRotX = -Number(event.target.value);
        updateModelMatrix();
    }
    // Register the Y-rotate slider
    document.getElementById("rotYSlider").oninput = function (event) {
        worldRotY = -Number(event.target.value);
        updateModelMatrix();
    }
    // Register the Z-rotate slider
    document.getElementById("rotZSlider").oninput = function (event) {
        worldRotZ = -Number(event.target.value);
        updateModelMatrix();
    }
    // update the world model matrix with values from the slides
    function updateModelMatrix() {
        modelMat = mat4();
        modelMat = mult(modelMat, rotateX(worldRotX));
        modelMat = mult(modelMat, rotateY(worldRotY));
        modelMat = mult(modelMat, rotateZ(worldRotZ));
    }

    // ----------------------------------------------------------------------------
    // init variables     
    // default model matrix (identity) 
    let modelMat = mat4();
    // rotation of the "world" model matrix
    let worldRotX = 0;
    let worldRotY = 0;
    let worldRotZ = 0;
    // animation time tracking
    let then = 0;
    // Step variable for the animation
    let step = 0;
    // default speed of the animation
    let speed = 10;

    // ----------------------------------------------------------------------------
    // set states which are static in this program        
    // Sets the color we want to use as background. 
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Enable depth testing 
    gl.enable(gl.DEPTH_TEST);
    // since we are using only one program for rendering of all objects, we set it here in the init            
    gl.useProgram(program);

    // ----------------------------------------------------------------------------
    // call render function by requesting a frame from the browser    
    window.requestAnimationFrame(render);



    // ============================================================================
    // ----------------------------------------------------------------------------
    // Nested buffer setup function. It sets the position buffer active.     
    // If scene is static, it needs only to be called once. 
    // If the scene is dynamic, it need to be called in the render function. 
    function setupBuffers(geometry) {

        if (geometry.vertices != null) {
            // vertex buffer
            // Create an empty buffer object to store vertex buffer
            vertexBuffer = gl.createBuffer();
            // Bind appropriate array buffer to it
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            // Pass the vertex data to the buffer
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.vertices), gl.STATIC_DRAW);
            // Unbind the buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        if (geometry.indices != null) {
            // index buffer
            // Create an empty buffer object to store Index buffer
            indexBuffer = gl.createBuffer();
            // Bind appropriate array buffer to it
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            // Pass the vertex data to the buffer
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.indices), gl.STATIC_DRAW);
            // Unbind the buffer
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }
    }

    // Bind buffers. Since we are using the same geometry for drawing of all three spheres, 
    // we can setup them only once in the initialization part. 
    function bindBuffers() {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

        // Turn on the position attribute
        gl.enableVertexAttribArray(positionAttribLocation);
        // Tell the position attribute how to get data out of triangleVertexBuffer (ARRAY_BUFFER)
        var size = 3; // number of elements per attribute, it is a vec2 thus 2.
        var type = gl.FLOAT; // type of elements, each are 32 bit float thus type is float.
        var normalize = gl.FALSE; // whether or not the data is normalized. It is false for positions.  
        var stride = 6 * Float32Array.BYTES_PER_ELEMENT; // size of an individual vertex (5 floats = 2 pos, 3 color)
        var offset = 0; // offset from beginning of the single vertex to this attribute
        gl.vertexAttribPointer(positionAttribLocation, size, type, normalize, stride, offset);

        // Turn on the color attribute
        gl.enableVertexAttribArray(colorAttribLocation);
        // Tell the color attribute how to get data out of triangleVertexBuffer (ARRAY_BUFFER)
        var size = 3; // number of elements per attribute
        var type = gl.FLOAT; // type of elements, each are 32 bit float thus type is float.
        var normalize = gl.FALSE; // whether or not the data is normalized. it is false for colors  
        var stride = 6 * Float32Array.BYTES_PER_ELEMENT; // size of an individual vertex and its color
        var offset = 3 * Float32Array.BYTES_PER_ELEMENT; // offset from beginning of the single vertex to this attribute
        gl.vertexAttribPointer(colorAttribLocation, size, type, normalize, stride, offset);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    }

    // ----------------------------------------------------------------------------
    // Nested render loop function. It performs the acutual drawing of the scence and needs
    // to be called each time anything has changes and needs to be updated. 
    function render(now) {

        // Screen mapping: sets the gl viewport to the canvas size.         
        gl.viewport(0, 0, canvas.width, canvas.height);
        // Clears the colorbuffer with the color specified above. 
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // --- animation setup ----
        // Convert the time to seconds
        now *= 0.001;
        // Subtract the previous time from the current time
        var delta = now - then;
        // Remember the current time for the next frame.
        then = now;
        // increment the step of the animation
        step += speed * delta;
        // set the duration of a day: 360 degrees per second by default speed = 10
        let day = -36.0 * step;
        // duration of a "sun-day": 24 times slower than an Earth day
        let sunday = day / 24;
        // duration of a month: 30 times slower than an Earth day
        let month = day / 30;
        // duration of a year: 360 times slower than an Earth day
        let year = day / 360;


        // -- draw sun ---------------
        if (document.getElementById("drawSun").checked) {

            // local variable for the model matrix
            let mmat = modelMat;

            // sun rotation wrt itself
            mmat = mult(mmat, rotateY(sunday));

            // sun size by scaling
            mmat = mult(mmat, scalem(0.5, 0.48, 0.5));

            // set sun model matrix            
            gl.uniformMatrix4fv(modelMatLocation, false, flatten(mmat));

            // set sun color and alpha
            gl.uniform3fv(colorLocation, hsvToRgb(0.11, 1, 1));
            gl.uniform1f(alphaLocation, 0.75);

            // draw the geometry                                   
            gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);
        }

        // -- draw earth ---------------        
        if (document.getElementById("drawEarth").checked) {

            // local variable for the model matrix
            let mmat = modelMat;

            // *** TODO_A2 *** : Task 1 (8 points)
            // Implement a model matrix for the Earth model using a concatination of 
            // canonical transformations and set it as the u_model uniform variable in the shader. 
            // The Earth should 
            // - be scaled accordingly
            // - rotate around its axis
            // - be tilted by -23.44 degrees with respect to (wrt) its orbit axis
            // - orbit around the sun  
            // Don't forget that the Earth's tilt angle is constant in the x-y-plane!
            // Be aware of the proper order of the transformations! 
            // Additionally, set its u_color uniform variable accordingly.  

            // *** code here ***
            mmat = mult(mmat, rotateY(year));

            //tilt earth
            mmat = mult(mmat, rotateX(-23.44));

            //move earth
            mmat = mult(mmat, translate(0.75, 0, 0));

            //Earth rotate
            mmat = mult(mmat, rotateY(day));



            // sun size by scaling
            mmat = mult(mmat, scalem(.1, .1, .1));


            gl.uniformMatrix4fv(modelMatLocation, false, flatten(mmat));

            // set sun color and alpha
            gl.uniform3fv(colorLocation, hsvToRgb(.625, 1.0, 0.75));
            gl.uniform1f(alphaLocation, 0.75);

            // draw the geometry                        
            gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);
        }

        // -- draw moon ---------------
        if (document.getElementById("drawMoon").checked) {
            // local variable for the model matrix
            let mmat = modelMat;

            // *** TODO_A2 *** : Task 2 (8 points)
            // Implement a model matrix for the Moon model using a concatination of 
            // canonical transformations and set it as the u_model uniform variable in the shader. 
            // The Moon should 
            // - be scaled accordingly
            // - rotate around the Earth
            // - be tilted by -5.14 degrees with respect to (wrt) its orbit axis around the Earth
            // - orbit around the Earth
            // - orbit with the Earth around the Sun  
            // Be aware of the proper order of the transformations! 
            // Additionally, set its u_color uniform variable accordingly.  

            // *** code here ***
             // Moon rotation wrt the Sun
             mmat = mult(mmat, rotateY(year));

             // Moon translation wrt the Earth
             mmat = mult(mmat, translate(0.75, 0, 0));
             
             // Moon rotation wrt the Earth
             mmat = mult(mmat, rotateY(month));
 
             // Moon tilt angle wrt its orbit axis around the Earth
             mmat = mult(mmat, rotateX(-5.14));
                         
             // move Moon by translation
             mmat = mult(mmat, translate(0.15, 0, 0));
 
             // Moon rotation wrt itself
             mmat = mult(mmat, rotateY(month));
 
             // Moon size by scaling
             mmat = mult(mmat, scalem(0.03, 0.03, 0.03));
 
             // set Moon model matrix            
             gl.uniformMatrix4fv(modelMatLocation, false, flatten(mmat));
 
             // set Moon color and alpha
             gl.uniform3fv(colorLocation, hsvToRgb(0.25, 1.0, 0.0));
             gl.uniform1f(alphaLocation, 0.75);

            // draw the geometry                                   
            gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);

        }

        // request next frame from the browser and render (it is an infinite loop)
        window.requestAnimationFrame(render);
    }
}