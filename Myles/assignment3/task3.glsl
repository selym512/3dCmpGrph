
// ****************************************************************************
const shaderSrcPreamble=`
#extension GL_OES_standard_derivatives : enable
#define PI 3.14159265359;
precision mediump float;
precision mediump int;
`;

// ****************************************************************************
const shaderSrcPhong=`
uniform int u_shading;

// Material coefficients
uniform vec3 u_ka;// Ambient reflection coefficient
uniform vec3 u_kd;// Diffuse reflection coefficient
uniform vec3 u_ks;// Specular reflection coefficient
uniform float u_qs;// Shininess
// Light properties
uniform vec3 u_lightpos;
uniform vec3 u_lightcol;

// ----------------------------------------------------------------------------
vec3 phongLighting(vec3 V, vec3 N, vec3 L, float r)
{
    // *** TODO_A3 *** Task 2b
    // Implement the Phong reflection model (Phong lighting)
    // compute the diffuse, specular, and ambient terms
    // Use the input arguments 
    // - V: normalized vector towards the viewers eye
    // - N: normalized normal vector of the surface point
    // - L: normalized vector towards the light source
    // - r: distance of the light source

    // *** begin code, replace the values below    
    vec3 reflectionVector = 2.0 * max(dot(N, L), 0.0) * N - L;


    // diffuse component
    vec3 diffuse = u_kd * dot(N, L);
    // specular component           
    vec3 specular = u_ks * pow(max(dot(V, reflectionVector), 0.0), u_qs);
    // ambient component
    vec3 ambient = u_ka * L;

    // *** end code
                
    // final shading color
    return diffuse + specular + ambient;
}
`;

// ****************************************************************************
const vertexShaderSrc=`
attribute vec3 a_position;
attribute vec3 a_color;
attribute vec3 a_normal;
attribute vec2 a_tex;

uniform vec3 u_color;
uniform float u_alpha;
uniform mat4 u_model;
uniform mat4 u_proj;
uniform mat4 u_normalmat;
uniform mat4 u_modelview;

varying vec3 v_color;
varying vec3 v_normal;
varying vec3 v_pos;

// ----------------------------------------------------------------------------
void main()
{
    // *** TODO_A3 : Task 2a
    // Transform the position of the vertex "a_position" to the view space using the model-view matrix.
    // Set the varying v_pos with the transformed value. 
    // Next, transform the normal-vectors "a_normal" to the view space using the transpose-inverse-view matrix
    // denoted here as "u_normalmat". Set the varying "v_normal". 
    
    // *** Begin code: replace the dummy values below. 



    // surface normal vector in view space  
    v_normal = vec3(u_normalmat * vec4(a_normal, 1));
    // vertex position in view space
    v_pos = vec3(u_modelview * vec4(a_position, 1));


    //Transform the position of the vertex attribute 
    //a_position to the view space using the model-view matrix

  

    // v_pos = (u_modelview);
    //math.transform()


    // *** End code.
  
    if(u_shading==0) {
        // light vector in view space
        vec3 lvec = (u_lightpos - v_pos);  
        // compute Gouraud shading using the Phong lighting model
        v_color = phongLighting(-normalize(v_pos), normalize(v_normal), normalize(lvec), length(lvec));                            
        gl_Position = u_proj * u_modelview * vec4(a_position, 1.0);
    }
    else if(u_shading==-1) {
        // create a small sphere around the origin in a qick-and-dirty way for the light dummy
        vec3 v = 0.09 * normalize(a_position);        
        gl_Position = u_proj * u_modelview * vec4(v, 1.0);
    }
    else if(u_shading==-2)
    {
        // draw only color, used for coordiante cross
        v_color = a_color;
        gl_Position = u_proj * u_modelview * vec4(a_position, 1.0);
    }
    else
    {        
        // output the position in model-view-projection space        
        gl_Position = u_proj * u_modelview * vec4(a_position, 1.0); 
    }   
}`;



const fragmentShaderSrc=`
varying vec3 v_color;
varying vec3 v_normal;
varying vec3 v_pos;

// ----------------------------------------------------------------------------
void main()
{
    // light vector in view space
    vec3 lvec = u_lightpos - v_pos.xyz;   

    if(u_shading==0) { 
        // draw Gouraud shaded                        
        gl_FragColor = vec4( v_color, 1.0 );
    }
    else if(u_shading==1) { 
        // draw Phong shaded                                                   
        gl_FragColor = vec4( phongLighting(-normalize(v_pos.xyz), normalize(v_normal), normalize(lvec), length(lvec)), 1.0 );
    }
    else if(u_shading==2) { 
        // draw flat shaded by comuting the face-normals using first order derivates on the triangle
        vec3 U = dFdx(v_pos.xyz);                     
        vec3 V = dFdy(v_pos.xyz);                 
        vec3 N = normalize(cross(U,V));
        gl_FragColor = vec4( phongLighting(-normalize(v_pos.xyz), normalize(N), normalize(lvec), length(lvec)), 1.0 );            
    }
    else if(u_shading==-1) {
        // draw light color for light dummy
        gl_FragColor = vec4( u_lightcol, 1.0 );
    }
    else { 
        // draw only the interpolated color, used for coordinate cross drawing
        gl_FragColor = vec4( v_color, 1.0 );
    }
}`;

