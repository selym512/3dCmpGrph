
// ###########################################################################
const shaderSrcPreamble=`
//#define TASKS
#define PI 3.14159265359
#extension GL_OES_standard_derivatives : enable
precision highp float;
precision mediump int;
`;

// ###########################################################################
const shaderSrcPhong=`
uniform int u_shading;
uniform float u_time;

uniform mat4 u_proj;
uniform mat4 u_normalmat;
uniform mat4 u_modelview;

// Material coefficients
uniform vec3 u_ka;  // Ambient reflection coefficient
uniform vec3 u_kd;  // Diffuse reflection coefficient
uniform vec3 u_ks;  // Specular reflection coefficient
uniform float u_qs; // Shininess

// Samplers
uniform sampler2D u_kdSampler; // Diffuse reflection coefficient
//uniform sampler2D u_ksSampler; // Specular reflection coefficient
uniform sampler2D u_nmSampler;// Normal map
uniform vec4 u_hasSampler;

// Light variables, note, light position is in view space!
uniform vec3 u_lightpos;
uniform vec3 u_lightcol;

// shared variables across shaders
varying vec3 v_color;
varying vec3 v_normal;
varying vec3 v_pos;
varying vec2 v_uv;

// light and eye directions in tangent space
varying vec3 v_lightTS;
varying vec3 v_eyeTS;


// ----------------------------------------------------------------------------
// computes a transpose of a 3x3 matrix
mat3 transpose(in mat3 inMatrix)
{
    return mat3(
        vec3(inMatrix[0].x, inMatrix[1].x, inMatrix[2].x),
        vec3(inMatrix[0].y, inMatrix[1].y, inMatrix[2].y),
        vec3(inMatrix[0].z, inMatrix[1].z, inMatrix[2].z)
    );    
}

// ----------------------------------------------------------------------------
vec3 phongLighting(vec3 V, vec3 N, vec3 L, float r, vec3 kdColor)
{
     // light color and intensity   
    vec3 light = (10.0*u_lightcol/(r*r));
    // diffuse component    
    vec3 diffuse =  kdColor * max(dot(N,L), 0.0) * light;       
    // specular component Phong         
    vec3 R = reflect(-L, N);
    float S = max(dot(V,R), 0.0);    
    vec3 specular = u_ks * pow(S, u_qs) * light;
    // ambient component
    vec3 ambient = u_ka * u_lightcol;              
    // final shading color
    return diffuse + specular + ambient;
}
`;


// ###########################################################################
const vertexShaderSrc=`
attribute vec3 a_position;
attribute vec3 a_color;
attribute vec3 a_normal;
attribute vec2 a_tex;
attribute vec3 a_tangent;

// ----------------------------------------------------------------------------
void main()
{
    // --- a quick-and-dirty way for the light dummy
    if(u_shading==-1) {        
        vec3 v = 0.09 * normalize(a_position);        
        gl_Position = u_proj * u_modelview * vec4(v, 1.0); return;
    }
    // --- draw only color, used for line rendering
    if(u_shading==-2)  {        
        v_color = a_color;
        gl_Position = u_proj * u_modelview * vec4(a_position, 1.0); return;
    }
    // --- draw uv's in texture-space as colors (uv1->rgb)
    if(u_shading==-3) {         
        v_color = (vec3(a_tex, 1.0));
        gl_Position = u_proj * u_modelview * vec4(a_position, 1.0); return;
    }
    // --- draw normals in world-space as colors (xyz->rgb)
    if(u_shading==-4) {         
        v_color = (a_normal+1.0)*0.5;
        gl_Position = u_proj * u_modelview * vec4(a_position, 1.0); return;
    }
    // --- draw tangents in world-space as colors (xyz->rgb)
    if(u_shading==-5) {         
        v_color = (a_tangent+1.0)*0.5;
        gl_Position = u_proj * u_modelview * vec4(a_position, 1.0); return;
    }
    // --- draw positions in world-space as colors (xyz->rgb)
    if(u_shading==-6) {         
        v_color = (normalize(a_position.xyz)+1.0)*0.5;
        gl_Position = u_proj * u_modelview * vec4(a_position, 1.0); return;
    }

    // --- surface normal vector in view space  
    v_normal = (u_normalmat * vec4(a_normal, 0.0)).xyz;    
    // --- vertex position in view space
    v_pos = (u_modelview * vec4(a_position, 1.0)).xyz;
    // --- texture coordinates assigned to a varying 
    v_uv = vec2(a_tex.x, a_tex.y);
    // --- output position in model-view-projection space        
    gl_Position = u_proj * vec4(v_pos, 1.0);
      

    // ************************************************************************
    // *** TODO_A4 : Task 3a: Transform to Tangent Space in VS (12 points) ***
    //
    // Implement transformation to tangents-space for normal mapping. 
    
    // Using the supplied tangent attribute (a_tangent), construct the TBN matrix. 
    // Hint: you need to compute the bitangent. Also be careful, since the order/direction matters!
    // Next, transform the light vector and the view vector view-space into tangent-space in order 
    // to compute lighting in the tangent-space. 
    // Hint: use the varyings v_lightTS and v_eyeTS to pass the values to fragment shaders. 
    //     
    // *** Begin code. Replace values below. 

    v_lightTS = vec3(0,0,0);
    v_eyeTS = vec3(0,0,0);
        
    // *** End code.
    // ************************************************************************
}`;


// ###########################################################################
const fragmentShaderSrc=`

// ----------------------------------------------------------------------------
void main()
{    
    // --- draw light color for light dummy
    if(u_shading==-1) {        
        gl_FragColor = vec4( u_lightcol, 1.0 );
        return;
    }
    // --- draw only the interpolated color,
    if(u_shading<-1) {         
        gl_FragColor = vec4( v_color, 1.0 );
        return;
    }


    // --- define variables for light, view, and normal vectors
    vec3 L,V,N;

    // --- phong illumination in view space (as in Assignment 3)
    if(u_shading==3)
    {
        // draw flat shaded by computing the face-normals using first order derivates on the triangle
        vec3 dpdx = dFdx(v_pos.xyz);                     
        vec3 dpdy = dFdy(v_pos.xyz);  
        // vectors in view space               
        N = cross(dpdx,dpdy); 
        L = u_lightpos - v_pos.xyz;   
        V = -v_pos.xyz; 
        
    }
    // --- phong illumination in tangent space
    else if(u_shading==2)
    {
        // ************************************************************************
        // *** TODO_A4 : Task 3b: Normal Sampling in FS (6 points) ***
        // 
        // Implement normal-mapping in tangent-space by appropriately sampling 
        // the value of the normal vector (N) from the normal-map texture (u_nmSampler). 
        // Also, set the value of light-direction, eye-direction appropriately. 
        // Note to account for a solution if the sampler is not set: in this case 
        // the value of u_hasSampler[2] is equal to zero. 
        // Similarly, maximum points is given if you avoid using an IF-switch. 
        //
        // *** Begin code. Replace values below. 
        
        N = vec3(0,0,0);
        L = vec3(0,0,0);
        V = vec3(0,0,0);

    
        // *** End code.
        // ************************************************************************
    }
    // --- phong illumination in view space with flat normals
    else
    {
        // vectors in view space
        L = u_lightpos - v_pos.xyz;   
        V = -v_pos.xyz;  
        N = v_normal;   
    }

    
    // ************************************************************************
    // *** TODO_A4 : Task 2a: Sampling from a Diffuse Texture (4 points) *** (4 points)
    // 
    // Implement sampling from the diffuse texture sampler. 
    // Use the u_hasSampler[0] value to decide if the kd-value should be taken form the sampler or not. 
    // If u_hasSampler[0] is set to 1.0, use the value from the texture as kd-coefficient
    // If u_hasSampler[0] is set to 0.0, use the diffuse coefficient rgb-values kd
    // NOTE: to get full points, avoid using an if-switch!
    //
    // *** Begin code. Replace values below. 

    vec3 kdColor = u_kd; 

    // *** End code.
    // ************************************************************************

    // --- compute lighting using values of V, N, L and the kdColor
    gl_FragColor = vec4( phongLighting(normalize(V), normalize(N), normalize(L), length(L), kdColor), 1.0 ); 
}`;

