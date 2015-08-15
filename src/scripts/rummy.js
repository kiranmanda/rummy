var rummy =  rummy || {},
	$box = $('#box'),
	$page = $('#page'),
	modelKey = 'rummyModel',
	fbi = false,
	logLevel = Cookies.get('logLevel') || 'ERROR',
	log = (logLevel === 'DEBUG' && console && typeof console.log === 'function');

rummy.fb = {};

rummy.hasHTML5Support = (typeof document.createElement('input').checkValidity === 'function');

rummy.log = function(msg) {
	if(log){
		console.log(msg);
	}
};

rummy.init = function() {
	rummy.log(this);
	this.initModel();
	this.initPageNames();
	this.showPage();
	this.bindEvents();
	this.initFacebookAPI();
};


rummy.initModel = function() {
	//Init Data Model
	this.model  = this.getModel();
	if(this.model == null){
		this.model = {};
		this.model.settings = {};
		this.model.settings.gameScore = 251;
		this.model.settings.dropScore = 25;
		this.model.settings.middleDropScore = 50;
		this.model.players = [];
		this.model.roundNumber = 1;
		this.model.rounds = [];
	}
	//Init Data Template 
	this.template = this["src/templates/rummy.hbs"];
};


rummy.initPageNames = function(){
	$page.html(this.template(this.model));
	rummy.pages = [];
	$page.find('.page').each(function(){rummy.pages.push('#'+this.id);});
};

rummy.isScoreCardView = function () {
	var hash = window.location.hash;
	return (hash === '#scoreCard' || hash === '#scoreCardTable');
};

rummy.showPage = function() {
	var pages = window.location.hash,
		animationDelay = 400,
		parts = pages.split("/"),
		pageName = parts[0];

	/* Unknown pageName reset to intro */
	if($.inArray(pageName, rummy.pages) == -1) {
		window.location.hash = "#intro";
		return;
	}

	/* No players so taking the user to intro page*/
	if(rummy.isScoreCardView() && rummy.model.players.length == 0){
		window.location.hash = "#intro";
		return;
	}

	/* Not enough players so taking the user to players page*/
	if(rummy.isScoreCardView() && rummy.model.players.length < 2){
		window.location.hash = "#players";
		return;
	}

	if(pageName === '#roundScore'){
		if(parts.length == 2){
			rummy.model.editRound = +parts[1] - 1;
			if(rummy.model.editRound >= rummy.model.rounds.length) {
				rummy.log("You are trying to edit a round even before entering the round score. Showind score card");
				window.location.hash = "#scoreCard";
			}
		}else{
			rummy.model.editRound = undefined;
		}
	}else{
		rummy.model.editRound = undefined;
	}

	/*Update scores*/
	if(rummy.isScoreCardView()){
		rummy.updateScores();
	}

	$page.html(this.template(this.model))
		.find('.page')
		.fadeOut(animationDelay)
		.delay(animationDelay)
		.filter(pageName)
		.fadeIn(function(){
			window.scrollTo(0,0);
			var title = $page.find('h1:visible').text();
			if(title !== "Rummy"){
				title = "Rummy " + title;
			}
			$('title').text(title);

			if(pageName == '#scoreCardGraph'){
				rummy.showDrillDownGraph();
			}
		});

};

rummy.getPlayerNames = function () {
	var playerNames = [],
		players = rummy.model.players,
		playersLength = players.length,
		i;

	for (i = 0; i < playersLength; i++) {
		player = players[i];
		playerNames.push(player.name);
	}

	return playerNames;
};

rummy.getRoundData = function () {
	var series = [],
		rounds = rummy.model.rounds,
		roundsLength = rounds.length,
		i, j,
		scores = [];

	for (i = 0; i < roundsLength; i++) {
		scores = rounds[i].join(" ").split(" ");
		for(j=0; j<scores.length; j++) { scores[j] = +scores[j]; } 
		series.push({
			'name': 'Round '+ (i+1), 
			'data': scores
		});
	}

	return series;
};

rummy.getPlayerNameAndTotals = function () {
	var series = [],
		data,
		players = this.model.players,
		playersLength = players.length,
		i;

	for (i = 0; i < playersLength; i++) {
		data = {};
		data.name = players[i].name;
		data.y = players[i].totalScore;
		data.drilldown = players[i].name;
		series.push(data);
	}

	return series;
};

rummy.getPlayerAndRoundData = function () {
	var series = [],
		dataPoint = {},
		players = this.model.players,
		playersLength = players.length,
		i, 
		j,
		rounds,
		roundsLength,
		roundDataPoint;

	for (i = 0; i < playersLength; i++) {
		dataPoint = {};
		dataPoint.id = players[i].name;
		dataPoint.data = [];
		rounds = players[i].rounds;
		roundsLength = rounds.length
		for (j = 0; j < roundsLength; j++) {
			roundDataPoint = [];
			roundDataPoint[0] = 'Round ' + (j+1);
			roundDataPoint[1] = +rounds[j];
			dataPoint.data.push(roundDataPoint);
		};
		series.push(dataPoint);
	}

	return series;
};

rummy.showDrillDownGraph = function(){

	var playerNameAndTotal = this.getPlayerNameAndTotals(),
		playerAndRoundData = this.getPlayerAndRoundData();

	rummy.log(playerNameAndTotal);
	rummy.log(playerAndRoundData);

	Highcharts.setOptions({
        lang: {
            drillUpText: '<< Player Scores'
        }
    });

    // Create the chart
    $('#graphContainer').highcharts({
        chart: {
            type: 'column'
        },
        
        title: {
            text: ''
        },

        xAxis: {
            type: 'category'
        },

        yAxis: {
            title: {
            	text: ''
            }
        },

        legend: {
            enabled: false
        },

        plotOptions: {
            series: {
                borderWidth: 0,
                dataLabels: {
                    enabled: true
                }
            }
        },

        series: [{
            name: 'Total',
            colorByPoint: true,
            data: playerNameAndTotal
        }],

        drilldown: {
            drillUpButton: {
                relativeTo: 'spacingBox',
                position: {
                    y: 0,
                    x: 0
                },
                theme: {
                    fill: 'white',
                    'stroke-width': 1,
                    stroke: 'silver',
                    r: 0,
                    states: {
                        hover: {
                            fill: '#bada55'
                        },
                        select: {
                            stroke: '#039',
                            fill: '#bada55'
                        }
                    }
                }

            },
            series: playerAndRoundData
        }
    });
};

rummy.updateScores = function(){
	var players = rummy.model.players,
		playersLength = players.length,
		i;

	for (i = 0; i < playersLength; i++) {
		player = players[i];
		rummy.log("Updating Player "+ player.name);
		rummy.updateDrops(player);
	};
};

rummy.updateDrops = function(player) {

	if(player.totalScore == undefined){
		player.totalScore = 0;
	}

	if(player.rounds == undefined){
		player.rounds = [];
	}

	player.dropsLeft = Math.floor((rummy.model.settings.gameScore - player.totalScore) / rummy.model.settings.dropScore);
	player.middleDropsLeft = Math.floor((rummy.model.settings.gameScore - player.totalScore) / rummy.model.settings.middleDropScore);

	player.dropsLeft = (player.dropsLeft < 0) ? 0 : player.dropsLeft;
	player.middleDropsLeft = (player.middleDropsLeft < 0) ? 0 : player.middleDropsLeft;

	rummy.log("Player: " + player.name);
	rummy.log(player);
}

rummy.sumScores = function(scores){
	if(scores && scores.length > 0){
		var evalString = scores.join('+');
		rummy.log("Evaluating "+evalString);
		return eval(evalString);
	}
	return 0;
}

rummy.addRoundScores = function(roundScores){

	//some error handling
	if(roundScores.length != this.model.players.length){
		console.error("Something went wrong.");
		return;
	}

	var players = this.model.players,
		playersLength = players.length,
		i,
		evalString;

	if(this.model.editRound >= 0){
		this.model.rounds[this.model.editRound] = roundScores;
	}else{
		this.model.rounds.push(roundScores);
	}

	this.model.roundNumber = this.model.rounds.length;

	for (i = 0; i < playersLength; i++) {
		rummy.log(roundScores[i])
		if(this.model.editRound >= 0){
			players[i].rounds[this.model.editRound] = roundScores[i];
		}else{
			players[i].rounds.push(roundScores[i]);
		}
		players[i].totalScore = rummy.sumScores(players[i].rounds);
		rummy.log("Player Round");
		rummy.log(players[i].rounds);
	};
};

rummy.resetScores = function(){
	this.model.rounds = [];
	this.model.roundNumber = 1;
	var players = this.model.players,
		playersLength = players.length,
		i;
	for (i = 0; i < playersLength; i++) {
		players[i].totalScore = undefined;
		players[i].rounds = undefined;
		this.updateDrops(players[i]);
	}

	this.saveModel();
};

rummy.saveModel = function() {

	try {
		localStorage.setItem(modelKey, JSON.stringify(this.model));
	} catch (e) {
		this.dataInCookie = true;
		Cookies.set(modelKey, JSON.stringify(this.model));
	}

};

rummy.getModel = function() {
	var retrievedModel;
	if(this.dataInCookie){
		retrievedModel = Cookies.get(modelKey);
	}else{
		retrievedModel = localStorage.getItem(modelKey);
	}
	// Retrieve the object from storage
	
	if(retrievedModel){
		return JSON.parse(retrievedModel);
	}
	return null;
};

rummy.initFacebookAPI = function(){
	if(fbi){
		$.getScript('//connect.facebook.net/en_US/sdk.js', function(){
		    FB.init({
		      appId: '405642912973671',
		      status: true,
	    	  xfbml: true,
		      version: 'v2.4' // or v2.0, v2.1, v2.0
		    });
		});
	}
};

rummy.getFBFriendLists = function(name){
	/* make the API call */
	FB.api(
	    "/me/friendlists",
	    function (response) {
	    	rummy.log(response);
	      	if (response && !response.error) {
	        /* handle the result */
	      	}
	    }
	);
};

rummy.isPlayerNameTaken = function(name){
	var i = 0,
		len = this.model.players.length;
	for (i = 0; i < len; i++) {
		if(this.model.players[i].name === name){
			return true;
		}
	};
	return false;
};

rummy.addPlayer = function(player){
	rummy.log("Adding new player " + player.name);
	if(rummy.isPlayerNameTaken(player.name)){
		rummy.log("Player " + player.name + " taken");
		rummy.showMessage("Duplicate Player Name. Choose a different name.");
		return;
	}

	if(rummy.model.gameInProgress) {
		rummy.log("Game is currently in progress. Retrieving active player round score who has the max totalScore");
		player.rounds = rummy.getNewReentryPlayersRoundScores();
		player.totalScore = rummy.sumScores(player.rounds);
		rummy.updateDrops(player);
		rummy.updateRoundScoresForNewPlayer(player.rounds);
	}
	player.inRound = rummy.model.roundNumber;
	rummy.model.players.push(player);
	rummy.saveModel();
	rummy.showPage();
};

rummy.updateRoundScoresForNewPlayer = function(roundScores){
	if(roundScores){
		var roundsLength = roundScores.length;
		for (var i = 0; i < roundsLength; i++) {
			rummy.model.rounds[i].push(roundScores[i]);
		};
	}
};

rummy.getNewReentryPlayersRoundScores = function(){
	var rounds,
		maxScore = 0,
		players = this.model.players,
		playersLength = players.length,
		i,
		lastRoundScore;

	for (i = 0; i < playersLength; i++) {
		if(players[i].totalScore < this.model.settings.gameScore){
			if(players[i].totalScore > maxScore){
				rounds = JSON.parse(JSON.stringify(players[i].rounds));
				maxScore = players[i].totalScore;
			}
		}
	}

	if(rounds && rounds.length > 0) {
		if(!rummy.isAnotherPlayerAddedInThisRound()){
			rummy.log("Incrementing the last round score by 1 ");
			lastRoundScore = +rounds[rounds.length - 1];
			rounds[rounds.length - 1] = (lastRoundScore + 1) + "";
		}else{
			rummy.log("A player already added or re-enetered in this round. So total score is same as the last person's score.");
		}
	}

	return rounds;
};

rummy.isAnotherPlayerAddedInThisRound = function() {
	var players = this.model.players,
		playersLength = players.length,
		i;
	for (i = 0; i < playersLength; i++) {
		if(rummy.model.roundNumber == players[i].inRound){
			return true;
		}
	}
	return false;
};

rummy.removePlayer = function(index){
	var rounds = this.model.rounds,
		roundsLength = rounds.length,
		i;

	rummy.log("Removing player " + rummy.model.players[index].name);

	for (var i = 0; i < roundsLength; i++) {
		rounds[i].splice(index, 1);
	};

	rummy.model.players.splice(index, 1);

	if(rummy.model.players.length < 2) {
		rummy.resetScores();
		rummy.model.gameInProgress = false;
		rummy.model.winner = undefined;
	}
	
	rummy.saveModel();
	rummy.showPage();
};

rummy.reEnterPlayer = function(index) {
	rummy.log("Re entering player " + rummy.model.players[index]);
	var name = rummy.model.players[index].name
		player = {'name': name};
	this.removePlayer(index);
	this.addPlayer(player);
};

rummy.startGame = function() {
	rummy.model.gameInProgress = true;
	rummy.model.winner = undefined;
	rummy.saveModel();
	window.location.hash = '#scoreCard';	
};

rummy.isThereAWinner = function() {
	var players = this.model.players,
		playersLength = players.length,
		i,
		activePlayers = [];
	for (i = 0; i < playersLength; i++){
		if(players[i].totalScore < this.model.settings.gameScore){
			activePlayers.push(players[i]);
		}
	}
	if(activePlayers.length == 1){
		rummy.model.winner = activePlayers[0];
		rummy.model.gameInProgress = false;
		rummy.saveModel();
		return true;
	}
	return false;
};

rummy.showMessage = function(message){
	$('#js-message').html(message).show();
	window.scrollTo(0,0);
	rummy.log(message);
	setTimeout(function(){
		$('#js-message').fadeOut();
	}, 3500);
};

rummy.safariPolyFill = function(obj) {
	if(rummy.hasHTML5Support){
		if (!obj.checkValidity()) {
	      $(obj).addClass('invalid');
	      var message = $('.invalid input:required:invalid').attr('title');
	      rummy.showMessage(message);
	      return false;
	    } else {
	      $(this).removeClass('invalid');
	    }
	}
	return true;
}

rummy.bindEvents = function() {
	
	var hashMenuOpen = undefined;

	$(window).on('hashchange', function(){
		if(window.location.hash != '#menu') {
			if($box.hasClass('menu-open')){
				$('ul.hamburger').trigger('click');
			}
			rummy.showPage();
		}
	});

	$(document).on('click', '.js-hash', function(e){
		e.preventDefault();
		if($(this).parent().attr('class') == 'menu'){
			$(this).closest('.menu-open').removeClass('menu-open');
		}
		window.location.hash = $(this).data('hash');
	});

	$page.on('submit', 'form[name="scoreSettings"]', function(e){
		e.preventDefault();
		if(!rummy.safariPolyFill(this)) return;
		rummy.model.settings = $(this).serializeObject();
		if(!rummy.isThereAWinner()){
			rummy.model.gameInProgress = true;
			rummy.model.winner = undefined;
		}
		rummy.saveModel();
		var $button = $(this).find('button');
		$button.text("Saved");
		setTimeout(function(){
			$button.text("Save Game Settings");
		}, 1000);
	});

	$page.on('submit', 'form[name="newGame"]', function(e){
		e.preventDefault();
		if(rummy.model.players.length < 2){
			if(fbi){
				FB.getLoginStatus(function(response) {
				  	if (response.status === 'connected') {
				    	rummy.fb.userId = response.authResponse.userID;
				    	rummy.fb.accessToken = response.authResponse.accessToken;
				    	rummy.log('User['+rummy.fb.userId+'] is logged into facebook.');
				    	/* make the API call */
						FB.api('/me', function(response) {
							rummy.model.players.push(response.name);
							rummy.saveModel();
							window.location.hash = '#players';
						});
				  	} else {
				  		rummy.log('You are currently not logged in to facebook.');
				  		window.location.hash = '#loginToFB';
				  	}
				});
			}else{
				window.location.hash = '#players';
			}
		}else{
			rummy.startGame();
		}
	});

	if(fbi){
		$page.on('click', '#loginToFB button.cta', function(){
			FB.login(function(response) {
			   if (response.authResponse) {
			   		rummy.log('Welcome!  Fetching your information.... ');
			     	window.location.hash = '#newGame';
			   } else {
			   		rummy.log('User cancelled login or did not fully authorize.');
			   		//TODO handle this scenario
			   }
			});
		});
	}

	if(fbi){
		$page.on('blur','input[name="playerName"]', function(){
			rummy.getFBFriendLists($(this).val());
		});
	}

	$page.on('submit', 'form[name="addPlayer"]', function(e){
		e.preventDefault();
		if(!rummy.safariPolyFill(this)) return;
		var data = $(this).serializeObject();
		rummy.addPlayer(data);
	});

	$page.on('submit', 'form[name=saveRoundScore]', function(e){
		e.preventDefault();
		if(!rummy.safariPolyFill(this)) return;
		var data = $(this).serializeObject();

		//Check to see if there is more than one active player with O value. If so throw an error.


		rummy.log("Saving round score");
		rummy.log(data.roundScores);
		rummy.addRoundScores(data.roundScores);
		rummy.saveModel();
		if(rummy.isThereAWinner()){
			window.location.hash = '#winner';
		}else{
			if(window.location.hash === '#scoreCard'){
				rummy.showPage();
			}else{
				window.location.hash = '#scoreCard';
			}
		}
	});

	$page.on('click', '.js-remove', function(e){
		e.preventDefault();
		var index = $(this).data('playerIndex');
		rummy.removePlayer(index);
	});

	$page.on('click', '.js-re-enter', function(e){
		e.preventDefault();
		var index = $(this).data('playerIndex');
		rummy.reEnterPlayer(index);
	});

	$page.on('click', '#js-abandon', function(e){
		e.preventDefault();
		rummy.log("Abandoning current game");
		rummy.resetScores();
		if(rummy.model.players.length < 2){ 
			window.location.hash = '#players'
		} else {
			rummy.startGame();
		}
	});

	$box.on('click', 'ul.hamburger', function(e){
		e.stopPropagation();
		$box.toggleClass('menu-open');
		if(hashMenuOpen == undefined){
			hashMenuOpen = window.location.hash;
			window.location.hash = '#menu';
		}else{
			hashMenuOpen = undefined;
		}
	});

	$box.on('click' ,'#js-startOver', function(e){
		e.preventDefault();
		try {
			localStorage[modelKey] = '';
		} catch (e) {
			Cookies.remove(modelKey);
		}
		rummy.initModel();
		window.location.hash = "#intro";
	});

	$box.on('keyup keypress blur change', 'form[name="saveRoundScore"] input.number', function(e){
		var numberOfZeroScores = 0,
			$form = $(this).closest("form"),
			returnSilent = false,
			editMode = $(this).closest('form').data('editMode');

		if(editMode) return; //Able to edit players after one or more players exit in previous rounds

		$form.find('input.number').each(function(){
			if($(this).val() === "0"){
				numberOfZeroScores++;
			}else if($(this).val() === ""){
				returnSilent = true;
			}
		});

		if(returnSilent) return;

		if(numberOfZeroScores !== 1){
			rummy.showMessage("One and only one player can win a round.");
			$form.find('button').addClass("disabled").attr("disabled","disabled");
		}else{
			$form.find('button').removeClass("disabled").removeAttr("disabled");
			$('#js-message').fadeOut();
		}

	});

	$('body').on('click', function(){
		if($box.hasClass('menu-open')){
			$box.removeClass('menu-open');
		}
	});

};

