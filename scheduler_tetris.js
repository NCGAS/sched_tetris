$(document).ready(function(){
    // Setting up our state and global variables
    // draggable_to_droppable_relationship is a JS object that will associate each draggable to a droppable.
    // I did it this way to ensure a draggable can only belong to one droppable at a time (I hope)
    var draggable_to_droppable_relationship = {};
    // Keep the list of users and their sizes to report; initialize based on those which have the draggable class
    var draggable_sizes = {};
    var draggable_users = {};
    // Keep list of the dropabbles to report
    var all_droppables = {};
    // Set our expectations for what the class names will be for our height, width, username.
    const height_regex = /height_(\d+)/;
    const width_regex = /width_(\d+)/;
    const user_regex = /user_(\w+)/;

    $('.dropSmallMem, .dropLargeMem').each( function () {
	$('#hpcstats tbody').append("<tr><td></td> <td></td> <td></td></tr>");
	let drop_id = $(this).attr("id");
        /*let drop_classnames = $(this).prop("className");
        let matchHeight = drop_classnames.match(height_regex);
        console.log("id is ", drop_id, " height is ", matchHeight[1]);
        let matchWidth = drop_classnames.match(width_regex);
	console.log("width is ",matchWidth[1]);
	let size = matchHeight[1] * matchWidth[1]; */
	let size = 4;
	all_droppables[drop_id] = size;
	//console.log("found hpc ",$(this).attr("id"));
    });
    // Start each draggable as belonging to no man!
    // Initialize the size and user by digesting their div classes
    $('.draggable').each( function () {
	$('#userstats tbody').append("<tr><td></td> <td></td></tr>");
	let drag_id = $(this).attr("id");
        draggable_to_droppable_relationship[drag_id] = "";
	let drag_classnames = $(this).prop("className");
	//console.log(drag_classnames);
	// TODO: Please check the number of matches for width and height to make sure they == 1
	let matchHeight = drag_classnames.match(height_regex);
	//console.log("id is ", drag_id, " height is ", matchHeight[1]);
	let matchWidth = drag_classnames.match(width_regex);
	//console.log("width is ",matchWidth[1]);
	let size = matchHeight[1] * matchWidth[1];
        draggable_sizes[drag_id] = size;
	let matchUser = drag_classnames.match(user_regex);
        //console.log("user is ",matchUser[1]);
        draggable_users[drag_id] = matchUser[1];
    });
    // Now calculate
    recalc();

    var dropped_in_which_droppable = "";
    
    // In this block, we implement behaviors for draggables
    $(".draggable").draggable({
        start: function (e, ui){
	    console.log("started drag of ",$(this).attr("id"))
            dropped_in_which_droppable = "";
            draggable_to_droppable_relationship[$(this).attr("id")] = "";
	    $(this).removeClass('hack');
        },
        stop: function (e, ui) {
	    $(this).addClass('hack');
            if (dropped_in_which_droppable != ""){
		draggable_to_droppable_relationship[$(this).attr("id")] = dropped_in_which_droppable;
		console.log("dropped successfully into ", dropped_in_which_droppable);              
            }
	    else{
		console.log("removed successfully");
	    }
            recalc();
        },
	grid: [ 80, 80 ],
	obstacle: ".hack",
	preventCollision: true,
    });
    
    // In this block, we implement behaviors of droppables - small and large mem
    $( ".dropSmallMem" ).droppable({
        tolerance: "fit",
	accept: ".smallmem",
        drop: function( event, ui ) {
            dropped_in_which_droppable = $(this).attr("id");
            ui.helper
                .addClass("dropped")
        },
	over: function( event, ui ) {       
            ui.helper
		.addClass("ui-over")
	},
	out: function( event, ui ) {
            ui.helper
		.removeClass("ui-over");
            ui.helper
		.removeClass("dropped")
	}
    });
    $( ".dropLargeMem" ).droppable({
        tolerance: "fit",
	accept: ".draggable",
        drop: function( event, ui ) {
            dropped_in_which_droppable = $(this).attr("id");
            ui.helper
                .addClass("dropped")
        },
	over: function( event, ui ) {       
            ui.helper
		.addClass("ui-over")
	},
	out: function( event, ui ) {
            ui.helper
		.removeClass("ui-over");
            ui.helper
		.removeClass("dropped")
	}
    });
    
    // Let's make a function that recalculates stats based on which droppable holds which drag
    function recalc(){
        //console.log("calculating");
        // We want per-user stats first.
        let perUserStats = {};
	
        // We want stats by user, but also by HPC resource. 
        let perHPCStats = {};
	let perHPCUse = {};

        // Iterate through our list of draggables, and pull out the info.
        let les_dragables = Object.keys(draggable_to_droppable_relationship);
        les_dragables.forEach((drag_id, index) => {
	    let size = draggable_sizes[drag_id];
            let username = draggable_users[drag_id];
	    let hpc = draggable_to_droppable_relationship[drag_id];
	    //console.log("during recalc, hpc for draggable ",drag_id," is ",hpc);
	    if (hpc == ""){ //maybe that is wrong?
		perUserStats[username] = (perUserStats[username] || 0);   
		perHPCStats[hpc] = (perHPCStats[hpc] || 0);	//changed	
	    }
	    else{
		perUserStats[username] = (perUserStats[username] || 0) + size;   
		perHPCStats[hpc] = (perHPCStats[hpc] || 0) + size;
	    }
	    if (hpc == "BigRed200"){
	        perHPCUse[hpc] = 20;
	    }
	    else if (hpc == "Co3"){
	        perHPCUse[hpc] = 12;
	    }
	    else if (hpc == "Karst"){
	        perHPCUse[hpc] = 16;
	    }
	    else{
                  perHPCUse[hpc] = 0;
	    }
        });
	
	// User table loop on usernames
	let les_users = Object.keys(perUserStats).sort();
        // Update table with the found stats.
	les_users.forEach((username, index) => {
	    // Get rows of the table first
            let row = document.getElementById('userstats').rows[index+1].cells;
	    row[0].innerHTML = username;
            row[1].innerHTML = perUserStats[username];
	});
	// User table loop on usernames
	let les_hpc = Object.keys(all_droppables).sort();
        // Update table with the found stats.
	les_hpc.forEach((hpcname, index) => {
	    // Get rows of the table first
	    //console.log("hpcname is ", hpcname);
	    stats = (perHPCStats[hpcname] || 0);
	    use = (stats/perHPCUse[hpcname]*100 || 0);
	    let row = document.getElementById('hpcstats').rows[index+1].cells;
	    row[0].innerHTML = hpcname;
	    row[1].innerHTML = stats;
	    row[2].innerHTML = use.toFixed(0);	    
	});
    }
});
