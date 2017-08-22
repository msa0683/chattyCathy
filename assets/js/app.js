var config = {
  apiKey: "AIzaSyDs-diVqFvFQTA2plc4cnOymgQNvpi59JA",
  authDomain: "chatbot-14388.firebaseapp.com",
  databaseURL: "https://chatbot-14388.firebaseio.com",
  projectId: "chatbot-14388",
  storageBucket: "chatbot-14388.appspot.com",
  messagingSenderId: "751128574046"
};
firebase.initializeApp(config);

var database = firebase.database()

var keyWord = "none";

var accessToken = "ecb2965ee6da42df92c8ab68408dbb69";
var baseUrl = "https://api.api.ai/api/";

var text; // user's input
var name; // user's name
var firstVisit = true;

var connected = database.ref(".info/connected");

// Video background using Bideo.js plugin
(function () {

  var bv = new Bideo();
  bv.init({
    // Video element
    videoEl: document.querySelector('#background_video'),

    // Container element
    container: document.querySelector('body'),

    // Resize
    resize: true,

    // autoplay: false,

    isMobile: window.matchMedia('(max-width: 768px)').matches,

    // Array of objects containing the src and type
    // of different video formats to add
    src: [
      {
        src: 'assets/images/vid.mp4',
        type: 'video/mp4'
      }
    ],

    // What to do once video loads (initial frame)
    onLoad: function () {
      document.querySelector('#video_cover').style.display = 'none';
    }
  });
}());

// Check database for user
function setFirebaseUser(name) {

  var time = moment().format('MMM D YYYY, h:mm:ss a');

  database.ref().child(name).once('value').then(function(snapshot) {
    if (snapshot.val()) {
      setResponse("Welcome back, " + text + "! Your last visit was " + 
        snapshot.val().time + ". How can I help you?");
      var greet = "I'm sure you remember, but just in case: I can chat, answer most questions," + 
        " tell you the weather or even suggest recipes. Just tell me what you have in the fridge!";
      setResponse(greet);
      database.ref().child(name).set({
        name: name,
        time: time
      });
    }
    else {
      database.ref().child(name).set({
        name: name,
        time: time
      });
      setResponse("Hello, " + text + "! How can I help you?");
      setResponse("I can chat, answer most questions, tell you the weather or even suggest recipes. Just tell me what you have in the fridge!")
    }
  });
}

// Welcome user on page load
if (firstVisit) {
	var welcome = "Welcome, what is your name?";
  setResponse(welcome);
}

$("#message-submit").on("click", function() {
	event.preventDefault();

	text = $("#input").val();
  if (text) {
  	$("#input").val("");

  	if (firstVisit) {
  		firstVisit = false;
  		name = text;
      setFirebaseUser(name);
  	}
  	else {
  		console.log(text);
  		setResponse(text, name);
  		send();
  	}
  }
});

function send() {
	$.ajax({
		type: "POST",
		url: baseUrl + "query?v=20150910",
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		headers: {
			"Authorization": "Bearer " + accessToken
		},
		data: JSON.stringify({
			query: text,
			lang: "en",
			sessionId: "testBot"
		}),
		success: function(data) {
			var dataResult = data.result.fulfillment.speech;
			if (dataResult === "") {
				console.log(data.result)
				if (data.result.action === "weather") {
  				keyWord = data.result.parameters.address.city;
  				getWeather();
				}
				else if (data.result.action === "web.search") {
  				keyWord = data.result.resolvedQuery;
  				getAnswers();
				}
        else if (data.result.action === "delivery.search") {
          keyWord = data.result.parameters.product.toString();
          getCooking();
        }
			}
			else {
				setResponse(dataResult);
				console.log(data);
			}
		},
		error: function() {
			setResponse("Ouch. I broke :(");
		}
	});
	// setResponse("Pondering...");
}   

function setResponse(val, name) {
	if (!name) {
		name = "Cathy";
	}
	$("#response").append("<strong>" + name + ":</strong> " + val + "<br>");

  // We put the repsonse div in a jquery object. Scrollheight is pure Javascript, so in order to call it, 
  // we have to extract the pure Javascript html element by using [0]. We then call scrollHeight on it. 
  // This returns the height of the scroll track. 
  var scrollHeight = $("#response")[0].scrollHeight;
  // We then put respoonse div in a jquery object and set it's scroll top to be the scroll Height. 
  $("#response").scrollTop(scrollHeight);
}  

function getWeather() {
	if (!keyWord) {
		keyWord = "San Francisco";
	}
	var results;
	var weatherApiKey = "7c82af881ec1e1081a5cd2d5a1c75e03";
	var queryURL = "https://cors-anywhere.herokuapp.com/http://api.openweathermap.org/data/2.5/weather?q=" + keyWord +
		"&units=imperial&appid=" + weatherApiKey;
	$.ajax({
    url: queryURL,
    method: "GET"
  }).done(function(response) {
		results = response.main.temp;
		// console.log(results);
		setResponse("The current weather in " + keyWord + " is " + results + " &deg;F");
	});
}

function getAnswers() {
	var APIKey = "3TVWEP-L6J4Y652JG";
  // console.log(keyWord);
  var queryURL = "https://cors-anywhere.herokuapp.com/https://api.wolframalpha.com/v1/result?i=" + keyWord + "%3F&appid=" + APIKey;
 
  $.ajax({
    url: queryURL,
    method: "GET",
  }).done(function(response) {
    // console.log(queryURL);
    setResponse(response);
  }).fail(function(response) {
    // console.log(response);
    if (response.status === 501) {
      setResponse("I'm sorry. I don't have a response for that.");
    }
  });
}

// Get recipe from ingredients
var id; // recipe id
var mashapeKey = 'FAFDoCl0Z5mshe5M1YLER3AVJWgNp1gQkoyjsnlZvGQomCTd62';

function getCooking () {
  var queryURL = "https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/findByIngredients?fillIngredients=false&ingredients=" + keyWord + 
    "&limitLicense=false&number=1&ranking=1";

  $.ajax({
    type: "GET",
    url: queryURL,
    dataType: "json",
    headers: {
      'X-Mashape-Key': mashapeKey
      // 'Accept: application/json' 
    }
  }).done(function(response) {
    results = response;
    console.log(queryURL);
    console.log(results);
    if (results.length > 0) {
      id = results[0].id;
      setResponse("With: " + keyWord + " you can make: " + results[0].title);
      getEating();
    }
    else {
      setResponse("Please provide me more ingredients.");
    }
  }).fail(function() {
    setResponse("Ouch. I broke :(");
  });
}

// Recipe instructions
function getEating () {
  var queryURL = "https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/" + 
    id + "/information";

  $.ajax({
    type: "GET",
    url: queryURL,
    dataType: "json",
    headers: {
      'X-Mashape-Key': mashapeKey
      // 'Accept: application/json' 
    }
  }).done(function(response) {
    results = response;
    console.log(results);
    var link = '<a href=' + results.spoonacularSourceUrl + ' target="_blank">' + results.title + '</a>';
    setResponse("Recipe link: " + link);
  }).fail(function() {
    setResponse("Ouch. I broke :(");
  });
}