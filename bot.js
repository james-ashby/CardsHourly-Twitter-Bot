console.log('The bot is starting...');

var Twit = require('twit');                                                                 //Required gubbins for node package 'Twit'
var config = require('./config');                                                           //^^
var fs = require('fs'), request = require('request');                                       //Required for using FileStream 
const { time } = require('console');

var download = function(url, filename, callback)                                            //Download function for saving the image from the API Url
{
    request.head(url, function(err,res,body)
    {
        request(url).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};
var T = new Twit(config);
const pokemonAPIUrlTemplate = 'https://api.pokemontcg.io/v1/cards?nationalPokedexNumber=';  // API Template URL to add Pokedex number to


// Global Variables until I figure out a way to integrate them into the Async function and passing to SendTweet without error
var pokemonName; 
var pokeID;
var fileUrl;
var pokeSet;
var pokeArtist;
var pokeSeries;
startCardsHourlyBot();                                                           //Initial run of 
setInterval(startCardsHourlyBot, 1000*60*60);                                     //Set the time between each post (1000*60 = 1 Minute, 1000*60*60 = 60 Minutes/1 Hour)
setInterval(timeOutput, 1000*60*10);
function startCardsHourlyBot(){
    async function getPokemonCard()
    {
        var randomDexNumber = Math.floor(Math.random()*889) + 1;                 //Chooses a random Pokedex number (for which cards exist)
        var pokemonAPIUrl = pokemonAPIUrlTemplate + randomDexNumber;             //Add the chosen Pokedex number to the API template

        const fetch = require("node-fetch");
        const response =  await fetch(pokemonAPIUrl);
        const data = await response.json();                                      //Store the JSON data into local 'data' variable
        const {cards} = data;                                                    //Store the array 'cards' (All cards for that Pokemon) from the JSON data into local 'cards'' variable

        var totalCards = cards.length;                                           //Store the amount of cards there are for that species of Pokemon
        var randomCardPicker = Math.floor(Math.random()*totalCards);             //Choose a random card from the amount of cards of that Pokemon

        while (cardDoesNotExist(randomDexNumber, randomCardPicker))              //If the selected card does not exist on the API's database, randomize again from the same pokemon
        {
            randomCardPicker = Math.floor(Math.random()*totalCards); 
        }

        // Assigning variables                                                                    

        pokemonName = cards[randomCardPicker].name;                              //Store the Pokemon name
        pokeID = cards[randomCardPicker].id;                                     //Store set ID (IMPORTANT - Unique identifier for each and every card)
        pokeSet = cards[randomCardPicker].set;                                   //Store the name of the expansion the card is from
        pokeArtist = cards[randomCardPicker].artist;                             //Store the name of the card's Artist
        pokeSeries = cards[randomCardPicker].series;
        var imageUrl = cards[randomCardPicker].imageUrlHiRes;                    //Store the high resolution Image url 

        //Outputting variables to console to verify
        console.log(pokemonName);                                                
        console.log(randomDexNumber);                                            
        console.log(totalCards);                                                 
        fileUrl = pokeID + '.png';
        download(imageUrl, fileUrl, function(){
            console.log(pokemonName + " ID : " + pokeID + " image successfully saved."); //Download and Save the image at the imageUrl with the name of the unique ID
        });
        
    }      
    getPokemonCard();            // Run the get Pokemon function to download and store the image of the Pokemon card
    setTimeout(sendTweet, 5000); // Run the send tweet function after 5 seconds (to allow the image to download)
}

// 'images/' +  Line 56
function sendTweet()
{
    var filename = fileUrl;
    var params = {
        encoding: 'base64'
    }
    var b64 = fs.readFileSync(filename, params);
        
    T.post('media/upload', {media_data: b64}, uploaded);
    
    function uploaded(err,data,responseMSG) 
    {
        // This is where the bot tweets
            var id = data.media_id_string;

            var tweet = 
                {
                    status: createStatusText(pokeSeries, pokeArtist, pokeSet, pokemonName), media_ids: [id]
                }

            T.post('statuses/update', tweet, tweeted);
            if(err)
            {
            console.log(data)
            }
    }
    function tweeted(err,data,response) 
    {
            if  (err)
            {
                console.log(data);
            }
            else
            {
                console.log('Tweet posted')
            }
    } 
}
function timeOutput()
{
    console.log("10 minutes have passed.");
}
var createStatusText = function(pokeSeries, pokeArtist, pokeSet,pokemonName) // Create different status formatting depending on the expansion of the card
{
    var artistString;
    if (pokeArtist == null)
    {
        artistString = "\n #PokemonTCG #PokemonCards #Pokemon";
    }    
    else
    {
         artistString = "\n\nArtwork by: " + pokeArtist + "\n #PokemonTCG #PokemonCards #Pokemon"
    }
    if (pokeSeries == pokeSet)
    {
        var statusText = pokemonName + " from the '" + pokeSeries + "' base set! \n " + artistString;
    }
    else if (pokeSet.includes("Promos"))
    {
        var statusText = pokemonName + " from '" + pokeSet + "'! \n " + artistString;
    }
    else if (pokeSet.includes(pokeSeries) || pokeSeries.includes("Base"))
    {
        var statusText = pokemonName + " from '" + pokeSet + "' set! \n" + artistString;
    }
    else
    {
        var statusText = pokemonName + " from the '" + pokeSeries + ": " + pokeSet + "' set!  \n" + artistString;
    }
    return statusText;
}
function cardDoesNotExist(dexNum, cardNumber)
{
    switch (dexNum)
    {
        case 1:          if (cardNumber == 17) { return true; }   break;
        case 6:          if (cardNumber == 48) { return true; }      break;   
        case 25:         if (cardNumber == 76 || cardNumber == 92) { return true; }      break;
        case 54:         if (cardNumber == 20) { return true; }      break;
        case 106:        if (cardNumber == 9) { return true; }      break;
        case 107:        if (cardNumber == 15) { return true; }      break;
        case 136:        if (cardNumber == 24) { return true; }      break;
        case 137:        if (cardNumber == 16) { return true; }      break;
        case 144:        if (cardNumber == 28) { return true; }      break;
        case 149:        if (cardNumber == 27) { return true; }      break;
        case 150:        if (cardNumber == 39 || cardNumber == 51) { return true; }      break;
        case 151:        if (cardNumber == 27) { return true; }      break;
        case 190:        if (cardNumber == 9) { return true; }      break;
        case 209:        if (cardNumber == 14) { return true; }      break;
        case 230:        if (cardNumber == 17) { return true; }      break;
        case 233:        if (cardNumber == 10) { return true; }      break;
        case 243:        if (cardNumber == 19) { return true; }      break;
        case 244:        if (cardNumber == 22) { return true; }      break;
        case 245:        if (cardNumber == 20) { return true; }      break;
        case 251:        if (cardNumber == 21) { return true; }      break;
        case 312:        if (cardNumber == 14) { return true; }      break;
        case 319:        if (cardNumber == 17) { return true; }      break;
        case 323:        if (cardNumber == 18) { return true; }      break;
        case 380:        if (cardNumber == 16) { return true; }      break;
        case 381:        if (cardNumber == 20) { return true; }      break;
        case 383:        if (cardNumber == 12) { return true; }      break;
        case 385:        if (cardNumber == 18) { return true; }      break;
        case 445:        if (cardNumber == 10) { return true; }      break;
        case 448:        if (cardNumber == 20) { return true; }      break;
        case 470:        if (cardNumber == 11) { return true; }      break;
        case 471:        if (cardNumber == 5) { return true; }      break;
        case 490:        if (cardNumber == 10) { return true; }      break;
        case 491:        if (cardNumber == 5) { return true; }      break;
        case 492:        if (cardNumber == 2) { return true; }      break;
        case 493:        if (cardNumber == 19) { return true; }      break;
        case 494:        if (cardNumber == 14) { return true; }      break;
        case 647:        if (cardNumber == 8) { return true; }      break;
        case 648:        if (cardNumber == 9) { return true; }      break;
        case 649:        if (cardNumber == 10) { return true; }      break;
        case 658:        if (cardNumber == 12) { return true; }      break;
        case 702:        if (cardNumber == 1) { return true; }      break;
        case 721:        if (cardNumber == 5) { return true; }      break;
        case 801:        if (cardNumber == 6) { return true; }      break;
        case 802:        if (cardNumber == 4) { return true; }     break;
        case 804:        if (cardNumber == 7) { return true; }      break;
        case 806:        if (cardNumber == 5) { return true; }      break;
        case 866:        return true;        
        default:      return false;
    }
}