setInterval(function() {
	$.get("/guilds", function(data) {
		$("#guilds").text(data);
	});
	$.get("/uptime", function(data) {
		$("#uptime").text(data);
	});
}, 1000);
