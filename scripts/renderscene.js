var view;
var ctx;
var scene;
var start_time;
var camera_velocity;
var keys_pressed;

var BACK =   1;  //000001
var FRONT =  2;  //000010
var TOP =    4;  //000100
var BOTTOM = 8;  //001000
var RIGHT =  16; //010000
var LEFT =   32; //100000

// Initialization function - called when web page loads
function Init() {
    var w = 800;
    var h = 600;
    view = document.getElementById('view');
    view.width = w;
    view.height = h;
    keys_pressed = Array(100).fill(false);

    ctx = view.getContext('2d');

    // initial scene... feel free to change this
    scene = {
        view: {
            type: 'perspective',
            prp: Vector3(10, 9, 0),
            srp: Vector3(10, 9, -30),
            vup: Vector3(0, 1, 0),
            clip: [-11, 11, -11, 11, 30, 100]
        },
        models: [
            {
                type: 'generic',
                animation: {
                    axis: 'y',
                    rps: 0.1
                },
                vertices: [
                    Vector4( 0,  0, -30, 1),
                    Vector4(20,  0, -30, 1),
                    Vector4(20, 12, -30, 1),
                    Vector4(10, 20, -30, 1),
                    Vector4( 0, 12, -30, 1),
                    Vector4( 0,  0, -60, 1),
                    Vector4(20,  0, -60, 1),
                    Vector4(20, 12, -60, 1),
                    Vector4(10, 20, -60, 1),
                    Vector4( 0, 12, -60, 1)
                ],
                edges: [
                    [0, 1, 2, 3, 4, 0],
                    [5, 6, 7, 8, 9, 5],
                    [0, 5],
                    [1, 6],
                    [2, 7],
                    [3, 8],
                    [4, 9]
                ]
            }
        ]
    };

    // event handler for pressing arrow keys
    document.addEventListener('keydown', (event) => {
        keys_pressed[event.keyCode] = true;
    }, false);
    document.addEventListener('keyup', (event) => {
        keys_pressed[event.keyCode] = false;
    }, false);
    
    // start animation loop
    start_time = performance.now(); // current timestamp in milliseconds
    window.requestAnimationFrame(Animate);
}

// Animation loop - repeatedly calls rendering code
function Animate(timestamp) {
    var time = timestamp - start_time;

    // Apply the changes to the camera
    let n_axis = scene.view.prp.subtract(scene.view.srp);
    n_axis.normalize();
    let u_axis = scene.view.vup.cross(n_axis);
    u_axis.normalize();

    
    if(!(keys_pressed[37] && keys_pressed[39])) {
        // Left arrow
    }

    for(let model of scene.models) {

        if(model.animation != undefined) {
            model.animation.matrix = new Matrix(4,4);
            Mat4x4Identity(model.animation.matrix);

            // Defines the centerpoint, if it is not defined
            if(model.center == undefined) {
                let min_x = model.vertices[0].x;
                let max_x = model.vertices[0].x;
                let min_y = model.vertices[0].y;
                let max_y = model.vertices[0].y;
                let min_z = model.vertices[0].z;
                let max_z = model.vertices[0].z;
    
                for(let vertex of model.vertices) {
                    min_x = Math.min(min_x, vertex.x*vertex.w);
                    max_x = Math.max(max_x, vertex.x*vertex.w);
                    min_y = Math.min(min_y, vertex.y*vertex.w);
                    max_y = Math.max(max_y, vertex.y*vertex.w);
                    min_z = Math.min(min_z, vertex.z*vertex.w);
                    max_z = Math.max(max_z, vertex.z*vertex.w);
                }

                model.center = Vector4((min_x+max_x)/2, (min_y+max_y)/2, (min_z+max_z)/2, 1);
            }

            // Translate centerpoint to origin
            let translate_to_origin = new Matrix(4,4);
            Mat4x4Translate(translate_to_origin, -model.center.x, -model.center.y, -model.center.z); 

            // Rotate about the desired axis
            let rotate = new Matrix(4,4);
            let theta = (time/1000)*2*Math.PI*model.animation.rps;
            switch(model.animation.axis) {
                case 'x':
                    Mat4x4RotateX(rotate, theta);
                    break;

                case 'y':
                    Mat4x4RotateY(rotate, theta);
                    break;

                case 'z':
                    Mat4x4RotateZ(rotate, theta);
                    break;
            }

            // Translate back to original position
            let translate_back = new Matrix(4,4);
            Mat4x4Translate(translate_back, model.center.x, model.center.y, model.center.z);

            // Apply to the animation matrix
            model.animation.matrix = Matrix.multiply([translate_back, rotate, translate_to_origin, model.animation.matrix]);
        }
    }

    DrawScene();

    window.requestAnimationFrame(Animate);
}

// Main drawing code - use information contained in variable `scene`
function DrawScene() {
    ctx.clearRect(0,0,view.width,view.height);

    // Copy models & apply animation matrix
    let models = [];
    for(let model of scene.models) {
        my_model = {
            vertices: [],
            edges:[]
        }

        switch(model.type) {
            case 'generic': // Copy a generic model
                for (let vertex of model.vertices) {
                    my_model.vertices.push(vertex);
                }
                for(let edge of model.edges) {
                    let my_edge = [];
                    for(let point of edge) {
                        my_edge.push(point);
                    }
                    my_model.edges.push(my_edge);
                }
                break;

            case 'cube': // Create a cube
                break;

            case 'cylinder': // Create a cylinder
                break;

            case 'cone': // Create a cone
                break;

            case 'sphere': // Create a sphere
                break;
        }

        // Applies the animation matrix
        if(model.animation != undefined) {
            for (let i=0; i<my_model.vertices.length; i++) {
                my_model.vertices[i] = Matrix.multiply([model.animation.matrix, my_model.vertices[i]]);
            }
        }
        models.push(my_model);
    }

    // Project
    let projection = new Matrix(4,4);
    if(scene.view.type === 'perspective') {
        Mat4x4Projection(projection, scene.view.prp, scene.view.srp, scene.view.vup, scene.view.clip);
    }
    else if(scene.view.type === 'parallel') {

    }

    for(let i=0; i< models.length; i++) {
        for (let j=0; j<models[i].vertices.length; j++) {
            models[i].vertices[j] = projection.mult(models[i].vertices[j]);
            
        }
        
    }

    //Clip
    for (var i = 0; i < scene.models.length; i++)
    {
        for (var j = 0; j < scene.models[i].edges.length; j++)
        {
            for (var k = 0; k < scene.models[i].edges[j].length - 1; k++)
            {
				var v1 = scene.models[i].vertices[scene.models[i].edges[j][k]];
				var v2 = scene.models[i].vertices[scene.models[i].edges[j][k + 1]];
				var line;
				if(scene.view.type === 'parallel')
				{
					line = clipPar(models[i][v1], models[i][v2]);
				}
				else
				{
					line = clipPersp(models[i][v1], models[i][v2]);
				}
				if (line != null)
				{
					scene.models[i].vertices[v1] = line.pt0;
					scene.models.[i].vertices[v2] = line.pt1;
				}
			}
		}
	}

    //Transform
    let project_back = new Matrix(4,4);
    if(scene.view.type === 'perspective') {
        Mat4x4MPer(project_back);
    }
    else if(scene.view.type === 'parallel') {

    }

    let scale = new Matrix(4,4);
    scale.values = [
        [view.width/2,0,0,view.width/2],
        [0,view.height/2,0,view.height/2],
        [0,0,1,0],
        [0,0,0,1]
    ];

    for(let i=0; i<models.length; i++) {
        for (let j=0; j<models[i].vertices.length; j++) {
            models[i].vertices[j] = new Vector(Matrix.multiply([scale, project_back, models[i].vertices[j]]));
        }
    }

    //Draw
    for (let model of models) {
        for (let edge of model.edges) {
            for(let i=1; i<edge.length; i++) {
                let point_1 = new Vector(model.vertices[edge[i-1]]);
                let point_2 = new Vector(model.vertices[edge[i]]);
                DrawLine(point_1.x/point_1.w, point_1.y/point_1.w, point_2.x/point_2.w, point_2.y/point_2.w);
            }
        }
    }
}

function outcodePar(pt)
{
	var outcode = 0;
	if (pt.x - 0.00001 < -1) outcode += LEFT;
	else if (pt.x - 0.00001 > 1) outcode += RIGHT;
	if (pt.y - 0.00001 < -1) outcode += BOTTOM;
	else if (pt.y - 0.00001 > 1) outcode += TOP;
	if (pt.z > 0) outcode += NEAR;
	else if (pt.z < -1) outcode += FAR;
	
	return outcode;
}

function outcodePersp(pt)
{
	var outcode = 0;
	var zmin = -scene.view.clip[4]/scene.view.clip[5];
	if(pt.x < pt.z) outcode += LEFT;
	else if(pt.x > -pt.z) outcode += RIGHT;
	if(pt.y < pt.z) outcode += BOTTOM;
	else if(pt.y > -pt.z) outcode += TOP;
	if(pt.z > zmin) outcode += NEAR;
	else if(pt.z < -1) outcode += FAR;
	
	return outcode;
}

function clipPar(pt0, pt1)
{
	var done = false;
	var line = null;
	var endpt0 = new Vector4(pt0.x, pt0.y, pt0.z, pt0.w);
	var endpt1 = new Vector4(pt1.x, pt1.y, pt1.z, pt1.w);
	var outcode0, outcode1, selected_outcode, t;
	
	while(!done)
	{
		outcode0 = OutcodePar(endpt0);
		outcode1 = OutcodePar(endpt1);
		if((outcode0 | outcode1) === 0) // <---checks type and value
		{
			done = true;
			line = {pt0 : endpt0, pt1 : endpt1};
		}
		else if((outcode0 & outcode1) !== 0)
		{
			done = true;
		}
		else
		{
			if(outcode0 !== 0)
			{
				selected_outcode = outcode0;
			}
			else
			{
				selected_outcode = outcode1;
			}
			
			if (selected_outcode & LEFT)
			{
				t = (-1 - endpt0.x) / (endpt1.x - endpt0.x);
			}
			else if (selected_outcode & RIGHT)
			{
				t = (1 - endpt0.x) / (endpt1.x - endpt0.x);
			}	
			else if (selected_outcode & BOTTOM)
			{
				t = (-1 - endpt0.y) / (endpt1.y - endpt0.y);
			}	
			else if (selected_outcode & TOP)
			{
				t = (1 - endpt0.y) / (endpt1.y - endpt0.y);
			}
			else if (selected_outcode & NEAR)
			{
				t = (0 - endpt0.z) / (endpt1.z - endpt0.z);
			}
			else
			{
				t = (-1 - endpt0.z) / (endpt1.z - endpt0.z);
			}
			
			if(selected_outcode === outcode0)
			{
				endpt0.x = endpt0.x + t * (endpt1.x - endpt0.x);
				endpt0.y = endpt0.y + t * (endpt1.y - endpt0.y);
				endpt0.z = endpt0.z + t * (endpt1.z - endpt0.z);
			}
			else
			{
				endpt1.x = endpt0.x + t * (endpt1.x - endpt0.x);
				endpt1.y = endpt0.y + t * (endpt1.y - endpt0.y);
				endpt1.z = endpt0.z + t * (endpt1.z - endpt0.z);
			}
		}
	}
	
	return line;
}

function clipPersp(pt0, pt1)
{
	var done = false;
	var line = null;
	var endpt0 = new Vector4(pt0.x, pt0.y, pt0.z, pt0.w);
	var endpt1 = new Vector4(pt1.x, pt1.y, pt1.z, pt1.w);
	var outcode0, outcode1, selected_outcode, t;
	
	while(!done)
	{
		outcode0 = OutcodePersp(endpt0);
		outcode1 = OutcodePersp(endpt1);
		if((outcode0 | outcode1) === 0) // <---checks type and value
		{
			done = true;
			line = {pt0 : endpt0, pt1 : endpt1};
		}
		else if((outcode0 & outcode1) !== 0)
		{
			done = true;
		}
		else
		{
			if(outcode0 !== 0)
			{
				selected_outcode = outcode0;
			}
			else
			{
				selected_outcode = outcode1;
			}
			
			var dx = endpt1.x - endpt0.x;
			var dy = endpt1.y - endpt0.y;
			var dz = endpt1.z - endpt0.z;
			var zmin = -scene.view.clip[4]/scene.view.clip[5];
			if (selected_outcode & LEFT)
			{
				t = ((-endpt0.x) - endpt0.z) / (dx - dz);
			}
			else if (selected_outcode & RIGHT)
			{
				t = (endpt0.x - endpt0.z) / (-dx - dz);
			}	
			else if (selected_outcode & BOTTOM)
			{
				t = ((-endpt0.y) + endpt0.z) / (dy - dz);
			}	
			else if (selected_outcode & TOP)
			{
				t = (endpt0.y + endpt0.z) / (-dy - dz);
			}
			else if (selected_outcode & NEAR)
			{
				t = (endpt0.z - zmin) / (-dz);
			}
			else
			{
				t = ((-endpt0.z) - 1) / (dz);
			}
			
			if(selected_outcode === outcode0)
			{
				endpt0.x = endpt0.x + t * (endpt1.x - endpt0.x);
				endpt0.y = endpt0.y + t * (endpt1.y - endpt0.y);
				endpt0.z = endpt0.z + t * (endpt1.z - endpt0.z);
			}
			else
			{
				endpt1.x = endpt0.x + t * (endpt1.x - endpt0.x);
				endpt1.y = endpt0.y + t * (endpt1.y - endpt0.y);
				endpt1.z = endpt0.z + t * (endpt1.z - endpt0.z);
			}
		}
	}
	
	return line;
}

// Called when user selects a new scene JSON file
function LoadNewScene() {
    var scene_file = document.getElementById('scene_file');

    console.log(scene_file.files[0]);

    var reader = new FileReader();
    reader.onload = (event) => {
        scene = JSON.parse(event.target.result);
        scene.view.prp = Vector3(scene.view.prp[0], scene.view.prp[1], scene.view.prp[2]);
        scene.view.srp = Vector3(scene.view.srp[0], scene.view.srp[1], scene.view.srp[2]);
        scene.view.vup = Vector3(scene.view.vup[0], scene.view.vup[1], scene.view.vup[2]);

        for (let i = 0; i < scene.models.length; i++) {
            if (scene.models[i].type === 'generic') {
                for (let j = 0; j < scene.models[i].vertices.length; j++) {
                    scene.models[i].vertices[j] = Vector4(scene.models[i].vertices[j][0],
                                                          scene.models[i].vertices[j][1],
                                                          scene.models[i].vertices[j][2],
                                                          1);
                }
            }
            else {
                scene.models[i].center = Vector4(scene.models[i].center[0],
                                                 scene.models[i].center[1],
                                                 scene.models[i].center[2],
                                                 1);
            }
            scene.models[i].matrix = new Matrix(4, 4);
        }
    };
    reader.readAsText(scene_file.files[0], "UTF-8");
}

// Called when user presses a key on the keyboard down 
function updateVelocity() {



    switch (event.keyCode) {

        case 37: // LEFT Arrow
            console.log("left");
            scene.view.prp = scene.view.prp.subtract(u_axis);
            scene.view.srp = scene.view.srp.subtract(u_axis);
            break;
        case 38: // UP Arrow
            console.log("up");
            scene.view.prp = scene.view.prp.subtract(n_axis);
            scene.view.srp = scene.view.srp.subtract(n_axis);
            break;
        case 39: // RIGHT Arrow
            console.log("right");
            scene.view.prp = scene.view.prp.add(u_axis);
            scene.view.srp = scene.view.srp.add(u_axis);
            console.log(scene.view.srp);
            break;
        case 40: // DOWN Arrow
            console.log("down");
            scene.view.prp = scene.view.prp.add(n_axis);
            scene.view.srp = scene.view.srp.add(n_axis);
            break;
    }
}

// Draw black 2D line with red endpoints 
function DrawLine(x1, y1, x2, y2) {
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
    ctx.fillRect(x2 - 2, y2 - 2, 4, 4);
}
