'use strict'
var newstube = angular.module('newstube', ['snap']);

// a simple factory to get videos from youtube
newstube.factory('youtubeFactory', function($http, $q, $rootScope){
	return {

		getVideos: function(page_vars){ // go get the videos and splice the correct value
			return {
					"page_token": this.getToken(page_vars),
					 "items":channel_json.channels[page_vars.channel_index].items.splice(page_vars.page_token*10,10)
			}
		},


		getToken: function(page_vars){ //gets the right next page token if more videos are available
			if(page_vars.page_token*10+10 >= channel_json.channels[page_vars.channel_index].items.length) return null;
			return page_vars.page_token+1;
		},

		getYoutubeChannels: function(){ 
			return channel_json.channels.map(function(channel){
				return {
					"owner":channel.owner,
					"img" : channel.img
				};
			});
		},

		channel_index : null,

		setChannel: function(index, owner){ // set a new category, if the category id changes
			if(index === this.channel_index) return console.log('stopped');
			this.channel_index = index;
			$rootScope.$broadcast('newChannel', index, owner); // broadcast so the controller is notified of the change
		}


	};
});

// a controller to display the youtube videos
newstube.controller('videoController',function($scope, youtubeFactory, snapRemote,  $location, $anchorScroll){
	$scope.videos=[],
	$scope.page_token=0,
	$scope.channels = youtubeFactory.getYoutubeChannels(),
	$scope.first_loading = true,  // don't display 'get more' when the page first loads
	$scope.activeVideo=null;

	function getOtherChannel(){ // returns the non-selected channel details to switch easily
		return $scope.channel_index===0 ? {
				"owner":$scope.channels[1].owner,
				"index":1} :
				{
				"owner":$scope.channels[0].owner,
				"index":0};
	}
	 
	$scope.getVideos = function(){ // get the list of videos
		$scope.error = false; // clear error if it existed
		
		var vids = youtubeFactory.getVideos(fetch_params());
			if(vids.error){
				$scope.videos.push({error:true}) // push the error to the end of the videos array
				$scope.first_loading = false;
				$scope.error = true;
				return;
			}
			$scope.page_token = (function(){
					if(vids.page_token<4) return vids.page_token; // sets the token to get next page
						return null; // there are no more results to return
					})(vids);
			console.log($scope.page_token);
			console.log(vids.items);
			vids.items.forEach(function(vid){
				$scope.videos.push(vid); 
			});
			$scope.first_loading=false; 
		return $scope.videos;
	}

	var fetch_params = function(){  // parameters which are passed in getVideos to build the url params in videoFactory
		return {
			page_token : $scope.page_token,
			channel_index: $scope.channel_index
		}
	}

	$scope.getMoreVids = function(){
		$scope.getVideos();
	}

	$scope.showChannels = function(){	 // slide the panel left to show the categories list
		snapRemote.open('left');
	}

	$scope.selectedVideo = function(index){ //when a video is selected, show it
		if($scope.activeVideo===index)return; // preventing bubbling from closeSelected (I hope)
		if($scope.activeVideo !== null){ // close video if one is already open
			$scope.closeSelected();
		}
		var video = $scope.videos[index]; 
		video.embed = '<iframe src="https://www.youtube.com/embed/'+video.id.videoId+'"></iframe>';
		$location.hash(video.id); // get scroll to position
 		$anchorScroll(); // scroll to the top of the selected video. 
		video.active = true; // sets the classes on the video to show the appropriate items
		$scope.activeVideo=index; // set the activeVideo index so we can easily fetch it later for checks
	}

	$scope.setChannel = function(index,owner){
		return youtubeFactory.setChannel(index,owner);
	}
	$scope.closeSelected = function(){
		//for some reason, this is not working from the close button
		var index = $scope.activeVideo;
		$scope.videos[index].active = false;
		delete $scope.videos[index].embed;
		$scope.activeVideo=null;
	}

	$scope.$on('newChannel', function(obj, index, owner){ // listen for a change in category selection
		$scope.first_loading = true; // hides the load more videos messaging
		$scope.channel_index = index; 
		$scope.channel_owner = owner;
		$scope.other_channel = getOtherChannel();
		$scope.page_token=0; // starting a new search, so clear page references
		$location.hash('top'); // scroll to the top
		$anchorScroll();
		$scope.videos = []; // remove the videos that are already on the page
		$scope.getVideos();
	});

});

// a controller for getting youtube video categories
newstube.controller('channelController', function($scope, youtubeFactory, snapRemote){
	

	$scope.channels = youtubeFactory.getYoutubeChannels();
	

	$scope.setChannel = function(index,owner){ 
		youtubeFactory.setChannel(index,owner); // update the set channel
		snapRemote.close(); // close the side menu to show the videos
	}

	
});

newstube.filter('unsafe', ['$sce', //cleans the iframe safely so it can be embedded by angular.js
    function($sce) {
        return function(val) {
            return $sce.trustAsHtml(val);
        };
    }
]);
